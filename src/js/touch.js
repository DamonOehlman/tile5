(function() {
    // initialise constants
    var WHEEL_DELTA_STEP = 120,
        DEFAULT_INERTIA_MAX = 500,
        INERTIA_TIMEOUT_MOUSE = 100,
        INERTIA_TIMEOUT_TOUCH = 250,
        THRESHOLD_DOUBLETAP = 300,
        THRESHOLD_PINCHZOOM = 5,
        THRESHOLD_PAN_EVENT = 2;
        
    // define the touch modes
    var TOUCH_MODE_TAP = 0,
        TOUCH_MODE_MOVE = 1,
        TOUCH_MODE_PINCH = 2;

    // TODO: configure the move distance to be screen size sensitive....
    var MIN_MOVEDIST = 7;

    var elementCounter = 0,
        listenerCount = 0,
        createVector = T5.V.create,
        vectorDistance = T5.V.distance,
        vectorDiff = T5.V.diff;
    
    function calcDistance(touches) {
        return vectorDistance(touches);
    } // calcDistance
    
    function calcChange(first, second) {
        var srcVector = (first && (first.length > 0)) ? first[0] : null;
        if (srcVector && second && (second.length > 0)) {
            return vectorDiff(srcVector, second[0]);
        } // if
        
        return null;
    } // calcChange
    
    function preventDefaultTouch(evt) {
        evt.preventDefault();
        evt.stopPropagation();
    } // preventDefaultTouch
    
    function getTouchPoints(touches) {
        var fnresult = new Array(touches.length);
        for (var ii = touches.length; ii--; ) {
            fnresult[ii] = createVector(touches[ii].pageX, touches[ii].pageY);
        } // for
        
        return fnresult;
    } // getTouchPoints
    
    function getMousePos(evt) {
        return [createVector(evt.pageX, evt.pageY)];
    } // getMousePos
    
    function debugTouchEvent(evt, title) {
        GT.Log.info("TOUCH EVENT '" + title + "':", evt);
        GT.Log.info("TOUCH EVENT '" + title + "': touches = ", evt.touches);
        GT.Log.info("TOUCH EVENT '" + title + "': targetTouches = ", evt.targetTouches);
        GT.Log.info("TOUCH EVENT '" + title + "': changedTouches = ", evt.changeTouches);
    } // debugTouchEvent
    
    /* touch helper */
    
    var TouchHelper =  function(params) {
        params = T5.ex({
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
            supportsTouch = T5.getConfig().supportsTouch,
            touchesStart = null,
            touchesLast = null,
            touchDelta = null,
            totalDelta = null,
            panDelta = createVector(),
            touchMode = null,
            touchDown = false,
            touchStartTick = 0,
            listeners = [],
            lastXY = null,
            inertiaSettings = null,
            ticksCurrent = 0,
            ticksLast = 0,
            targetElement = params.element,
            observable = params.observable,
            BENCHMARK_INTERVAL = 300;
            
        function calculateInertia(upXY, currentXY, distance, tickDiff) {
            var theta = Math.asin((upXY.y - currentXY.y) / distance),
                // TODO: remove the magic numbers from here (pass through animation time from view, and determine max from dimensions)
                extraDistance = Math.min(Math.floor(distance * (inertiaSettings.duration / tickDiff)), inertiaSettings.max),
                distanceVector;
                
            theta = currentXY.x > upXY.x ? theta : Math.PI - theta;
            distanceVector = createVector(Math.cos(theta) * -extraDistance, Math.sin(theta) * extraDistance);
                
            triggerEvent("inertiaPan", distanceVector.x, distanceVector.y);
        } // calculateInertia
        
        function checkInertia(upXY, currentTick) {
            var tickDiff, distance;
            
            if (! supportsTouch) {
                lastXY = upXY;
                
                GT.Loopage.join({
                    execute: function(tickCount, worker) {
                        tickDiff = tickCount - currentTick;
                        distance = vectorDistance([upXY, lastXY]);

                        // calculate the inertia
                        if ((tickDiff < INERTIA_TIMEOUT_MOUSE) && (distance > params.inertiaTrigger)) {
                            worker.trigger('complete');
                            calculateInertia(upXY, lastXY, distance, tickDiff);
                        }
                        else if (tickDiff > INERTIA_TIMEOUT_MOUSE) {
                            worker.trigger('complete');
                        } // if..else
                    }
                });
            }
            else {
                tickDiff = currentTick - touchStartTick;
                
                if ((tickDiff < INERTIA_TIMEOUT_TOUCH)) {
                    distance = vectorDistance([touchesStart[0], upXY]);
                    
                    if (distance > params.inertiaTrigger) {
                        calculateInertia(touchesStart[0], upXY, distance, tickDiff);
                    } // if
                } // if
            } // if..else                
        } // checkInertia
            
        function relativeTouches(touches) {
            var fnresult = [],
                offsetX = targetElement ? -targetElement.offsetLeft : 0,
                offsetY = targetElement ? -targetElement.offsetTop : 0;
            
            // apply the offset
            for (var ii = touches.length; ii--; ) {
                fnresult[fnresult.length] = T5.V.offset(touches[ii], offsetX, offsetY);
            } // for
            
            return fnresult;
        } // relativeTouches
        
        function triggerEvent() {
            if (observable) {
                observable.trigger.apply(null, arguments);
            } // if
        } // triggerEvent
        
        function triggerPositionEvent(eventName, absVector) {
            var offsetVector = null;
            
            // if an element is defined, then determine the element offset
            if (targetElement) {
                offsetVector = T5.V.offset(absVector, -targetElement.offsetLeft, -targetElement.offsetTop);
            } // if
            
            // fire the event
            triggerEvent(eventName, absVector, offsetVector);
        } // triggerPositionEvent

        function touchStart(evt) {
            if (evt.target && (evt.target === targetElement)) {
                touchesStart = supportsTouch ? getTouchPoints(evt.touches) : getMousePos(evt);
                touchDelta = createVector();
                totalDelta = createVector();
                touchDown = true;
                doubleTap = false;
                touchStartTick = T5.time();

                // cancel event propogation
                preventDefaultTouch(evt);
                evt.target.style.cursor = 'move';

                // trigger the inertia cancel event
                triggerEvent("inertiaCancel");

                // log the current touch start time
                ticksCurrent = touchStartTick;
        
                // fire the touch start event handler
                var touchVector = touchesStart.length > 0 ? touchesStart[0] : null;
        
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
                    var touchChange = touchesLast ? T5.V.diff(touchesStart[0], touchesLast[0]) : null;
                    if (touchChange && (Math.abs(touchChange.x) < params.maxDistDoubleTap) && (Math.abs(touchChange.y) < params.maxDistDoubleTap)) {
                        doubleTap = true;
                    } // if
                } // if

                // reset the touch mode to unknown
                touchMode = TOUCH_MODE_TAP;
        
                // update the last touches
                touchesLast = [].concat(touchesStart);
            } // if
        } // touchStart
        
        function touchMove(evt) {
            if (evt.target && (evt.target === targetElement)) {
                lastXY = (supportsTouch ? getTouchPoints(evt.touches) : getMousePos(evt))[0];
                
                if (! touchDown) { return; }

                // cancel event propogation
                if (supportsTouch) {
                    preventDefaultTouch(evt);
                } // if

                // get the current touches
                var touchesCurrent = supportsTouch ? getTouchPoints(evt.touches) : getMousePos(evt),
                    zoomDistance = 0;

                // check to see if we are pinching or zooming
                if (touchesCurrent.length > 1) {
                    // if the start touches does have two touch points, then reset to the current
                    if (touchesStart.length === 1) {
                        touchesStart = [].concat(touchesCurrent);
                    } // if

                    zoomDistance = calcDistance(touchesStart) - calcDistance(touchesCurrent);
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

                        // if the pan_delta is sufficient to fire an event, then do so
                        if (T5.V.absSize(panDelta) > THRESHOLD_PAN_EVENT) {
                            triggerEvent("pan", panDelta.x, panDelta.y);
                            panDelta = createVector();
                        } // if

                        // set the touch mode to move
                        touchMode = TOUCH_MODE_MOVE;
                    }
                    else {
                        triggerEvent('pinchZoom', relativeTouches(touchesStart), relativeTouches(touchesCurrent));

                        // set the touch mode to pinch zoom
                        touchMode = TOUCH_MODE_PINCH;
                    } // if..else
                } // if..else

                touchesLast = [].concat(touchesCurrent);                        
            } // if
        } // touchMove
        
        function touchEnd(evt) {
            if (evt.target && (evt.target === targetElement)) {
                var touchUpXY = (supportsTouch ? getTouchPoints(evt.changedTouches) : getMousePos(evt))[0];
                
                // cancel event propogation
                if (supportsTouch) {
                    preventDefaultTouch(evt);
                } // if

                // get the end tick
                var endTick = T5.time();

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
                            triggerPositionEvent(doubleTap ? 'doubleTap' : 'tap', touchesStart[0]);
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
                
                evt.target.style.cursor = 'default';
                touchDown = false;
            } // if
        } // touchEnd
        
        function getWheelDelta(evt) {
            // process ff DOMMouseScroll event
            if (evt.detail) {
                var delta = -evt.detail * WHEEL_DELTA_STEP;
                return createVector(evt.axis === 1 ? delta : 0, evt.axis === 2 ? delta : 0);
            }
            else {
                return createVector(evt.wheelDeltaX, evt.wheelDeltaY);
            } // if..else
        } // getWheelDelta
        
        function wheelie(evt) {
            if (evt.target && (evt.target === targetElement)) {
                var delta = getWheelDelta(evt), 
                    zoomAmount = delta.y !== 0 ? Math.abs(delta.y / WHEEL_DELTA_STEP) : 0;

                if (lastXY && (zoomAmount !== 0)) {
                    // apply the offset to the xy
                    var xy = T5.V.offset(lastXY, -targetElement.offsetLeft, -targetElement.offsetTop);
                    triggerEvent("wheelZoom", xy, Math.pow(2, delta.y > 0 ? zoomAmount : -zoomAmount));
                } // if
                
                evt.preventDefault();
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
            touchHelper = new TouchHelper(T5.ex({ element: element}, params));
            touchHelpers[element.id] = touchHelper;
        } // if
        
        // if we already have an association with listeners, then remove first
        if (params.listenerId) {
            touchHelper.decoupleListeners(params.listenerId);
        } // if
        
        // flag the parameters with touch listener ids so they can be removed later
        params.listenerId = (++listenerCount);

        // add the listeners to the helper
        touchHelper.addListeners(params);
        
        return touchHelper;
    }; // T5.captureTouch
    
    T5.resetTouch = function(element) {
        if (element && element.id && touchHelpers[element.id]) {
            touchHelpers[element.id].release();
            delete touchHelpers[element.id];
        } // if
    }; // T5.resetTouch
})();
