var Animator = (function() {
    
    /* internals */
    
    var FRAME_RATE = 1000 / 60,
        callbacks = [],
        frameIndex = 0;
    
    function frame(tickCount) {
        // increment the frame index
        frameIndex++;

        // set the tick count in the case that it hasn't been set already
        tickCount = tickCount || new Date().getTime();
        
        // iterate through the callbacks
        for (var ii = callbacks.length; ii--; ) {
            var cbData = callbacks[ii];

            // check to see if this callback should fire this frame
            if (frameIndex % cbData.every === 0) {
                cbData.cb(tickCount);
            } // if
        } // for
        
        // schedule the animator for another call
        animFrame(frame);
    } // frame
    
    /* exports */
    
    function attach(callback, every) {
        callbacks[callbacks.length] = {
            cb: callback,
            every: every ? round(every / FRAME_RATE) : 1
        };
    } // attach
    
    function detach(callback) {
        // TODO: remove from the list of callbacks
    } // detach
    
    // bind to the animframe callback
    animFrame(frame);
    
    return {
        attach: attach,
        detact: detach
    };
})();