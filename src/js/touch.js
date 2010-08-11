SLICK.Touch = (function() {
    // initialise constants
    var PANREFRESH = 5;
    var TOUCH_MODES = {
        TAP: 0,
        MOVE: 1, 
        PINCHZOOM: 2
    }; // TOUCH_MODES

    // TODO: configure the move distance to be screen size sensitive....
    var MIN_MOVEDIST = 7;

    var elementCounter = 0,
        listenerCount = 0;
    
    function calcDistance(touches) {
        return SLICK.VectorMath.distance(touches);
    } // calcDistance
    
    function calcChange(first, second) {
        var srcVector = (first && (first.length > 0)) ? first[0] : null;
        if (srcVector && second && (second.length > 0)) {
            return SLICK.V.diff(srcVector, second[0]);
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
            fnresult[ii] = new SLICK.Vector(touches[ii].pageX, touches[ii].pageY);
        } // for
        
        return fnresult;
    } // getTouchPoints
    
    function getMousePos(event) {
        return [new SLICK.Vector(event.pageX, event.pageY)];
    } // getMousePos
    
    function debugTouchEvent(evt, title) {
        GRUNT.Log.info("TOUCH EVENT '" + title + "':", evt);
        GRUNT.Log.info("TOUCH EVENT '" + title + "': touches = ", evt.touches);
        GRUNT.Log.info("TOUCH EVENT '" + title + "': targetTouches = ", evt.targetTouches);
        GRUNT.Log.info("TOUCH EVENT '" + title + "': changedTouches = ", evt.changeTouches);
    } // debugTouchEvent
    
    var module_types = {
        TouchHelper: function(params) {
            params = GRUNT.extend({
                element: null,
                inertiaTrigger: 20,
                maxDistDoubleTap: 20,
                panEventThreshhold: 0,
                pinchZoomThreshold: 5,
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
                supportsTouch = SLICK.Device.getConfig().supportsTouch,
                touchesStart = null,
                touchesLast = null,
                touchDelta = null,
                totalDelta = null,
                panDelta = new SLICK.Vector(),
                touchMode = null,
                touchDown = false,
                listeners = [],
                ticks = {
                    current: 0,
                    last: 0
                },
                config = SLICK.Device.getConfig(),
                BENCHMARK_INTERVAL = 300;
                
            function relativeTouches(touches) {
                var fnresult = new SLICK.VectorArray(touches, true);
                
                // apply the offset
                if (params.element) {
                    fnresult.applyOffset(new SLICK.Vector(-params.element.offsetLeft, -params.element.offsetTop));
                } // if
                
                return fnresult;
            } // relativeTouches
            
            function fireEvent(eventName) {
                var eventArgs = new Array(arguments.length - 1);
                var ii = 0;
                
                for (ii = 1; ii < arguments.length; ii++) {
                    eventArgs[ii - 1] = arguments[ii];
                } // for
                
                for (ii = listeners.length; ii--; ) {
                    if (listeners[ii][eventName]) {
                        listeners[ii][eventName].apply(self, eventArgs);
                    } // if
                } // for
            } // fireEvent
            
            function firePositionEvent(eventName, absVector) {
                var offsetVector = null;
                
                // if an element is defined, then determine the element offset
                if (params.element) {
                    offsetVector = SLICK.V.offset(absVector, -params.element.offsetLeft, -params.element.offsetTop);
                } // if
                
                // fire the event
                fireEvent(eventName, absVector, offsetVector);
            } // firePositionEvent
            
            function touchStart(evt) {
                // debugTouchEvent(evt, 'touch start');
                touchesStart = supportsTouch ? getTouchPoints(evt.touches) : getMousePos(evt);
                touchDelta = new SLICK.Vector();
                totalDelta = new SLICK.Vector();
                touchDown = true;
                doubleTap = false;
                
                if (evt.target && (evt.target === params.element)) {
                    // cancel event propogation
                    preventDefaultTouch(evt);

                    // clear the inertia interval if it is running
                    // clearInterval(inertiaInterval);
            
                    // log the current touch start time
                    ticks.current = SLICK.Clock.getTime();
            
                    // fire the touch start event handler
                    var touchVector = touchesStart.length > 0 ? touchesStart[0] : null;
            
                    // if we don't have a touch vector, then log a warning, and exit
                    if (! touchVector) {
                        GRUNT.Log.warn("Touch start fired, but no touch vector found");
                        return;
                    } // if
            
                    // fire the touch start handler
                    fireEvent('touchStartHandler', touchVector.x, touchVector.y);
            
                    // check to see whether this is a double tap (if we are watching for them)
                    if (ticks.current - ticks.last < self.THRESHOLD_DOUBLETAP) {
                        // calculate the difference between this and the last touch point
                        var touchChange = touchesLast ? SLICK.V.diff(touchesStart[0], touchesLast[0]) : null;
                        if (touchChange && (Math.abs(touchChange.x) < params.maxDistDoubleTap) && (Math.abs(touchChange.y) < params.maxDistDoubleTap)) {
                            doubleTap = true;
                        } // if
                    } // if

                    // reset the touch mode to unknown
                    touchMode = TOUCH_MODES.TAP;
            
                    // update the last touches
                    touchesLast = [].concat(touchesStart);
                } // if
            } // touchStart
            
            function touchMove(evt) {
                if (! touchDown) { return; }
                
                if (evt.target && (evt.target === params.element)) {
                    try {
                        // cancel event propogation
                        preventDefaultTouch(evt);

                        // get the current touches
                        var touchesCurrent = supportsTouch ? getTouchPoints(evt.touches) : getMousePos(evt),
                            zoomDistance = 0;

                        // check to see if we are pinching or zooming
                        if (touchesCurrent.length > 1) {
                            // if the start touches does have two touch points, then reset to the current
                            if (touchesStart.length === 1) {
                                touchesStart = [].concat(touchesCurrent);
                            } // if

                            zoomDistance = calcDistance(touchesStart) - calcDistance(touchesLast);
                        } // if

                        // if the touch mode is tap, then check to see if we have gone beyond a move threshhold
                        if (touchMode === TOUCH_MODES.TAP) {
                            // get the delta between the first touch and the current touch
                            var tapDelta = calcChange(touchesCurrent, touchesStart);

                            // if the delta.x or delta.y is greater than the move threshhold, we are no longer moving
                            if (tapDelta && ((Math.abs(tapDelta.x) >= MIN_MOVEDIST) || (Math.abs(tapDelta.y) >= MIN_MOVEDIST))) {
                                touchMode = TOUCH_MODES.MOVE;
                            } // if
                        } // if


                        // if we aren't in tap mode, then let's see what we should do
                        if (touchMode !== TOUCH_MODES.TAP) {
                            // TODO: queue touch count history to enable an informed decision on touch end whether
                            // a single or multitouch event is completing...

                            // if we aren't pinching or zooming then do the move 
                            if ((! zoomDistance) || (Math.abs(zoomDistance) < params.pinchZoomThreshold)) {
                                // calculate the pan delta
                                touchDelta = calcChange(touchesCurrent, touchesLast);

                                // update the total delta
                                if (touchDelta) {
                                    totalDelta.x += touchDelta.x; totalDelta.y += touchDelta.y;
                                    panDelta.x += touchDelta.x; panDelta.y += touchDelta.y;
                                } // if

                                // if the pan_delta is sufficient to fire an event, then do so
                                if (SLICK.V.absSize(panDelta) > params.panEventThreshhold) {
                                    fireEvent('moveHandler', panDelta.x, panDelta.y);
                                    panDelta = SLICK.V.create();
                                } // if

                                // set the touch mode to move
                                touchMode = TOUCH_MODES.MOVE;

                                // TODO: investigate whether it is more efficient to animate on a timer or not
                            }
                            else {
                                fireEvent('pinchZoomHandler', relativeTouches(touchesStart), relativeTouches(touchesCurrent));

                                // set the touch mode to pinch zoom
                                touchMode = TOUCH_MODES.PINCHZOOM;
                            } // if..else
                        } // if..else

                        touchesLast = [].concat(touchesCurrent);                        
                    }
                    catch (e) {
                        GRUNT.Log.exception(e);
                    } // try..catch
                } // if
            } // touchMove
            
            function touchEnd(evt) {
                if (evt.target && (evt.target === params.element)) {
                    try {
                        // cancel event propogation
                        preventDefaultTouch(evt);

                        // get the end tick
                        var endTick = SLICK.Clock.getTime();

                        // save the current ticks to the last ticks
                        ticks.last = ticks.current;

                        // if tapping, then first the tap event
                        if (touchMode === TOUCH_MODES.TAP) {
                            // start the timer to fire the tap handler, if 
                            if (! tapTimer) {
                                tapTimer = setTimeout(function() {
                                    // reset the timer 
                                    tapTimer = 0;

                                    // fire the appropriate tap event
                                    firePositionEvent(doubleTap ? 'doubleTapHandler' : 'tapHandler', touchesStart[0]);
                                }, self.THRESHOLD_DOUBLETAP + 50);
                            }
                        }
                        // if moving, then fire the move end
                        else if (touchMode == TOUCH_MODES.MOVE) {
                            fireEvent('moveEndHandler', totalDelta.x, totalDelta.y);
                        }
                        // if pinchzooming, then fire the pinch zoom end
                        else if (touchMode == TOUCH_MODES.PINCHZOOM) {
                            // TODO: pass the total zoom amount
                            fireEvent('pinchZoomEndHandler', relativeTouches(touchesStart), relativeTouches(touchesLast));
                        } // if..else

                        touchDown = false;
                    }
                    catch (e) {
                        GRUNT.Log.exception(e);
                    } // try..catch
                } // if
            } // touchEnd

            // initialise self
            var self = {
                supportsTouch: supportsTouch,

                /* define mutable constants (yeah, I know that's a contradiction) */

                THRESHOLD_DOUBLETAP: 300,

                /* define methods */
                
                addListeners: function(args) {
                    listeners.push(args);
                },
                
                decoupleListeners: function(listenerId) {
                    // iterate through the listeners and look for the matching listener id
                    for (var ii = 0; listenerId && (ii < listeners.length); ii++) {
                        if (listeners[ii].listenerId === listenerId) {
                            listeners.splice(ii, 1);
                            GRUNT.Log.info("successfully decoupled touch listener: " + listenerId);

                            break;
                        } // if
                    } // for
                },
                
                release: function() {
                    config.eventTarget.removeEventListener(config.supportsTouch ? 'touchstart' : 'mousedown', touchStart, false);
                    config.eventTarget.removeEventListener(config.supportsTouch ? 'touchmove' : 'mousemove', touchMove, false);
                    config.eventTarget.removeEventListener(config.supportsTouch ? 'touchend' : 'mouseup', touchEnd, false);
                },
                
                wheelie: function(evt) {
                    var delta = new SLICK.Vector(evt.wheelDeltaX, evt.wheelDeltaY),
                        xy = new SLICK.Vector(evt.clientX, evt.clientY),
                        zoomAmount = delta.y !== 0 ? Math.abs(delta.y / 120) : 0;
                        
                    if (zoomAmount !== 0) {
                        fireEvent("wheelZoomHandler", xy, delta.y > 0 ? zoomAmount + 0.5 : 0.5 / zoomAmount);
                    } // if
                    
                    GRUNT.Log.info("capture mouse wheel event, delta = " + delta + ", position = " + xy);
                }
            };
            
            // wire up the events
            config.eventTarget.addEventListener(config.supportsTouch ? 'touchstart' : 'mousedown', touchStart, false);
            config.eventTarget.addEventListener(config.supportsTouch ? 'touchmove' : 'mousemove', touchMove, false);
            config.eventTarget.addEventListener(config.supportsTouch ? 'touchend' : 'mouseup', touchEnd, false);
            
            /*
            // handle mouse wheel events by
            eventTarget.addEventListener(
                "mousewheel",
                function (evt) {
                    touchHelper.wheelie(evt);
                }, false);
            */

            return self;
        } // TouchHelper
    };
    
    // initialise touch helpers array
    var touchHelpers = [];
    
    // define the module members
    return {
        // TODO: add the release touch method
        captureTouch: function(element, params) {
            try {
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
                    touchHelper = module_types.TouchHelper(GRUNT.extend({ element: element}, params));
                    touchHelpers[element.id] = touchHelper;
                    
                    GRUNT.Log.info("CREATED TOUCH HELPER. SUPPORTS TOUCH = " + touchHelper.supportsTouch);
                } // if
                
                // if we already have an association with listeners, then remove first
                if (params.listenerId) {
                    touchHelper.decoupleListeners(params.listenerId);
                } // if
                
                // flag the parameters with touch listener ids so they can be removed later
                params.listenerId = (++listenerCount);

                // add the listeners to the helper
                touchHelper.addListeners(params);
            }
            catch (e) {
                GRUNT.Log.exception(e);
            }
        },
        
        resetTouch: function(element) {
            if (element && element.id && touchHelpers[element.id]) {
                touchHelpers[element.id].release();
                delete touchHelpers[element.id];
            } // if
        }
    }; // module
})();

// if jquery is defined, then add the plugins
if (typeof(jQuery) !== 'undefined') {
    jQuery.fn.canTouchThis = function(params) {
        // bind the touch events
        return this.each(function() {
            SLICK.Touch.captureTouch(this, params);
        });
    }; // canTouchThis

    jQuery.fn.untouchable = function() {
        // define acceptable touch items
        var TAGS_CANTOUCH = /^(A|BUTTON)$/i;

        return this
            /*
            .bind("touchstart", function(evt) {
                if (! (evt.target && TAGS_CANTOUCH.test(evt.target.tagName))) {
                    // check to see whether a click handler has been assigned for the current object
                    if (! (evt.target.onclick || evt.target.ondblclick)) {
                        GRUNT.Log.info("no touch for: " + evt.target.tagName);
                        evt.preventDefault();
                    } // if
                } // if
            })
            */
            .bind("touchmove", function(evt) {
                evt.preventDefault();
            });
    }; // untouchable
} // if

