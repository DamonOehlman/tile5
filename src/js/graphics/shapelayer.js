/**
# T5.ShapeLayer
_extends:_ T5.ViewLayer


The ShapeLayer is designed to facilitate the storage and display of multiple 
geometric shapes.  This is particularly useful for displaying [GeoJSON](http://geojson.org) 
data and the like.

## Methods
*/
T5.ShapeLayer = function(params) {
    params = T5.ex({
        zindex: 80,
        style: null
    }, params);
    
    // initialise variables
    var children = [],
        forceRedraw = false;
        
    /* private functions */
    
    function performSync(view) {
        // iterate through the children and resync to the grid
        for (var ii = children.length; ii--; ) {
            children[ii].resync(view);
        } // for
        
        // sort the children so the topmost, leftmost is drawn first followed by other shapes
        children.sort(function(shapeA, shapeB) {
            var diff = shapeB.xy.y - shapeA.xy.y;
            if (diff === 0) {
                diff = shapeB.xy.x - shapeA.xy.y;
            } // if
            
            return diff;
        });
        
        forceRedraw = true;
        self.changed();
    } // performSync
    
    /* event handlers */
    
    function handleResync(evt, parent) {
        if (parent.syncXY) {
            performSync(parent);
        } // if
    } // handleParentChange
    
    /* exports */
    
    /* initialise self */
    
    var self = T5.ex(new T5.ViewLayer(params), {
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
        
        cycle: function(tickCount, offset, state, redraw) {
            return forceRedraw;
        },

        draw: function(context, viewRect, state, view, redraw) {
            var offsetX = viewRect.x1,
                offsetY = viewRect.y1,
                viewWidth = viewRect.width,
                viewHeight = viewRect.height;
            
            context.save();
            try {
                T5.applyStyle(context, params.style);
                
                // COG.Log.info('shape layer has ' + children.length + ' children');

                // iterate through the children and draw the layers
                for (var ii = children.length; ii--; ) {
                    var overrideStyle = children[ii].style,
                        previousStyle = overrideStyle ? T5.applyStyle(context, overrideStyle) : null;
                    
                    // draw the layer
                    children[ii].draw(context, offsetX, offsetY, viewWidth, viewHeight, state);
                    
                    // if we have a previous style, then restore that style
                    if (previousStyle) {
                        T5.applyStyle(context, previousStyle);
                    } // if
                } // for
            }
            finally {
                context.restore();
            } // try..finally
            
            forceRedraw = false;
        }
    });
    
    // handle grid updates
    self.bind('parentChange', handleResync);
    self.bind('resync', handleResync);
    
    // set the style attribute to be configurable
    COG.configurable(
        self, 
        ['style'], 
        COG.paramTweaker(params, null, null),
        true);    

    return self;
};

/**
# T5.PolyLayer
__deprecated__ 


What already?  Yes it really should have been called the T5.ShapeLayer from the 
start, we will remove the T5.PolyLayer before the 0.9.4 release.
*/
T5.PolyLayer = T5.ShapeLayer;