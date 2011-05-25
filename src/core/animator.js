/**
# T5.Animator
The animator centralizes the callbacks requiring regular update intervals in Tile5.  
This simple utility module exposes `attach` and `detach` methods that allow other
classes in Tile5 to fire callbacks on a regular basis without needing to hook into
the likes of `setInterval` to run animation routines.

The animator will intelligently use `requestAnimationFrame` if available, and if not
will fall back to a `setInterval` call that will run optimized for 60fps.

## Methods
*/
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
        useAnimFrame = DOM && (function() {
            for (var ii = 0; ii < TEST_PROPS.length; ii++) {
                window.animFrame = window.animFrame || window[TEST_PROPS[ii] + 'equestAnimationFrame'];
            } // for
            
            return animFrame;
        })();
    
    function frame(tickCount) {
        // increment the frame index
        frameIndex++;

        // set the tick count in the case that it hasn't been set already
        tickCount = DOM ? (window.mozAnimationStartTime || 
            tickCount || 
            new Date().getTime()) : new Date().getTime();
        
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
    
    /**
    ### attach(callback, every)
    Attach `callback` to the animation callback loop.  If specified, `every` 
    specified the regularity (in ms) with which this particular callback should be 
    fired.  If not specified, the callback is fired for every animation frame (which
    is approximately 60 times per second).
    */
    function attach(callback, every) {
        callbacks[callbacks.length] = {
            cb: callback,
            every: every ? round(every / FRAME_RATE) : 1
        };
    } // attach
    
    /**
    ### detach(callback)
    Remove `callback` from the animation callback loop.
    */
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