/**
# VIEW: simple
*/
reg('view', 'map', function(params) {
    // initialise defaults
    params = _extend({
        container: "",
        captureHover: true,
        controls: ['zoombar'],
        drawOnScale: true,
        // TODO: automatically calculate padding to allow map rotation with no "whitespace"
        padding: 50, 
        inertia: true,
        refreshDistance: 256,
        pannable: true,
        scalable: true,
        
        // zoom parameters
        minZoom: 1,
        maxZoom: 18,
        renderer: 'canvas/dom',
        zoom: 1,
        
        zoombar: {}
    }, params);
    
    /* internals */
    
    var lastBoundsChangeOffset = new GeoXY(),
        rpp,
        zoomLevel = params.zoom || params.zoomLevel;
    
    function checkScaling(evt, scaleFactor) {
        // calculate the scale factor exponent
        var scaleFactorExp = log(scaleFactor) / Math.LN2 | 0;

        // _log('scale factor = ' + scaleFactor + ', exp = ' + scaleFactorExp);
        if (scaleFactorExp !== 0) {
            scaleFactor = pow(2, scaleFactorExp);
            zoom(zoomLevel + scaleFactorExp);
        } // ifg
    } // checkScaling
    
    function handleRefresh(evt) {
        var viewport = _self.getViewport();
        
        // check the offset has changed (refreshes can happen for other reasons)
        if (lastBoundsChangeOffset.x != viewport.x || lastBoundsChangeOffset.y != viewport.y) {
            // trigger the event
            _self.trigger('boundsChange', bounds());

            // update the last bounds change offset
            lastBoundsChangeOffset.x = viewport.x;
            lastBoundsChangeOffset.y = viewport.y;
        } // if
    } // handleRefresh
    
    /* exports */
    
    /**
    ### bounds(newBounds)
    */
    function bounds(newBounds) {
        var viewport = _self.getViewport();
        
        if (newBounds) {
            return zoom(newBounds.bestZoomLevel(viewport)).center(newBounds.center());
        }
        else {
            return new BBox(
                new GeoXY(viewport.x, viewport.y2).sync(_self, true).pos(),
                new GeoXY(viewport.x2, viewport.y).sync(_self, true).pos()
            );
        } // if..else
    } // bounds
    
    /**
    ### zoom(int): int
    Either update or simply return the current zoomlevel.
    */
    function zoom(value, zoomX, zoomY) {
        if (_is(value, typeNumber)) {
            value = max(params.minZoom, min(params.maxZoom, value | 0));
            if (value !== zoomLevel) {
                var viewport = _self.getViewport(),
                    offset = _self.offset(),
                    halfWidth = viewport.w / 2,
                    halfHeight = viewport.h / 2,
                    scaling = pow(2, value - zoomLevel),
                    scaledHalfWidth = halfWidth / scaling | 0,
                    scaledHalfHeight = halfHeight / scaling | 0;

                // update the zoom level
                zoomLevel = value;

                // update the offset
                _self.offset(
                    ((zoomX || offset.x + halfWidth) - scaledHalfWidth) * scaling,
                    ((zoomY || offset.y + halfHeight) - scaledHalfHeight) * scaling
                );

                // reset the last offset
                refreshX = 0;
                refreshY = 0;

                // trigger the change
                _self.trigger('zoom', value);
                
                var gridSize;

                // update the rads per pixel to reflect the zoom level change
                rpp = _self.rpp = radsPerPixel(zoomLevel);

                // calculate the grid size
                _self.setMaxOffset(TWO_PI / rpp | 0, TWO_PI / rpp | 0, true, false);

                // reset the scale factor
                _self.scale(1, false, true);

                // reset scaling and resync the map
                _self.trigger('resync');

                // reset the renderer
                _self.renderer.trigger('reset');

                // refresh the display
                _self.refresh();
            } // if
            
            // return the view so we can chain
            return _self; 
        }
        else {
            return zoomLevel;
        } // if..else
    } // zoom    
    
    var _self = _extend(regCreate('view', 'view', params), {
        XY: GeoXY, 
        
        bounds: bounds,
        zoom: zoom
    });
    
    // bind events
    _self.bind('refresh', handleRefresh);
    _self.bind('scaleChanged', checkScaling);
    
    return _self;
});