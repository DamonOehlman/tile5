var Tweener = (function() {
    
    /* internals */
    
    /* exports */

    function tween(valuesStart, valuesEnd, params, callback) {
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
                        if (finishedCount >= expectedCount) {
                            var fireCB = callback ? callback() : true;
                            
                            if (params.callback && (_is(fireCB, typeUndefined) || fireCB)) {
                                params.callback();
                            } // if
                        } // if
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
    
    return {
        tween: tween
    };
})();
