/*
File:  slick.behaviours.js
This file implements mixins that describe behaviour for a particular display class

Section:  Version History
2010-06-03 (DJO) - Created File
*/

SLICK.Pannable = function(args) {
    // initialise defaults
    var DEFAULT_ARGS = {
        container: null,
        onPan: null,
        checkOffset: null
    };
    
    var offset = new SLICK.Vector();
    
    // initialise self
    var self = {
        args: GRUNT.extend({}, DEFAULT_ARGS, args),
        pannable: true,
        
        getOffset: function() {
            return new SLICK.Vector(offset.x, offset.y);
        },
        
        pan: function(x, y) {
            self.updateOffset(offset.x + x, offset.y + y);

            // if the on pan event is defined, then hook into it
            if (args.onPan) {
                args.onPan(x, y);
            } // if
        },
        
        updateOffset: function(x, y) {
            offset.x = x;
            offset.y = y;
            
            // if a checkoffset handler is defined, then call it to so if it needs to vito any of the offset
            // modifications that have been made in the pan event.  For example, when using an offscreen buffer
            // we need to keep the offset within tolerable bounds
            if (args.checkOffset) {
                offset = args.checkOffset(offset);
            } // if
        }
    };
    
    var container = jQuery(self.args.container).get(0);
    if (container) {
        SLICK.TOUCH.TouchEnable(container, {
            moveHandler: function(x, y) {
                self.pan(-x, -y);
            }
        });
    } // if
    
    return self;
}; // SLICK.Pannable

SLICK.Scalable = function(params) {
    params = GRUNT.extend({
        container: null,
        onPinchZoom: null,
        onScale: null
    }, params);

    var scaling = false;
    var startRect = null;
    var endRect = null;
    var scaleAmount = 0;
    
    // initialise self
    var self = {
        scalable: true,

        getStartRect: function() {
            return startRect;
        },
        
        getEndRect: function() {
            return endRect;
        },
        
        getScaling: function() {
            return scaling;
        },
        
        getScaleAmount: function() {
            return scaleAmount;
        }
    };
    
    var container = jQuery(params.container).get(0);
    if (container) {
        SLICK.TOUCH.TouchEnable(container, {
            pinchZoomHandler: function(touches_start, touches_current) {
                startRect = touches_start.getRect();
                endRect = touches_current.getRect();
                
                scaling = true;
                if (params.onPinchZoom) {
                    params.onPinchZoom();
                } // if
            },
            
            pinchZoomEndHandler: function(touches_start, touches_end) {
                startRect = touches_start.getRect();
                endRect = touches_end.getRect();
                
                // determine the ratio between the start rect and the end rect
                scaleAmount = (startRect && startRect.getSize() != 0) ? endRect.getSize() / startRect.getSize() : 1;
                
                scaling = false;
                if (params.onScale) {
                    params.onScale();
                } // if
            }
        });
    } // if    
    
    return self;
}; // SLICK.Scalable
