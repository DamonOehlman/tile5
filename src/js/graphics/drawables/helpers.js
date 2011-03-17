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