/**
# T5.Map
_extends:_ T5.Tiler


The Map class is the entry point for creating a tiling map.  Creating a 
map is quite simple and requires two things to operate.  A containing HTML5 canvas
that will be used to display the map and a T5.Geo.MapProvider that will populate 
the map.

## Example Usage: Creating a Map
    
<pre lang='javascript'>
// create the map
map = new T5.Map({
    container: 'mapContainer'
});
</pre>

Like all View descendants the map supports features such as intertial scrolling and
the like and is configurable through implementing the COG.configurable interface. For 
more information on view level features check out the View documentation.

## Events

### zoomLevelChange
This event is triggered when the zoom level has been updated

<pre>
map.bind('zoomLevelChange', function(evt, newZoomLevel) {
});
</pre>

## Methods
*/
var Map = exports.Map = function(params) {
    params = COG.extend({
        tapExtent: 10, // TODO: remove and use the inherited value
        crosshair: false,
        zoomLevel: 0,
        boundsChangeThreshold: 30,
        minZoom: 1,
        maxZoom: 18,
        pannable: true,
        scalable: true
    }, params);

    // define the locate modes
    var LOCATE_MODE = {
        NONE: 0,
        SINGLE: 1,
        WATCH: 2
    };
    
    // initialise variables
    var lastBoundsChangeOffset = XY.init(),
        locationWatchId = 0,
        locateMode = LOCATE_MODE.NONE,
        initialized = false,
        tappedPOIs = [],
        annotations = null, // annotations layer
        guideOffset = null,
        locationOverlay = null,
        geoWatchId = 0,
        initialTrackingUpdate = true,
        radsPerPixel = 0,
        tapExtent = params.tapExtent;
        
    /* internal functions */
    
    /* tracking functions */
    
    function trackingUpdate(position) {
        try {
            var currentPos = Geo.Position.init(
                        position.coords.latitude, 
                        position.coords.longitude),
                accuracy = position.coords.accuracy / 1000;
                
            _self.trigger('locationUpdate', position, accuracy);

            // if this is the initial tracking update then 
            // create the overlay
            if (initialTrackingUpdate) {
                // if the geolocation annotation has not 
                // been created then do that now
                if (! locationOverlay) {
                    locationOverlay = new Geo.UI.LocationOverlay({
                        pos: currentPos,
                        accuracy: accuracy
                    });

                    // if we want to display the location annotation, t
                    // then put it onscreen
                    locationOverlay.update(_self.getTileLayer());
                    _self.setLayer('location', locationOverlay);
                } // if

                // TODO: fix the magic number
                var targetBounds = Geo.BoundingBox.createBoundsFromCenter(
                        currentPos, 
                        Math.max(accuracy, 1));
                        
                _self.gotoBounds(targetBounds);
            }
            // otherwise, animate to the new position
            else {
                // update location annotation details
                locationOverlay.pos = currentPos;
                locationOverlay.accuracy = accuracy;

                // tell the location annotation to update 
                // it's xy coordinate
                locationOverlay.update(_self.getTileLayer());

                // pan to the position
                panToPosition(
                    currentPos, 
                    null, 
                    COG.easing('sine.out'));
            } // if..else

            initialTrackingUpdate = false;
        }
        catch (e) {
            COG.exception(e);
        }
    } // trackingUpdate
    
    function trackingError(error) {
        COG.info('caught location tracking error:', error);
    } // trackingError
    
    /* event handlers */
    
    function handlePan(evt, x, y) {
        if (locateMode === LOCATE_MODE.SINGLE) {
            _self.trackCancel();
        } // if
    } // handlePan
    
    function handleTap(evt, absXY, relXY, offsetXY) {
        var tapPos = GeoXY.toPos(offsetXY, radsPerPixel),
            minPos = GeoXY.toPos(
                XY.offset(offsetXY, -tapExtent, tapExtent),
                radsPerPixel),
            maxPos = GeoXY.toPos(
                XY.offset(offsetXY, tapExtent, -tapExtent),
                radsPerPixel);
                
        _self.trigger(
            'geotap', 
            absXY, 
            relXY, 
            tapPos,
            BoundingBox.init(minPos, maxPos)
        );
        
        
        /*
        var grid = _self.getTileLayer();
        var tapBounds = null;

        if (grid) {
            TODO: get the tap working again...
            var gridPos = _self.viewPixToGridPix(
                    XY.init(relXY.x, relXY.y)),
                tapPos = grid.pixelsToPos(gridPos),
                minPos = grid.pixelsToPos(
                    XY.offset(
                        gridPos, 
                        -params.tapExtent, 
                        params.tapExtent)),
                maxPos = grid.pixelsToPos(
                    XY.offset(
                        gridPos,
                         params.tapExtent, 
                         -params.tapExtent));

            // turn that into a bounds object
            tapBounds = BoundingBox.init(minPos, maxPos);

            // find the pois in the bounds area
            // tappedPOIs = _self.pois.findByBounds(tapBounds);
            // COG.info('TAPPED POIS = ', tappedPOIs);
            
            _self.trigger('geotap', absXY, relXY, tapPos, tapBounds);
            // _self.trigger('tapPOI', tappedPOIs);
        } // if
        */
    } // handleTap
    
    function handleRefresh(evt) {
        var changeDelta = XY.absSize(XY.diff(lastBoundsChangeOffset, _self.getOffset()));
        if (changeDelta > params.boundsChangeThreshold) {
            lastBoundsChangeOffset = XY.copy(_self.getOffset());
            _self.trigger("boundsChange", _self.getBoundingBox());
        } // if
    } // handleWork
    
    function handleProviderUpdate(name, value) {
        _self.cleanup();
        initialized = false;
    } // handleProviderUpdate
    
    function handleZoomLevelChange(evt, zoomLevel) {
        var gridSize;
        
        // update the rads per pixel to reflect the zoom level change
        radsPerPixel = Geo.radsPerPixel(zoomLevel);
        
        // calculate the grid size
        gridSize = TWO_PI / radsPerPixel | 0;
        _self.setMaxOffset(gridSize, gridSize, true, false);
        
        // remove the grid layer
        // Images.cancelLoad();
        
        // reset scaling and resync the map
        _self.resetScale();
        _self.triggerAll('resync', _self);
        _self.refresh();
    } // handleZoomLevel
    
    /* internal functions */
    
    function getLayerScaling(oldZoom, newZoom) {
        return Geo.radsPerPixel(oldZoom) / 
                    Geo.radsPerPixel(newZoom);
    } // getLayerScaling
    
    /* public methods */
    
    /** 
    ### getBoundingBox()
    
    Return a T5.Geo.BoundingBox for the current map view area
    */
    function getBoundingBox() {
        var viewport = _self.getViewport();
        
        return viewport ? 
            Geo.BoundingBox.init(
                GeoXY.toPos(XY.init(viewport.x1, viewport.y2), radsPerPixel),
                GeoXY.toPos(XY.init(viewport.x2, viewport.y1), radsPerPixel)) : 
            null;
    } // getBoundingBox

    /**
    ### getCenterPosition()`
    Return a T5.GeoXY composite for the center position of the map
    */
    function getCenterPosition() {
        var viewport = _self.getViewport();
        if (viewport) {
            var xy = XY.init(viewport.x1 + (viewport.width >> 1), viewport.y1 + (viewport.height >> 1));
            return GeoXY.toPos(xy, radsPerPixel);
        } // if
        
        return null;
    } // getCenterPosition
    
    /**
    ### gotoBounds(bounds, callback)
    Calculates the optimal display bounds for the specified T5.Geo.BoundingBox and
    then goes to the center position and zoom level best suited.
    */
    function gotoBounds(bounds, callback) {
        // calculate the zoom level required for the 
        // specified bounds
        var zoomLevel = Geo.BoundingBox.getZoomLevel(
                            bounds, 
                            _self.getViewport());
        
        // goto the center position of the bounding box 
        // with the calculated zoom level
        gotoPosition(
            Geo.BoundingBox.getCenter(bounds), 
            zoomLevel, 
            callback);
    } // gotoBounds
    
    /**
    ### gotoPosition(position, newZoomLevel, callback)
    This function is used to tell the map to go to the specified position.  The 
    newZoomLevel parameter is optional and updates the map zoom level if supplied.
    An optional callback argument is provided to receieve a notification once
    the position of the map has been updated.
    */
    function gotoPosition(position, newZoomLevel, callback) {
        // update the zoom level
        _self.setZoomLevel(newZoomLevel);
        
        // pan to Position
        panToPosition(position, callback);
    } // gotoPosition
    
    /**
    ### panToPosition(position, callback, easingFn)
    This method is used to tell the map to pan (not zoom) to the specified 
    T5.GeoXY.  An optional callback can be passed as the second
    parameter to the function and this fires a notification once the map is
    at the new specified position.  Additionally, an optional easingFn parameter
    can be supplied if the pan operation should ease to the specified location 
    rather than just shift immediately.  An easingDuration can also be supplied.
    */
    function panToPosition(position, callback, easingFn, easingDuration) {
        // determine the tile offset for the 
        // requested position
        var centerXY = GeoXY.init(position, Geo.radsPerPixel(_self.getZoomLevel())),
            offsetX = centerXY.x - (_self.width >> 1),
            offsetY = centerXY.y - (_self.height >> 1);
            
        // COG.info('panning to center xy: ', centerXY);
        _self.updateOffset(offsetX, offsetY, easingFn, easingDuration, function() {
            // refresh the display
            _self.refresh();
            
            // trigger a bounds change event
            _self.trigger("boundsChange", _self.getBoundingBox());
            
            // if a callback is defined, then pass that on
            if (callback) {
                callback(_self); 
            } // if
        });
    } // panToPosition
    
    /**
    ### syncXY(points)
    This function iterates through the specified vectors and if they are
    of type GeoXY composite they are provided the rads per pixel of the
    grid so they can perform their calculations
    */
    function syncXY(points, reverse) {
        return (reverse ? GeoXY.syncPos : GeoXY.sync)(points, radsPerPixel);
    } // syncXY
    
    /* public object definition */
    
    // provide the tiler (and view) an adjust scale factor handler
    params.adjustScaleFactor = function(scaleFactor) {
        var roundFn = scaleFactor < 1 ? Math.floor : Math.ceil;
        return Math.pow(2, roundFn(Math.log(scaleFactor)));
    };
    
    // initialise _self
    var _self = COG.extend(new View(params), {
        
        getBoundingBox: getBoundingBox,
        getCenterPosition: getCenterPosition,

        gotoBounds: gotoBounds,
        gotoPosition: gotoPosition,
        panToPosition: panToPosition,
        
        syncXY: syncXY,

        /**
        - `locate()`
        
        TODO
        */
        locate: function() {
            // run a track start, but only allow 
            // it to run for a maximum of 30s 
            _self.trackStart(LOCATE_MODE.SINGLE);
            
            // stop checking for location after 10 seconds
            setTimeout(_self.trackCancel, 10000);
        },
        
        /**
        - `trackStart(mode)`
        
        TODO
        */
        trackStart: function(mode) {
            if (navigator.geolocation && (! geoWatchId)) {
                locateMode = mode ? mode : LOCATE_MODE.WATCH;
                
                initialTrackingUpdate = true;
                geoWatchId = navigator.geolocation.watchPosition(
                    trackingUpdate, 
                    trackingError, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 5000
                    });
            } // if
        },
        
        /**
        - `trackCancel()`
        
        TODO
        */
        trackCancel: function() {
            if (geoWatchId && navigator.geolocation) {
                navigator.geolocation.clearWatch(geoWatchId);
            } // if
            
            _self.removeLayer('location');
            locationOverlay = null;
            
            // reset the locate mode
            locateMode = LOCATE_MODE.NONE;
            
            // reset the watch
            geoWatchId = 0;
        },
        
        /**
        - `animateRoute(easing, duration, callback, center)`
        
        TODO
        */
        animateRoute: function(easing, duration, callback, center) {
            // get the routing layer
            var routeLayer = _self.getLayer('route');
            if (routeLayer) {
                // create the animation layer from the route
                var animationLayer = routeLayer.getAnimation(
                                        easing, 
                                        duration, 
                                        callback, 
                                        center);
                
                // add the animation layer
                if (animationLayer) {
                    animationLayer.addToView(_self);
                }
            } // if
        }
    });
    
    // bind some event handlers
    _self.bind('pan', handlePan);
    _self.bind('tap', handleTap);
    
    // listen for the view idling
    _self.bind('refresh', handleRefresh);
    
    // listen for zoom level changes
    _self.bind('zoomLevelChange', handleZoomLevelChange);

    return _self;
}; // T5.Map
