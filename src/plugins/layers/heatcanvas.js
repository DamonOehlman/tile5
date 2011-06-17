/**
# LAYER: cluster (plugin)
*/
T5.Registry.register('layer', 'heatcanvas', function(view, params) {
    params = T5.ex({
        step: 1,
        degree: HeatCanvas.LINEAR,
        opacity: 0.6,
        colorscheme: null,
        source: 'markers'
    }, params);

    /* internals */
    
    var sourceLayer = view.layer(params.source);
            
    function handleMarkerAdded(evt, marker) {
        clearTimeout(clusterCheckTimeout);
        clusterCheckTimeout = setTimeout(rebuild, 100);
    } // handlerMarkerAdded
    
    function handleMarkersCleared(evt) {
        // clear ourself
        _self.clear();
    } // handleMarkersCleared
    
    /* exports */
    
    var _self = T5.Registry.create('layer', 'draw', view, params);
    
    if (sourceLayer) {
        sourceLayer.bind('markerAdded', handleMarkerAdded);
        sourceLayer.bind('cleared', handleMarkersCleared);
        
        // set the source layer to invisible
        sourceLayer.visible = false;
    }
    // if the source layer is not defined, then warn
    else {
        T5.log('No source matching source layer, no heatmaps today folks', 'warn');
    } // if..else
    
    // if the view renderer is not canvas, then raise an error
    if (view.renderer() !== 'canvas') {
        throw new Error('The heatcanvas layer is only configured to work with the canvas renderer - sorry');
    } // if
    
    return _self;
});