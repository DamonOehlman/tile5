/**
# T5.Tween
*/
var Tween = function(params) {
    params = COG.extend({
        target: null,
        property: null,
        startValue: 0,
        endValue: null,
        duration: 2000,
        tweenFn: easing('sine.out'),
        complete: null,
        cancelOnInteract: false
    }, params);
    
    // get the start ticks
    var startTicks = ticks(),
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
                COG.Log.exception(e);
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
    wakeTweens();
    
    return self;
};