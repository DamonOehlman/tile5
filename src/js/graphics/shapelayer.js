/**
# T5.ShapeLayer
_extends:_ T5.DrawLayer


The ShapeLayer is designed to facilitate the storage and display of multiple 
geometric shapes.  This is particularly useful for displaying [GeoJSON](http://geojson.org) 
data and the like.

## Methods
*/
var ShapeLayer = function(params) {
    params = COG.extend({
        zindex: 10
    }, params);
    
    // initialise variables
    var shapes = [];
        
    /* private functions */
    
    function performSync(view) {
        // iterate through the shapes and resync to the grid
        for (var ii = shapes.length; ii--; ) {
            shapes[ii].resync(view);
        } // for
        
        // sort the shapes so the topmost, leftmost is drawn first followed by other shapes
        shapes.sort(function(shapeA, shapeB) {
            var diff = shapeB.xy.y - shapeA.xy.y;
            return diff != 0 ? diff : shapeB.xy.x - shapeA.xy.y;
        });
        
        _self.changed();
    } // performSync
    
    /* event handlers */
    
    function handleResync(evt, parent) {
        performSync(parent);
    } // handleParentChange
    
    /* exports */
    
    /**
    ### find(selector: String)
    The find method will eventually support retrieving all the shapes from the shape
    layer that match the selector expression.  For now though, it just returns all shapes
    */
    function find(selector) {
        return [].concat(shapes);
    } // find
    
    /* initialise _self */
    
    var _self = COG.extend(new DrawLayer(params), {
        /**
        ### add(poly)
        Used to add a T5.Poly to the layer
        */
        add: function(shape, prepend) {
            if (shape) {
                shape.layer = _self;
                
                // sync this shape with the parent view
                var view = _self.getParent();
                if (view) {
                    shape.resync(_self.getParent());
                    
                    view.invalidate();
                } // if
            
                // add the the shapes array
                if (prepend) {
                    shapes.unshift(shape);
                }
                else {
                    shapes[shapes.length] = shape;
                } // if..else
            } // if
        },
        
        clear: function() {
            shapes = [];
        },
        
        find: find,
        
        getDrawables: function(view, viewRect) {
            return shapes;
        }
    });
    
    // handle grid updates
    _self.bind('parentChange', handleResync);
    _self.bind('resync', handleResync);
    
    return _self;
};