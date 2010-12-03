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
        tileOffset: new T5.Vector(),
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
        loadImage = T5.Images.load;
        
    // initialise the tile draw args
    var tileDrawArgs = T5.ex({
        background: null, 
        overlay: null,
        offset: new T5.Vector(),
        realSize: new T5.Dimensions(tileSize, tileSize)
    }, params.tileDrawArgs);
        
    // initialise self
    var self = T5.ex(new T5.TileGrid(params), {
        /**
        ### clearTileRect(context, x, y, tileSize, state)
        */
        clearTileRect: function(context, x, y, tileSize, state) {
            // if the state is not the panning state, then clear the rect
            if ((state & statePan) === 0) {
                context.clearRect(x, y, tileSize, tileSize);
            } // if..else
        },
        
        /**
        ### drawTile(context, tile, x, y, state, redraw, tickCount)
        */
        drawTile: function(context, tile, x, y, state, redraw, tickCount) {
            var image = tile.url ? getImage(tile.url) : null,
                drawn = false;
                
            if (image) {
                context.drawImage(image, x, y);
                drawn = true;
            }
            else if ((state & statePan) !== 0) {
                context.drawImage(panningTile, x, y);
                drawn = true;
            } // if..else
            
            tile.dirty = false;
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
