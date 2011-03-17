/**
# T5.Drawable
The T5.Shape class is simply a template class that provides placeholder methods
that need to be implemented for shapes that can be drawn in a T5.ShapeLayer.

## Constructor
`new T5.Drawable(params);`


#### Initialization Parameters

- 
*/
var Drawable = function(params) {
    params = COG.extend({
        style: null,
        xy: null,
        size: null,
        fill: false,
        stroke: true,
        draggable: false,
        observable: true, // TODO: should this be true or false by default
        properties: {},
        type: 'shape'
    }, params);
    
    // copy the parameters to this
    COG.extend(this, params);
    
    // initialise the id
    this.id = COG.objId(this.type);
    this.bounds = null;
    this.view = null;
    
    // initialise transform variables
    this.rotation = 0;
    this.scaling = 1;
    this.translateX = 0;
    this.translateY = 0;
    
    // make the shape observable
    if (this.observable) {
        COG.observable(this);
    } // if
};

function animateDrawable(target, fn, argsStart, argsEnd, opts) {
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

Drawable.prototype = {
    constructor: Drawable,
    
    /**
    ### animate(fn, argsStart, argsEnd, opts)
    */
    animate: function(fn, argsStart, argsEnd, opts) {
        animateDrawable(this, fn, argsStart, argsEnd, opts);
    },
    
    
    /**
    ### drag(dragData, dragX, dragY, drop)
    */
    drag: null,
    
    /**
    ### draw(context, x, y, width, height, state)
    */
    draw: function(context, x, y, width, height, state) {
        if (this.fill) {
            context.fill();
        } // if
        
        if (this.stroke) {
            context.stroke();
        } // if
    },
    
    /**
    ### invalidate()
    */
    invalidate: function() {
        var view = this.layer ? this.layer.getParent() : null;
        if (view) {
            view.invalidate();
        } // if
    },
    
    /**
    ### prepPath(context, x, y, width, height, state)
    Prepping the path for a shape is the main 
    */
    prepPath: function(context, x, y, width, height, state) {
    },
    
    /**
    ### resync(view)
    */
    resync: function(view) {
        if (this.xy) {
            view.syncXY([this.xy]);
            
            // if we have a size, then update the bounds
            if (this.size) {
                this.updateBounds(XYRect.fromCenter(
                    this.xy.x, this.xy.y, this.size, this.size));
            } // if
        } // if
    },
    
    /**
    ### rotate(value)
    */
    rotate: function(value) {
        this.rotation = value;
    },
    
    /**
    ### scale(value)
    */
    scale: function(value) {
        this.scaling = value;
    },
    
    /**
    ### translate(x, y)
    */
    translate: function(x, y) {
        this.translateX = x;
        this.translateY = y;
    },
    
    
    /**
    ### updateBounds(bounds: XYRect, updateXY: boolean)
    */
    updateBounds: function(bounds, updateXY) {
        this.bounds = bounds;
        
        if (updateXY) {
            this.xy = XYRect.center(this.bounds);
        } // if
    }
};