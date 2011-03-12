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

function transformable(target) {
    
    /* internals */
    var DEFAULT_DURATION = 1000,
        ANI_WAIT = 1000 / 60 | 0,
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
    
    function animate(fn, argsStart, argsEnd, easing, duration, callback) {
        var startTicks = new Date().getTime(),
            lastTicks = 0,
            targetFn = target[fn],
            argsComplete = 0,
            animateValid = argsStart.length && argsEnd.length && 
                argsStart.length == argsEnd.length,
            argsCount = animateValid ? argsStart.length : 0,
            argsChange = new Array(argsCount),
            argsCurrent = new Array(argsCount),
            easingFn = COG.easing(easing ? easing : 'sine.out'),
            ii,
            
            runTween = function(tickCount) {
                if (tickCount - lastTicks > ANI_WAIT) {
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
                    target.invalidate.call(target);

                    if (! complete) {
                        animFrame(runTween);
                    }
                    else {
                        targetFn.apply(target, argsEnd);
                        target.invalidate.call(target);

                        if (callback) {
                            callback();
                        } // if
                    } // if..else
                } // if
            };
            
        if (targetFn && targetFn.apply && argsCount > 0) {
            // update the duration with the default value if not specified
            duration = duration ? duration : DEFAULT_DURATION;
            
            // calculate changed values
            for (ii = argsCount; ii--; ) {
                argsChange[ii] = argsEnd[ii] - argsStart[ii];
            } // for

            animFrame(runTween);            
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
