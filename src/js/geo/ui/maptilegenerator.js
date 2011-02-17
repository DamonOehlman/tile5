/**
# T5.MapTileGenerator
*/
var MapTileGenerator = exports.MapTileGenerator = function(params) {
    params = COG.extend({
        relative: true
    }, params);
    
    // initialise variables
    var zoomLevel = 0,
        initPos = null;
    
    /* internal functions */
    
    /* exports */
    
    function getTileCreatorArgs(view) {
        initPos = view.getCenterPosition();
        zoomLevel = view.getZoomLevel();
        
        return {
            zoomLevel: zoomLevel,
            position: initPos
        };
    } // getTileCreatorArgs
    
    function requireRefresh(viewRect, view) {
        return (! initPos) || (zoomLevel !== view.getZoomLevel());
    } // requireRefresh    
    
    /* define self */
    
    var self = COG.extend(new TileGenerator(params), {
        minLevel: 2,
        maxLevel: 20,
        
        getTileCreatorArgs: getTileCreatorArgs,
        requireRefresh: requireRefresh
    });
    
    return self;
};
