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
        boundsChangeThreshold: 30,
        zoomAnimation: T5.easing('quad.out')
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
        radsPerPixel = 0,
        zoomLevel = params.zoomLevel;
        
    // if the data provider has not been created, 
    // then create a default one
    if (! params.provider) {
        params.provider = new T5.Geo.MapProvider();
    } // if

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
            grid.syncVectors([markers[ii].xy]);
        } // for
    } // handleMarkerUpdate
    
    function handlePan(evt, x, y) {
        if (locateMode === LOCATE_MODE.SINGLE) {
            self.trackCancel();
        } // if
    } // handlePan
    
    function handleTap(evt, absXY, relXY) {
        var grid = self.getTileLayer();
        var tapBounds = null;

        if (grid) {
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
    } // handleTap
    
    function handleDoubleTap(evt, absXY, relXY) {
        if (self.scalable()) {
            self.animate(2, 
                T5.D.getCenter(self.getDimensions()), 
                T5.XY.init(relXY.x, relXY.y), 
                params.zoomAnimation);
        } // if
    } // handleDoubleTap
    
    function handleScale(evt, scaleAmount, zoomXY) {
        var zoomChange = 0;

        // damp the scale amount
        scaleAmount = Math.sqrt(scaleAmount);

        if (scaleAmount < 1) {
            zoomChange = -(0.5 / scaleAmount);
        }
        else if (scaleAmount > 1) {
            zoomChange = scaleAmount;
        } // if..else

        gotoPosition(
            self.getXYPosition(zoomXY), 
            zoomLevel + zoomChange >> 0);
    } // handleScale
    
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
    
    /* internal functions */
    
    function getLayerScaling(oldZoom, newZoom) {
        return T5.Geo.radsPerPixel(oldZoom) / 
                    T5.Geo.radsPerPixel(newZoom);
    } // getLayerScaling
    
    /* public methods */
    
    function getPosOffset(position) {
        var xy = new T5.Geo.GeoXY(position);
        xy.setRadsPerPixel(T5.Geo.radsPerPixel(zoomLevel));
        
        return xy;
    } // getPosOffset
    
    function getXYPosition(x, y) {
        return T5.Geo.P.fromMercatorPixels(x * radsPerPixel, Math.PI - y * radsPerPixel);
    } // getXYPosition
    
    // TODO: make sure tile requests are returned in the correct 
    // order and if a new request is issued while a request is completing
    // the previous results don't create a tile layer
    function gotoPosition(position, newZoomLevel, callback) {
        COG.Log.info('position updated to: ', position);
        
        // update the zoom level
        zoomLevel = newZoomLevel;
        
        // remove the grid layer
        T5.Images.cancelLoad();
        
        // cancel any animations
        T5.cancelAnimation();
        
        // trigger the zoom level change
        radsPerPixel = T5.Geo.radsPerPixel(zoomLevel);
        self.trigger('zoomLevelChange', zoomLevel);

        // pan to Position
        panToPosition(position, callback);
    } // gotoPosition
    
    /**
    - `panToPosition(position, callback, easingFn)`
    
    This method is used to tell the map to pan (not zoom) to the specified 
    T5.Geo.Position.  An optional callback can be passed as the second
    parameter to the function and this fires a notification once the map is
    at the new specified position.  Additionally, an optional easingFn parameter
    can be supplied if the pan operation should ease to the specified location 
    rather than just shift immediately.  An easingDuration can also be supplied.
    */
    function panToPosition(position, callback, easingFn, easingDuration) {
        // determine the tile offset for the 
        // requested position
        var centerXY = getPosOffset(position),
            dimensions = self.getDimensions();
            
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
    
    /* public object definition */
    
    // provide the tiler (and view) an adjust scale factor handler
    params.adjustScaleFactor = function(scaleFactor) {
        var roundFn = scaleFactor < 1 ? Math.floor : Math.ceil;
        return Math.pow(2, roundFn(Math.log(scaleFactor)));
    };
    
    // initialise self
    var self = T5.ex(new T5.Tiler(params), {
        annotations: null,
        
        /** 
        - `getBoundingBox()`
        
        Return a Geo.BoundingBox for the current map view area
        */
        getBoundingBox: function() {
            var rect = self.getOffsetRect();
            
            return new T5.Geo.BoundingBox(
                getXYPosition(rect.x1, rect.y2),
                getXYPosition(rect.x2, rect.y1));
        },

        /**
        - `getCenterPosition()`
        
        Return a Geo.Position for the center position of the map
        */
        getCenterPosition: function() {
            var offset = self.getOffset();
            
            // get the position for the grid position
            return self.getXYPosition(offset.x, offset.y);
        },
        
        /**
        ### getXYPosition(x, y)
        
        Convert the Vector that has been passed to the function to a
        Geo.Position object
        */
        getXYPosition: getXYPosition,
        
        /**
        - `gotoBounds(bounds, callback)`
        
        TODO
        */
        gotoBounds: function(bounds, callback) {
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
        },
        
        /**
        - `gotoPosition(position, zoomLevel, callback)`
        
        TODO
        */
        gotoPosition: gotoPosition,
        panToPosition: panToPosition,

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
        ### syncVectors
        This function iterates through the specified vectors and if they are
        of type T5.Geo.GeoVector, they are provided the rads per pixel of the
        grid so they can perform their calculations
        */
        syncVectors: function(vectors) {
            var minX, minY, maxX, maxY;
            
            for (var ii = vectors.length; ii--; ) {
                var xy = vectors[ii];
                
                if (xy && xy.setRadsPerPixel) {
                    xy.setRadsPerPixel(radsPerPixel);

                    // update the min x and min y
                    minX = (typeof minX === 'undefined') || xy.x < minX ? xy.x : minX;
                    minY = (typeof minY === 'undefined') || xy.y < minY ? xy.y : minY;
                    
                    // update the max x and max y
                    maxX = (typeof maxX === 'undefined') || xy.x > maxX ? xy.x : maxX;
                    maxY = (typeof maxY === 'undefined') || xy.y > maxY ? xy.y : maxY;
                    
                    // COG.Log.info('synced vector: ', xy);
                } // if
            } // for
            
            return T5.XYRect.init(minX, minY, maxY, maxY);
        },        
        
        /**
        - `getZoomLevel()`
        
        Get the current zoom level for the map
        */
        getZoomLevel: function() {
            return zoomLevel;
        },

        /**
        - `setZoomLevel(value: Integer)`
        
        Update the map's zoom level to the specified zoom level
        */
        setZoomLevel: function(value) {
            // if the current position is set, 
            // then goto the updated position
            try {
                gotoPosition(self.getCenterPosition(), value);
            }
            catch (e) {
                COG.Log.exception(e);
            }
        },

        /**
        - `zoomIn()`
        
        Zoom in one zoom level
        */
        zoomIn: function() {
            // determine the required scaling
            var scalingNeeded = T5.Geo.radsPerPixel(zoomLevel) / 
                    T5.Geo.radsPerPixel(zoomLevel + 1);
            
            if (! self.scale(2, T5.easing('sine.out'))) {
                self.setZoomLevel(zoomLevel + 1);
            } // if
        },

        /**
        - `zoomOut()`
        
        Zoom out one zoom level
        */
        zoomOut: function() {
            var scalingNeeded = T5.Geo.radsPerPixel(zoomLevel) / 
                    T5.Geo.radsPerPixel(zoomLevel - 1);
            
            if (! self.scale(0.5, T5.easing('sine.out'))) {
                self.setZoomLevel(zoomLevel - 1);
            } // if
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
    self.bind('doubleTap', handleDoubleTap);
    self.bind('scale', handleScale);
    
    // watch for marker updates
    // self.markers.bind('markerUpdate', handleMarkerUpdate);
    
    /* ANNOTATIONS LAYER TO BE DEPRECATED */

    // if we are drawing the cross hair, then add a cross hair overlay
    if (params.crosshair) {
        self.setLayer('crosshair', new CrosshairOverlay());
    } // if

    // listen for the view idling
    self.bind("idle", handleIdle);
    
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
