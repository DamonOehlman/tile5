// initialise variables
var tweens = [],
    tweenWorker = null,
    updatingTweens = false;

/* animation internals */
            
function updateTweens(tickCount, worker) {
    if (updatingTweens) { return tweens.length; }
    
    updatingTweens = true;
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
        updatingTweens = false;
    } // try..finally
    
    // if we have no more tweens then complete it
    if (tweens.length === 0) {
        tweenWorker.trigger('complete');
    } // if
    
    return tweens.length;
} // update

function cancelAnimation(checkCallback) {
    if (updatingTweens) { return ; }
    
    updatingTweens = true;
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
        updatingTweens = false;
    } // try..finally
} // T5.cancelAnimation

function wakeTweens() {
    if (tweenWorker) { return; }
    
    // create a tween worker
    tweenWorker = COG.Loopage.join({
        execute: updateTweens,
        frequency: 20
    });
    
    tweenWorker.bind('complete', function(evt) {
        tweenWorker = null;
    });
} // wakeTweens

/* animation exports */

/*
# T5.tweenValue
*/
function tweenValue(startValue, endValue, fn, callback, duration) {
    // create a tween that doesn't operate on a property
    var fnresult = new Tween({
        startValue: startValue,
        endValue: endValue,
        tweenFn: fn,
        complete: callback,
        duration: duration
    });
    
    // add the the list return the new tween
    tweens.push(fnresult);
    return fnresult;
} // T5.tweenValue

/*
# T5.tween
*/
function tween(target, property, targetValue, fn, callback, duration) {
    var fnresult = new Tween({
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
} // T5.tween

