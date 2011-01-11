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
    
    function handleZoomLevelChange(evt, newZoomLevel) {
        var zoomOK = newZoomLevel >= self.minLevel && (
            (! self.maxLevel) || (newZoomLevel <= self.maxLevel));
            
        COG.info('new zoom level = ' + newZoomLevel + ', zoom ok = ' + zoomOK);

        evt.cancel = ! zoomOK;
        if (zoomOK) {
            zoomLevel = newZoomLevel;
            self.reset();
        } // if
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
    
    var self = COG.extend(new TileGenerator(params), {
        minLevel: 2,
        maxLevel: 20,
        
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
