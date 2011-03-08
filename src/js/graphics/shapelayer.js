/**
# T5.ShapeLayer
_extends:_ T5.ViewLayer


The ShapeLayer is designed to facilitate the storage and display of multiple 
geometric shapes.  This is particularly useful for displaying [GeoJSON](http://geojson.org) 
data and the like.

## Methods
*/
var ShapeLayer = function(params) {
    params = COG.extend({
        zindex: 80
    }, params);
    
    // initialise variables
    var children = [];
        
    /* private functions */
    
    function performSync(view) {
        // iterate through the children and resync to the grid
        for (var ii = children.length; ii--; ) {
            children[ii].resync(view);
        } // for
        
        // sort the children so the topmost, leftmost is drawn first followed by other shapes
        children.sort(function(shapeA, shapeB) {
            var diff = shapeB.xy.y - shapeA.xy.y;
            return diff != 0 ? diff : shapeB.xy.x - shapeA.xy.y;
        });
        
        self.changed();
    } // performSync
    
    /* event handlers */
    
    function handleResync(evt, parent) {
        performSync(parent);
    } // handleParentChange
    
    /* exports */
    
    /* initialise self */
    
    var self = COG.extend(new ViewLayer(params), {
        /**
        ### add(poly)
        Used to add a T5.Poly to the layer
        */
        add: function(shape) {
            children[children.length] = shape;
        },
        
        each: function(callback) {
            for (var ii = children.length; ii--; ) {
                callback(children[ii]);
            } // for
        },
        
        draw: function(context, viewRect, state, view) {
            var viewX = viewRect.x1,
                viewY = viewRect.y1,
                viewWidth = viewRect.width,
                viewHeight = viewRect.height;
            
            // iterate through the children and draw the layers
            for (var ii = children.length; ii--; ) {
                var overrideStyle = children[ii].style,
                    previousStyle = overrideStyle ? Style.apply(context, overrideStyle) : null;
                    
                // draw the layer
                children[ii].draw(context, viewX, viewY, viewWidth, viewHeight, state);
                
                // if we have a previous style, then restore that style
                if (previousStyle) {
                    Style.apply(context, previousStyle);
                } // if
            } // for
        }
    });
    
    // handle grid updates
    self.bind('parentChange', handleResync);
    self.bind('resync', handleResync);
    
    return self;
};