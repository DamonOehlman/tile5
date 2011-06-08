/**
# T5.Map
*/
var Map = function(container, params) {
    // initialise defaults
    params = _extend({
        controls: ['zoombar'],
        
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
        zoomLevel = params.zoom || params.zoomLevel,
        zoomTimeout = 0;
    
    function checkScaling(evt, scaleFactor) {
        // calculate the scale factor exponent
        var scaleFactorExp = log(scaleFactor) / Math.LN2 | 0;

        // _log('scale factor = ' + scaleFactor + ', exp = ' + scaleFactorExp);
        if (scaleFactorExp !== 0) {
            scaleFactor = pow(2, scaleFactorExp);
            
            clearTimeout(zoomTimeout);
            zoomTimeout = setTimeout(function() {
                zoom(zoomLevel + scaleFactorExp);
            }, 500);
        } // ifg
    } // checkScaling
    
    function handleRefresh(evt) {
        var viewport = _self.viewport();
        
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
    function bounds(newBounds, maxZoomLevel) {
        var viewport = _self.viewport();
        
        if (newBounds) {
            // calculate the zoom level we are going to
            var zoomLevel = max(newBounds.bestZoomLevel(viewport.w, viewport.h) - 1, maxZoomLevel || 0);
            
            // move the map
            return zoom(zoomLevel).center(newBounds.center());
        }
        else {
            return new GeoJS.BBox(
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
                var viewport = _self.viewport(),
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

                // trigger the change
                _self.trigger('zoom', value);
                _self.trigger('reset');
                
                // update the rads per pixel to reflect the zoom level change
                rpp = _self.rpp = radsPerPixel(zoomLevel);

                // calculate the grid size
                _self.setMaxOffset(TWO_PI / rpp | 0, TWO_PI / rpp | 0, true, false);

                // reset the scale factor
                _self.scale(1, false, true);

                // reset scaling and resync the map
                _self.trigger('resync');

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
    
    var _self = _extend(new View(container, params), {
        XY: GeoXY, 
        
        bounds: bounds,
        zoom: zoom
    });
    
    // initialise the default rpp
    rpp = _self.rpp = radsPerPixel(zoomLevel);
    
    // bind events
    _self.bind('refresh', handleRefresh);
    _self.bind('scaleChanged', checkScaling);
    
    return _self;
};