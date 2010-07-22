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
    
    var animating = false,
        offset = new SLICK.Vector();
    
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
                self.updateOffset(offset.x + x, offset.y + y, tweenFn);
            } // if..else
        },
        
        isAnimating: function() {
            return animating;
        },
        
        panEnd: function(x, y) {
            if (params.onPanEnd) {
                params.onPanEnd(x, y);
            } // if
        },
        
        updateOffset: function(x, y, tweenFn) {
            if (tweenFn) {
                var endPosition = new SLICK.Vector(x, y);

                animating = true;
                var tweens = SLICK.Animation.tweenVector(offset, endPosition.x, endPosition.y, tweenFn, function() {
                    animating = false;
                    self.panEnd(0, 0);
                });

                // set the tweens to cancel on interact
                for (var ii = 0; ii < tweens.length; ii++) {
                    tweens[ii].cancelOnInteract = true;
                } // for            
            }
            else {
                self.setOffset(x, y);
            } // if..else
        }
    };
    
    var container = document.getElementById(params.container);
    if (container) {
        SLICK.Touch.captureTouch(container, {
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
        
        // get the sizes of the rects
        var startSize = startRect.getSize(),
            endSize = endRect.getSize();
        
        // determine the ratio between the start rect and the end rect
        scaleFactor = (startRect && (startSize !== 0)) ? (endSize / startSize) : 1;
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
        SLICK.Touch.captureTouch(container, {
            pinchZoomHandler: function(touchesStart, touchesCurrent) {
                checkTouches(touchesStart, touchesCurrent);
                
                scaling = scaleFactor !== 1;
                if (scaling && params.onPinchZoom) {
                    params.onPinchZoom(touchesStart, touchesCurrent);
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
