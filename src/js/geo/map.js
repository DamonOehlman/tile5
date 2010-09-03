T5.Map = function(params) {
    params = GRUNT.extend({
        tapExtent: 10,
        provider: null,
        crosshair: false,
        zoomLevel: 0,
        boundsChange: null,
        tapPOI: null,
        boundsChangeThreshold: 30,
        pois: new T5.Geo.POIStorage(),
        createAnnotationForPOI: null,
        displayLocationAnnotation: true,
        zoomAnimation: T5.Easing.Quad.Out
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
        gridLayerId = null,
        locationAnnotation = null,
        geoWatchId = 0,
        tileRequestInProgress = false,
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
                if (! locationAnnotation) {
                    locationAnnotation = 
                        new T5.Geo.UI.LocationAnnotation({
                            pos: currentPos,
                            accuracy: accuracy
                        });

                    self.bind('tileDrawComplete', function() {
                        locationAnnotation.drawAccuracyIndicator =
                            true;
                    });
                } // if

                // if we want to display the location annotation, t
                // then put it onscreen
                if (params.displayLocationAnnotation) {
                    annotations.add(locationAnnotation);
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
                locationAnnotation.pos = currentPos;
                locationAnnotation.accuracy = accuracy;

                // tell the location annotation to update 
                // it's xy coordinate
                locationAnnotation.calcXY(self.getTileLayer());

                // pan to the position
                self.panToPosition(
                    currentPos, 
                    null, 
                    T5.Easing.Sine.Out);
            } // if..else

            initialTrackingUpdate = false;
        }
        catch (e) {
            GRUNT.Log.exception(e);
        }
    } // trackingUpdate
    
    function trackingError(error) {
        GRUNT.Log.info('caught location tracking error:', error);
    } // trackingError
    
    /* event handlers */
    
    function handlePan(x, y) {
        if (locateMode === LOCATE_MODE.SINGLE) {
            self.trackCancel();
        } // if
    } // handlePan
    
    function handleTap(absXY, relXY) {
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
            tappedPOIs = self.pois.findByBounds(tapBounds);
            // GRUNT.Log.info('TAPPED POIS = ', tappedPOIs);
            
            self.trigger('geotap', absXY, relXY, tapPos, tapBounds);

            if (params.tapPOI) {
                params.tapPOI(tappedPOIs);
            } // if
        } // if
    } // handleTap
    
    function handleDoubleTap(absXY, relXY) {
        self.animate(2, 
            T5.D.getCenter(self.getDimensions()), 
            new T5.Vector(relXY.x, relXY.y), 
            params.zoomAnimation);
    } // handleDoubleTap
    
    function handleScale(scaleAmount, zoomXY) {
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
            zoomLevel + Math.floor(zoomChange));
    } // handleScale
    
    function handleIdle() {
        var changeDelta = T5.V.absSize(T5.V.diff(
                lastBoundsChangeOffset, self.getOffset()));
        
        if ((changeDelta > params.boundsChangeThreshold) && params.boundsChange) {
            lastBoundsChangeOffset = self.getOffset();
            params.boundsChange(self.getBoundingBox());
        } // if
    } // handleIdle
    
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
    
    function gotoPosition(position, newZoomLevel, callback) {
        
        function updateTileGrid(tileGrid) {
            // update the tile layer to the use the new layer
            self.setTileLayer(tileGrid);

            // update the grid layer id
            gridLayerId = tileGrid.getId();

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

            // reset the tile request flag
            tileRequestInProgress = false;
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
            // if there is already a tile request in progress
            // abort
            if (tileRequestInProgress) {
                GRUNT.Log.warn("Tile request in progress, aborting");
                return;
            } // if
            
            // remove the grid layer
            T5.Resources.resetImageLoadQueue();
            
            // if we have a location annotation tell 
            // it not to draw the accuracy ring
            if (locationAnnotation) {
                locationAnnotation.drawAccuracyIndicator = false;
            } // if
            
            // get the grid and if available, then 
            // deactivate to prevent further image draws
            var grid = self.getTileLayer();
            if (grid) {
                grid.deactivate();
            } // if

            // cancel any animations
            T5.Animation.cancel();

            // if the map is initialise, then pan to 
            // the specified position
            if (initialized) {
                self.freeze();
            } // if
            
            tileRequestInProgress = true;
            
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
    var self = GRUNT.extend({}, new T5.Tiling.Tiler(params), {
        pois: params.pois,
        annotations: null,
        
        getProvider: function() {
            return params.provider;
        },
        
        setProvider: function(value) {
            params.provider = value;
            initialized = false;
        },
        
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

        getCenterPosition: function() {
            // get the position for the grid position
            return self.getXYPosition(
                T5.D.getCenter(self.getDimensions()));
        },
        
        getXYPosition: function(xy) {
            return self.getTileLayer().pixelsToPos(
                self.viewPixToGridPix(xy));
        },
        
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
        
        gotoPosition: gotoPosition,

        panToPosition: function(position, callback, easingFn) {
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

                self.updateOffset(centerXY.x, centerXY.y, easingFn);
                self.trigger("wake");

                // trigger a bounds change event
                if (params.boundsChange) {
                    params.boundsChange(self.getBoundingBox());
                } // if

                // if we have a callback defined, then run it
                if (callback) {
                    callback(self);
                } // if
            } // if
        },
        
        locate: function() {
            // run a track start, but only allow 
            // it to run for a maximum of 30s 
            self.trackStart(LOCATE_MODE.SINGLE);
            
            // stop checking for location after 10 seconds
            setTimeout(self.trackCancel, 10000);
        },
        
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
        
        trackCancel: function() {
            if (geoWatchId && navigator.geolocation) {
                navigator.geolocation.clearWatch(geoWatchId);
            } // if
            
            if (locateMode === LOCATE_MODE.WATCH) {
                // TODO: fix this to only remove 
                // the location annotation
                annotations.clear();
            } // if
            
            // reset the locate mode
            locateMode = LOCATE_MODE.NONE;
            
            // reset the watch
            geoWatchId = 0;
        },
        
        getZoomLevel: function() {
            return zoomLevel;
        },

        setZoomLevel: function(value) {
            // if the current position is set, 
            // then goto the updated position
            try {
                self.gotoPosition(self.getCenterPosition(), value);
            }
            catch (e) {
                GRUNT.Log.exception(e);
            }
        },

        zoomIn: function() {
            // determine the required scaling
            var scalingNeeded = radsPerPixelAtZoom(1, zoomLevel) / 
                    radsPerPixelAtZoom(1, zoomLevel + 1);
            
            if (! self.scale(2, T5.Easing.Sine.Out)) {
                self.setZoomLevel(zoomLevel + 1);
            } // if
        },

        zoomOut: function() {
            var scalingNeeded = radsPerPixelAtZoom(1, zoomLevel) / 
                    radsPerPixelAtZoom(1, zoomLevel - 1);
            
            if (! self.scale(0.5, T5.Easing.Sine.Out)) {
                self.setZoomLevel(zoomLevel - 1);
            } // if
        },

        /* route methods */
        
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

    // create an annotations layer
    annotations = new T5.Geo.UI.AnnotationsOverlay({
        pois: self.pois,
        map: self,
        createAnnotationForPOI: params.createAnnotationForPOI
    });

    // add the annotations layer
    self.annotations = annotations;
    self.setLayer('annotations', annotations);
    
    // if we are drawing the cross hair, then add a cross hair overlay
    if (params.crosshair) {
        self.setLayer('crosshair', new CrosshairOverlay());
    } // if

    // listen for the view idling
    self.bind("idle", handleIdle);

    return self;
}; // T5.Map
