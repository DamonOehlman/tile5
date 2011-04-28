var Animator = (function() {
    
    /* internals */
    
    var FRAME_RATE = 1000 / 60,
        TEST_PROPS = [
            'r',
            'webkitR',
            'mozR',
            'oR',
            'msR'
        ],
        callbacks = [],
        frameIndex = 0,
        useAnimFrame = (function() {
            for (var ii = 0; ii < TEST_PROPS.length; ii++) {
                window.animFrame = window.animFrame || window[TEST_PROPS[ii] + 'equestAnimationFrame'];
            } // for
            
            if (window.animFrame) {
                _log('Using request animation frame');
            } // if
            
            return animFrame;
        })();
    
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
        if (useAnimFrame) {
            animFrame(frame);
        } // if
    } // frame
    
    /* exports */
    
    function attach(callback, every) {
        callbacks[callbacks.length] = {
            cb: callback,
            every: every ? round(every / FRAME_RATE) : 1
        };
    } // attach
    
    function detach(callback) {
        // iterate through the callbacks and remove the specified one
        for (var ii = callbacks.length; ii--; ) {
            if (callbacks[ii].cb === callback) {
                callbacks.splice(ii, 1);
                break;
            } // if
        } // for
    } // detach
    
    // bind to the animframe callback
    useAnimFrame ? animFrame(frame) : setInterval(frame, 1000 / 60);
    
    return {
        attach: attach,
        detach: detach
    };
})();