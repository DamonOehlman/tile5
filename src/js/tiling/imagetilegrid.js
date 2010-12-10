/**
# T5.ImageTileGrid 
_extends_: T5.TileGrid


The ImageTileGrid extends the T5.TileGrid and implements the 
`drawTile` functionality to check the loaded state of image tiles, and treat them accordingly.  
If the tile is already loaded, then it is drawn to the canvas, it not the T5.Images module is used to load the 
tile and once loaded drawn.

## Constructor
`new T5.ImageTileGrid(params);`

### Initialization Parameters

- emptyTile (image, default = default empty tile) - specify an image here to be used as the empty tile
which is displayed when the required tile is not available and the display is not panning

- panningTile (image, default = default panning tile) - the image that is used to display a tile area
when panning, **if** the tile image has not been loaded already

- tileOffset - to be completed
- tileDrawArgs - to be completed


## Methods
*/
T5.ImageTileGrid = function(params) {
    params = T5.ex({
        emptyTile: getEmptyTile(T5.tileSize),
        panningTile: null,
        tileOffset: T5.XY.init(),
        tileDrawArgs: {}
    }, params);
    
    function getEmptyTile(tileSize) {
        if ((! emptyTile) || (tileSize !== emptyTile.width)) {
            emptyTile = T5.Images.newCanvas(tileSize, tileSize);

            var tileContext = emptyTile.getContext('2d');

            tileContext.fillStyle = "rgba(150, 150, 150, 0.1)";
            tileContext.fillRect(0, 0, emptyTile.width, emptyTile.height);
        } // if

        return emptyTile;
    } // getEmptyTile
    
    function getPanningTile(tileSize) {

        function getPattern() {
            var patternSize = 32,
                halfSize = patternSize / 2,
                patternCanvas = T5.Images.newCanvas(patternSize, patternSize);

            // get the canvas context
            var context = patternCanvas.getContext("2d");

            // fill the canvas
            context.fillStyle = "#BBBBBB";
            context.fillRect(0, 0, patternSize, patternSize);

            // now draw two smaller rectangles
            context.fillStyle = "#C3C3C3";
            context.fillRect(0, 0, halfSize, halfSize);
            context.fillRect(halfSize, halfSize, halfSize, halfSize);

            return patternCanvas;
        } // getPattern

        if ((! panningTile) || (tileSize !== panningTile.width)) {
            panningTile = T5.Images.newCanvas(tileSize, tileSize);

            var tileContext = panningTile.getContext('2d');

            // fill the panning tile with the pattern
            tileContext.fillStyle = 
                typeof FlashCanvas !== 'undefined' ? 
                    '#666666' : 
                    tileContext.createPattern(getPattern(), "repeat");
                    
            tileContext.fillRect(0, 0, panningTile.width, panningTile.height);
        } // if

        return panningTile;
    } // getPanningTile
    
    // initialise variables
    var emptyTile = params.emptyTile,
        panningTile = params.panningTile ? params.panningTile : getPanningTile(T5.tileSize),
        tileOffset = params.tileOffset,
        imageOverlay = params.imageOverlay,
        stateActive = T5.viewState('ACTIVE'),
        statePan = T5.viewState('PAN'),
        fastDraw = T5.getConfig().requireFastDraw,
        tileSize = params.tileSize ? params.tileSize : T5.tileSize,
        
        // some short cut functions
        getImage = T5.Images.get,
        loadImage = T5.Images.load,
        
        // initialise the tile draw args
        tileDrawArgs = T5.ex({
            background: null,
            overlay: null,
            offset: T5.XY.init(),
            realSize: new T5.Dimensions(tileSize, tileSize)
        }, params.tileDrawArgs);
        
    // initialise self
    var self = T5.ex(new T5.TileGrid(params), {
        /**
        ### drawTile(context, tile, x, y, state, redraw, tickCount)
        */
        drawTile: function(context, tile, x, y, state, redraw, tickCount, cleared) {
            var image = tile.url ? getImage(tile.url) : null,
                drawn = false,
                tileAge = tickCount - tile.loadTime;
                
            if (image) {
                /*
                // if the tile is young, fade it in
                if (tileAge < 150) {
                    context.clearRect(x, y, tileSize, tileSize);
                    context.globalAlpha = tileAge / 150;
                    
                    setTimeout(self.changed, 150);
                } // if
                */
                
                context.drawImage(image, x, y);
                tile.dirty = false;
                // context.globalAlpha = 1;
                
                drawn = true;
            }
            else if ((state & statePan) !== 0) {
                if (! cleared) {
                    context.drawImage(panningTile, x, y);
                } // if
                
                drawn = true;
            } // if..else
            
            return drawn;
        },
        
        /**
        ### initTileUrl(tile)
        */
        initTileUrl: function(tile) {
        },
        
        /**
        ### prepTile: function(tile, state)
        */
        prepTile: function(tile, state) {
            if (tile && (! tile.loading) && ((! fastDraw) || (state === stateActive))) {
                if (! tile.url) {
                    self.initTileUrl(tile);
                } // if
                
                var image = getImage(tile.url);
                if (! image) {
                    tile.loading = true;

                    loadImage(
                        tile.url, 
                        function() {
                            tile.loadTime = new Date().getTime();
                            tile.loaded = true;
                            tile.dirty = true;
                            
                            self.changed();
                        }, 
                        tileDrawArgs);
                } // if
            } // if
        }
    });
    
    return self;
}; // T5.ImageTileGrid
