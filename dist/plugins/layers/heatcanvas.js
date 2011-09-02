/**
# LAYER: cluster (plugin)
*/
T5.Registry.register('layer', 'heatcanvas', function(view, panFrame, container, params) {
    params = T5.ex({
        step: 1,
        degree: HeatCanvas.LINEAR,
        opacity: 0.75,
        colorscheme: null,
        source: 'markers'
    }, params);

    /* internals */
    
    var canvas,
        heatmap,
        lastOffsetX,
        lastOffsetY,
        rebuildTimeout = 0,
        sourceLayer = view.layer(params.source);
        
    function createCanvas() {
        if (panFrame) {
            var viewport = view.viewport();
            
            // create the canvas
            canvas = T5.DOM ? T5.DOM.create('canvas', null, {
                position: 'absolute',
                margin: viewport.padding.y + 'px 0 0 ' + viewport.padding.x + 'px',
                'z-index': 2
            }) : new Canvas();
            
            canvas.width = panFrame.offsetWidth;
            canvas.height = panFrame.offsetHeight;
            canvas.style.opacity = params.opacity;

            // attach the frame to the view
            view.attachFrame(canvas, true);
            
            // create the heatmap
            heatmap = new HeatCanvas(canvas);
        } // if
    } // createCanvas
            
    function handleMarkerAdded(evt, marker) {
        clearTimeout(rebuildTimeout);
        rebuildTimeout = setTimeout(rebuild, 100);
    } // handlerMarkerAdded
    
    function handleMarkersCleared(evt) {
        // clear ourself
        // _self.clear();
    } // handleMarkersCleared
    
    /* exports */
    
    /**
    ### draw(renderer, viewport, view, tickCount, hitData)
    */
    function draw(renderer, viewport, view, tickCount, hitData) {
        if (lastOffsetX !== viewport.x && lastOffsetY !== viewport.y) {
            heatmap.clear();
            setTimeout(rebuild, 1000);
            
            // update the last offset
            lastOffsetX = viewport.x;
            lastOffsetY = viewport.y;
        } // if
    } // draw
    
    function rebuild() {
        if (heatmap && sourceLayer) {
            var markers = sourceLayer.find(),
                viewport = view.viewport(),
                offsetX = viewport.x + viewport.padding.x,
                offsetY = viewport.y + viewport.padding.y;

                heatmap.clear();

                // iterate throught the markers and build the heatmap
                for (var ii = markers.length; ii--; ) {
                    heatmap.push(
                        markers[ii].xy.x - offsetX, 
                        markers[ii].xy.y - offsetY, 
                        markers[ii].value || markers[ii].size
                    );
                } // for

                // render the heatmap
                heatmap.render(params.step, params.degree, params.colorscheme);
        } // if
    } // rebuild
    
    var _self = T5.ex(new T5.ViewLayer(view, panFrame, container, params), {
        draw: draw,
        rebuild: rebuild
    });
    
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
    
    // create the canvas 
    createCanvas();
    
    return _self;
});