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
    container: 'mapCanvas',
    provider: new T5.Geo.Decarta.MapProvider()
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
T5.Map = function(params) {
    params = T5.ex({
        tapExtent: 10, // TODO: remove and use the inherited value
        provider: null,
        crosshair: false,
        zoomLevel: 0,
        boundsChangeThreshold: 30
    }, params);

    // define the locate modes
    var LOCATE_MODE = {
        NONE: 0,
        SINGLE: 1,
        WATCH: 2
    };
    
    // initialise variables
    var lastBoundsChangeOffset = T5.XY.init(),
        locationWatchId = 0,
        locateMode = LOCATE_MODE.NONE,
        initialized = false,
        tappedPOIs = [],
        annotations = null, // annotations layer
        guideOffset = null,
        locationOverlay = null,
        geoWatchId = 0,
        initialTrackingUpdate = true,
        radsPerPixel = 0;
        
    // if the data provider has not been created, 
    // then create a default one
    if (! params.provider) {
        params.provider = new T5.Geo.MapProvider();
    } // if
    
    /* internal functions */
    
    /* tracking functions */
    
    function trackingUpdate(position) {
        try {
            var currentPos = new T5.Geo.Position(
                        position.coords.latitude, 
                        position.coords.longitude),
                accuracy = position.coords.accuracy / 1000;
                
            self.trigger('locationUpdate', position, accuracy);

            // if this is the initial tracking update then 
            // create the overlay
            if (initialTrackingUpdate) {
                // if the geolocation annotation has not 
                // been created then do that now
                if (! locationOverlay) {
                    locationOverlay = new T5.Geo.UI.LocationOverlay({
                        pos: currentPos,
                        accuracy: accuracy
                    });

                    // if we want to display the location annotation, t
                    // then put it onscreen
                    locationOverlay.update(self.getTileLayer());
                    self.setLayer('location', locationOverlay);
                } // if

                // TODO: fix the magic number
                var targetBounds = T5.Geo.B.createBoundsFromCenter(
                        currentPos, 
                        Math.max(accuracy, 1));
                        
                self.gotoBounds(targetBounds);
            }
            // otherwise, animate to the new position
            else {
                // update location annotation details
                locationOverlay.pos = currentPos;
                locationOverlay.accuracy = accuracy;

                // tell the location annotation to update 
                // it's xy coordinate
                locationOverlay.update(self.getTileLayer());

                // pan to the position
                panToPosition(
                    currentPos, 
                    null, 
                    T5.easing('sine.out'));
            } // if..else

            initialTrackingUpdate = false;
        }
        catch (e) {
            COG.Log.exception(e);
        }
    } // trackingUpdate
    
    function trackingError(error) {
        COG.Log.info('caught location tracking error:', error);
    } // trackingError
    
    /* event handlers */
    
    function handleMarkerUpdate(evt, markers) {
        var grid = self.getTileLayer();
        
        for (var ii = markers.length; ii--; ) {
            syncXY([markers[ii].xy]);
        } // for
    } // handleMarkerUpdate
    
    function handlePan(evt, x, y) {
        if (locateMode === LOCATE_MODE.SINGLE) {
            self.trackCancel();
        } // if
    } // handlePan
    
    function handleTap(evt, absXY, relXY) {
        /*
        var grid = self.getTileLayer();
        var tapBounds = null;

        if (grid) {
            TODO: get the tap working again...
            var gridPos = self.viewPixToGridPix(
                    T5.XY.init(relXY.x, relXY.y)),
                tapPos = grid.pixelsToPos(gridPos),
                minPos = grid.pixelsToPos(
                    T5.XY.offset(
                        gridPos, 
                        -params.tapExtent, 
                        params.tapExtent)),
                maxPos = grid.pixelsToPos(
                    T5.XY.offset(
                        gridPos,
                         params.tapExtent, 
                         -params.tapExtent));

            // turn that into a bounds object
            tapBounds = new T5.Geo.BoundingBox(minPos, maxPos);

            // find the pois in the bounds area
            // tappedPOIs = self.pois.findByBounds(tapBounds);
            // COG.Log.info('TAPPED POIS = ', tappedPOIs);
            
            self.trigger('geotap', absXY, relXY, tapPos, tapBounds);
            // self.trigger('tapPOI', tappedPOIs);
        } // if
        */
    } // handleTap
    
    function handleIdle(evt) {
        var changeDelta = T5.XY.absSize(T5.XY.diff(
                lastBoundsChangeOffset, self.getOffset()));
                
        if (changeDelta > params.boundsChangeThreshold) {
            lastBoundsChangeOffset = T5.XY.copy(self.getOffset());
            self.trigger("boundsChange", self.getBoundingBox());
        } // if
    } // handleIdle
    
    function handleProviderUpdate(name, value) {
        self.cleanup();
        initialized = false;
    } // handleProviderUpdate
    
    function handleZoomLevelChange(evt, zoomLevel, zoomXY) {
        // COG.Log.info('zoom level change, new zoom level = ' + zoomLevel + ', zoomXY = ', zoomXY);
        
        // get the current position on the map
        var currentPos = zoomXY ? T5.GeoXY.toPos(zoomXY, radsPerPixel) : getCenterPosition();
        
        // update the rads per pixel to reflect the zoom level change
        radsPerPixel = T5.Geo.radsPerPixel(zoomLevel);
        self.triggerAll('resync', self);

        // reset the map to the same position
        panToPosition(currentPos);
    } // handleZoomLevel
    
    /* internal functions */
    
    function getLayerScaling(oldZoom, newZoom) {
        return T5.Geo.radsPerPixel(oldZoom) / 
                    T5.Geo.radsPerPixel(newZoom);
    } // getLayerScaling
    
    /* public methods */
    
    /** 
    ### getBoundingBox()
    
    Return a T5.Geo.BoundingBox for the current map view area
    */
    function getBoundingBox() {
        var rect = self.getViewRect();
        
        return new T5.Geo.BoundingBox(
            T5.GeoXY.toPos(T5.XY.init(rect.x1, rect.y2), radsPerPixel),
            T5.GeoXY.toPos(T5.XY.init(rect.x2, rect.y1), radsPerPixel));
    } // getBoundingBox

    /**
    ### getCenterPosition()`
    Return a T5.GeoXY composite for the center position of the map
    */
    function getCenterPosition() {
        var rect = self.getViewRect();
        if (rect) {
            var xy = T5.XY.init(rect.x1 + rect.width / 2, rect.y1 + rect.height / 2);
            return T5.GeoXY.toPos(xy, radsPerPixel);
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
        var zoomLevel = T5.Geo.B.getZoomLevel(
                            bounds, 
                            self.getDimensions());
        
        // goto the center position of the bounding box 
        // with the calculated zoom level
        gotoPosition(
            T5.Geo.B.getCenter(bounds), 
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
        // COG.Log.info('position updated to: ', position);
        
        // update the zoom level
        self.setZoomLevel(newZoomLevel);
        
        // remove the grid layer
        T5.Images.cancelLoad();
        
        // cancel any animations
        T5.cancelAnimation();
        
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
        var centerXY = T5.GeoXY.init(position, T5.Geo.radsPerPixel(self.getZoomLevel()));
            
        // COG.Log.info('panning to center xy: ', centerXY);
        self.updateOffset(centerXY.x, centerXY.y, easingFn, easingDuration, callback);
        self.trigger('wake');

        // trigger a bounds change event
        self.trigger("boundsChange", self.getBoundingBox());

        // if we have a callback defined, then run it
        if (callback && (typeof easingFn === 'undefined')) {
            callback(self);
        } // if
    } // panToPosition
    
    /**
    ### syncXY(points)
    This function iterates through the specified vectors and if they are
    of type GeoXY composite they are provided the rads per pixel of the
    grid so they can perform their calculations
    */
    function syncXY(points) {
        return T5.GeoXY.sync(points, radsPerPixel);
    } // syncXY
    
    /* public object definition */
    
    // provide the tiler (and view) an adjust scale factor handler
    params.adjustScaleFactor = function(scaleFactor) {
        var roundFn = scaleFactor < 1 ? Math.floor : Math.ceil;
        return Math.pow(2, roundFn(Math.log(scaleFactor)));
    };
    
    // initialise self
    var self = T5.ex(new T5.View(params), {
        
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
            self.trackStart(LOCATE_MODE.SINGLE);
            
            // stop checking for location after 10 seconds
            setTimeout(self.trackCancel, 10000);
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
            
            self.removeLayer('location');
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
            var routeLayer = self.getLayer('route');
            if (routeLayer) {
                // create the animation layer from the route
                var animationLayer = routeLayer.getAnimation(
                                        easing, 
                                        duration, 
                                        callback, 
                                        center);
                
                // add the animation layer
                if (animationLayer) {
                    animationLayer.addToView(self);
                }
            } // if
        }
    });
    
    // bind some event handlers
    self.bind('pan', handlePan);
    self.bind('tap', handleTap);
    
    // watch for marker updates
    // self.markers.bind('markerUpdate', handleMarkerUpdate);
    
    // listen for the view idling
    self.bind("idle", handleIdle);
    
    // list for zoom level changes
    T5.zoomable(self, params);
    self.bind('zoomLevelChange', handleZoomLevelChange);
    
    // make a few parameter configurable
    COG.configurable(
        self, 
        ["provider"], 
        COG.paramTweaker(params, null, {
            "provider": handleProviderUpdate
        }), 
        true);

    return self;
}; // T5.Map
