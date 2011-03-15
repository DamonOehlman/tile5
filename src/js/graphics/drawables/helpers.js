var ANI_WAIT = 1000 / 60 | 0,
    animateCallbacks = [],
    lastAniTicks = 0;

function checkOffsetAndBounds(drawable, image) {
    var x, y;
    
    if (image && image.width > 0) {
        if (! drawable.imageOffset) {
            drawable.imageOffset = XY.init(
                -image.width >> 1, 
                -image.height >> 1
            );
        } // if
        
        if (! drawable.bounds) {
            x = drawable.xy.x + drawable.imageOffset.x;
            y = drawable.xy.y + drawable.imageOffset.y;
            
            drawable.bounds = XYRect.init(x, y, x + image.width, y + image.height);
        } // if            
    } // if
} // checkOffsetAndBounds

function registerAnimationCallback(fn) {
    var scheduleCallbacks = animateCallbacks.length == 0;
    
    // add the callback to the list
    animateCallbacks[animateCallbacks.length] = fn;
    
    // if we need to schedule, then do it now
    if (scheduleCallbacks) {
        animFrame(runAnimationCallbacks);
    } // if
} // registerAnimationCallback

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

function transformable(target) {
    
    /* internals */
    var DEFAULT_DURATION = 1000,
        rotation = 0,
        scale = 1,
        transX = 0,
        transY = 0;
        
    function checkTransformed() {
        target.transformed = (scale !== 1) || 
            (rotation % TWO_PI !== 0) || 
            (transX !== 0) || (transY !== 0);
    } // isTransformed
        
    /* exports */
    
    function animate(fn, argsStart, argsEnd, opts) {
        opts = COG.extend({
            easing: 'sine.out',
            duration: 1000,
            progress: null,
            complete: null,
            autoInvalidate: true
        }, opts);
        
        var startTicks = new Date().getTime(),
            lastTicks = 0,
            targetFn = target[fn],
            argsComplete = 0,
            autoInvalidate = opts.autoInvalidate,
            animateValid = argsStart.length && argsEnd.length && 
                argsStart.length == argsEnd.length,
            argsCount = animateValid ? argsStart.length : 0,
            argsChange = new Array(argsCount),
            argsCurrent = new Array(argsCount),
            easingFn = COG.easing(opts.easing),
            duration = opts.duration,
            callback = opts.progress,
            ii,
            
            runTween = function(tickCount) {
                // calculate the updated value
                var elapsed = tickCount - startTicks,
                    complete = startTicks + duration <= tickCount;

                // iterate through the arguments and get the current values
                for (var ii = argsCount; ii--; ) {
                    argsCurrent[ii] = easingFn(
                        elapsed, 
                        argsStart[ii], 
                        argsChange[ii], 
                        duration);
                } // for

                // call the target function with the specified arguments
                targetFn.apply(target, argsCurrent);

                // if we need to auto invalidate the control then do so now
                if (autoInvalidate) {
                    target.invalidate.call(target);
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

            registerAnimationCallback(runTween);            
        } // if
    } // animate
    
    function transform(context, offsetX, offsetY) {
        context.save();
        context.translate(target.xy.x - offsetX + transX, target.xy.y - offsetY + transY);
        
        if (rotation !== 0) {
            context.rotate(rotation);
        } // if
        
        if (scale !== 1) {
            context.scale(scale, scale);
        } // if
    } // transform
    
    COG.extend(target, {
        animate: animate,
        
        rotate: function(value) {
            rotation = value;
            checkTransformed();
        },
        
        scale: function(value) {
            scale = value;
            checkTransformed();
        },
        
        translate: function(x, y) {
            transX = x;
            transY = y;
            checkTransformed();
        },
        
        transform: transform
    });
}
