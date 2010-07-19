/**
SLICK Animation module
*/
SLICK.Animation = (function() {
    // initialise variables
    var tweens = [];
    
    // define the module
    var module = {
        DURATION: 2000,
        
        tween: function(target, property, targetValue, fn, callback, duration) {
            // if the function is not defined, use the default
            tweens.push(new module.Tween({
                target: target,
                property: property,
                endValue: targetValue,
                tweenFn: fn,
                duration: duration,
                complete: callback
            }));
        },
        
        tweenVector: function(target, dstX, dstY, fn, callback, duration) {
            if (target) {
                var xDone = target.x == dstX;
                var yDone = target.y == dstY;
                
                if (! xDone) {
                    module.tween(target, "x", dstX, fn, function() {
                        xDone = true;
                        if (xDone && yDone) { callback(); }
                    }, duration);
                } // if
                
                if (! yDone) {
                    module.tween(target, "y", dstY, fn, function() {
                        yDone = true;
                        if (xDone && yDone) { callback(); }
                    }, duration);
                } // if
            } // if
        },
        
        cancel: function() {
            // trigger the complete for the tween marking it as cancelled
            for (var ii = 0; ii < tweens.length; ii++) {
                tweens[ii].triggerComplete(true);
            } // for
            
            // remove all the tweens
            tweens = [];
        },
        
        isTweening: function() {
            return tweens.length > 0;
        },
        
        update: function(tickCount) {
            // iterate through the active tweens and update each
            var ii = 0;
            while (ii < tweens.length) {
                if (tweens[ii].isComplete()) {
                    tweens[ii].triggerComplete(false);
                    tweens.splice(ii, 1);
                    
                    GRUNT.WaterCooler.say("animation.complete");
                }
                else {
                    tweens[ii].update(tickCount);
                    ii++;
                } // if..else
            } // while
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
            var startTicks = new Date().getTime(),
                complete = false,
                beginningValue = 0.0,
                change = 0;
                
            var self = {
                isComplete: function() {
                    return complete;
                },
                
                triggerComplete: function(cancelled) {
                    if (params.complete) {
                        params.complete(cancelled);
                    } // if
                },
                
                update: function(tickCount) {
                    // calculate the updated value
                    var elapsed = tickCount - startTicks,
                        updatedValue = params.tweenFn(elapsed, beginningValue, change, params.duration);
                    
                    // update the property value
                    params.target[params.property] = updatedValue;

                    complete = startTicks + params.duration <= tickCount;
                    if (complete) {
                        params.target[params.property] = params.tweenFn(params.duration, beginningValue, change, params.duration);
                    } // if
                }
            };

            // calculate the change and beginning position
            if (params.target && params.property && params.target[params.property]) {
                beginningValue = params.target[params.property];
                // check that the end value is not undefined
                if (typeof params.endValue !== 'undefined') {
                    change = (params.endValue - beginningValue);
                } // if
            } // if
            
            // GRUNT.Log.info("creating new tween. change = " + changePerTick, params);

            // if no change is required, then mark as complete so the update method will never be called
            if (change == 0) {
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
        */
        Easing: (function() {
            var s = 1.70158;
            
            return {
                Linear: function(t, b, c, d) {
                    return c*t/d + b;
                },
                
                Back: {
                    In: function(t, b, c, d) {
                        return c*(t/=d)*t*((s+1)*t - s) + b;
                    },
                    
                    Out: function(t, b, c, d) {
                        return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
                    },
                    
                    InOut: function(t, b, c, d) {
                        return ((t/=d/2)<1) ? c/2*(t*t*(((s*=(1.525))+1)*t-s))+b : c/2*((t-=2)*t*(((s*=(1.525))+1)*t+s)+2)+b;
                    }
                },
                
                Bounce: {
                    In: function(t, b, c, d) {
                        return c - module.Easing.Bounce.Out(d-t, 0, c, d) + b;
                    },
                    
                    Out: function(t, b, c, d) {
                        if ((t/=d) < (1/2.75)) {
                            return c*(7.5625*t*t) + b;
                        } else if (t < (2/2.75)) {
                            return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
                        } else if (t < (2.5/2.75)) {
                            return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
                        } else {
                            return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
                        }
                    },
                    
                    InOut: function(t, b, c, d) {
                        if (t < d/2) return module.Easing.Bounce.In(t*2, 0, c, d) * 0.5 + b;
                        else return module.Easing.Bounce.Out(t*2-d, 0, c, d) * 0.5 + c*0.5 + b;
                    }
                },
                
                Cubic: {
                    In: function(t, b, c, d) {
                        return c*(t/=d)*t*t + b;
                    },
                    
                    Out: function(t, b, c, d) {
                        return c*((t=t/d-1)*t*t + 1) + b;
                    },
                    
                    InOut: function(t, b, c, d) {
                        if ((t/=d/2) < 1) return c/2*t*t*t + b;
                        return c/2*((t-=2)*t*t + 2) + b;
                    }
                },
                
                Elastic: {
                    In: function(t, b, c, d, a, p) {
                        var s;
                        
                        if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
                        if (!a || a < Math.abs(c)) { a=c; s=p/4; }
                        else s = p/(2*Math.PI) * Math.asin (c/a);
                        return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
                    },
                    
                    Out: function(t, b, c, d, a, p) {
                        var s;
                        
                        if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
                        if (!a || a < Math.abs(c)) { a=c; s=p/4; }
                        else s = p/(2*Math.PI) * Math.asin (c/a);
                        return (a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b);
                    },
                    
                    InOut: function(t, b, c, d, a, p) {
                        var s;
                        
                        if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(0.3*1.5);
                        if (!a || a < Math.abs(c)) { a=c; s=p/4; }
                        else s = p/(2*Math.PI) * Math.asin (c/a);
                        if (t < 1) return -0.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
                        return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*0.5 + c + b;
                    }
                },
                
                Quad: {
                    In: function(t, b, c, d) {
                        return c*(t/=d)*t + b;
                    },
                    
                    Out: function(t, b, c, d) {
                        return -c *(t/=d)*(t-2) + b;
                    },
                    
                    InOut: function(t, b, c, d) {
                        if ((t/=d/2) < 1) return c/2*t*t + b;
                        return -c/2 * ((--t)*(t-2) - 1) + b;
                    }
                },
                
                Sine: {
                    In: function(t, b, c, d) {
                        return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
                    },
                    
                    Out: function(t, b, c, d) {
                        return c * Math.sin(t/d * (Math.PI/2)) + b;
                    },
                    
                    InOut: function(t, b, c, d) {
                        return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
                    }
                }
            };
        })()
    };
    
    return GRUNT.extend(module, {
        DEFAULT: module.Easing.Back.Out
    });
})();

