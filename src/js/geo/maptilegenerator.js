/**
# T5.MapTileGenerator
*/
T5.MapTileGenerator = function(params) {
    params = T5.ex({
        tileWidth: 256,
        tileHeight: 256
    }, params);
    
    // initialise variables
    var zoomLevel = 0,
        initPos = null,
        targetView = null,
        lastRect = null,
        requestXY = T5.XY.init(),
        tileLoader = null,
        requestedTileCreator = false,
        tileWidth = params.tileWidth,
        halfTileWidth = tileWidth / 2,
        tileHeight = params.tileHeight,
        halfTileHeight = tileHeight / 2,
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
    
    function handleZoomLevelChange(evt, newZoomLevel) {
        zoomLevel = newZoomLevel;
        initPos = null;
    } // handleZoomLevelChange
    
    /* exports */
    
    /**
    ### bindToView(view)
    */
    function bindToView(view) {
        COG.Log.info('initializing generator');
        
        // update the target view
        targetView = view;
        
        // if the view is a zoomable then get the zoom level and bind to the zoom change event
        if (view.getZoomLevel) {
            zoomLevel = view.getZoomLevel();
            view.bind('zoomLevelChange', handleZoomLevelChange);
        } // if
    } // bindToView

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
                    zoomLevel, 
                    tileHeight,
                    tileWidth,
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
        initTileCreator: null,
        run: run
    };
    
    // make the tile generator observable
    COG.observable(self);
    
    return self;
};
