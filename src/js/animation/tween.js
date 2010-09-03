T5.Animation = (function() {
    // initialise variables
    var tweens = [],
        updating = false,
        tweenTimer = 0;
        
    function wake() {
        if (tweenTimer !== 0) { return; }
        
        tweenTimer = setInterval(function() {
            if (update(T5.time()) === 0) {
                clearInterval(tweenTimer);
                tweenTimer = 0;
            } // if
        }, 20);
    } // wake
    
    function update(tickCount) {
        if (updating) { return tweens.length; }
        
        updating = true;
        try {
            // iterate through the active tweens and update each
            var ii = 0;
            while (ii < tweens.length) {
                if (tweens[ii].isComplete()) {
                    tweens[ii].triggerComplete(false);
                    tweens.splice(ii, 1);
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
    } // update
    
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
        
        Tween: function(params) {
            params = T5.ex({
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
            var startTicks = T5.time(),
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
                            updatedValue = params.tweenFn(
                                                elapsed, 
                                                beginningValue, 
                                                change, 
                                                params.duration);
                    
                        // update the property value
                        if (params.target) {
                            params.target[params.property] = updatedValue;
                        } // if
                    
                        // iterate through the update listeners 
                        // and let them know the updated value
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
            beginningValue = 
                (params.target && params.property && params.target[params.property]) ? params.target[params.property] : params.startValue;

            // calculate the change and beginning position
            if (typeof params.endValue !== 'undefined') {
                change = (params.endValue - beginningValue);
            } // if
            
            // if no change is required, then mark as complete 
            // so the update method will never be called
            if (change == 0) {
                complete = true;
            } // if..else
            
            // wake the tween timer
            wake();
            
            return self;
        }
    };
    
    return T5.ex(module, {
        DEFAULT: T5.Easing.Back.Out
    });
})();
