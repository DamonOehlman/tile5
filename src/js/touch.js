(function() {
    // initialise constants
    var MAX_TOUCHES = 10,
        WHEEL_DELTA_STEP = 120,
        DEFAULT_INERTIA_MAX = 500,
        INERTIA_TIMEOUT_MOUSE = 100,
        INERTIA_TIMEOUT_TOUCH = 250,
        THRESHOLD_DOUBLETAP = 300,
        THRESHOLD_PINCHZOOM = 5;
        
    // define the touch modes
    var TOUCH_MODE_TAP = 0,
        TOUCH_MODE_MOVE = 1,
        TOUCH_MODE_PINCH = 2;

    // TODO: configure the move distance to be screen size sensitive....
    var MIN_MOVEDIST = 7;

    var elementCounter = 0,
        listenerCount = 0,
        supportsTouch = undefined;
        
    function calcDiff(v1, v2) {
        return {
            x: v1.x - v2.x, 
            y: v1.y - v2.y
        };
    } // calcDiff
    
    function calcDistance(v1, v2) {
        var distV = calcDiff(v1, v2);
            
        return Math.sqrt(distV.x * distV.x + distV.y * distV.y);
    } // calcDistance
        
    function touchDistance(touchData) {
        if (touchData.count > 1) {
            return calcDistance(
                touchData.touches[0],
                touchData.touches[1]);
        } // if
        
        return 0;
    } // calcDistance
    
    function calcChange(first, second) {
        var srcVector = (first && (first.count > 0)) ? first.touches[0] : null;
        if (srcVector && second && (second.count > 0)) {
            return calcDiff(srcVector, second.touches[0]);
        } // if
        
        return null;
    } // calcChange
    
    function copyTouchData(dst, src) {
        dst.count = src.count;
        
        for (var ii = MAX_TOUCHES; ii--; ) {
            dst.touches[ii].x = src.touches[ii].x;
            dst.touches[ii].y = src.touches[ii].y;
        } // for
    } // copyTouchData
    
    function initTouchData() {
        // initialise some empty touch data
        var touchData = {
            count: 0,
            touches: new Array(MAX_TOUCHES)
        }; 
        
        // create ten touch points
        for (var ii = MAX_TOUCHES; ii--; ) {
            touchData.touches[ii] = createPoint();
        } // for
        
        return touchData;
    } // initTouchData
    
    function preventDefault(evt) {
        if (evt.preventDefault) {
            evt.preventDefault();
            evt.stopPropagation();
        }
        else if (evt.cancelBubble) {
            evt.cancelBubble();
        } // if..else
    } // preventDefault
    
    function fillTouchData(touchData, evt, evtProp) {
        if (supportsTouch) {
            var touches = evt[evtProp ? evtProp : 'touches'],
                touchCount = touches.length;
            
            touchData.count = touchCount;
            for (var ii = touchCount; ii--; ) {
                touchData.touches[ii].x = touches[ii].pageX;
                touchData.touches[ii].y = touches[ii].pageY;
            } // for
        }
        else if (evt.button === 0) {
            touchData.count = 1;
            touchData.touches[0].x = evt.pageX ? evt.pageX : evt.screenX;
            touchData.touches[0].y = evt.pageY ? evt.pageY : evt.screenY;
        }
        else {
            touchData.count = 0;
        } // if//else
    } // fillTouchPoints
    
    function debugTouchEvent(evt, title) {
        GT.Log.info("TOUCH EVENT '" + title + "':", evt);
        GT.Log.info("TOUCH EVENT '" + title + "': touches = ", evt.touches);
        GT.Log.info("TOUCH EVENT '" + title + "': targetTouches = ", evt.targetTouches);
        GT.Log.info("TOUCH EVENT '" + title + "': changedTouches = ", evt.changeTouches);
    } // debugTouchEvent
    
    // used to return a composite xy value compatible with a T5.Vector
    function createPoint(x, y) {
        return {
            x: x ? x : 0,
            y: y ? y : 0
        };
    } // createPoint
    
    /* touch helper */
    
    var TouchHelper =  function(params) {
        params = GT.extend({
            element: null,
            observable: null,
            inertiaTrigger: 20,
            maxDistDoubleTap: 20,
            touchStartHandler: null,
            moveHandler: null,
            moveEndHandler: null,
            pinchZoomHandler: null,
            pinchZoomEndHandler: null,
            tapHandler: null,
            doubleTapHandler: null,
            wheelZoomHandler: null
        }, params);

        /*
        // determine whether touch is supported
        // nice work to thomas fuchs on this:
        // http://mir.aculo.us/2010/06/04/making-an-ipad-html5-app-making-it-really-fast/
        var touchReady = 'createTouch' in document;
        */

        // initialise private members
        var doubleTap = false,
            tapTimer = 0,
            config = T5.getConfig(),
            touchesStart = initTouchData(),
            touchesCurrent = initTouchData(),
            touchesLast = initTouchData(),
            touchesEnd = initTouchData(),
            touchDelta = null,
            totalDelta = createPoint(),
            panDelta = createPoint(),
            touchMode = null,
            touchDown = false,
            touchStartTick = 0,
            listeners = [],
            lastXY = createPoint(),
            inertiaSettings = null,
            ticksCurrent = 0,
            ticksLast = 0,
            targetElement = params.element,
            observable = params.observable,
            aggressiveCapture = typeof FlashCanvas !== 'undefined',
            BENCHMARK_INTERVAL = 300;
            
        function calculateInertia(upXY, currentXY, distance, tickDiff) {
            var theta = Math.asin((upXY.y - currentXY.y) / distance),
                // TODO: remove the magic numbers from here (pass through animation time from view, and determine max from dimensions)
                extraDistance = Math.min(Math.floor(distance * (inertiaSettings.duration / tickDiff)), inertiaSettings.max),
                distanceVector;
                
            theta = currentXY.x > upXY.x ? theta : Math.PI - theta;
            distanceVector = createPoint(
                Math.cos(theta) * -extraDistance, 
                Math.sin(theta) * extraDistance);
                
            triggerEvent("pan", distanceVector.x, distanceVector.y, true);
        } // calculateInertia
        
        function checkInertia(upXY, currentTick) {
            var tickDiff, distance;
            
            if (! supportsTouch) {
                lastXY.x = upXY.x;
                lastXY.y = upXY.y;
                
                GT.Loopage.join({
                    execute: function(tickCount, worker) {
                        tickDiff = tickCount - currentTick;
                        
                        // calculate the distance from the upXY (which doesn't change) and the
                        // lastXY (which changes as the mouse continues to move) if we move over
                        // a certain distance then trigger the intertia
                        distance = calcDistance(upXY, lastXY);

                        // calculate the inertia
                        if ((tickDiff < INERTIA_TIMEOUT_MOUSE) && (distance > params.inertiaTrigger)) {
                            worker.trigger('complete');
                            calculateInertia(upXY, lastXY, distance, tickDiff);
                        }
                        else if (tickDiff > INERTIA_TIMEOUT_MOUSE) {
                            worker.trigger('complete');
                        } // if..else
                    },
                    frequency: 10
                });
            }
            else {
                tickDiff = currentTick - touchStartTick;
                
                if ((tickDiff < INERTIA_TIMEOUT_TOUCH)) {
                    distance = calcDistance(touchesStart.touches[0], upXY);
                    
                    if (distance > params.inertiaTrigger) {
                        calculateInertia(touchesStart.touches[0], upXY, distance, tickDiff);
                    } // if
                } // if
            } // if..else                
        } // checkInertia
            
        function relativeTouches(touchData) {
            var touchCount = touchData.count,
                fnresult = new Array(touchCount),
                offsetX = targetElement ? -targetElement.offsetLeft : 0,
                offsetY = targetElement ? -targetElement.offsetTop : 0;
            
            // apply the offset
            for (var ii = touchCount; ii--; ) {
                fnresult[ii] = createPoint(
                    touchData.touches[ii].x + offsetX, 
                    touchData.touches[ii].y + offsetY);
            } // for
            
            return fnresult;
        } // relativeTouches
        
        function triggerEvent() {
            // GT.Log.info("triggering event: " + arguments[0]);
            if (observable) {
                observable.trigger.apply(null, arguments);
            } // if
        } // triggerEvent
        
        function triggerPositionEvent(eventName, absVector) {
            var offsetVector = null;
            
            // if an element is defined, then determine the element offset
            if (targetElement) {
                offsetVector = createPoint(
                    absVector.x - targetElement.offsetLeft, 
                    absVector.y - targetElement.offsetTop);
            } // if
            
            // fire the event
            triggerEvent(eventName, absVector, offsetVector);
        } // triggerPositionEvent

        function touchStart(evt) {
            var targ = evt.target ? evt.target : evt.srcElement;
            
            if (aggressiveCapture || targ && (targ === targetElement)) {
                fillTouchData(touchesStart, evt);
                if (touchesStart.count === 0) {
                    return;
                } // if
                
                // reset the touch and total vectors
                touchDelta = null;
                totalDelta.x = 0;
                totalDelta.y = 0;
                
                touchDown = true;
                doubleTap = false;
                touchStartTick = new Date().getTime();

                // cancel event propogation
                preventDefault(evt);
                targ.style.cursor = 'move';

                // trigger the inertia cancel event
                triggerEvent("inertiaCancel");

                // log the current touch start time
                ticksCurrent = touchStartTick;
        
                // fire the touch start event handler
                var touchVector = touchesStart.count > 0 ? touchesStart.touches[0] : null;
        
                // if we don't have a touch vector, then log a warning, and exit
                if (! touchVector) {
                    GT.Log.warn("Touch start fired, but no touch vector found");
                    return;
                } // if
        
                // fire the touch start handler
                triggerEvent("touchStart", touchVector.x, touchVector.y);
        
                // check to see whether this is a double tap (if we are watching for them)
                if (ticksCurrent - ticksLast < THRESHOLD_DOUBLETAP) {
                    // calculate the difference between this and the last touch point
                    var touchChange = calcDiff(touchesStart.touches[0], touchesLast.touches[0]);
                    if (touchChange && (Math.abs(touchChange.x) < params.maxDistDoubleTap) && (Math.abs(touchChange.y) < params.maxDistDoubleTap)) {
                        doubleTap = true;
                    } // if
                } // if

                // reset the touch mode to unknown
                touchMode = TOUCH_MODE_TAP;
        
                // update the last touches
                copyTouchData(touchesLast, touchesStart);
            } // if
        } // touchStart
        
        function touchMove(evt) {
            var targ = evt.target ? evt.target : evt.srcElement,
                zoomDistance = 0;
            
            if (aggressiveCapture || targ && (targ === targetElement)) {
                // fill the touch data
                fillTouchData(touchesCurrent, evt);
                
                // update the last xy
                if (touchesCurrent.count > 0) {
                    lastXY.x = touchesCurrent.touches[0].x;
                    lastXY.y = touchesCurrent.touches[0].y;
                } // if
                
                if (! touchDown) { return; }

                // cancel event propogation
                if (supportsTouch) {
                    preventDefault(evt);
                } // if

                // check to see if we are pinching or zooming
                if (touchesCurrent.count > 1) {
                    // if the start touches does have two touch points, then reset to the current
                    if (touchesStart.count === 1) {
                        copyTouchData(touchesStart, touchesCurrent);
                    } // if

                    zoomDistance = touchDistance(touchesStart) - touchDistance(touchesCurrent);
                } // if

                // if the touch mode is tap, then check to see if we have gone beyond a move threshhold
                if (touchMode === TOUCH_MODE_TAP) {
                    // get the delta between the first touch and the current touch
                    var tapDelta = calcChange(touchesCurrent, touchesStart);

                    // if the delta.x or delta.y is greater than the move threshhold, we are no longer moving
                    if (tapDelta && ((Math.abs(tapDelta.x) >= MIN_MOVEDIST) || (Math.abs(tapDelta.y) >= MIN_MOVEDIST))) {
                        touchMode = TOUCH_MODE_MOVE;
                    } // if
                } // if


                // if we aren't in tap mode, then let's see what we should do
                if (touchMode !== TOUCH_MODE_TAP) {
                    // TODO: queue touch count history to enable an informed decision on touch end whether
                    // a single or multitouch event is completing...

                    // if we aren't pinching or zooming then do the move 
                    if ((! zoomDistance) || (Math.abs(zoomDistance) < THRESHOLD_PINCHZOOM)) {
                        // calculate the pan delta
                        touchDelta = calcChange(touchesCurrent, touchesLast);

                        // update the total delta
                        if (touchDelta) {
                            totalDelta.x -= touchDelta.x; totalDelta.y -= touchDelta.y;
                            panDelta.x -= touchDelta.x; panDelta.y -= touchDelta.y;
                        } // if

                        // trigger the pan event
                        triggerEvent("pan", panDelta.x, panDelta.y);
                        
                        // reset the pan vector
                        panDelta.x = 0;
                        panDelta.y = 0;

                        // set the touch mode to move
                        touchMode = TOUCH_MODE_MOVE;
                    }
                    else {
                        triggerEvent('pinchZoom', relativeTouches(touchesStart), relativeTouches(touchesCurrent));

                        // set the touch mode to pinch zoom
                        touchMode = TOUCH_MODE_PINCH;
                    } // if..else
                } // if..else

                copyTouchData(touchesLast, touchesCurrent);
            } // if
        } // touchMove
        
        function touchEnd(evt) {
            var targ = evt.target ? evt.target : evt.srcElement;
            
            if (touchDown && (aggressiveCapture || targ && (targ === targetElement))) {
                fillTouchData(touchesEnd, evt, 'changedTouches');
                
                var touchUpXY = touchesEnd.touches[0];
                
                // cancel event propogation
                if (supportsTouch) {
                    preventDefault(evt);
                } // if

                // get the end tick
                var endTick = new Date().getTime();

                // save the current ticks to the last ticks
                ticksLast = ticksCurrent;

                // if tapping, then first the tap event
                if (touchMode === TOUCH_MODE_TAP) {
                    // start the timer to fire the tap handler, if 
                    if (! tapTimer) {
                        tapTimer = setTimeout(function() {
                            // reset the timer 
                            tapTimer = 0;

                            // fire the appropriate tap event
                            triggerPositionEvent(doubleTap ? 'doubleTap' : 'tap', touchesStart.touches[0]);
                        }, THRESHOLD_DOUBLETAP + 50);
                    }
                }
                // if moving, then fire the move end
                else if (touchMode == TOUCH_MODE_MOVE) {
                    triggerEvent("panEnd", totalDelta.x, totalDelta.y);
                    
                    if (inertiaSettings) {
                        checkInertia(touchUpXY, endTick);
                    } // if
                }
                // if pinchzooming, then fire the pinch zoom end
                else if (touchMode == TOUCH_MODE_PINCH) {
                    triggerEvent('pinchZoomEnd', relativeTouches(touchesStart), relativeTouches(touchesLast), endTick - touchStartTick);
                } // if..else
                
                targ.style.cursor = 'default';
                touchDown = false;
            } // if
        } // touchEnd
        
        function getWheelDelta(evt) {
            // process ff DOMMouseScroll event
            if (evt.detail) {
                var delta = -evt.detail * WHEEL_DELTA_STEP;
                
                return createPoint(
                    evt.axis === 1 ? delta : 0,
                    evt.axis === 2 ? delta : 0);
            }
            else {
                return createPoint(
                    evt.wheelDeltaX,
                    evt.wheelDeltaY);
            } // if..else
        } // getWheelDelta
        
        function wheelie(evt) {
            var targ = evt.target ? evt.target : evt.srcElement;
            
            if (aggressiveCapture || targ && (targ === targetElement)) {
                var delta = getWheelDelta(evt), 
                    zoomAmount = delta.y !== 0 ? Math.abs(delta.y / WHEEL_DELTA_STEP) : 0;

                if (lastXY && (zoomAmount !== 0)) {
                    // apply the offset to the xy
                    var xy = createPoint(
                        lastXY.x - targetElement.offsetLeft, 
                        lastXY.y - targetElement.offsetTop);
                    
                    triggerEvent("wheelZoom", xy, Math.pow(2, delta.y > 0 ? zoomAmount : -zoomAmount));
                } // if
                
                preventDefault(evt);
            } // if
        } // wheelie

        // initialise self
        var self = {
            supportsTouch: supportsTouch,

            /* define methods */
            
            addListeners: function(args) {
                listeners.push(args);
            },
            
            decoupleListeners: function(listenerId) {
                // iterate through the listeners and look for the matching listener id
                for (var ii = 0; listenerId && (ii < listeners.length); ii++) {
                    if (listeners[ii].listenerId === listenerId) {
                        listeners.splice(ii, 1);

                        break;
                    } // if
                } // for
            },
            
            release: function() {
                config.unbindEvent(supportsTouch ? 'touchstart' : 'mousedown', touchStart, false);
                config.unbindEvent(supportsTouch ? 'touchmove' : 'mousemove', touchMove, false);
                config.unbindEvent(supportsTouch ? 'touchend' : 'mouseup', touchEnd, false);
                
                // handle mouse wheel events by
                if (! supportsTouch) {
                    window.removeEventListener("mousewheel", wheelie, false);
                    window.removeEventListener("DOMMouseScroll", wheelie, false);
                } // if
            },

            inertiaEnable: function(animationTime, dimensions) {
                inertiaSettings = {
                    duration: animationTime,
                    max: dimensions ? Math.min(dimensions.width, dimensions.height) : DEFAULT_INERTIA_MAX
                };
            },
            
            inertiaDisable: function() {
                inertiaSettings = null;
            }
        };
        
        if (typeof supportsTouch === 'undefined') {
            supportsTouch = T5.getConfig().supportsTouch;
        } // if
        
        // wire up the events
        config.bindEvent(supportsTouch ? 'touchstart' : 'mousedown', touchStart, false);
        config.bindEvent(supportsTouch ? 'touchmove' : 'mousemove', touchMove, false);
        config.bindEvent(supportsTouch ? 'touchend' : 'mouseup', touchEnd, false);
        
        // handle mouse wheel events by
        if (! supportsTouch) {
            config.bindEvent("mousewheel", wheelie, window);
            config.bindEvent("DOMMouseScroll", wheelie, window);
        } // if

        return self;
    }; // TouchHelper
    
    // initialise touch helpers array
    var touchHelpers = [];
    
    T5.captureTouch = function(element, params) {
        if (! element) {
            throw new Error("Unable to capture touch of null element");
        } // if
        
        // if the element does not have an id, then generate on
        if (! element.id) {
            element.id = "touchable_" + elementCounter++;
        } // if
    
        // create the touch helper
        var touchHelper = touchHelpers[element.id];
        
        // if the touch helper has not been created, then create it and attach to events
        if (! touchHelper) {
            touchHelper = new TouchHelper(GT.extend({ element: element}, params));
            touchHelpers[element.id] = touchHelper;
        } // if
        
        // if we have params, then perform extra initialization
        if (params) {
            // if we already have an association with listeners, then remove first
            if (params.listenerId) {
                touchHelper.decoupleListeners(params.listenerId);
            } // if

            // flag the parameters with touch listener ids so they can be removed later
            params.listenerId = (++listenerCount);

            // add the listeners to the helper
            touchHelper.addListeners(params);
        } // if
        
        return touchHelper;
    }; // T5.captureTouch
    
    T5.resetTouch = function(element) {
        if (element && element.id && touchHelpers[element.id]) {
            touchHelpers[element.id].release();
            delete touchHelpers[element.id];
        } // if
    }; // T5.resetTouch
})();
