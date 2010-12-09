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
    
    function handleGridUpdate(evt, grid) {
        // iterate through the children and resync to the grid
        for (var ii = children.length; ii--; ) {
            children[ii].resync(grid);
        } // for
        
        forceRedraw = true;
        self.changed();
    }
    
    function handleParentChange(evt, parent) {
        var grid = parent ? parent.getTileLayer() : null;
        
        if (grid) {
            // iterate through the children and resync to the grid
            for (var ii = children.length; ii--; ) {
                children[ii].resync(grid);
            } // for
        } // if
    } // handleParentChange
    
    /* initialise self */
    
    var self = T5.ex(new T5.ViewLayer(params), {
        /**
        ### add(poly)
        Used to add a T5.Poly to the layer
        */
        add: function(poly) {
            // children.push(poly);
            children.unshift(poly);
        },
        
        cycle: function(tickCount, offset, state, redraw) {
            return forceRedraw;
        },

        draw: function(context, offset, dimensions, state, view, redraw) {
            var offsetX = offset.x,
                offsetY = offset.y,
                viewWidth = dimensions.width,
                viewHeight = dimensions.height;
            
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
    self.bind('gridUpdate', handleGridUpdate);
    self.bind('parentChange', handleParentChange);
    
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