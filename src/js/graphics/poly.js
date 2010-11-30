/**
# T5.Poly
This class is used to represent individual poly(gon/line)s that are drawn within
a T5.PolyLayer.  

## Constructor

`T5.Poly(vectors, params)`

The constructor requires an array of vectors that represent the poly and 
also accepts optional initialization parameters (see below).


### Initialization Parameters

- `fill` (default = true) - whether or not the poly should be filled.
- `style` (default = null) - the style override for this poly.  If none
is specified then the style of the T5.PolyLayer is used.


## Methods
*/
T5.Poly = function(vectors, params) {
    params = T5.ex({
        fill: false,
        style: null
    }, params);

    // initialise variables
    var haveData = false,
        fill = params.fill,
        styleOverride = params.style,
        drawVectors = [];
    
    /* exported functions */
    
    /**
    ### drawPoly(context, offsetX, offsetY, state)
    This method is used to draw the poly to the specified `context`.  The 
    `offsetX` and `offsetY` arguments specify the panning offset of the T5.View
    which is taken into account when drawing the poly to the display.  The 
    `state` argument specifies the current T5.ViewState of the view.
    */
    function drawPoly(context, offsetX, offsetY, state) {
        if (haveData) {
            var first = true,
                previousStyle = styleOverride ? T5.applyStyle(context, params.style) : null;
            
            context.beginPath();
            
            // now draw the lines
            // COG.Log.info('drawing poly: have ' + drawVectors.length + ' vectors');
            for (var ii = drawVectors.length; ii--; ) {
                var x = drawVectors[ii].x - offsetX,
                    y = drawVectors[ii].y - offsetY;
                    
                if (first) {
                    context.moveTo(x, y);
                    first = false;
                }
                else {
                    context.lineTo(x, y);
                }
            } // for
            
            if (fill) {
                context.fill();
            } // if
            
            context.stroke();
            
            // if we had a previous style, then return to that style
            if (previousStyle) {
                T5.applyStyle(context, previousStyle);
            } // if
        } // if
    } // drawPoly
    
    /**
    ### resync(grid)
    Used to synchronize the vectors of the poly to the grid.
    */
    function resyncToGrid(grid) {
        grid.syncVectors(vectors);
        
        // simplify the vectors for drawing (if required)
        drawVectors = vectors.length <= 3 ? vectors : T5.V.simplify(vectors);
    } // resyncToGrid
    
    /* define self */
    
    var self = {
        draw: drawPoly,
        resync: resyncToGrid
    };

    // initialise the first item to the first element in the array
    haveData = vectors && (vectors.length >= 2);
    
    return self;
};

/**
# T5.PolyLayer
_extends:_ T5.ViewLayer


The PolyLayer is designed to facilitate the storage and display of multiple 
geometric shapes.  This is particularly useful for displaying [GeoJSON](http://geojson.org) 
data and the like.

## Methods
*/
T5.PolyLayer = function(params) {
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
                offsetY = offset.y;
            
            context.save();
            try {
                T5.applyStyle(context, params.style);

                // iterate through the children and draw the layers
                for (var ii = children.length; ii--; ) {
                    children[ii].draw(context, offsetX, offsetY, state);
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

