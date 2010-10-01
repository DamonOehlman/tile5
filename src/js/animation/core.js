(function() {
    // initialise variables
    var tweens = [],
        tweenWorker = null,
        updating = false;
                
    function update(tickCount, worker) {
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
        
        // if we have no more tweens then complete it
        if (tweens.length === 0) {
            tweenWorker.trigger('complete');
        } // if
        
        return tweens.length;
    } // update
    
    T5.tweenValue = function(startValue, endValue, fn, callback, duration) {
        // create a tween that doesn't operate on a property
        var fnresult = new T5.Tween({
            startValue: startValue,
            endValue: endValue,
            tweenFn: fn,
            complete: callback,
            duration: duration
        });
        
        // add the the list return the new tween
        tweens.push(fnresult);
        return fnresult;
    }; // T5.tweenValue
    
    T5.tween = function(target, property, targetValue, fn, callback, duration) {
        var fnresult = new T5.Tween({
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
    }; // T5.tween
    
    T5.tweenVector = function(target, dstX, dstY, fn, callback, duration) {
        var fnresult = [];
        
        if (target) {
            var xDone = target.x == dstX;
            var yDone = target.y == dstY;
            
            if (! xDone) {
                fnresult.push(T5.tween(target, "x", dstX, fn, function() {
                    xDone = true;
                    if (xDone && yDone) { callback(); }
                }, duration));
            } // if
            
            if (! yDone) {
                fnresult.push(T5.tween(target, "y", dstY, fn, function() {
                    yDone = true;
                    if (xDone && yDone) { callback(); }
                }, duration));
            } // if
        } // if
        
        return fnresult;
    }; // T5.tweenVector
    
    T5.cancelAnimation = function(checkCallback) {
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
    }; // T5.cancelAnimation
    
    T5.isTweening = function() {
        return tweens.length > 0;
    }; // T5.isTweening

    T5.wakeTweens = function() {
        if (tweenWorker) { return; }
        
        // create a tween worker
        tweenWorker = GT.Loopage.join({
            execute: update
        });
        
        tweenWorker.bind('complete', function() {
            tweenWorker = null;
        });
    };
})();