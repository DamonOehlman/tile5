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
        fill: false,
        draggable: false,
        observable: true, // TODO: should this be true or false by default
        properties: {},
        type: 'shape',
        rotation: 0,
        scale: 1
    }, params);
    
    // copy the parameters to this
    COG.extend(this, params);
    
    // initialise the id
    this.id = COG.objId(this.type);
    this.bounds = null;
    
    // make the shape observable
    if (this.observable) {
        COG.observable(this);
    } // if
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
        
        context.stroke();
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
        } // if
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