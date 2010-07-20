SLICK.Touch = (function() {
    var elementCounter = 0;
    
    function calcDistance(touches) {
        return SLICK.VectorMath.distance(touches);
    } // calcDistance
    
    function calcChange(first, second) {
        var srcVector = first.length > 0 ? first[0] : null;
        if (srcVector && (second.length > 0)) {
            return srcVector.diff(second[0]);
        } // if
        
        return null;
    } // calcChange
    
    function preventDefaultTouch(touchEvent) {
        touchEvent.preventDefault();
        touchEvent.stopPropagation();
    } // preventDefaultTouch
    
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
                doubleTapHandler: null
            }, params);

            // determine whether touch is supported
            // nice work to thomas fuchs on this:
            // http://mir.aculo.us/2010/06/04/making-an-ipad-html5-app-making-it-really-fast/
            var touchReady = 'createTouch' in document;

            // initialise constants
            var PANREFRESH = 5;
            var TOUCH_TYPES = {
                GLOBAL: 'touches',
                TARGET: 'targetTouches',
                CHANGED: 'changedTouches'
            };
            var DEFAULT_TOUCHTYPE_PRIORITY = [TOUCH_TYPES.GLOBAL, TOUCH_TYPES.TARGET];
            var TOUCH_MODES = {
                TAP: 0,
                MOVE: 1, 
                PINCHZOOM: 2
            }; // TOUCH_MODES

            // TODO: configure the move distance to be screen size sensitive....
            var MIN_MOVEDIST = 7;

            // initialise private members
            var doubleTap = false,
                tapTimer = 0,
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
                BENCHMARK_INTERVAL = 300;
                
            function relativeTouches(touches) {
                var fnresult = new SLICK.VectorArray(touches, true);
                
                // apply the offset
                if (params.element) {
                    fnresult.applyOffset(new SLICK.Vector(-params.element.offsetLeft, -params.element.offsetTop));
                } // if
                
                return fnresult;
            } // relativeTouches
            
            // initialise self
            var self = {
                supportsTouch: SLICK.Device.supportsTouch,

                /* define mutable constants (yeah, I know that's a contradiction) */

                THRESHOLD_DOUBLETAP: 300,

                /* define methods */
                
                addListeners: function(args) {
                    listeners.push(args);
                },
                
                fireEvent: function(eventName) {
                    var eventArgs = [];
                    var ii = 0;
                    
                    for (ii = 1; ii < arguments.length; ii++) {
                        eventArgs.push(arguments[ii]);
                    } // for
                    
                    for (ii = 0; ii < listeners.length; ii++) {
                        if (listeners[ii][eventName]) {
                            listeners[ii][eventName].apply(self, eventArgs);
                        } // if
                    }
                },
                
                firePositionEvent: function(eventName, absVector) {
                    var offsetVector = null;
                    
                    // if an element is defined, then determine the element offset
                    if (params.element) {
                        offsetVector = absVector.offset(-params.element.offsetLeft, -params.element.offsetTop);
                    } // if
                    
                    // fire the event
                    self.fireEvent(eventName, absVector, offsetVector);
                },

                getTouchPoints: function(touchEvent, typePriority) {
                    if (! typePriority) {
                        typePriority = DEFAULT_TOUCHTYPE_PRIORITY;
                    } // if
                    
                    function getTouches(touches, touchType) {
                        var targetArray = touchEvent[touchType];
                        for (var ii = 0; targetArray && (ii < targetArray.length); ii++) {
                            touches.push(new SLICK.Vector(targetArray[ii].pageX, targetArray[ii].pageY));
                        } // for
                    } // getTouches
                    
                    var fnresult = [];
                    
                    // iterate through the type priorities and get the touches
                    for (var ii = 0; ii < typePriority.length; ii++) {
                        getTouches(fnresult, typePriority[ii]);
                        if (fnresult.length > 0) {
                            break;
                        } // if
                    }
                    
                    // if we have not touches, then just add the page x and page y
                    if (fnresult.length === 0) {
                        fnresult.push(new SLICK.Vector(touchEvent.pageX, touchEvent.pageY));
                    } // if

                    return fnresult;
                },

                /*
                Method:  start
                This method is used to handle starting a touch event in the display
                */
                start: function(touchEvent) {
                    try {
                        touchesStart = self.getTouchPoints(touchEvent);
                        touchDelta = new SLICK.Vector();
                        totalDelta = new SLICK.Vector();
                        touchDown = true;
                        doubleTap = false;
                    
                        // cancel event propogation
                        preventDefaultTouch(touchEvent);

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
                        self.fireEvent('touchStartHandler', touchVector.x, touchVector.y);
                    
                        // check to see whether this is a double tap (if we are watching for them)
                        if (ticks.current - ticks.last < self.THRESHOLD_DOUBLETAP) {
                            // calculate the difference between this and the last touch point
                            var touchChange = touchesLast ? touchesStart[0].diff(touchesLast[0]) : null;
                            if (touchChange && (Math.abs(touchChange.x) < params.maxDistDoubleTap) && (Math.abs(touchChange.y) < params.maxDistDoubleTap)) {
                                doubleTap = true;
                            } // if
                        } // if

                        // reset the touch mode to unknown
                        touchMode = TOUCH_MODES.TAP;
                    
                        // update the last touches
                        touchesLast = [].concat(touchesStart);
                    }
                    catch (e) {
                        GRUNT.Log.exception(e);
                    }
                },

                move: function(touchEvent) {
                    if (! touchDown) { return; }
                    
                    try {
                        // cancel event propogation
                        preventDefaultTouch(touchEvent);

                        // get the current touches
                        var touchesCurrent = self.getTouchPoints(touchEvent),
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
                                totalDelta.add(touchDelta);
                                panDelta.add(touchDelta);

                                // if the pan_delta is sufficient to fire an event, then do so
                                if (panDelta.getAbsSize() > params.panEventThreshhold) {
                                    self.fireEvent('moveHandler', panDelta.x, panDelta.y);
                                    panDelta.empty();
                                } // if

                                // set the touch mode to move
                                touchMode = TOUCH_MODES.MOVE;

                                // TODO: investigate whether it is more efficient to animate on a timer or not
                            }
                            else {
                                self.fireEvent('pinchZoomHandler', relativeTouches(touchesStart), relativeTouches(touchesCurrent));

                                // set the touch mode to pinch zoom
                                touchMode = TOUCH_MODES.PINCHZOOM;
                            } // if..else
                        } // if..else

                        touchesLast = [].concat(touchesCurrent);                        
                    }
                    catch (e) {
                        GRUNT.Log.exception(e);
                    } // try..catch
                },

                end: function(touchEvent) {
                    try {
                        // cancel event propogation
                        preventDefaultTouch(touchEvent);

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
                                    self.firePositionEvent(doubleTap ? 'doubleTapHandler' : 'tapHandler', touchesStart[0]);
                                }, self.THRESHOLD_DOUBLETAP + 50);
                            }
                        }
                        // if moving, then fire the move end
                        else if (touchMode == TOUCH_MODES.MOVE) {
                            self.fireEvent('moveEndHandler', totalDelta.x, totalDelta.y);
                        }
                        // if pinchzooming, then fire the pinch zoom end
                        else if (touchMode == TOUCH_MODES.PINCHZOOM) {
                            // TODO: pass the total zoom amount
                            self.fireEvent('pinchZoomEndHandler', relativeTouches(touchesStart), relativeTouches(touchesLast));
                        } // if..else

                        touchDown = false;
                    }
                    catch (e) {
                        GRUNT.Log.exception(e);
                    } // try..catch
                }
            };

            return self;            
        } // TouchHelper        
    };
    
    // initialise touch helpers array
    var touchHelpers = [];
    
    // define the module members
    return {
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
                    
                    // bind the touch events
                    // TOUCH START
                    SLICK.Device.eventTarget.addEventListener(touchHelper.supportsTouch ? 'touchstart' : 'mousedown', touchHelper.start, false);
                    SLICK.Device.eventTarget.addEventListener(touchHelper.supportsTouch ? 'touchmove' : 'mousemove', touchHelper.move, false);
                    SLICK.Device.eventTarget.addEventListener(touchHelper.supportsTouch ? 'touchend' : 'mouseup', touchHelper.end, false);

                    // if we support touch, then disable mouse wheel events
                    if (touchHelper.supportsTouch) {
                        element['onmousewheel'] = function(evt) {
                            evt.preventDefault();
                        }; // mousewheel
                    } // if
                } // if
                
                // add the listeners to the helper
                touchHelper.addListeners(params);
            }
            catch (e) {
                GRUNT.Log.exception(e);
            }
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

