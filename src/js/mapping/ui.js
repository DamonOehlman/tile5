TILE5.Mapping = (function() {
    var lastAnnotationTween = null,
        lastAnnotationTweenTicks = null,
        routeAnimationCounter = 0;
    
    function getAnnotationTween(tweenType) {
        // get the current tick count
        var tickCount = TILE5.Clock.getTime(true);

        if ((! lastAnnotationTween) || (tickCount - lastAnnotationTweenTicks > 100)) {
            lastAnnotationTween = TILE5.Animation.tweenValue(480, 0, tweenType, null, 250);
            lastAnnotationTweenTicks = tickCount;
        } // if
        
        return lastAnnotationTween;
    } // getAnnotationTween
    
    // TODO: evaluate whether this function can be used for all mapping providers or we need to 
    // route this call to the provider
    function radsPerPixelAtZoom(tileSize, gxZoom) {
        return 2*Math.PI / (tileSize << gxZoom);
    } // radsPerPixelAtZoom
    
    var module = {
        // change this value to have the annotations tween in (eg. TILE5.Animation.Easing.Sine.Out)
        AnnotationTween: null,
        
        GeoTileGrid: function(params) {
            // extend the params with some defaults
            params = GRUNT.extend({
                grid: null,
                centerPos: new TILE5.Geo.Position(),
                centerXY: new TILE5.Vector(),
                radsPerPixel: 0
            }, params);
            
            // determine the mercator 
            var centerMercatorPix = TILE5.Geo.P.toMercatorPixels(params.centerPos, params.radsPerPixel);
            
            // calculate the bottom left mercator pix
            // the position of the bottom left mercator pixel is determined by params.subtracting the actual 
            var blMercatorPixX = centerMercatorPix.x - params.centerXY.x,
                blMercatorPixY = centerMercatorPix.y - params.centerXY.y;
            
            // initialise self
            var self = GRUNT.extend({}, params.grid, {
                getBoundingBox: function(x, y, width, height) {
                    return new TILE5.Geo.BoundingBox(
                        self.pixelsToPos(new TILE5.Vector(x, y + height)),
                        self.pixelsToPos(new TILE5.Vector(x + width, y)));
                },
                
                getCenterOffset: function() {
                    return params.centerXY;
                },
                
                getGridXYForPosition: function(pos) {
                    // determine the mercator pixels for teh position
                    var posPixels = TILE5.Geo.P.toMercatorPixels(pos, params.radsPerPixel);

                    // calculate the offsets
                    // GRUNT.Log.info("GETTING OFFSET for position: " + pos);
                    var offsetX = posPixels.x - blMercatorPixX;
                    var offsetY = self.gridDimensions.height - (posPixels.y - blMercatorPixY);

                    // GRUNT.Log.info("position mercator pixels: " + pos_mp);
                    // GRUNT.Log.info("bottom left mercator pixels: " + blMercatorPix);
                    // GRUNT.Log.info("calcalated pos offset:    " + offset_x + ", " + offset_y);

                    return new TILE5.Vector(offsetX, offsetY);
                },
                
                getGuideOffset: function(offset) {
                    var tileSize = self.getTileSize();
                    return new TILE5.Vector((offset.x % tileSize), (offset.y % tileSize));
                },
                
                pixelsToPos: function(vector) {
                    return TILE5.Geo.P.fromMercatorPixels(blMercatorPixX + vector.x, (blMercatorPixY + self.gridDimensions.height) - vector.y, params.radsPerPixel);
                }
            });
            
            return self;
        },
        
        /**
        A view layer that is designed to display points of interest in an effective way.
        */
        POIViewLayer: function(params) {
            params = GRUNT.extend({
                
            }, params);
        },
        
        /** 
        */
        Overlay: function(params) {
            params = GRUNT.extend({
                
            }, params);
            
            // initialise self
            var self = {
                
            };
            
            return self;
        },
        
        /**
        The Radar Overlay is used to draw a translucent radar image over the map which can be used
        to indicate the accuracy of the geolocation detection, or possibly distance that has been 
        used to determine points of interest in the nearby area.
        */
        RadarOverlay: function(params) {
            params = GRUNT.extend({
                radarFill: "rgba(0, 221, 238, 0.1)",
                radarStroke: "rgba(0, 102, 136, 0.3)",
                zindex: 100
            }, params);
            
            // initialise variables
            var MAXSIZE = 100;
            var MINSIZE = 20;
            var size = 50;
            var increment = 3;
            
            return GRUNT.extend(new TILE5.Graphics.ViewLayer(params), {
                draw: function(context, offset, dimensions, state, view) {
                    // calculate the center position
                    var xPos = dimensions.width >> 1;
                    var yPos = dimensions.height >> 1;

                    // initialise the drawing style
                    context.fillStyle = params.radarFill;
                    context.strokeStyle = params.radarStroke;
                    
                    // draw the radar circle
                    context.beginPath();
                    context.arc(xPos, yPos, size, 0, Math.PI * 2, false);
                    context.fill();
                    context.stroke();
                }
            });
        },
        
        /**
        The crosshair overlay is used to draw a crosshair at the center of the map.
        */
        CrosshairOverlay: function(params) {
            params = GRUNT.extend({
                lineWidth: 1.5,
                strokeStyle: "rgba(0, 0, 0, 0.5)",
                size: 15,
                zindex: 150,
                scalePosition: false,
                validStates: TILE5.Graphics.DisplayState.ACTIVE | TILE5.Graphics.DisplayState.ANIMATING | TILE5.Graphics.DisplayState.PAN
            }, params);
            
            function drawCrosshair(context, centerPos, size) {
                context.beginPath();
                context.moveTo(centerPos.x, centerPos.y - size);
                context.lineTo(centerPos.x, centerPos.y + size);
                context.moveTo(centerPos.x - size, centerPos.y);
                context.lineTo(centerPos.x + size, centerPos.y);
                context.arc(centerPos.x, centerPos.y, size * 0.6666, 0, 2 * Math.PI, false);
                context.stroke();
            } // drawCrosshair
            
            return GRUNT.extend(new TILE5.Graphics.ViewLayer(params), {
                draw: function(context, offset, dimensions, state, view) {
                    var centerPos = dimensions.getCenter();
                    
                    // initialise the context line style
                    context.lineWidth = params.lineWidth;
                    context.strokeStyle = params.strokeStyle;
                    
                    // draw the cross hair lines
                    drawCrosshair(context, centerPos, params.size);
                }
            });
        },
        
        /** 
        Route Overlay
        */
        RouteOverlay: function(params) {
            params = GRUNT.extend({
                strokeStyle: "rgba(0, 51, 119, 0.9)",
                waypointFillStyle: "#FFFFFF",
                lineWidth: 4,
                data: null,
                pixelGeneralization: 8,
                calculationsPerCycle: 250,
                partialDraw: false,
                zindex: 50
                // validStates: TILE5.Graphics.DisplayState.ACTIVE | TILE5.Graphics.DisplayState.PAN | TILE5.Graphics.DisplayState.PINCHZOOM
            }, params);
            
            var recalc = true,
                last = null,
                coordinates = [],
                geometryCalcIndex = 0,
                instructionCoords = [],
                spawnedAnimations = [];
                
            function calcCoordinates(grid) {
                instructionCoords = [];
                
                var startTicks = GRUNT.Log.getTraceTicks(),
                    ii, current, include,
                    geometry = params.data ? params.data.geometry : [],
                    geometryLen = geometry.length,
                    instructions = params.data ? params.data.instructions : [],
                    instructionsLength = instructions.length,
                    calculationsPerCycle = params.calculationsPerCycle,
                    currentCalculations = 0;
                    
                // iterate through the position geometry and determine xy coordinates
                for (ii = geometryCalcIndex; ii < geometryLen; ii++) {
                    // calculate the current position
                    current = grid.getGridXYForPosition(geometry[ii]);

                    // determine whether the current point should be included
                    include = (! last) || (ii === 0) || 
                        (Math.abs(current.x - last.x) + Math.abs(current.y - last.y) > params.pixelGeneralization);
                        
                    if (include) {
                        coordinates.push(current);
                        
                        // update the last
                        last = current;
                    } // if
                    
                    currentCalculations++;
                    if (currentCalculations >= calculationsPerCycle) {
                        geometryCalcIndex = ii;
                        return;
                    } // if
                } // for
                
                geometryCalcIndex = geometryLen;
                GRUNT.Log.trace(geometryLen + " geometry points generalized to " + coordinates.length + " coordinates", startTicks);
                
                // iterate throught the instructions and add any points to the instruction coordinates array
                last = null;
                for (ii = instructionsLength; ii--; ) {
                    if (instructions[ii].position) {
                        // calculate the current position
                        current = grid.getGridXYForPosition(instructions[ii].position);

                        // determine whether the current point should be included
                        include = (! last) || (ii === 0) || 
                            (Math.abs(current.x - last.x) + Math.abs(current.y - last.y) > params.pixelGeneralization);

                        if (include) {
                            instructionCoords.push(current);

                            // update the last
                            last = current;
                        } // if
                    } // if
                } // for
            } // calcCoordinates
            
            // create the view layer the we will draw the view
            var self = GRUNT.extend(new TILE5.Graphics.ViewLayer(params), {
                getAnimation: function(easingFn, duration, drawCallback, autoCenter) {
                    if (recalc) {
                        return null;
                    } // if
                    
                    // define the layer id
                    var layerId = "routeAnimation" + routeAnimationCounter++;
                    spawnedAnimations.push(layerId);

                    // create a new animation layer based on the coordinates
                    return new TILE5.Graphics.AnimatedPathLayer({
                        id: layerId,
                        path: coordinates,
                        zindex: params.zindex + 1,
                        easing: easingFn ? easingFn : TILE5.Animation.Easing.Sine.InOut,
                        duration: duration ? duration : 5000,
                        drawIndicator: drawCallback,
                        autoCenter: autoCenter ? autoCenter : false
                    });
                },

                draw: function(context, offset, dimensions, state, view) {
                    var changes = 0,
                        geometry = params.data ? params.data.geometry : null;
                    
                    if (recalc) {
                        recalc = false;
                        last = null;
                        coordinates = [];
                        geometryCalcIndex = 0;
                    } // if
                    
                    if (geometry && (geometryCalcIndex < geometry.length)) {
                        calcCoordinates(view.getTileLayer());
                        changes++;
                    } // if
                    
                    var ii,
                        coordLength = coordinates.length;
                        
                    if ((coordLength > 0) && ((! changes) || params.partialDraw)) {
                        // update the context stroke style and line width
                        context.strokeStyle = params.strokeStyle;
                        context.lineWidth = params.lineWidth;
                        
                        // start drawing the path
                        context.beginPath();
                        context.moveTo(coordinates[coordLength - 1].x - offset.x, coordinates[coordLength - 1].y - offset.y);

                        for (ii = coordLength; ii--; ) {
                            context.lineTo(coordinates[ii].x - offset.x, coordinates[ii].y - offset.y);
                        } // for

                        context.stroke();
                        context.fillStyle = params.waypointFillStyle;

                        // draw the instruction coordinates
                        for (ii = instructionCoords.length; ii--; ) {
                            context.beginPath();
                            context.arc(
                                instructionCoords[ii].x - offset.x, 
                                instructionCoords[ii].y - offset.y,
                                2,
                                0,
                                Math.PI * 2,
                                false);

                            context.stroke();
                            context.fill();
                        } // for
                    } // if
                    
                    return changes;
                }
            });
            
            // listed for grid updates
            GRUNT.WaterCooler.listen("grid.updated", function(args) {
                // tell all the spawned animations to remove themselves
                for (var ii = spawnedAnimations.length; ii--; ) {
                    GRUNT.WaterCooler.say("layer.remove", { id: spawnedAnimations[ii] });
                } // for
                
                // reset the spawned animations array
                spawnedAnimations = [];
                
                // trigger a recalculation
                recalc = true;
                self.wakeParent();
            });
            
            return self;
        },

        /* annotations and annotations overlay */
        
        Annotation: function(params) {
            params = GRUNT.extend({
                xy: null,
                pos: null,
                draw: null,
                tweenIn: module.AnnotationTween,
                animationSpeed: null
            }, params);
            
            // TODO: make this inherit from sprite
            var animating = false;
            
            var self = {
                xy: params.xy,
                pos: params.pos,
                isNew: true,
                
                isAnimating: function() {
                    return animating;
                },
                
                draw: function(context, offset, state, overlay) {
                    if (! self.xy) { return; }
                    
                    if (self.isNew && (params.tweenIn)) {
                        // get the end value and update the y value
                        var endValue = self.xy.y;

                        // set the y to offscreen
                        self.xy.y = offset.y - 20;
                        
                        // animate the annotation
                        animating = true;
                        
                        TILE5.Animation.tween(self.xy, "y", endValue, params.tweenIn, function() {
                            self.xy.y = endValue;
                            animating = false;
                        }, params.animationSpeed ? params.animationSpeed : 250 + (Math.random() * 500));
                    } // if
                    
                    if (params.draw) {
                        params.draw(context, offset, new TILE5.Vector(self.xy.x - offset.x, self.xy.y - offset.y), state, overlay);
                    }
                    else {
                        context.beginPath();
                        context.arc(
                            self.xy.x - offset.x, 
                            self.xy.y - offset.y,
                            4,
                            0,
                            Math.PI * 2,
                            false);                    
                        context.fill();                    
                    }
                    
                    self.isNew = false;
                }
            }; // self
            
            return self;
        },
        
        ImageAnnotation: function(params) {
            params = GRUNT.extend({
                imageUrl: null,
                animatingImageUrl: null,
                imageAnchor: null
            }, params);
            
            var imageOffset = params.imageAnchor ? TILE5.V.invert(params.imageAnchor) : null;
            
            function getImageUrl() {
                if (params.animatingImageUrl && self.isAnimating()) {
                    // we want a smooth transition, so make sure the end image is loaded
                    TILE5.Resources.loadImage(params.imageUrl);
                    
                    // return the animating image url
                    return params.animatingImageUrl;
                }
                else {
                    return params.imageUrl;
                } // if..else
            }
            
            params.draw = function(context, offset, xy, state, overlay) {
                // get the image
                var imageUrl = getImageUrl(),
                    image = TILE5.Resources.getImage(imageUrl);
                    
                if (! image) {
                    TILE5.Resources.loadImage(imageUrl, function(loadedImage, fromCache) {
                        overlay.wakeParent();
                    });
                }
                else if (image.complete && (image.width > 0)) {
                    if (! imageOffset) {
                        imageOffset = new TILE5.Vector(-image.width >> 1, -image.height >> 1);
                    } // if
                    
                    // determine the position to draw the image
                    var imageXY = TILE5.V.offset(xy, imageOffset.x, imageOffset.y);

                    // draw the image
                    context.drawImage(image, imageXY.x, imageXY.y, image.width, image.height);
                } // if
            }; // draw

            var self = new module.Annotation(params);
            return self;
        },
        
        AnnotationsOverlay: function(params) {
            params = GRUNT.extend({
                pois: null,
                map: null,
                createAnnotationForPOI: null,
                zindex: 100
            }, params);
            
            var annotations = [],
                animating = false,
                staticAnnotations = [];
                
            function createAnnotationForPOI(poi) {
                if (poi && poi.pos) {
                    var annotation = null;
                    if (params.createAnnotationForPOI) {
                        annotation = params.createAnnotationForPOI(poi);
                    }
                    else {
                        annotation = new module.Annotation({
                            pos: poi.pos
                        });
                    } // if..else
                    
                    if (annotation) {
                        annotation.isNew = poi.isNew;
                        poi.isNew = false;
                    } // if
                    
                    return annotation;
                } // if
            } // createAnnotationForPOI
            
            function updateAnnotations(newPOIs) {
                try {
                    // reset the annotations array
                    annotations = [];
                    
                    // iterate through the pois and generate the annotations
                    for (var ii = 0; ii < newPOIs.length; ii++) {
                        if (newPOIs[ii].pos) {
                            var newAnnotation = createAnnotationForPOI(newPOIs[ii]);
                            if (newAnnotation) {
                                annotations.push(newAnnotation); 
                            } // if
                        } // if
                    } // for
                    
                    updateAnnotationCoordinates(annotations);
                }
                catch (e) {
                    GRUNT.Log.exception(e);
                }
            } // updateAnnotations
            
            function updateAnnotationCoordinates(annotationsArray) {
                var grid = params.map ? params.map.getTileLayer() : null;
                
                // iterate through the annotations and calculate the xy coordinates
                for (var ii = 0; grid && (ii < annotationsArray.length); ii++) {
                    // update the annotation xy coordinates
                    annotationsArray[ii].xy = grid.getGridXYForPosition(annotationsArray[ii].pos);
                } // for
            }

            // create the view layer the we will draw the view
            var self = GRUNT.extend(new TILE5.Graphics.ViewLayer(params), {
                draw: function(context, offset, dimensions, state, view) {
                    context.save();
                    try {
                        // initialise variables
                        var ii;
                    
                        // reset animating to false
                        animating = false;
                        context.fillStyle = "rgba(255, 0, 0, 0.75)";
                        context.globalCompositeOperation = "source-over";
                    
                        // iterate through the annotations and draw them
                        for (ii = annotations.length; ii--; ) {
                            annotations[ii].draw(context, offset, state, self);
                            animating = animating || annotations[ii].isAnimating();
                        } // for

                        for (ii = staticAnnotations.length; ii--; ) {
                            staticAnnotations[ii].draw(context, offset, state, self);
                            animating = animating || staticAnnotations[ii].isAnimating();
                        } // for

                        if (animating) {
                            self.wakeParent();
                        } // if
                    }
                    finally {
                        context.restore();
                    } // try..finally
                },
                
                /**
                This method provides that ability for the creation of static annotations (as opposed)
                to annotations that are kept in sync with the pois that are POIStorage of the map. 
                */
                add: function(annotation) {
                    staticAnnotations.push(annotation);
                    updateAnnotationCoordinates(staticAnnotations);
                    self.wakeParent();
                },
                
                clear: function(includeNonStatic) {
                    staticAnnotations = [];
                    updateAnnotationCoordinates(staticAnnotations);
                    
                    // if non static annotations should be cleared also, then do it
                    if (includeNonStatic) {
                        annotations = [];
                        updateAnnotationCoordinates(annotations);
                    } // if
                    
                    // wake the parent
                    self.wakeParent();
                },
                
                isAnimating: function() {
                    return animating;
                }
            });

            GRUNT.WaterCooler.listen("geo.pois-updated", function(args) {
                // if the event source id matches our current poi storage, then apply updates
                if (params.pois && (params.pois.id == args.srcID)) {
                    updateAnnotations(args.pois);
                    self.wakeParent();
                } // if
            });
            
            // list for grid updates
            GRUNT.WaterCooler.listen("grid.updated", function(args) {
                updateAnnotationCoordinates(annotations);
                updateAnnotationCoordinates(staticAnnotations);
                self.wakeParent();
            });
            
            return self;
        },
        
        Tiler: function(params) {
            params = GRUNT.extend({
                tapExtent: 10,
                provider: null,
                crosshair: true,
                copyright: undefined,
                zoomLevel: 0,
                boundsChange: null,
                tapPOI: null,
                tapHandler: null,
                boundsChangeThreshold: 30,
                pois: new TILE5.Geo.POIStorage(),
                createAnnotationForPOI: null,
                onTilesLoaded: null
            }, params);
            
            // if the copyright message is not defined, then use the provider
            if (typeof(params.copyright) === 'undefined') {
                params.copyright = params.provider ? params.provider.getCopyright() : "";
            } // if

            // initialise variables
            var lastBoundsChangeOffset = new TILE5.Vector(),
                copyrightMessage = params.copyright,
                initialized = false,
                tappedPOIs = [],
                lastRequestTime = 0,
                guideOffset = null,
                gridLayerId = null,
                zoomLevel = params.zoomLevel,
                callerTapHandler = params.tapHandler;
                
            // if the data provider has not been created, then create a default one
            if (! params.provider) {
                params.provider = new TILE5.Geo.MapProvider();
            } // if

            // create the base tiler
            var parent = new TILE5.Tiling.Tiler(GRUNT.extend({}, params, {
                tapHandler: function(absXY, relXY) {
                    var grid = self.getTileLayer();
                    var tapBounds = null;

                    if (grid) {
                        var gridPos = self.viewPixToGridPix(new TILE5.Vector(relXY.x, relXY.y)),
                            tapPos = grid.pixelsToPos(gridPos),
                            minPos = grid.pixelsToPos(TILE5.V.offset(gridPos, -params.tapExtent, params.tapExtent)),
                            maxPos = grid.pixelsToPos(TILE5.V.offset(gridPos, params.tapExtent, -params.tapExtent));

                        GRUNT.Log.info("grid tapped @ " + TILE5.Geo.P.toString(grid.pixelsToPos(gridPos)));

                        // turn that into a bounds object
                        tapBounds = new TILE5.Geo.BoundingBox(minPos, maxPos);

                        // find the pois in the bounds area
                        tappedPOIs = self.pois.findByBounds(tapBounds);
                        // GRUNT.Log.info("TAPPED POIS = ", tappedPOIs);

                        if (params.tapPOI) {
                            params.tapPOI(tappedPOIs);
                        } // if
                    } // if

                    if (callerTapHandler) {
                        callerTapHandler(absXY, relXY, tapPos, tapBounds); 
                    } // if
                },
                
                doubleTapHandler: function(absPos, relPos) {
                    self.animate(2, self.getDimensions().getCenter(), new TILE5.Vector(relPos.x, relPos.y), TILE5.Animation.Easing.Sine.Out);
                },
                
                onScale: function(scaleAmount, zoomXY) {
                    var zoomChange = 0;

                    // damp the scale amount
                    scaleAmount = Math.sqrt(scaleAmount);

                    if (scaleAmount < 1) {
                        zoomChange = -(0.5 / scaleAmount);
                    }
                    else if (scaleAmount > 1) {
                        zoomChange = scaleAmount;
                    } // if..else

                    self.gotoPosition(self.getXYPosition(zoomXY), zoomLevel + Math.floor(zoomChange));
                }
            }));
            
            function getLayerScaling(oldZoom, newZoom) {
                return radsPerPixelAtZoom(1, oldZoom) / radsPerPixelAtZoom(1, newZoom);
            } // getLayerScaling
            
            // initialise self
            var self = GRUNT.extend({}, parent, {
                pois: params.pois,
                annotations: null,
                
                getBoundingBox: function(buffer_size) {
                    var fnresult = new TILE5.Geo.BoundingBox();
                    var grid = self.getTileLayer();
                    var offset = self.getOffset();
                    var dimensions = self.getDimensions();

                    if (grid) {
                        fnresult = grid.getBoundingBox(offset.x, offset.y, dimensions.width, dimensions.height);
                    } // if

                    return fnresult;
                },

                getCenterPosition: function() {
                    // get the position for the grid position
                    return self.getXYPosition(self.gridDimensions.getCenter());
                },
                
                getXYPosition: function(xy) {
                    return self.getTileLayer().pixelsToPos(self.viewPixToGridPix(xy));
                },
                
                gotoBounds: function(bounds, callback) {
                    // calculate the zoom level required for the specified bounds
                    var zoomLevel = TILE5.Geo.getBoundingBoxZoomLevel(bounds, self.getDimensions());
                    
                    // goto the center position of the bounding box with the calculated zoom level
                    self.gotoPosition(bounds.getCenter(), zoomLevel, callback);
                },
                
                gotoCurrentPosition: function(callback) {
                    // use the geolocation api to get the current position
                    TILE5.Geo.Location.get({
                        successCallback: function(position, phase, rawPosition) {
                            self.clearBackground();
                            self.gotoPosition(position, 15, callback);
                        },
                        
                        errorCallback: function(error) {
                        }
                    });
                },
                
                gotoPosition: function(position, newZoomLevel, callback) {
                    // save the current zoom level
                    var currentZoomLevel = zoomLevel,
                        zoomScaling = getLayerScaling(zoomLevel, newZoomLevel),
                        requestTime = new Date().getTime();

                    // if a new zoom level is specified, then use it
                    zoomLevel = newZoomLevel ? newZoomLevel : zoomLevel;

                    // if the zoom level is not defined, then raise an exception
                    if (! zoomLevel) {
                        throw "Zoom level required to goto a position.";
                    } // if

                    // check the zoom level is ok
                    if (params.provider) {
                        zoomLevel = params.provider.checkZoomLevel(zoomLevel);
                    } // if
                    
                    // if the zoom level is different from the current zoom level, then update the map tiles
                    if ((! initialized) || (zoomLevel !== currentZoomLevel)) {
                        // remove the grid layer
                        TILE5.Resources.resetImageLoadQueue();
                        
                        // get the grid and if available, then deactivate to prevent further image draws
                        var grid = self.getTileLayer();
                        if (grid) {
                            grid.deactivate();
                        } // if

                        // cancel any animations
                        TILE5.Animation.cancel();

                        // if the map is initialise, then pan to the specified position
                        if (initialized) {
                            self.freeze();
                        } // if
                        
                        // update the global request time
                        lastRequestTime = requestTime;

                        // update the provider zoom level
                        params.provider.zoomLevel = zoomLevel;
                        params.provider.getMapTiles(self, position, function(tileGrid) {
                            // if the request time equals the last request time process, otherwise ignore
                            if (requestTime === lastRequestTime) {
                                // update the tile layer to the use the new layer
                                self.setTileLayer(tileGrid);
                                
                                // update the grid layer id
                                gridLayerId = tileGrid.getId();

                                // pan to the correct position
                                self.panToPosition(position, function() {
                                    self.unfreeze();

                                    if (callback) {
                                        callback();
                                    } // if
                                });
                            }
                            else {
                                GRUNT.Log.info("request time mismatch - ignoring update");
                            }
                        });

                        initialized = true;
                    }
                    // otherwise, just pan to the correct position
                    else {
                        self.panToPosition(position, callback);
                    } // if..else
                },

                panToPosition: function(position, callback, easingFn) {
                    var grid = self.getTileLayer();
                    if (grid) {
                        // determine the tile offset for the requested position
                        var centerXY = grid.getGridXYForPosition(position),
                            dimensions = self.getDimensions();

                        // determine the actual pan amount, by calculating the center of the viewport
                        centerXY.x -= (dimensions.width >> 1);
                        centerXY.y -= (dimensions.height >> 1);
                        
                        // if we have a guide layer snap to that
                        if (guideOffset) {
                            guideOffset = null;
                        } // if

                        // pan the required amount
                        //GRUNT.Log.info(String.format("need to apply pan vector of ({0}) to correctly center", center_xy));
                        //GRUNT.Log.info("offset before pan = " + self.getOffset());
                        self.updateOffset(centerXY.x, centerXY.y, easingFn);
                        GRUNT.WaterCooler.say("view.wake", { id: self.id });
                        //GRUNT.Log.info("offset after pan = " + self.getOffset());

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

                setZoomLevel: function(value) {
                    // if the current position is set, then goto the updated position
                    self.gotoPosition(self.getCenterPosition(), value);
                },

                zoomIn: function() {
                    // determine the required scaling
                    var scalingNeeded = radsPerPixelAtZoom(1, zoomLevel) / radsPerPixelAtZoom(1, zoomLevel + 1);
                    
                    if (! self.scale(2, TILE5.Animation.Easing.Sine.Out)) {
                        self.setZoomLevel(zoomLevel + 1);
                    } // if
                },

                zoomOut: function() {
                    var scalingNeeded = radsPerPixelAtZoom(1, zoomLevel) / radsPerPixelAtZoom(1, zoomLevel - 1);
                    
                    if (! self.scale(0.5, TILE5.Animation.Easing.Sine.Out)) {
                        self.setZoomLevel(zoomLevel - 1);
                    } // if
                },

                /* route methods */
                
                animateRoute: function(easingFn, duration, drawCallback, autoCenter) {
                    // get the routing layer
                    var routeLayer = self.getLayer("route");
                    if (routeLayer) {
                        // create the animation layer from the route
                        var animationLayer = routeLayer.getAnimation(easingFn, duration, drawCallback, autoCenter);
                        
                        // add the animation layer
                        if (animationLayer) {
                            animationLayer.addToView(self);
                        }
                    } // if
                }
            }, parent);

            // create an annotations layer
            var annotations = new TILE5.Mapping.AnnotationsOverlay({
                pois: self.pois,
                map: self,
                createAnnotationForPOI: params.createAnnotationForPOI
            });

            // add the annotations layer
            self.annotations = annotations;
            self.setLayer("annotations", annotations);
            
            // add the radar overlay
            // self.setLayer("radar", new TILE5.Mapping.RadarOverlay());
            
            // if we are drawing the cross hair, then add a cross hair overlay
            if (params.crosshair) {
                self.setLayer("crosshair", new TILE5.Mapping.CrosshairOverlay());
            } // if

            // if we have a copyright message, then add the message
            if (copyrightMessage) {
                self.setLayer("copyright", new TILE5.Graphics.ViewLayer({
                    zindex: 999,
                    draw: function(context, offset, dimensions, state, view) {
                        context.lineWidth = 2.5;
                        context.fillStyle = "rgb(50, 50, 50)";
                        context.strokeStyle = "rgba(255, 255, 255, 0.8)";
                        context.font = "bold 10px sans";
                        context.textBaseline = "bottom";
                        context.strokeText(copyrightMessage, 10, dimensions.height - 10);
                        context.fillText(copyrightMessage, 10, dimensions.height - 10);
                    }
                }));
            } // if
            
            // listen for the view idling
            GRUNT.WaterCooler.listen("view-idle", function(args) {
                if (args.id && (args.id == self.id)) {
                    // compare the last bounds change offset with the current offset
                    var changeDelta = TILE5.V.absSize(TILE5.V.diff(lastBoundsChangeOffset, self.getOffset()));
                    
                    if ((changeDelta > params.boundsChangeThreshold) && params.boundsChange) {
                        lastBoundsChangeOffset = self.getOffset();
                        params.boundsChange(self.getBoundingBox());
                    } // if
                }
            });

            // listen for tiles drawn being completed
            GRUNT.WaterCooler.listen("tiles.drawn", function(args) {
                if (args.id && (args.id == gridLayerId) && params.onTilesLoaded) {
                    params.onTilesLoaded();
                }  // if
            });
            
            return self;
        }
    };
    
    return module;
})();

