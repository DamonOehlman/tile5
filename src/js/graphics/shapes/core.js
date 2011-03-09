/**
# T5.Shape
The T5.Shape class is simply a template class that provides placeholder methods
that need to be implemented for shapes that can be drawn in a T5.ShapeLayer.

## Constructor
`new T5.Shape(params);`


#### Initialization Parameters

- 
*/
var Shape = function(params) {
    params = COG.extend({
        style: null,
        fill: false,
        draggable: false,
        observable: true, // TODO: should this be true or false by default
        properties: {},
        type: 'shape',
        rotation: 0,
        scale: 1
    }, params);
    
    var fill = params.fill;
    
    /* exports */
    
    /* initialise shape */
    
    var _self = COG.extend(params, {
        id: COG.objId(params.type),

        // public properties
        bounds: null,
        hit: false,

        /**
        ### drag(dragData, dragX, dragY, drop)
        */
        drag: null,
        
        /**
        ### draw(context, x, y, width, height, state)
        */
        draw: function(context, x, y, width, height, state) {
            if (fill) {
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
        }
    });
    
    // make the shape observable
    if (params.observable) {
        COG.observable(_self);
    } // if
    
    return _self;
};