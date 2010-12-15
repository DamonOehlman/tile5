/**
# T5.TileGenerator
*/
T5.TileGenerator = function(params) {
    params = T5.ex({
        tileWidth: 256,
        tileHeight: 256
    }, params);
    
    // initialise variables
    var initPos = null,
        targetView = null,
        lastRect = null,
        requestXY = T5.XY.init(),
        tileLoader = null,
        requestedTileCreator = false,
        tileWidth = params.tileWidth,
        halfTileWidth = tileWidth / 2,
        tileHeight = params.tileHeight,
        halfTileHeight = tileHeight / 2,
        tileCreator = null,
        xTiles = 0,
        yTiles = 0,
        imageQueue = [];
    
    /* internal functions */
    
    function runTileCreator(viewRect, callback) {
        var relX = ~~((viewRect.x1 - requestXY.x) / tileWidth),
            relY = ~~((viewRect.y1 - requestXY.y) / tileHeight),
            endX = viewRect.width,
            endY = viewRect.height,
            tiles = [];
            
        for (var xx = -xTiles; xx < xTiles; xx++) {
            for (var yy = -yTiles; yy < yTiles; yy++) {
                tiles[tiles.length] = tileCreator(relX + xx, relY + yy);
            } // for
        } // for
        
        if (callback) {
            callback(tiles);
        } // if
        
        lastRect = T5.XYRect.copy(viewRect);
    } // runTileCreator
    
    /* event handlers */
    
    /* exports */
    
    /**
    ### bindToView(view)
    */
    function bindToView(view) {
        COG.Log.info('initializing generator');
        
        // update the target view
        targetView = view;
        self.trigger('bindView', view);
    } // bindToView
    
    /**
    ### resetTileCreator()
    */
    function resetTileCreator() {
        tileCreator = null;
        requestedTileCreator = false;
    } // resetTileCreator

    /**
    ### run(viewRect, callback)
    */
    function run(viewRect, callback) {
        var recalc = (! lastRect) || 
            (Math.abs(viewRect.x1 - lastRect.x1) > tileWidth) || 
            (Math.abs(viewRect.y1 - lastRect.y1) > tileHeight);
        
        // if we don't know the center position, then this is the first call
        if ((! initPos) && (! requestedTileCreator)) {
            COG.Log.info('generating tiles, view rect = ', viewRect);
            initPos = targetView.getCenterPosition();
            requestXY = T5.XY.init(viewRect.x1, viewRect.y1);
            xTiles = Math.ceil(viewRect.width / tileWidth) + 1;
            yTiles = Math.ceil(viewRect.height / tileHeight) + 1;
            
            // get the tile loader
            if (self.initTileCreator) {
                requestedTileCreator = true;
                self.initTileCreator(
                    initPos, 
                    tileHeight,
                    tileWidth,
                    self.getTileCreatorArgs ? self.getTileCreatorArgs() : {},
                    function(creator, tweakOffset) {
                        tileCreator = creator;
                        requestedTileCreator = false;
                        
                        runTileCreator(viewRect, callback);
                    }
                );
            } // if
            
            COG.Log.info('generator got view center: ', initPos);
        } // if
        
        if (tileCreator && recalc) {
            runTileCreator(viewRect, callback);
        } // if
    } // run

    var self = {
        bindToView: bindToView,
        getTileCreatorArgs: null,
        initTileCreator: null,
        resetTileCreator: resetTileCreator,
        run: run
    };
    
    // make the tile generator observable
    COG.observable(self);
    
    return self;
};
