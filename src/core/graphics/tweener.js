var Tweener = (function() {
    
    /* internals */
    
    /* exports */

    function tween(valuesStart, valuesEnd, params, callback, viewToInvalidate) {
        params = _extend({
            easing: 'sine.out',
            duration: 1000,
            callback: callback
        }, params);
        
        function startTween(index) {
            _tweenValue(
                // start and end value
                valuesStart[index],
                valuesEnd[index],
                
                // easing equation
                _easing(params.easing),
                
                // duration 
                params.duration,
                
                // easing callback
                function(updatedValue, complete) {
                    valuesCurrent[index] = updatedValue;
                    
                    if (complete) {
                        finishedCount++;
                        
                        // if the tween has finished, then check a few things
                        if (continueTween && finishedCount >= expectedCount) {
                            var fireCB = callback ? callback() : true;
                            
                            if (params.callback && (_is(fireCB, typeUndefined) || fireCB)) {
                                params.callback();
                            } // if
                        } // if
                    } // if
                    
                    // if a view to invalidate has been specified, then invalidate it
                    if (viewToInvalidate) {
                        viewToInvalidate.invalidate();
                    } // if
                    
                    return continueTween;
                }
            );
        } // startTween
        
        var expectedCount = valuesStart.length,
            valuesCurrent = [].concat(valuesStart),
            finishedCount = 0,
            continueTween = true,
            ii;

        for (ii = expectedCount; ii--; ) {
            startTween(ii);
        } // for
        
        // return a function that the caller can use to get the updated values
        // and cancel the tween too :)
        return function(cancel) {
            continueTween = !cancel;
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
