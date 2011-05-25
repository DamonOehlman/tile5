var Tweener = (function() {
    
    /* internals */
    
    /* exports */

    function tween(valuesStart, valuesEnd, params, callback, viewToInvalidate) {
        params = _extend({
            easing: 'sine.out',
            duration: 1000,
            complete: null
        }, params);
        
        var valueCount = valuesStart.length,
            valuesCurrent = [].concat(valuesStart),
            callbacks = [callback, params.complete],
            easingFn = _easing(params.easing),
            valuesChange = [],
            finishedCount = 0,
            cancelTween = false,
            duration = params.duration,
            ii,
            startTicks = new Date().getTime();
            
        function tweenStep(tickCount) {
            // calculate the updated value
            var elapsed = tickCount - startTicks,
                complete = startTicks + duration <= tickCount,
                retVal;
                
            // iterate through the values and update
            for (var ii = valueCount; ii--; ) {
                valuesCurrent[ii] = easingFn(
                    elapsed, 
                    valuesStart[ii], 
                    valuesChange[ii], 
                    duration);
            } // for
            
            if (viewToInvalidate) {
                viewToInvalidate.invalidate();
            } // if
            
            if (complete || cancelTween) {
                 Animator.detach(tweenStep);
                 
                 for (ii = 0; ii < callbacks.length; ii++) {
                     if (callbacks[ii]) {
                         callbacks[ii](valuesCurrent, elapsed, cancelTween);
                     } // if
                 } // // for
            } // if
        } // function
        
        // determine the changed values
        for (ii = valueCount; ii--; ) {
            valuesChange[ii] = valuesEnd[ii] - valuesStart[ii];
        } // for
        
        Animator.attach(tweenStep);
        
        // return a function that the caller can use to get the updated values
        // and cancel the tween too :)
        return function(cancel) {
            cancelTween = cancel;
            return valuesCurrent;
        }; // function
    } // tween
    
    function tweenDrawable(drawable, prop, startVal, endVal, tween) {
        var tweenFn = Tweener.tween(
                [startVal],
                [endVal],
                tween,
                function() {
                    drawable[prop] = endVal;
                
                    // remove the tween fn
                    for (var ii = drawable.tweens.length; ii--; ) {
                        if (drawable.tweens[ii] === applicator) {
                            drawable.tweens.splice(ii, 1);
                            break;
                        } // if
                    } // for
                },
                drawable.view
            ),
            applicator = function() {
                drawable[prop] = tweenFn()[0];
            };
            
        return applicator;
    } // tweenDrawable
    
    return {
        tween: tween,
        tweenDrawable: tweenDrawable
    };
})();
