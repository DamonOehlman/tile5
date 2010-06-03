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
        onPan: null
    };
    
    // initialise self
    var self = {
        args: jQuery.extend({}, DEFAULT_ARGS, args),
        
        pan: function(x, y) {
            if (args.onPan) {
                args.onPan(x, y);
            } // if
        }
    };
    
    if (self.args.container) {
        jQuery(self.args.container).canTouchThis({
            moveHandler: function(x, y) {
                self.pan(x, y);
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
    
    // initialise self
    var self = {
        args: jQuery.extend({}, DEFAULT_ARGS, args),
        
        scale: function(scale_amount) {
            if (args.onScale) {
                args.onScale(scale_amount);
            } // if
        }
    };
    
    if (self.args.container) {
        jQuery(self.args.container).canTouchThis({
            pinchZoomHandler: function(scale_amount) {
                self.scale(scale_amount);
            }
        });
    } // if
    
    return self;
}; // SLICK.Scalable