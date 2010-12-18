/**
# T5.TileGenerator
*/
T5.TileGenerator = function(params) {
    params = T5.ex({
        tileWidth: 256,
        tileHeight: 256
    }, params);
    
    // initialise variables
    var targetView = null,
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
    ### requireRefresh(viewRect)
    This function is used to determine whether or not a new tile creator is required
    */
    function requireRefresh(viewRect) {
        return false;
    } // requireRefresh

    /**
    ### reset()
    */
    function reset() {
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
            
        if (recalc) {
            // if we haven't yet created a tile creator then do that now
            // OR: the current tile creator is invalid
            if (((! tileCreator) && (! requestedTileCreator)) || self.requireRefresh()) {
                COG.Log.info('generating tiles, view rect = ', viewRect);
                requestXY = T5.XY.init(viewRect.x1, viewRect.y1);
                xTiles = Math.ceil(viewRect.width / tileWidth) + 1;
                yTiles = Math.ceil(viewRect.height / tileHeight) + 1;

                // get the tile loader
                if (self.initTileCreator) {
                    requestedTileCreator = true;
                    self.initTileCreator(
                        tileHeight,
                        tileWidth,
                        self.getTileCreatorArgs ? self.getTileCreatorArgs(targetView) : {},
                        function(creator, tweakOffset) {
                            tileCreator = creator;
                            requestedTileCreator = false;

                            runTileCreator(viewRect, callback);
                        }
                    );
                } // if
            } // if
            
            // if we have a tile creator then run it
            if (tileCreator) {
                runTileCreator(viewRect, callback);
            } // if
        } //  if
    } // run

    var self = {
        bindToView: bindToView,
        getTileCreatorArgs: null,
        initTileCreator: null,
        requireRefresh: requireRefresh,
        reset: reset,
        run: run
    };
    
    // make the tile generator observable
    COG.observable(self);
    
    return self;
};
