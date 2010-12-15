/**
# T5.MapTileGenerator
*/
T5.MapTileGenerator = function(params) {
    
    // initialise variables
    var zoomLevel = 0;
    
    /* internal functions */
    
    function handleZoomLevelChange(evt, newZoomLevel) {
        zoomLevel = newZoomLevel;
        self.resetTileCreator();
    } // handleZoomLevelChange;
    
    /* exports */
    
    function getTileCreatorArgs() {
        return {
            zoomLevel: zoomLevel
        };
    } // getTileCreatorArgs
    
    /* define self */
    
    var self = T5.ex(new T5.TileGenerator(params), {
        getTileCreatorArgs: getTileCreatorArgs
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
