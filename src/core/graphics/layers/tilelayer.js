/**
# LAYER: tile
*/
reg('layer', 'tile', function(view, panFrame, container, params) {
    params = _extend({
        generator: 'osm',
        imageLoadArgs: {}
    }, params);
    
    // initialise variables
    var TILELOAD_MAX_PANSPEED = 2,
        genFn = regCreate('generator', params.generator, params).run,
        generating = false,
        storage = null,
        zoomTrees = [],
        loadArgs = params.imageLoadArgs;
    
    /* event handlers */

    function handleRefresh(evt, view, viewport) {
        if (storage) {
            // fire the generator
            genFn(view, viewport, storage, function() {
                view.invalidate();
            });
        } // if
    } // handleViewIdle
    
    function handleResync(evt) {
        // get the zoom level for the view
        var zoomLevel = view && view.zoom ? view.zoom() : 0;
        
        if (! zoomTrees[zoomLevel]) {
            zoomTrees[zoomLevel] = createStoreForZoomLevel(zoomLevel);
        } // if
        
        storage = zoomTrees[zoomLevel];
    } // handleParentChange    
    
    /* exports */
    
    /**
    ### draw(renderer)
    */
    function draw(renderer, viewport, view) {
        if (renderer.drawTiles) {
            renderer.drawTiles(
                viewport, 
                storage.search(viewport.buffer(128)),
                view.panSpeed < TILELOAD_MAX_PANSPEED);
        } // if
    } // draw    
    
    /* definition */
    
    var _self = _extend(new ViewLayer(view, panFrame, container, params), {
        draw: draw
    });
    
    view.bind('resync', handleResync);
    view.bind('refresh', handleRefresh);
    
    return _self;
});
