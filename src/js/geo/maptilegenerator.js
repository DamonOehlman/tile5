/**
# T5.MapTileGenerator
*/
T5.MapTileGenerator = function(params) {
    
    // initialise variables
    var zoomLevel = 0,
        initPos = null;
    
    /* internal functions */
    
    function handleZoomLevelChange(evt, newZoomLevel) {
        COG.Log.info('ZOOM LEVEL CHANGED');
        zoomLevel = newZoomLevel;
        self.reset();
    } // handleZoomLevelChange;
    
    /* exports */
    
    function getTileCreatorArgs(view) {
        initPos = view.getCenterPosition();
        
        return {
            zoomLevel: zoomLevel,
            position: initPos
        };
    } // getTileCreatorArgs
    
    function requireRefresh(viewRect) {
        return !initPos;
    } // requireRefresh    
    
    /* define self */
    
    var self = T5.ex(new T5.TileGenerator(params), {
        getTileCreatorArgs: getTileCreatorArgs,
        requireRefresh: requireRefresh
    });
    
    self.bind('bindView', function(evt, view) {
        // if the view is a zoomable then get the zoom level and bind to the zoom change event
        if (view.getZoomLevel) {
            zoomLevel = view.getZoomLevel();
            view.bind('zoomLevelChange', handleZoomLevelChange);
        } // if
    });
    
    return self;
};
