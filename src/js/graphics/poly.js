T5.Poly = function(vectors, params) {
    params = T5.ex({
        fill: false
    }, params);

    // initialise variables
    var haveData = false,
        fill = params.fill,
        drawVectors = [];
    
    /* exported functions */
    
    function drawPoly(context, offsetX, offsetY, state) {
        if (haveData) {
            var first = true;
            
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
        } // if
    } // drawPoly
    
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
# PolyLayer

The PolyLayer is designed to facilitate the storage and display of multiple 
geometric shapes.  This is particularly useful for displaying GeoJSON data and 
the like
*/
T5.PolyLayer = function(params) {
    params = T5.ex({
        zindex: 80,
        style: null
    }, params);
    
    // initialise variables
    var children = [],
        forceRedraw = false,
        lastOffsetX, lastOffsetY;
        
    /* private functions */
    
    function handleGridUpdate(evt, grid) {
        // iterate through the children and resync to the grid
        for (var ii = children.length; ii--; ) {
            children[ii].resync(grid);
        } // for
        
        forceRedraw = true;
        self.wakeParent(true);
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
        add: function(poly) {
            // children.push(poly);
            children.unshift(poly);
        },
        
        cycle: function(tickCount, offset, state, redraw) {
            return forceRedraw;
        },

        draw: function(context, offset, dimensions, state, view, redraw) {
            context.save();
            try {
                T5.applyStyle(context, params.style);

                // iterate through the children and draw the layers
                for (var ii = children.length; ii--; ) {
                    children[ii].draw(context, lastOffsetX, lastOffsetY, state);
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

