SLICK.TOUCH = (function() {
    var module_types = {
        Touches: function() {
            // initialise private members
            var _vectors = [];

            var self = {
                addTouch: function(touch_vector) {
                    _vectors.push(touch_vector);
                },
                
                copy: function(source) {
                    // clear the vectors
                    _vectors = [];
                    
                    // iterate through the touch counts of the source
                    for (var ii = 0; source && (ii < source.getTouchCount()); ii++) {
                        _vectors.push(source.getTouch(ii).duplicate());
                    } // for
                },

                /*
                Method: calculateDelta
                This method is used to calculate the distance between the current touch and a previous touch event.  
                Note - The calculation is made using only the first touch stored in the vectors.
                */
                calculateDelta: function(previous_touches) {
                    // get the second vector
                    var previous_vector = previous_touches ? previous_touches.getTouch(0) : null;

                    // GRUNT.Log.info(String.format("calculating delta: current vector = {0}, previous vector = {1}", _vectors[0], previous_vector));
                    return previous_vector ? new SLICK.Vector(_vectors[0].x - previous_vector.x, _vectors[0].y - previous_vector.y) : new SLICK.Vector();
                },

                /*
                Method:  getDistance
                Returns the distance between the first two touches. 
                TODO: make it work for additional touch points
                */
                getDistance: function() {
                    var fnresult = 0;

                    // if we have multiple touches, then calculate distance betweem the touches
                    if (_vectors.length > 1) {
                        var dist_x = Math.abs(_vectors[0].x - _vectors[1].x);
                        var dist_y = Math.abs(_vectors[0].y - _vectors[1].y);

                        // calculate the distance between the points
                        fnresult = Math.sqrt((dist_x * dist_x) + (dist_y * dist_y));
                    } // if

                    return fnresult;
                },
                
                getRect: function() {
                    if (_vectors.length > 1) {
                        return _vectors[0].createRect(_vectors[1]);
                    } // if
                },

                getTouch: function(touch_index) {
                    // if the touch index is not set, the default to 0
                    if (! touch_index) {
                        touch_index = 0;
                    } // if

                    // if the touch index is within tolerances return the index
                    if (_vectors.length > touch_index) {
                        return _vectors[touch_index];
                    } // if

                    // TODO: determine whether it is better to return null, or a 0,0 Vector
                },

                getTouchCount: function() {
                    return _vectors.length;
                },

                toString: function() {
                    // initialise return value
                    var fnresult = "";

                    // iterate through the vectors and each to the string result
                    for (var ii = 0; ii < _vectors.length; ii++) {
                        fnresult += "[" + _vectors[ii] + "]";
                    } // for

                    return fnresult;
                }
            }; // self

            return self;
        }, // Touches        
        
        TouchHelper: function(params) {
            // initialise default args
            var DEFAULT_ARGS = {
                element: null,
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
            }; // DEFAULT_ARGS

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
            var touches_start = null;
            var touches_last = null;
            var touch_delta = null;
            var total_delta = null;
            var pan_delta = new SLICK.Vector();
            var touch_mode = null;
            var touch_down = false;
            var listeners = [];
            var ticks = {
                current: 0,
                last: 0
            };

            // initialise self
            var self = {
                args: GRUNT.extend({}, DEFAULT_ARGS, params),
                supportsTouch: touchReady,

                /* define mutable constants (yeah, I know that's a contradiction) */

                THRESHOLD_DOUBLETAP: 300,

                /* define methods */
                
                addListeners: function(args) {
                    listeners.push(args);
                },
                
                fireEvent: function(event_name) {
                    var eventArgs = [];
                    var ii = 0;
                    
                    for (ii = 1; ii < arguments.length; ii++) {
                        eventArgs.push(arguments[ii]);
                    } // for
                    
                    for (ii = 0; ii < listeners.length; ii++) {
                        if (listeners[ii][event_name]) {
                            listeners[ii][event_name].apply(self, eventArgs);
                        } // if
                    }
                },
                
                firePositionEvent: function(eventName, absVector) {
                    var offsetVector = null;
                    
                    // if an element is defined, then determine the element offset
                    if (self.args.element) {
                        var offset = jQuery(self.args.element).offset();
                        offsetVector = absVector.offset(-offset.left, -offset.top);
                    } // if
                    
                    // fire the event
                    self.fireEvent(eventName, absVector, offsetVector);
                },

                getTouchPoints: function(touch_event, type_priority) {
                    // initilaise variables
                    var fnresult = new module_types.Touches();

                    // if the type priority is not set, then use the default
                    if (! type_priority) {
                        type_priority = DEFAULT_TOUCHTYPE_PRIORITY;
                    } // if

                    // WHATTHE:
                    // The code below takes the type priority that was passed to the get pos function
                    // and iterates through the array grabbing the appropriate string that is referenced
                    // by the touch type in each instance.  We then look to see if the touch event both 
                    // supports contains that particular touch type and also checks that it has suffient
                    // touch positions to satisfy the request for the specified touch_index.  It's a bit
                    // confusing, but allows the getTouchPoints method to be called with an optional third param
                    // that means you can prioritize using targetTouches or changedTouches over the 
                    // global touches data.
                    var touch_array = null;
                    var ii = 0;
                    for (ii = 0; ii < type_priority.length; ii++) {
                        var touch_type = type_priority[ii];
                        if (touch_event[touch_type] && touch_event[touch_type].length > 0) {
                            touch_array = touch_event[touch_type];
                            break;
                        } // if
                    } // if

                    // if we have the touch array, then populate the touch points
                    if (touch_array) {
                        for (ii = 0; ii < touch_array.length; ii++) {
                            fnresult.addTouch(new SLICK.Vector(touch_array[ii].pageX, touch_array[ii].pageY));
                        } // for
                    }
                    // otherwise, if we are supporting mouse events (TODO: check for this)
                    else if (! touchReady) {
                        fnresult.addTouch(new SLICK.Vector(touch_event.pageX, touch_event.pageY));
                    } // if..else

                    return fnresult;
                },

                /*
                Method:  start
                This method is used to handle starting a touch event in the display
                */
                start: function(touch_event) {
                    touches_start = self.getTouchPoints(touch_event);
                    touch_delta = new SLICK.Vector();
                    total_delta = new SLICK.Vector();
                    touch_down = true;

                    // log the current touch start time
                    ticks.current = new Date().getTime();

                    // fire the touch start event handler
                    var touch_vector = touches_start.getTouch();
                    self.fireEvent('touchStartHandler', touch_vector.x, touch_vector.y);
                    
                    // check to see whether this is a double tap (if we are watching for them)
                    if (ticks.current - ticks.last < self.THRESHOLD_DOUBLETAP) {
                        // calculate the difference between this and the last touch point
                        var touchChange = touches_start.calculateDelta(touches_last);
                        if ((Math.abs(touchChange.x) < self.args.maxDistDoubleTap) && (Math.abs(touchChange.y) < self.args.maxDistDoubleTap)) {
                            var pos = touches_start.getTouch(0);
                            if (pos) {
                                self.fireEvent('doubleTapHandler', pos.x, pos.y);
                            } // if
                        } // if
                    } // if

                    // reset the touch mode to unknown
                    touch_mode = TOUCH_MODES.TAP;
                    
                    // update the last touches
                    touches_last = self.getTouchPoints(touch_event);
                },

                move: function(touch_event) {
                    if (! touch_down) { return; }
                    
                    // get the current touches
                    var touches_current = self.getTouchPoints(touch_event);
                    var zoom_distance = 0;

                    // check to see if we are pinching or zooming
                    if (touches_current.getTouchCount() > 1) {
                        // if the start touches does have two touch points, then reset to the current
                        if (touches_start.getTouchCount() === 1) {
                            touches_start.copy(touches_current);
                        } // if
                        
                        zoom_distance = touches_start.getDistance() - touches_last.getDistance();
                    } // if

                    // if the touch mode is tap, then check to see if we have gone beyond a move threshhold
                    if (touch_mode === TOUCH_MODES.TAP) {
                        // get the delta between the first touch and the current touch
                        var tap_delta = touches_current.calculateDelta(touches_start);

                        // if the delta.x or delta.y is greater than the move threshhold, we are no longer moving
                        if ((Math.abs(tap_delta.x) >= MIN_MOVEDIST) || (Math.abs(tap_delta.y) >= MIN_MOVEDIST)) {
                            touch_mode = TOUCH_MODES.MOVE;
                        } // if
                    } // if


                    // if we aren't in tap mode, then let's see what we should do
                    if (touch_mode !== TOUCH_MODES.TAP) {
                        // TODO: queue touch count history to enable an informed decision on touch end whether
                        // a single or multitouch event is completing...

                        // if we aren't pinching or zooming then do the move 
                        if (Math.abs(zoom_distance) < self.args.pinchZoomThreshold) {
                            // calculate the pan delta
                            touch_delta = touches_current.calculateDelta(touches_last);

                            // update the total delta
                            total_delta.add(touch_delta);
                            pan_delta.add(touch_delta);
                            
                            // if the pan_delta is sufficient to fire an event, then do so
                            if (pan_delta.getAbsSize() > self.args.panEventThreshhold) {
                                self.fireEvent('moveHandler', pan_delta.x, pan_delta.y);
                                pan_delta = new SLICK.Vector();
                            } // if

                            // set the touch mode to move
                            touch_mode = TOUCH_MODES.MOVE;

                            // TODO: investigate whether it is more efficient to animate on a timer or not
                        }
                        else {
                            self.fireEvent('pinchZoomHandler', touches_start, touches_current);

                            // set the touch mode to pinch zoom
                            touch_mode = TOUCH_MODES.PINCHZOOM;
                        } // if..else
                    } // if..else

                    // update the last touch position
                     // TODO: check whether I need to deep copy here...
                     touches_last = touches_current;
                },

                end: function(touch_event) {
                    // save the current ticks to the last ticks
                    ticks.last = ticks.current;

                    // if tapping, then first the tap event
                    if (touch_mode === TOUCH_MODES.TAP) {
                        // get the start touch
                        self.firePositionEvent('tapHandler', touches_start.getTouch(0));
                    }
                    // if moving, then fire the move end
                    else if (touch_mode == TOUCH_MODES.MOVE) {
                        self.fireEvent('moveEndHandler', total_delta.x, total_delta.y);
                    }
                    // if pinchzooming, then fire the pinch zoom end
                    else if (touch_mode == TOUCH_MODES.PINCHZOOM) {
                        // TODO: pass the total zoom amount
                        self.fireEvent('pinchZoomEndHandler', touches_start, touches_last);
                    } // if..else
                    
                    touch_down = false;
                }
            };

            return self;            
        } // TouchHelper        
    };
    
    // initialise touch helpers array
    var touch_helpers = [];
    
    // define the module members
    return {
        TouchEnable: (function() {
            return function(element, params) {
                // if the element does not have an id, then generate on
                if (! element.id) {
                    element.id = new Date().getTime();
                } // if
                
                // initialise the parameters with default params
                var plugin_params = GRUNT.extend({
                    preventDefault: true
                }, params);

                // create the touch helper
                var touch_helper = touch_helpers[element.id];
                
                // if the touch helper has not been created, then create it and attach to events
                if (! touch_helper) {
                    touch_helper = module_types.TouchHelper(GRUNT.extend({ element: element}, params));
                    touch_helpers[element.id] = touch_helper;
                    
                    // bind the touch events
                    element[touch_helper.supportsTouch ? 'ontouchstart' : 'onmousedown'] = function(evt) {
                        if (plugin_params.preventDefault) { evt.preventDefault(); }
                        touch_helper.start(evt);
                    }; // touchstart / mousedown

                    element[touch_helper.supportsTouch ? 'ontouchmove' : 'onmousemove'] = function(evt) {
                        if (plugin_params.preventDefault) { evt.preventDefault(); }
                        touch_helper.move(evt);
                    }; // touchmove / mousemove

                    element[touch_helper.supportsTouch ? 'ontouchend' : 'onmouseup'] = function(evt) {
                        if (plugin_params.preventDefault) { evt.preventDefault(); }
                        touch_helper.end(evt);
                    }; // touchend / mouseup

                    // if we support touch, then disable mouse wheel events
                    if (touch_helper.supportsTouch) {
                        element['onmousewheel'] = function(evt) {
                            evt.preventDefault();
                        }; // mousewheel
                    } // if
                } // if
                
                // add the listeners to the helper
                touch_helper.addListeners(params);
            }; 
        })()
    }; // module
})();

jQuery.fn.canTouchThis = function(params) {
    // bind the touch events
    return this.each(function() {
        SLICK.TOUCH.TouchEnable(this, params);
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
