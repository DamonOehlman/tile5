/**
# T5.ImageLayer
*/
var TileLayer = function(genId, params) {
    params = COG.extend({
        imageLoadArgs: {}
    }, params);
    
    // initialise variables
    var genFn = genId ? Generator.init(genId, params).run : null,
        generating = false,
        storage = null,
        zoomTrees = [],
        tiles = [],
        oldTiles = [],
        lastViewport = null,
        loadArgs = params.imageLoadArgs;
    
    /* event handlers */

    function handleRefresh(evt, view, viewport) {
        var tickCount = new Date().getTime();
        
        if (storage) {
            // if we have a last view rect, then get the tiles for that rect
            oldTiles = lastViewport ? storage.search(lastViewport) : [];
            
            // fire the generator
            genFn(view, viewport, storage, function() {
                view.invalidate();
                COG.info('GEN COMPLETED IN ' + (new Date().getTime() - tickCount) + ' ms');
            });
            
            // update the last view rect
            lastViewport = XYRect.copy(viewport);
        } // if
    } // handleViewIdle
    
    function handleResync(evt, view) {
        // if we have a current tree then get the tiles from the current tree and 
        // flag them for removal
        if (storage && lastViewport) {
            oldTiles = storage.search(lastViewport);
            lastViewport = null;
        } // if
        
        // get the zoom level for the view
        var zoomLevel = view && view.getZoomLevel ? view.getZoomLevel() : 0;
        
        if (! zoomTrees[zoomLevel]) {
            zoomTrees[zoomLevel] = new SpatialStore();
        } // if
        
        storage = zoomTrees[zoomLevel];
    } // handleParentChange    
    
    /* exports */
    
    /**
    ### draw(renderer)
    */
    function draw(renderer, viewport) {
        renderer.drawTiles(viewport, storage.search(viewport));
    } // draw    
    
    /* definition */
    
    var _self = COG.extend(new ViewLayer(params), {
        draw: draw
    });
    
    _self.bind('refresh', handleRefresh);
    _self.bind('parentChange', handleResync);
    _self.bind('resync', handleResync);
    
    return _self;
};