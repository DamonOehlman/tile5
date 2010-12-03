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
    var lastBoundsChangeOffset = new T5.Vector(),
        locationWatchId = 0,
        locateMode = LOCATE_MODE.NONE,
        initialized = false,
        tappedPOIs = [],
        annotations = null, // annotations layer
        guideOffset = null,
        locationOverlay = null,
        geoWatchId = 0,
        initialTrackingUpdate = true,
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
                self.panToPosition(
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
                    new T5.Vector(relXY.x, relXY.y)),
                tapPos = grid.pixelsToPos(gridPos),
                minPos = grid.pixelsToPos(
                    T5.V.offset(
                        gridPos, 
                        -params.tapExtent, 
                        params.tapExtent)),
                maxPos = grid.pixelsToPos(
                    T5.V.offset(
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
        self.animate(2, 
            T5.D.getCenter(self.getDimensions()), 
            new T5.Vector(relXY.x, relXY.y), 
            params.zoomAnimation);
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

        self.gotoPosition(
            self.getXYPosition(zoomXY), 
            zoomLevel + zoomChange >> 0);
    } // handleScale
    
    function handleIdle(evt) {
        var changeDelta = T5.V.absSize(T5.V.diff(
                lastBoundsChangeOffset, self.getOffset()));
        
        if (changeDelta > params.boundsChangeThreshold) {
            lastBoundsChangeOffset = T5.V.copy(self.getOffset());
            self.trigger("boundsChange", self.getBoundingBox());
        } // if
    } // handleIdle
    
    function handleProviderUpdate(name, value) {
        self.cleanup();
        initialized = false;
    } // handleProviderUpdate
    
    /* internal functions */
    
    // TODO: evaluate whether this function can be used for 
    // all mapping providers or we need to route this call to the provider
    function radsPerPixelAtZoom(tileSize, gxZoom) {
        return 2 * Math.PI / (tileSize << gxZoom);
    } // radsPerPixelAtZoom
    
    function getLayerScaling(oldZoom, newZoom) {
        return radsPerPixelAtZoom(1, oldZoom) / 
                    radsPerPixelAtZoom(1, newZoom);
    } // getLayerScaling
    
    /* public methods */
    
    // TODO: make sure tile requests are returned in the correct 
    // order and if a new request is issued while a request is completing
    // the previous results don't create a tile layer
    function gotoPosition(position, newZoomLevel, callback) {
        
        function updateTileGrid(tileGrid) {
            // update the tile layer to the use the new layer
            self.setTileLayer(tileGrid);

            // pan to the correct position
            self.panToPosition(position, function() {
                self.unfreeze();

                // trigger the zoom level change event
                self.trigger('zoomLevelChange', zoomLevel);

                if (callback) {
                    callback();
                } // if
            });

            // flag as initialized
            initialized = true;
        } // updateTileGrid
        
        // save the current zoom level
        var currentZoomLevel = zoomLevel,
            zoomScaling = getLayerScaling(zoomLevel, newZoomLevel),
            reset = ! initialized,
            currentBounds = self.getBoundingBox();
            
        if (currentBounds) {
            reset = reset || !T5.Geo.P.inBounds(
                position, 
                currentBounds);
            /*
            // TODO: get this right...
            if (reset) {
                self.clearBackground();
            }
            */
        } // if                        

        // if a new zoom level is specified, then use it
        zoomLevel = newZoomLevel ? newZoomLevel : zoomLevel;

        // if the zoom level is not defined, 
        // then raise an exception
        if (! zoomLevel) {
            throw new Error('Zoom level required to goto' + 
            ' a position.');
        } // if

        // check the zoom level is ok
        if (params.provider) {
            zoomLevel = params.provider.checkZoomLevel(zoomLevel);
        } // if
        
        // if the zoom level is different from the 
        // current zoom level, then update the map tiles
        if (reset || (zoomLevel !== currentZoomLevel)) {
            // remove the grid layer
            T5.Images.cancelLoad();
            
            // cancel any animations
            T5.cancelAnimation();

            // if the map is initialise, then pan to 
            // the specified position
            if (initialized) {
                self.freeze();
            } // if
            
            // update the provider zoom level
            params.provider.zoomLevel = zoomLevel;
            params.provider.getMapTiles(
                self, 
                position, 
                updateTileGrid);
        }
        // otherwise, just pan to the correct position
        else {
            self.panToPosition(position, callback);
        } // if..else
    } // gotoPosition
    
    /* public object definition */
    
    // provide the tiler (and view) an adjust scale factor handler
    params.adjustScaleFactor = function(scaleFactor) {
        var roundFn = scaleFactor < 1 ? Math.floor : Math.ceil;
        return Math.pow(2, roundFn(Math.log(scaleFactor)));
    };
    
    // initialise self
    var self = T5.ex({}, new T5.Tiler(params), {
        annotations: null,
        
        /** 
        - `getBoundingBox()`
        
        Return a Geo.BoundingBox for the current map view area
        */
        getBoundingBox: function() {
            var grid = self.getTileLayer(),
                offset = self.getOffset(),
                dimensions = self.getDimensions();

            if (grid) {
                return grid.getBoundingBox(
                            offset.x, 
                            offset.y, 
                            dimensions.width, 
                            dimensions.height);
            } // if
            
            return null;
        },

        /**
        - `getCenterPosition()`
        
        Return a Geo.Position for the center position of the map
        */
        getCenterPosition: function() {
            // get the position for the grid position
            return self.getXYPosition(
                T5.D.getCenter(self.getDimensions()));
        },
        
        /**
        - `getXYPosition(xy)`
        
        Convert the Vector that has been passed to the function to a
        Geo.Position object
        */
        getXYPosition: function(xy) {
            return self.getTileLayer().pixelsToPos(
                self.viewPixToGridPix(xy));
        },
        
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
            self.gotoPosition(
                T5.Geo.B.getCenter(bounds), 
                zoomLevel, 
                callback);
        },
        
        /**
        - `gotoPosition(position, zoomLevel, callback)`
        
        TODO
        */
        gotoPosition: gotoPosition,

        /**
        - `panToPosition(position, callback, easingFn)`
        
        This method is used to tell the map to pan (not zoom) to the specified 
        T5.Geo.Position.  An optional callback can be passed as the second
        parameter to the function and this fires a notification once the map is
        at the new specified position.  Additionally, an optional easingFn parameter
        can be supplied if the pan operation should ease to the specified location 
        rather than just shift immediately.  An easingDuration can also be supplied.
        */
        panToPosition: function(position, callback, easingFn, easingDuration) {
            var grid = self.getTileLayer();
            if (grid) {
                // determine the tile offset for the 
                // requested position
                var centerXY = grid.getGridXYForPosition(position),
                    dimensions = self.getDimensions();

                // determine the actual pan amount, by 
                // calculating the center of the viewport
                centerXY.x -= (dimensions.width / 2);
                centerXY.y -= (dimensions.height / 2);
                
                // if we have a guide layer snap to that
                if (guideOffset) {
                    guideOffset = null;
                } // if
                
                self.updateOffset(centerXY.x, centerXY.y, easingFn, easingDuration, callback);
                self.trigger("wake");

                // trigger a bounds change event
                self.trigger("boundsChange", self.getBoundingBox());

                // if we have a callback defined, then run it
                if (callback && (typeof easingFn === 'undefined')) {
                    callback(self);
                } // if
            } // if
        },
        
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
                self.gotoPosition(self.getCenterPosition(), value);
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
            var scalingNeeded = radsPerPixelAtZoom(1, zoomLevel) / 
                    radsPerPixelAtZoom(1, zoomLevel + 1);
            
            if (! self.scale(2, T5.easing('sine.out'))) {
                self.setZoomLevel(zoomLevel + 1);
            } // if
        },

        /**
        - `zoomOut()`
        
        Zoom out one zoom level
        */
        zoomOut: function() {
            var scalingNeeded = radsPerPixelAtZoom(1, zoomLevel) / 
                    radsPerPixelAtZoom(1, zoomLevel - 1);
            
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
