var ANI_WAIT = 1000 / 60 | 0,
    animateCallbacks = [],
    lastAniTicks = 0;
    
function runAnimationCallbacks(tickCount) {
    // initialise the tick count if it isn't already defined
    // not all browsers pass through the ticks with the requestAnimationFrame :/
    tickCount = tickCount ? tickCount : new Date().getTime();
    
    // if we a due for a redraw then do on
    if (tickCount - lastAniTicks > ANI_WAIT) {
        var callbacks = animateCallbacks.splice(0);
        
        // iterate through the callbacks and run each on
        for (var ii = callbacks.length; ii--; ) {
            callbacks[ii](tickCount);
        } // for 
        
        lastAniTicks = tickCount;
    } // if

    // we have completed our loop, if we have callbacks to go then schedule again
    if (animateCallbacks.length) {
        animFrame(runAnimationCallbacks);
    } // if
} // runAnimationCallback

function registerAnimationCallback(fn) {
    var scheduleCallbacks = animateCallbacks.length == 0;
    
    // add the callback to the list
    animateCallbacks[animateCallbacks.length] = fn;
    
    // if we need to schedule, then do it now
    if (scheduleCallbacks) {
        animFrame(runAnimationCallbacks);
    } // if
} // registerAnimationCallback

function animateDrawable(target, fnName, argsStart, argsEnd, opts) {
    opts = _extend({
        easing: 'sine.out',
        duration: 1000,
        progress: null,
        complete: null,
        autoInvalidate: true
    }, opts);
    
    var startTicks = new Date().getTime(),
        lastTicks = 0,
        targetFn = target[fnName],
        floorValue = fnName == 'translate',
        argsComplete = 0,
        autoInvalidate = opts.autoInvalidate,
        animateValid = argsStart.length && argsEnd.length && 
            argsStart.length == argsEnd.length,
        argsCount = animateValid ? argsStart.length : 0,
        argsChange = new Array(argsCount),
        argsCurrent = new Array(argsCount),
        easingFn = _easing(opts.easing),
        duration = opts.duration,
        callback = opts.progress,
        ii,
        
        runTween = function(tickCount) {
            // calculate the updated value
            var elapsed = tickCount - startTicks,
                complete = startTicks + duration <= tickCount,
                view = target.layer ? target.layer.view : null,
                easedValue;

            // iterate through the arguments and get the current values
            for (var ii = argsCount; ii--; ) {
                // calculate the eased value
                easedValue = easingFn(
                    elapsed, 
                    argsStart[ii], 
                    argsChange[ii], 
                    duration);
                
                // apply the eased value (flooring if appropriate)
                argsCurrent[ii] = floorValue ? easedValue | 0 : easedValue;
            } // for

            // call the target function with the specified arguments
            targetFn.apply(target, argsCurrent);

            // if we need to auto invalidate the control then do so now
            if (autoInvalidate && view) {
                view.invalidate();
            } // if
            
            // if we have a progress callback, trigger that
            if (callback) {
                // initilaise the args
                var cbArgs = [].concat(complete ? argsEnd : argsCurrent);
                
                // unshift the complete value onto the args
                cbArgs.unshift(complete);
                
                // fire the callback
                callback.apply(target, cbArgs);
            } // if
            
            if (! complete) {
                registerAnimationCallback(runTween);
            }
            else {
                target.animations--;
                targetFn.apply(target, argsEnd);
                
                // if we have a completion callback fire it
                if (opts.complete) {
                    opts.complete.apply(target, argsEnd);
                } // if
            } // if..else
        };
        
    if (targetFn && targetFn.apply && argsCount > 0) {
        // update the duration with the default value if not specified
        duration = duration ? duration : DEFAULT_DURATION;
        
        // calculate changed values
        for (ii = argsCount; ii--; ) {
            argsChange[ii] = argsEnd[ii] - argsStart[ii];
        } // for
        
        // increase the drawables animation count
        target.animations++;
        
        registerAnimationCallback(runTween);            
    } // if
} // animate