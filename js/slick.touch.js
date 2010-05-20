SIDELAB.Vector = function(init_x, init_y) {
    // if the initialise x is not specified then set to 0
    if (! init_x) {
        init_x = 0;
    } // if
    
    // repeat for the y
    if (! init_y) {
        init_y = 0;
    } // if
    
    // initialise self
    var self = {
        x: init_x,
        y: init_y,
        
        toString: function() {
            return self.x + ", " + self.y;
        }
    }; // self
    
    return self;
}; // MAPPING.Point

SIDELAB.Touches = function() {
    // initialise private members
    var _vectors = [];
    
    var self = {
        addTouch: function(touch_vector) {
            _vectors.push(touch_vector);
        },

        /*
        Method: calculateDelta
        This method is used to calculate the distance between the current touch and a previous touch event.  
        Note - The calculation is made using only the first touch stored in the vectors.
        */
        calculateDelta: function(previous_touches) {
            // get the second vector
            var previous_vector = previous_touches.getTouch(0);
            
            // LOGGER.info(String.format("calculating delta: current vector = {0}, previous vector = {1}", _vectors[0], previous_vector));
            return previous_vector ? new SIDELAB.Vector(_vectors[0].x - previous_vector.x, _vectors[0].y - previous_vector.y) : new SIDELAB.Vector();
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
        }
    }; // self
    
    return self;
}; // SIDELAB.Touches

SIDELAB.TouchHelper = function() {
    // initialise constants
    var PANREFRESH = 5;
    var TOUCH_TYPES = {
        GLOBAL: 'touches',
        TARGET: 'targetTouches',
        CHANGED: 'changedTouches'
    };
    var DEFAULT_TOUCHTYPE_PRIORITY = [TOUCH_TYPES.GLOBAL, TOUCH_TYPES.TARGET];
    
    // initialise private members
    var touches_start = null;
    var touches_last = null;
    var touch_delta = null;
    var ticks = {
        current: 0,
        last: 0
    };
    
    // initialise self
    var self = {
        /* define mutable constants (yeah, I know that's a contradiction) */
        
        THRESHOLD_DOUBLETAP: 300,
        
        /* define methods */
        
        getTouchPoints: function(touch_event, type_priority) {
            // initilaise variables
            var fnresult = new SIDELAB.Touches();
            
            // if the type priority is not set, then use the default
            if (! type_priority) {
                type_priority = DEFAULT_TOUCHTYPE_PRIORITY;
            } // if
            
            // if the event is a jQuery event
            if (touch_event.originalEvent) {
                touch_event = touch_event.originalEvent;
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
            for (var ii = 0; ii < type_priority.length; ii++) {
                var touch_type = type_priority[ii];
                if (touch_event[touch_type] && touch_event[touch_type].length > 0) {
                    touch_array = touch_event[touch_type];
                    break;
                } // if
            } // if
            
            // if we have the touch array, then populate the touch points
            for (var ii = 0; touch_array && (ii < touch_array.length); ii++) {
                fnresult.addTouch(new SIDELAB.Vector(touch_array[ii].pageX, touch_array[ii].pageY));
            } // for

            return fnresult;
        },
        
        /*
        Method:  start
        This method is used to handle starting a touch event in the display
        */
        start: function(touch_event) {
            touches_start = self.getTouchPoints(touch_event);
            touches_last = self.getTouchPoints(touch_event);
            touch_delta = new SIDELAB.Vector();

            // log the current touch start time
            ticks.current = new Date().getTime();
            
            // if the time between taps is less than the thresh-hold fire a double-tap event
            if ((ticks.current - ticks.last < self.THRESHOLD_DOUBLETAP) && self.handleDoubleTap) {
                var pos = touches_start.getTouch(0);
                if (pos) {
                    self.handleDoubleTap(pos.x, pos.y);
                } // if
            } // if
        },
        
        move: function(touch_event) {
            // get the current touches
            var touches_current = self.getTouchPoints(touch_event);
            var zoom_amount = 0;
            
            // check to see if we are pinching or zooming
            if (touches_current.getTouchCount() > 1) {
                zoom_amount = touches_current.getDistance() - touches_last.getDistance();
            } // if
            
            // TODO: queue touch count history to enable an informed decision on touch end whether
            // a single or multitouch event is completing...
            
            // if we aren't pinching or zooming then do the move 
            if (zoom_amount == 0) {
                // calculate the pan delta
                touch_delta = touches_current.calculateDelta(touches_last);
                
                // LOGGER.info("touch delta = " + touch_delta.toString());
                if (self.handleMove) {
                    self.handleMove(touch_delta.x, touch_delta.y);
                } // if

                // TODO: investigate whether it is more efficient to animate on a timer or not
            }
            else if (self.handlePinchZoom) {
                self.handlePinchZoom(zoom_amount);
            } // if..else
            
            // update the last touch position
             // TODO: check whether I need to deep copy here...
             touches_last = touches_current;
        },
        
        end: function(touch_event) {
            // save the current ticks to the last ticks
            ticks.last = ticks.current;
        },

        /* event handlers */
        
        handleDoubleTap: function(x, y) {
            
        },
        
        handleMove: function(x, y) {
        },
        
        handlePinchZoom: function(zoom_delta) {
        }
    };
    
    return self;
}; // MAPPING.TouchHelper

jQuery.fn.canTouchThis = function(params) {
    // initialise the parameters with default params
    var plugin_params = jQuery.extend({
        preventDefault: true,
        moveHandler: null,
        pinchZoomHandler: null,
        doubleTapHandler: null
    }, params);
    
    // create the touch helper
    var touch_helper = new SIDELAB.TouchHelper();
    
    // initialise the touch helper from the plugin params
    touch_helper.handleMove = plugin_params.moveHandler;
    touch_helper.handlePinchZoom = plugin_params.pinchZoomHandler;
    touch_helper.handleDoubleTap = plugin_params.doubleTapHandler;
    
    // bind the touch events
    return this
        .bind("touchstart", function(evt) {
            if (plugin_params.preventDefault) { evt.preventDefault(); }
            
            try {
                touch_helper.start(evt);
            } 
            catch (e) {
                LOGGER.exception(e); 
            } // try..catch
        })
        .bind("touchmove", function(evt) {
            if (plugin_params.preventDefault) { evt.preventDefault(); }
            
            try {
                touch_helper.move(evt);
            }
            catch (e) {
                LOGGER.exception(e);
            } // try..catch
        })
        .bind("touchend", function(evt) {
            if (plugin_params.preventDefault) { evt.preventDefault(); }
            
            try {
                touch_helper.end(evt);
            }
            catch (e) {
                LOGGER.exception(e);
            } // try..catch
        })
        .bind("mousewheel", function(evt) {
            evt.preventDefault();
            LOGGER.info("Got a mouse wheel event");
        });
}; // canTouchThis