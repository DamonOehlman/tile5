/**
TILE5 Animation module
*/
TILE5.Animation = (function() {
    // initialise variables
    var tweens = [],
        updating = false,
        tweenTimer = 0;
        
    function wake() {
        if (tweenTimer !== 0) { return; }
        
        tweenTimer = setInterval(function() {
            if (module.update(TILE5.Clock.getTime()) === 0) {
                clearInterval(tweenTimer);
                tweenTimer = 0;
            } // if
        }, 20);
    } // wake
    
    // define the module
    var module = {
        DURATION: 2000,
        
        tweenValue: function(startValue, endValue, fn, callback, duration) {
            // create a tween that doesn't operate on a property
            var fnresult = new module.Tween({
                startValue: startValue,
                endValue: endValue,
                tweenFn: fn,
                complete: callback,
                duration: duration
            });
            
            // add the the list return the new tween
            tweens.push(fnresult);
            return fnresult;
        },
        
        tween: function(target, property, targetValue, fn, callback, duration) {
            var fnresult = new module.Tween({
                target: target,
                property: property,
                endValue: targetValue,
                tweenFn: fn,
                duration: duration,
                complete: callback
            });
            
            // return the new tween
            tweens.push(fnresult);
            return fnresult;
        },
        
        tweenVector: function(target, dstX, dstY, fn, callback, duration) {
            var fnresult = [];
            
            if (target) {
                var xDone = target.x == dstX;
                var yDone = target.y == dstY;
                
                if (! xDone) {
                    fnresult.push(module.tween(target, "x", dstX, fn, function() {
                        xDone = true;
                        if (xDone && yDone) { callback(); }
                    }, duration));
                } // if
                
                if (! yDone) {
                    fnresult.push(module.tween(target, "y", dstY, fn, function() {
                        yDone = true;
                        if (xDone && yDone) { callback(); }
                    }, duration));
                } // if
            } // if
            
            return fnresult;
        },
        
        cancel: function(checkCallback) {
            if (updating) { return ; }
            
            updating = true;
            try {
                var ii = 0;

                // trigger the complete for the tween marking it as cancelled
                while (ii < tweens.length) {
                    if ((! checkCallback) || checkCallback(tweens[ii])) {
                        GRUNT.Log.info("CANCELLING ANIMATION");
                        tweens[ii].triggerComplete(true);
                        tweens.splice(ii, 1);
                    }
                    else {
                        ii++;
                    } // if..else
                } // for
            }
            finally {
                updating = false;
            } // try..finally
        },
        
        isTweening: function() {
            return tweens.length > 0;
        },
        
        update: function(tickCount) {
            if (updating) { return tweens.length; }
            
            updating = true;
            try {
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
            }
            finally {
                updating = false;
            } // try..finally
            
            return tweens.length;
        },
        
        Tween: function(params) {
            params = GRUNT.extend({
                target: null,
                property: null,
                startValue: 0,
                endValue: null,
                duration: module.DURATION,
                tweenFn: module.DEFAULT,
                complete: null,
                cancelOnInteract: false
            }, params);
            
            // get the start ticks
            var startTicks = TILE5.Clock.getTime(),
                updateListeners = [],
                complete = false,
                beginningValue = 0.0,
                change = 0;
                
            function notifyListeners(updatedValue, complete) {
                for (var ii = updateListeners.length; ii--; ) {
                    updateListeners[ii](updatedValue, complete);
                } // for
            } // notifyListeners
                
            var self = {
                cancelOnInteract: params.cancelOnInteract,
                
                isComplete: function() {
                    return complete;
                },
                
                triggerComplete: function(cancelled) {
                    if (params.complete) {
                        params.complete(cancelled);
                    } // if
                },
                
                update: function(tickCount) {
                    try {
                        // calculate the updated value
                        var elapsed = tickCount - startTicks,
                            updatedValue = params.tweenFn(elapsed, beginningValue, change, params.duration);
                    
                        // update the property value
                        if (params.target) {
                            params.target[params.property] = updatedValue;
                        } // if
                    
                        // iterate through the update listeners and let them know the updated value
                        notifyListeners(updatedValue);

                        complete = startTicks + params.duration <= tickCount;
                        if (complete) {
                            if (params.target) {
                                params.target[params.property] = params.tweenFn(params.duration, beginningValue, change, params.duration);
                            } // if
                        
                            notifyListeners(updatedValue, true);
                        } // if
                    }
                    catch (e) {
                        GRUNT.Log.exception(e);
                    } // try..catch
                },
                
                requestUpdates: function(callback) {
                    updateListeners.push(callback);
                }
            };
            
            // calculate the beginning value
            beginningValue = (params.target && params.property && params.target[params.property]) ? params.target[params.property] : params.startValue;

            // calculate the change and beginning position
            if (typeof params.endValue !== 'undefined') {
                change = (params.endValue - beginningValue);
            } // if
            
            // GRUNT.Log.info("creating new tween. change = " + change, params);

            // if no change is required, then mark as complete so the update method will never be called
            if (change == 0) {
                complete = true;
            } // if..else
            
            // wake the tween timer
            wake();
            
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
                        if (t < d/2) return module.Easing.Bounce.In(t*2, 0, c, d) / 2 + b;
                        else return module.Easing.Bounce.Out(t*2-d, 0, c, d) / 2 + c/2 + b;
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

