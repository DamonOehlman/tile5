T5.ImageTileGrid = function(params) {
    params = T5.ex({
        emptyTile: getEmptyTile(T5.tileSize),
        panningTile: getPanningTile(T5.tileSize),
        tileOffset: new T5.Vector(),
        tileDrawArgs: {}
    }, params);
    
    function getEmptyTile(tileSize) {
        if ((! emptyTile) || (tileSize !== emptyTile.width)) {
            emptyTile = T5.newCanvas(tileSize, tileSize);

            var tileContext = emptyTile.getContext('2d');

            tileContext.fillStyle = "rgba(150, 150, 150, 0.01)";
            tileContext.fillRect(0, 0, emptyTile.width, emptyTile.height);
        } // if

        return emptyTile;
    } // getEmptyTile
    
    function getPanningTile(tileSize) {

        function getPattern() {
            var patternSize = 32,
                halfSize = patternSize / 2,
                patternCanvas = T5.newCanvas(patternSize, patternSize);

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
            panningTile = T5.newCanvas(tileSize, tileSize);

            var tileContext = panningTile.getContext('2d');

            // fill the panning tile with the pattern
            tileContext.fillStyle = tileContext.createPattern(getPattern(), "repeat");
            tileContext.fillRect(0, 0, panningTile.width, panningTile.height);
        } // if

        return panningTile;
    } // getPanningTile
    
    function handleImageLoad(loadedImage, fromCache) {
        self.getParent().trigger("invalidate");

        self.dirty = true;
        self.wakeParent();
    } // handleImageLoad
    
    // initialise variables
    var emptyTile = params.emptyTile,
        panningTile = params.panningTile,
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
        drawTile: function(context, tile, x, y, state) {
            var image = tile.url ? getImage(tile.url) : null,
                drawn = false;
                
            if (image) {
                context.drawImage(image, x, y);
                tile.dirty = false;

                drawn = true;
            }
            else if (state === statePan) {
                panningTile ? context.drawImage(panningTile, x, y) : 0;
            }
            else if (emptyTile) {
                context.drawImage(emptyTile, x, y);
            } // if..else
            
            return drawn;
        },
        
        prepTile: function(tile, state) {
            if (tile) {
                tile.dirty = true;
            } // if
            
            if (tile && ((! fastDraw) || (state === stateActive))) {
                var image = getImage(tile.url);
                if (! image) {
                    loadImage(tile.url, handleImageLoad, tileDrawArgs);
                } // if
            } // if
        }
    });
    
    return self;
}; // T5.ImageTileGrid
