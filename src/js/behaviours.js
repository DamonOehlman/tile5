/*
File:  slick.behaviours.js
This file implements mixins that describe behaviour for a particular display class

Section:  Version History
2010-06-03 (DJO) - Created File
*/

// TODO: investigate the overheads of having multiple touch helpers created for each object that implements
// each one of these behaviours

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
        args: jQuery.extend({}, DEFAULT_ARGS, args),
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

SLICK.Scalable = function(args) {
    // initialise defaults
    var DEFAULT_ARGS = {
        container: null,
        onScale: null
    };
    
    var scale_amount = 0;
    
    // initialise self
    var self = {
        args: jQuery.extend({}, DEFAULT_ARGS, args),
        scalable: true,
        
        getScaleAmount: function() {
            return scale_amount;
        },
        
        scale: function(amount) {
            // update the scale factor
            scale_amount = amount * 0.5;
            
            SLICK.logger.info("scaling by " + scale_amount);
            
            if (args.onScale) {
                args.onScale(scale_amount);
            } // if
        }
    };
    
    var container = jQuery(self.args.container).get(0);
    if (container) {
        SLICK.TOUCH.TouchEnable(container, {
            pinchZoomHandler: function(amount) {
                self.scale(amount);
            }
        });
    } // if    
    
    return self;
}; // SLICK.Scalable
