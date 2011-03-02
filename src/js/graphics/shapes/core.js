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
        properties: {}
    }, params);
    
    return COG.extend(params, {
        rect: null,
        
        /**
        ### draw(context, offsetX, offsetY, width, height, state)
        */
        draw: function(context, offsetX, offsetY, width, height, state) {
        },
        
        /**
        ### resync(view)
        */
        resync: function(view) {
        }
    });
};