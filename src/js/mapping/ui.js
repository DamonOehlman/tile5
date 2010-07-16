SLICK.Mapping = (function() {
    var module = {
        GeoTileGrid: function(params) {
            // extend the params with some defaults
            params = GRUNT.extend({
                grid: null,
                centerPos: new SLICK.Geo.Position(),
                centerXY: new SLICK.Vector(),
                radsPerPixel: 0
            }, params);
            
            // determine the mercator 
            var centerMercatorPix = params.centerPos.getMercatorPixels(params.radsPerPixel);
            
            // calculate the bottom left mercator pix
            // the position of the bottom left mercator pixel is determined by params.subtracting the actual 
            var blMercatorPix = new SLICK.Vector(centerMercatorPix.x - params.centerXY.x, centerMercatorPix.y - params.centerXY.y);
            
            // initialise self
            var self = GRUNT.extend({}, params.grid, {
                getBoundingBox: function(x, y, width, height) {
                    return new SLICK.Geo.BoundingBox(
                        self.pixelsToPos(new SLICK.Vector(x, y + height)),
                        self.pixelsToPos(new SLICK.Vector(x + width, y)));
                },
                
                getCenterOffset: function() {
                    return params.centerXY;
                },
                
                getGridXYForPosition: function(pos) {
                    // determine the mercator pixels for teh position
                    var pos_mp = pos.getMercatorPixels(params.radsPerPixel);

                    // calculate the offsets
                    // GRUNT.Log.info("GETTING OFFSET for position: " + pos);
                    var offset_x = pos_mp.x - blMercatorPix.x;
                    var offset_y = self.getDimensions().height - (pos_mp.y - blMercatorPix.y);

                    // GRUNT.Log.info("position mercator pixels: " + pos_mp);
                    // GRUNT.Log.info("bottom left mercator pixels: " + blMercatorPix);
                    // GRUNT.Log.info("calcalated pos offset:    " + offset_x + ", " + offset_y);

                    return new SLICK.Vector(offset_x, offset_y);
                },
                
                pixelsToPos: function(vector) {
                    // initialise the new position object
                    var fnresult = new SLICK.Geo.Position();
                    
                    var mercX = blMercatorPix.x + vector.x;
                    var mercY = (blMercatorPix.y + self.getDimensions().height) - vector.y;

                    // update the position pixels
                    fnresult.setMercatorPixels(mercX, mercY, params.radsPerPixel);

                    // return the position
                    return fnresult;
                }
            });
            
            // listen for updates to the view.offset-changed message
            GRUNT.WaterCooler.listen("tiler.shift", function(args) {
                // TODO: check if the message is related to the view that this object belongs to

                // add the specified change to the reference mercator position
                if (args.change) {
                    blMercatorPix.y += args.change.y;
                    blMercatorPix.x -= args.change.x;
                } // if
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
                radarStroke: "rgba(0, 102, 136, 0.3)"
            }, params);
            
            // initialise variables
            var MAXSIZE = 100;
            var MINSIZE = 20;
            var size = 50;
            var increment = 3;
            
            // create the view layer
            return new SLICK.Graphics.ViewLayer(GRUNT.extend({
                zindex: 100,
                draw: function(drawArgs) {
                    // calculate the center position
                    var xPos = drawArgs.dimensions.width * 0.5;
                    var yPos = drawArgs.dimensions.height * 0.5;

                    // initialise the drawing style
                    drawArgs.context.fillStyle = params.radarFill;
                    drawArgs.context.strokeStyle = params.radarStroke;
                    
                    // draw the radar circle
                    drawArgs.context.beginPath();
                    drawArgs.context.arc(xPos, yPos, size, 0, Math.PI * 2, false);
                    drawArgs.context.fill();
                    drawArgs.context.stroke();
                    
                    /*
                    // animation test
                    size += increment;
                    if ((size >= MAXSIZE) || (size <= MINSIZE)) {
                        increment = -increment;
                    } // if
                    */
                }
            }, params));
        },
        
        /**
        The crosshair overlay is used to draw a crosshair at the center of the map.
        */
        CrosshairOverlay: function(params) {
            params = GRUNT.extend({
                lineWidth: 1.5,
                strokeStyle: "rgba(0, 0, 0, 0.5)",
                size: 15,
                canCache: false
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
            
            return new SLICK.Graphics.ViewLayer(GRUNT.extend({
                zindex: 110,
                draw: function(drawArgs) {
                    var centerPos = drawArgs.dimensions.getCenter();
                    
                    // initialise the context line style
                    drawArgs.context.lineWidth = params.lineWidth;
                    drawArgs.context.strokeStyle = params.strokeStyle;
                    
                    // draw the cross hair lines
                    drawCrosshair(drawArgs.context, centerPos, params.size);
                }
            }, params));
        },
        
        /** 
        Route Overlay
        */
        RouteOverlay: function(params) {
            params = GRUNT.extend({
                strokeStyles: ["rgba(0, 51, 119, 0.9)"],
                waypointFillStyle: "#FFFFFF",
                lineWidths: [4],
                data: null,
                pixelGeneralization: 8,
                canCache: true
            }, params);
            
            var coordinates = [];
            var instructionCoords = [];
            
            // create the view layer the we will draw the view
            var view = new SLICK.Graphics.ViewLayer(GRUNT.extend({
                zindex: 50,
                draw: function(drawArgs) {
                    // TODO: see how this can be optimized... 
                    var ii;
                    
                    if (coordinates.length > 0) {
                        for (var strokeIndex = 0; strokeIndex < params.strokeStyles.length; strokeIndex++) {
                            // update the context stroke style and line width
                            drawArgs.context.strokeStyle = params.strokeStyles[strokeIndex];
                            drawArgs.context.lineWidth = params.lineWidths[strokeIndex];

                            // start drawing the path
                            drawArgs.context.beginPath();
                            drawArgs.context.moveTo(coordinates[0].x - drawArgs.offset.x, coordinates[0].y - drawArgs.offset.y);

                            for (ii = 1; ii < coordinates.length; ii++) {
                                drawArgs.context.lineTo(coordinates[ii].x - drawArgs.offset.x, coordinates[ii].y - drawArgs.offset.y);
                            } // for

                            drawArgs.context.stroke();
                        } // for
                    }
                    
                    drawArgs.context.fillStyle = params.waypointFillStyle;
                    
                    // draw the instruction coordinates
                    for (ii = 0; ii < instructionCoords.length; ii++) {
                        drawArgs.context.beginPath();
                        drawArgs.context.arc(
                            instructionCoords[ii].x - drawArgs.offset.x, 
                            instructionCoords[ii].y - drawArgs.offset.y,
                            2,
                            0,
                            Math.PI * 2,
                            false);
                        
                        drawArgs.context.stroke();
                        drawArgs.context.fill();
                    } // for
                }
            }, params));
            
            // define self
            var self = GRUNT.extend(view, {
                calcCoordinates: function(grid) {
                    coordinates = [];
                    instructionCoords = [];

                    var tickCount = new Date().getTime();
                    var ii, current, last = null, include,
                        geometry = params.data ? params.data.getGeometry() : [],
                        instructions = params.data ? params.data.getInstructions() : [];
                        
                    // TODO: improve the code reuse in the code below

                    // iterate through the position geometry and determine xy coordinates
                    for (ii = 0; ii < geometry.length; ii++) {
                        // calculate the current position
                        current = grid.getGridXYForPosition(geometry[ii]);

                        // determine whether the current point should be included
                        include = (! last) || (ii == geometry.length-1) || 
                            (Math.abs(current.x - last.x) + Math.abs(current.y - last.y) > params.pixelGeneralization);
                        
                        
                        if (include) {
                            coordinates.push(current);
                            
                            // update the last
                            last = current;
                        } // if
                    } // for
                    
                    // iterate throught the instructions and add any points to the instruction coordinates array
                    last = null;
                    for (ii = 0; ii < instructions.length; ii++) {
                        if (instructions[ii].position) {
                            // calculate the current position
                            current = grid.getGridXYForPosition(instructions[ii].position);

                            // determine whether the current point should be included
                            include = (! last) || (ii == instructions.length-1) || 
                                (Math.abs(current.x - last.x) + Math.abs(current.y - last.y) > params.pixelGeneralization);

                            if (include) {
                                instructionCoords.push(current);

                                // update the last
                                last = current;
                            } // if
                        } // if
                    } // for

                    GRUNT.Log.info("geometry = " + geometry.length + ", coordinates = " + coordinates.length + ", instructions = " + instructionCoords.length + ", calctime = " + (new Date().getTime() - tickCount) + " ms");
                }
            });
            
            // listen for updates to the view.offset-changed message
            GRUNT.WaterCooler.listen("tiler.shift", function(args) {
                // TODO: check if the message is related to the view that this object belongs to
                
                if (args.change) {
                    var ii;
                    // iterate through the items in the coordinates
                    for (ii = 0; ii < coordinates.length; ii++) {
                        coordinates[ii].add(args.change);
                    } // for

                    for (ii = 0; ii < instructionCoords.length; ii++) {
                        instructionCoords[ii].add(args.change);
                    } // for
                } // if
            });

            return self;
        },

        /* annotations and annotations overlay */
        
        Annotation: function(params) {
            params = GRUNT.extend({
                xy: null,
                pos: null,
                draw: null
            }, params);
            
            // TODO: make this inherit from sprite
            var self = {
                xy: params.xy,
                pos: params.pos,
                
                draw: function(drawArgs) {
                    if (! self.xy) { return; }
                    
                    if (params.draw) {
                        params.draw(drawArgs, new SLICK.Vector(self.xy.x - drawArgs.offset.x, self.xy.y - drawArgs.offset.y));
                    }
                    else {
                        drawArgs.context.beginPath();
                        drawArgs.context.arc(
                            self.xy.x - drawArgs.offset.x, 
                            self.xy.y - drawArgs.offset.y,
                            4,
                            0,
                            Math.PI * 2,
                            false);                    
                        drawArgs.context.fill();                    
                    }
                }
            }; // self
            
            return self;
        },
        
        ImageAnnotation: function(params) {
            params = GRUNT.extend({
                imageUrl: null
            }, params);
            
            var image = null,
                imageOffset = new SLICK.Vector();
            
            params.draw = function(drawArgs, xy) {
                if (! image) { return; }
                
                // determine the position to draw the image
                var imageXY = xy.offset(imageOffset.x, imageOffset.y);
                
                // draw the image
                drawArgs.context.drawImage(image, imageXY.x, imageXY.y, image.width, image.height);
            }; // draw
            
            // load the image
            SLICK.Resources.loadImage({
                url: params.imageUrl,
                callback: function(loadedImage) {
                    image = loadedImage;
                    
                    // calculate the image offset
                    if (image) {
                        imageOffset.x = -image.width * 0.5;
                        imageOffset.y = -image.height * 0.5;
                    } // if
                }
            });

            return new module.Annotation(params);
        },
        
        AnnotationsOverlay: function(params) {
            params = GRUNT.extend({
                pois: null,
                map: null,
                createAnnotationForPOI: null,
                canCache: true
            }, params);
            
            var annotations = [],
                staticAnnotations = [];
                
            function createAnnotationForPOI(poi) {
                if (poi && poi.pos) {
                    if (params.createAnnotationForPOI) {
                        return params.createAnnotationForPOI(poi);
                    }
                    else {
                        return new module.Annotation({
                            pos: poi.pos
                        });
                    } // if..else
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
                
                GRUNT.Log.info("calculating " + annotationsArray.length + " annotation coordinates, map = " + grid);

                // iterate through the annotations and calculate the xy coordinates
                for (var ii = 0; grid && (ii < annotationsArray.length); ii++) {
                    // update the annotation xy coordinates
                    annotationsArray[ii].xy = grid.getGridXYForPosition(annotationsArray[ii].pos);
                } // for
            }

            // create the view layer the we will draw the view
            var self = new SLICK.Graphics.ViewLayer(GRUNT.extend({
                zindex: 100,
                
                /**
                This method provides that ability for the creation of static annotations (as opposed)
                to annotations that are kept in sync with the pois that are POIStorage of the map. 
                */
                add: function(annotation) {
                    staticAnnotations.push(annotation);
                    updateAnnotationCoordinates(staticAnnotations);
                },
                
                draw: function(drawArgs) {
                    // initialise variables
                    var ii;
                    
                    drawArgs.context.fillStyle = "rgba(255, 0, 0, 0.75)";
                    
                    // iterate through the annotations and draw them
                    for (ii = 0; ii < annotations.length; ii++) {
                        annotations[ii].draw(drawArgs);
                    } // for
                    
                    // iterate through the annotations and draw them
                    for (ii = 0; ii < staticAnnotations.length; ii++) {
                        staticAnnotations[ii].draw(drawArgs);
                    } // for
                }
            }, params));
            
            // listen for updates to the view.offset-changed message
            GRUNT.WaterCooler.listen("tiler.shift", function(args) {
                updateAnnotationCoordinates(annotations);
            });
            
            GRUNT.WaterCooler.listen("geo.pois-updated", function(args) {
                // if the event source id matches our current poi storage, then apply updates
                if (params.pois && (params.pois.id == args.srcID)) {
                    updateAnnotations(args.pois);
                } // if
            });
            
            return self;
        },
        
        Tiler: function(params) {
            params = GRUNT.extend({
                tapExtent: 10,
                provider: null,
                crosshair: false,
                zoomLevel: 0,
                boundsChange: null,
                boundsChangeThreshold: 30,
                pois: new SLICK.Geo.POIStorage(),
                createAnnotationForPOI: null
            }, params);

            // initialise variables
            var current_position = null,
                lastBoundsChangeOffset = new SLICK.Vector(),
                centerPos = null;
            var initialized = false;
            var zoomLevel = params.zoomLevel;

            // if the data provider has not been created, then create a default one
            if (! params.provider) {
                params.provider = new SLICK.Geo.MapProvider();
            } // if

            // if we have a pan handler in the args, then save it as we are going to insert our own
            var caller_pan_handler = params.panHandler;
            var caller_tap_handler = params.tapHandler;
            var pins = {};

            function updateCenterPos() {
                // get the dimensions of the object
                var dimensions = self.getDimensions();
                var grid = self.getTileLayer();

                if (grid) {
                    // get the relative positioning on the grid for the current control center position
                    var grid_pos = self.viewPixToGridPix(new SLICK.Vector(dimensions.width * 0.5, dimensions.height * 0.5));

                    // get the position for the grid position
                    centerPos = grid.pixelsToPos(grid_pos);
                } // if
            } // updateCenterPos
            
            // initialise our own pan handler
            params.onPan = function(x, y) {
                if (caller_pan_handler) {
                    caller_pan_handler(x, y);
                } // if
            }; // 

            // initialise our own tap handler
            params.tapHandler = function(absPos, relPos) {
                var grid = self.getTileLayer();
                var tap_bounds = null;

                if (grid) {
                    var grid_pos = self.viewPixToGridPix(new SLICK.Vector(relPos.x, relPos.y));

                    // create a min xy and a max xy using a tap extent
                    var min_pos = grid.pixelsToPos(grid_pos.offset(-params.tapExtent, params.tapExtent));
                    var max_pos = grid.pixelsToPos(grid_pos.offset(params.tapExtent, -params.tapExtent));

                    // turn that into a bounds object
                    tap_bounds = new SLICK.Geo.BoundingBox(min_pos.toString(), max_pos.toString());

                    // GRUNT.Log.info("tap position = " + relPos.x + ", " + relPos.y);
                    // GRUNT.Log.info("grid pos = " + grid_pos);
                    // GRUNT.Log.info("tap bounds = " + tap_bounds);
                } // if

                if (caller_tap_handler) {
                    caller_tap_handler(absPos, relPos, tap_bounds); 
                } // if
            }; // tapHandler

            params.doubleTapHandler = function(absPos, relPos) {
                var grid = self.getTileLayer();
                if (grid) {
                    var grid_pos = self.viewPixToGridPix(new SLICK.Vector(relPos.x, relPos.y));

                    // create a min xy and a max xy using a tap extent
                    self.gotoPosition(grid.pixelsToPos(grid_pos.offset(-params.tapExtent, params.tapExtent)), zoomLevel + 1);
                } // if
            }; // doubleTapHandler

            params.onScale = function(scaleAmount) {
                var zoomChange = 0;

                // damp the scale amount
                scaleAmount = Math.sqrt(scaleAmount);

                if (scaleAmount < 1) {
                    zoomChange = -(1 / scaleAmount);
                }
                else if (scaleAmount > 1) {
                    zoomChange = scaleAmount;
                } // if..else

                // get the updated center position
                updateCenterPos();

                // TODO: check that the new zoom level is acceptable
                // remove the grid layer
                // self.removeLayer("grid");

                // GRUNT.Log.info("adjust zoom by: " + zoomChange);
                self.gotoPosition(centerPos, zoomLevel + Math.round(zoomChange));
            }; // zoomHandler

            params.onDraw = function(drawArgs) {
                // get the offset
                var grid = self.getTileLayer();

                // draw each of the pins
                for (var pin_id in pins) {
                    if (pins[pin_id] && grid) {
                        // get the offset for the position
                        // TODO: optimize this (eg. var xy = self.gridPixToViewPix(pins[pin_id].mercXY);)
                        var xy = self.gridPixToViewPix(grid.getGridXYForPosition(pins[pin_id].poi.pos));
                        pins[pin_id].drawToContext(drawArgs.context, xy.x, xy.y);
                    } // if
                } // for
            }; // onDraw
            
            // create the base tiler
            var parent = new SLICK.Tiling.Tiler(params);
            
            // register a layer listener to properly initialise GeoOverlays
            parent.registerLayerListener(function(eventType, layerId, layer) {
                if (layer) {
                    // if the layer is a geo layer and has a handler for the calcposition coordinates method, then call it
                    GRUNT.Log.info("layer " + layerId + " " + eventType + " event, has position coordinates event: " + (layer.calcCoordinates ? "true" : "false"));
                    if (layer.calcCoordinates) {
                        layer.calcCoordinates(self.getTileLayer());
                    } // if

                    // handlers for changes to the grid
                    if (/grid\d+/.test(layerId)) {
                        GRUNT.Log.info("CAPTURED NOTIFY EVENT: type = " + eventType + ", layerId = " + layerId);
                        // if the event type is an add event, then recalculate the necessary coordinates
                        if ((eventType == "add") || (eventType == "offset-changed")) {
                            self.eachLayer(function(checkLayer) {
                                if (checkLayer.calcCoordinates) {
                                    checkLayer.calcCoordinates(layer);
                                } // if                            
                            });
                        }
                        // otherwise if the event is load, then recalc position information, and unfreeze the display
                        else if (eventType == "load") {
                            self.setDisplayStatus(SLICK.Graphics.DisplayState.ACTIVE);
                        } // if
                    } // if
                } 
                // looks like we have a global event
                else {
                    self.eachLayer(function(checkLayer) {
                        if (checkLayer.calcCoordinates) {
                            checkLayer.calcCoordinates(self.getTileLayer());
                        } // if                            
                    });
                }
            });
            
            // initialise self
            var self = GRUNT.extend({}, parent, {
                pois: params.pois,
                
                getBoundingBox: function(buffer_size) {
                    var fnresult = new SLICK.Geo.BoundingBox();
                    var grid = self.getTileLayer();
                    var offset = self.getOffset();
                    var dimensions = self.getDimensions();

                    if (grid) {
                        fnresult = grid.getBoundingBox(offset.x, offset.y, dimensions.width, dimensions.height);
                    } // if

                    return fnresult;
                },

                getCenterPosition: function() {
                    // TODO: detect and retrieve the center position
                    return centerPos;
                },

                gotoPosition: function(position, newZoomLevel, callback) {
                    // save the current zoom level
                    var currentZoomLevel = zoomLevel;

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
                    if ((! initialized) || (zoomLevel != currentZoomLevel)) {
                        // if the map is initialise, then pan to the specified position
                        if (initialized) {
                            // flag the route and poi layers as frozen
                            self.setDisplayStatus(SLICK.Graphics.DisplayState.FROZEN);

                            self.panToPosition(position);
                            self.newTileLayer();
                        } // if

                        // update the provider zoom level
                        params.provider.zoomLevel = zoomLevel;
                        params.provider.getMapTiles(self, position, function(tile_grid) {
                            self.setTileLayer(tile_grid);
                            self.panToPosition(position, callback);

                            centerPos = position;
                        });

                        initialized = true;
                    }
                    // otherwise, just pan to the correct position
                    else {
                        self.panToPosition(position, callback);
                    } // if..else
                },

                panToPosition: function(position, callback) {
                    var grid = self.getTileLayer();
                    if (grid) {
                        // determine the tile offset for the requested position
                        var center_xy = grid.getGridXYForPosition(position);
                        var dimensions = self.getDimensions();

                        // determine the actual pan amount, by calculating the center of the viewport
                        center_xy.x -= (dimensions.width * 0.5);
                        center_xy.y -= (dimensions.height * 0.5);

                        // pan the required amount
                        //GRUNT.Log.info(String.format("need to apply pan vector of ({0}) to correctly center", center_xy));
                        //GRUNT.Log.info("offset before pan = " + self.getOffset());
                        self.setOffset(center_xy.x, center_xy.y);
                        //GRUNT.Log.info("offset after pan = " + self.getOffset());

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
                    self.setZoomLevel(zoomLevel + 1);
                },

                zoomOut: function() {
                    self.setZoomLevel(zoomLevel - 1);
                },

                /* poi methods */

                addPOI: function(poi) {
                    var grid = self.getTileLayer();

                    if (grid && poi && poi.id && poi.pos) {
                        // create the pin
                        pins[poi.id] = new SLICK.Geo.POIPin({
                            poi: poi
                            // mercXY: grid.getGridXYForPosition(poi.pos)
                        });
                    }
                    else {
                        throw new Error("Unable to add POI: " + (grid ? "Insufficient POI details" : "Mapping Grid not defined"));
                    }
                },

                removePOI: function(poi) {
                    // GRUNT.Log.info("removing poi: " + poi);
                    if (poi && poi.id) {
                        pins[poi.id] = null;
                    } // if
                }
            }, parent);

            // create an annotations layer
            var annotations = new SLICK.Mapping.AnnotationsOverlay({
                pois: self.pois,
                map: self,
                createAnnotationForPOI: params.createAnnotationForPOI
            });
            
            // add the annotations layer
            self.setLayer("annotations", annotations);
            
            // add the radar overlay
            // self.setLayer("radar", new SLICK.Mapping.RadarOverlay());
            
            // if we are drawing the cross hair, then add a cross hair overlay
            if (params.crosshair) {
                self.setLayer("crosshair", new SLICK.Mapping.CrosshairOverlay());
            } // if
            
            // add the copyright layer
            self.setLayer("copyright", new SLICK.Graphics.ViewLayer({
                zindex: 999,
                canCache: false,
                draw: function(drawArgs) {
                    drawArgs.context.lineWidth = 2.5;
                    drawArgs.context.fillStyle = "rgb(50, 50, 50)";
                    drawArgs.context.strokeStyle = "rgba(255, 255, 255, 0.8)";
                    drawArgs.context.font = "bold 10px sans";
                    drawArgs.context.textBaseline = "bottom";
                    drawArgs.context.strokeText("© RACQ, deCarta & Navteq 2010", 10, drawArgs.dimensions.height - 10);
                    drawArgs.context.fillText("© RACQ, deCarta & Navteq 2010", 10, drawArgs.dimensions.height - 10);
                }
            }));
            
            // listen for the view idling
            GRUNT.WaterCooler.listen("view-idle", function(args) {
                if (args.id && (args.id == self.id)) {
                    // compare the last bounds change offset with the current offset
                    var changeDelta = lastBoundsChangeOffset.diff(self.getOffset()).getAbsSize();
                    
                    if ((changeDelta > params.boundsChangeThreshold) && params.boundsChange) {
                        lastBoundsChangeOffset = self.getOffset();
                        params.boundsChange(self.getBoundingBox());
                    } // if
                }
            });

            return self;
        }
    };
    
    return module;
})();

