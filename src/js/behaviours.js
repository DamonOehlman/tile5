/*
File:  slick.behaviours.js
This file implements mixins that describe behaviour for a particular display class

Section:  Version History
2010-06-03 (DJO) - Created File
*/

SLICK.Pannable = function(params) {
    params = GRUNT.extend({
        container: null,
        onPan: null,
        onPanEnd: null,
        checkOffset: null
    }, params);
    
    var offset = new SLICK.Vector();
    
    // initialise self
    var self = {
        pannable: true,
        
        getOffset: function() {
            return new SLICK.Vector(offset.x, offset.y);
        },
        
        setOffset: function(x, y) {
            offset.x = x; offset.y = y;
        },
        
        pan: function(x, y, tweenFn) {
            // if no tween function is defined, then go ahead
            if (! tweenFn) {
                self.updateOffset(offset.x + x, offset.y + y);

                // if the on pan event is defined, then hook into it
                if (params.onPan) {
                    params.onPan(x, y);
                } // if
            }
            // otherwise, apply the tween function to the offset
            else {
                var endPosition = new SLICK.Vector(offset.x + x, offset.y + y);
                
                SLICK.Animation.tweenVector(offset, endPosition.x, endPosition.y, tweenFn, function() {
                    self.panEnd(0, 0);
                });
            } // if..else
        },
        
        panEnd: function(x, y) {
            if (params.onPanEnd) {
                params.onPanEnd(x, y);
            } // if
        },
        
        updateOffset: function(x, y) {
            offset.x = x;
            offset.y = y;
            
            // if a checkoffset handler is defined, then call it to so if it needs to vito any of the offset
            // modifications that have been made in the pan event.  For example, when using an offscreen buffer
            // we need to keep the offset within tolerable bounds
            if (params.checkOffset) {
                offset = params.checkOffset(offset);
            } // if
        }
    };
    
    var container = document.getElementById(params.container);
    if (container) {
        GRUNT.Log.info("making element #" + container.id + " pannable");
        SLICK.Touch.TouchEnable(container, {
            moveHandler: function(x, y) {
                self.pan(-x, -y);
            },
            
            moveEndHandler: function(x, y) {
                self.panEnd(x, y);
            }
        });
    } // if
    
    return self;
}; // SLICK.Pannable

SLICK.Scalable = function(params) {
    params = GRUNT.extend({
        container: null,
        onPinchZoom: null,
        onScale: null,
        scaleDamping: false
    }, params);

    var scaling = false;
    var startRect = null;
    var endRect = null;
    var scaleFactor = 1;
    
    function checkTouches(start, end) {
        startRect = start.getRect();
        endRect = end.getRect();
        
        // determine the ratio between the start rect and the end rect
        scaleFactor = (startRect && startRect.getSize() != 0) ? endRect.getSize() / startRect.getSize() : 1;
        /*
        if (params.scaleDamping && (scaleAmount != 1)) {
            scaleAmount = Math.sqrt(scaleAmount);
        } // if
        */
    } // checkTouches
    
    // initialise self
    var self = {
        scalable: true,

        getStartRect: function() {
            return startRect.duplicate();
        },
        
        getEndRect: function() {
            return endRect.duplicate();
        },
        
        getScaling: function() {
            return scaling;
        },
        
        getScaleFactor: function() {
            return scaleFactor;
        }
    };
    
    var container = document.getElementById(params.container);
    if (container) {
        GRUNT.Log.info("making element #" + container.id + " scalable");
        SLICK.Touch.TouchEnable(container, {
            pinchZoomHandler: function(touchesStart, touchesCurrent) {
                checkTouches(touchesStart, touchesCurrent);
                
                scaling = true;
                if (params.onPinchZoom) {
                    params.onPinchZoom();
                } // if
            },
            
            pinchZoomEndHandler: function(touchesStart, touchesEnd) {
                checkTouches(touchesStart, touchesEnd);
                
                scaling = false;
                if (params.onScale) {
                    params.onScale(scaleFactor);
                } // if
                
                // restore the scale amount to 1
                scaleFactor = 1;
            }
        });
    } // if    
    
    return self;
}; // SLICK.Scalable
