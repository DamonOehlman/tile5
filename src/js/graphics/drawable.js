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
        type: 'shape',
        transformable: false
    }, params);
    
    // copy the parameters to this
    COG.extend(this, params);
    
    // initialise the id
    this.id = COG.objId(this.type);
    this.bounds = null;
    this.view = null;
    
    // initialise transform variables
    this.rotation = 0;
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    
    // make the shape observable
    if (this.observable) {
        COG.observable(this);
    } // if
    
    // update transform states
    this.transformed = false;
};

Drawable.prototype = {
    constructor: Drawable,
    
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
        
        checkTransformed(this);
    },
    
    /**
    ### scale(value)
    */
    scale: function(value) {
        this.scale = value;
        
        checkTransformed(this);
    },
    
    /**
    ### setTransformable(boolean)
    Update the transformable state
    */
    setTransformable: function(flag) {
        if (flag && (! this.transformable)) {
            transformable(this);
        } // if
        
        // update the transformable flag
        this.transformable = flag;
    },

    /**
    ### translate(x, y)
    */
    translate: function(x, y) {
        this.translateX = x;
        this.translateY = y;
        
        checkTransformed(this);
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