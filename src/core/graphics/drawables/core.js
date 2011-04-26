/**
DRAWABLE

## Constructor
`new T5.Drawable(view, layer, params);`

## Settings
- 
*/
var Drawable = function(view, layer, params) {
    params = _extend({
        style: null,
        xy: null,
        size: 20,
        fill: false,
        stroke: true,
        draggable: false,
        observable: true, // TODO: should this be true or false by default
        properties: {},
        typeName: 'Shape'
    }, params);
    
    // copy the parameters to this
    _extend(this, params);
    
    // if the xy is a string, then parse it
    if (_is(this.xy, typeString)) {
        this.xy = new XY(this.xy);
    } // if
    
    // initialise the id
    this.id = 'drawable_' + drawableCounter++;
    this.bounds = null;
    this.view = view;
    this.layer = layer;
    
    // initialise transform variables
    this.animations = 0;
    this.rotation = 0;
    this.scaling = 1;
    this.translateX = 0;
    this.translateY = 0;
    
    // make the shape observable
    if (this.observable) {
        _observable(this);
    } // if
};

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
    ### draw(renderer, drawData)
    The draw method is provided for custom drawables. Internal drawables will delegate
    their drawing to the function that is returned from the various prep* methods of the
    renderer, however, when building some applications this really isn't suitable and
    more is required.  Thus if required a custom draw method can be implemented to implement
    the required functionality.
    */
    draw: null,

    /**
    ### getProps(renderer)
    Get the drawable item properties that will be passed to the renderer during
    the prepare and draw phase
    */
    getProps: null,
    
    /**
    ### resync(view)
    */
    resync: function() {
        if (this.xy) {
            this.xy.sync(this.view.rpp);
            
            // if we have a size, update the bounds
            if (this.size) {
                var halfSize = this.size >> 1;

                this.updateBounds(new Rect(
                    this.xy.x - halfSize,
                    this.xy.y - halfSize,
                    this.size,
                    this.size));
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
        var moved = bounds && (
                (! this.bounds) ||
                bounds.x != this.bounds.x ||
                bounds.y != this.bounds.y
            );
        
        if (moved) {
            this.trigger('move', this, bounds, this.bounds);
        } // if
        
        // update the bounds
        this.bounds = bounds;
        
        if (updateXY) {
            this.xy = this.bounds.center();
        } // if
    }
};