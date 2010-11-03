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
        clearTileRect: function(context, x, y, tileSize, state) {
            if ((state & statePan) !== 0) {
                COG.Log.info("drawing panning tile for empty tile");
                
            }
            else {
                context.clearRect(x, y, tileSize, tileSize);
            } // if..else
        },
        
        drawTile: function(context, tile, x, y, state) {
            var image = tile.url ? getImage(tile.url) : null,
                drawn = false;
                
            if (image) {
                context.drawImage(image, x, y);
                drawn = true;
            }
            else if ((state & statePan) !== 0) {
                context.drawImage(panningTile, x, y);
            }
            else if (emptyTile && (! tile.drawnEmpty)) {
                context.drawImage(emptyTile, x, y);
                tile.drawnEmpty = true;
            } // if..else
            
            tile.dirty = false;
            return drawn;
        },
        
        initTileUrl: function(tile) {
        },
        
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
                            
                            self.wakeParent();
                        }, 
                        tileDrawArgs);
                } // if
            } // if
        }
    });
    
    return self;
}; // T5.ImageTileGrid
