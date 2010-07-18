/**
SLICK Animation module
*/
SLICK.Animation = (function() {
    // initialise variables
    var tweens = [];
    
    // define the module
    var module = {
        DURATION: 2000,
        
        tween: function(target, property, targetValue, fn, callback) {
            // if the function is not defined, use the default
            tweens.push(new module.Tween({
                target: target,
                property: property,
                endValue: targetValue,
                tweenFn: fn,
                complete: callback
            }));
        },
        
        tweenVector: function(target, dstX, dstY, fn, callback) {
            if (target) {
                var xDone = target.x == dstX;
                var yDone = target.y == dstY;
                
                if (! xDone) {
                    module.tween(target, "x", dstX, fn, function() {
                        xDone = true;
                        if (xDone && yDone) { callback(); }
                    });
                } // if
                
                if (! yDone) {
                    module.tween(target, "y", dstY, fn, function() {
                        yDone = true;
                        if (xDone && yDone) { callback(); }
                    });
                } // if
            } // if
        },
        
        cancel: function() {
            // remove all the tweens
            tweens = [];
        },
        
        isTweening: function() {
            return tweens.length > 0;
        },
        
        update: function(tickCount) {
            try {
                // iterate through the active tweens and update each
                var ii = 0;
                while (ii < tweens.length) {
                    if (tweens[ii].isComplete()) {
                        tweens.splice(ii, 1);
                    }
                    else {
                        tweens[ii].update(tickCount);
                        ii++;
                    } // if..else
                } // while
            }
            catch (e) {
                GRUNT.Log.exception(e);
            } // try..catch
        },
        
        Tween: function(params) {
            params = GRUNT.extend({
                target: null,
                property: null,
                endValue: null,
                duration: module.DURATION,
                tweenFn: module.DEFAULT,
                complete: null
            }, params);
            
            // get the start ticks
            var startTicks = 0,
                complete = false,
                beginningValue = 0.0,
                changePerTick = 0.0;
                
            var self = {
                isComplete: function() {
                    return complete;
                },
                
                update: function(tickCount) {
                    if (! startTicks) {
                        startTicks = tickCount;
                    } // if
                    
                    // calculate the updated value
                    var elapsed = tickCount - startTicks,
                        updatedValue = params.tweenFn(elapsed, beginningValue, changePerTick * elapsed, params.duration);
                    
                    // update the property value
                    params.target[params.property] = updatedValue;
                    
                    // check to see if we are complete
                    /*
                    if (((params.endValue < beginningValue) && (updatedValue <= params.endValue)) || (updatedValue >= params.endValue)) {
                        complete = true;
                    } // if
                    */
                    complete = startTicks + params.duration < tickCount;
                    if (complete) {
                        GRUNT.Log.info("startTime = " + startTicks + ", duration = " + params.duration + ", tickCount = " + tickCount + ", updated value = " + updatedValue + ", complete = " + complete);
                    } // if
                }
            };

            // calculate the change and beginning position
            if (params.target && params.property && params.target[params.property]) {
                beginningValue = params.target[params.property];
                // check that the end value is not undefined
                if (typeof params.endValue !== 'undefined') {
                    changePerTick = (params.endValue - beginningValue) / params.duration;
                } // if
            } // if
            
            GRUNT.Log.info("creating new tween. change = " + changePerTick, params);

            // if no change is required, then mark as complete so the update method will never be called
            if (changePerTick == 0) {
                complete = true;
            } // if..else
            
            return self;
        },
        
        /**
        Easing functions
        
        sourced from Robert Penner's excellent work:
        http://www.robertpenner.com/easing/
        
        Functions follow the function format of fn(t, b, c, d, s) where:
        - t = time
        - b = beginning position
        - c = change
        - d = duration
        - s = slope ??
        */
        Easing: (function() {
            return {
                Linear: function(t, b, c, d) {
                    return c*t/d + b;
                },
                
                Back: {
                    In: function(t, b, c, d, s) {
                        if (! s) s = 1.70158;
                        return c*(t/=d)*t*((s+1)*t - s) + b;
                    },
                    
                    Out: function(t, b, c, d, s) {
                        if (! s) s = 1.70158;
                        return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
                    },
                    
                    InOut: function(t, b, c, d, s) {
                        if (! s) s = 1.70158; 
                        if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
                        return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
                    }
                }
            };
        })()
    };
    
    return GRUNT.extend(module, {
        DEFAULT: module.Easing.Back.Out
    });
})();

