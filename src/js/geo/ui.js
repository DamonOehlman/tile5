/**
# T5.Geo.UI
_module_


This module defines user interface elements for Tile5 geo elements
*/
T5.Geo.UI = (function() {
    var lastAnnotationTween = null,
        lastAnnotationTweenTicks = null,
        routeAnimationCounter = 0;
    
    // some base64 images
    var LOCATOR_IMAGE = 
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAA' +
    'BHNCSVQICAgIfAhkiAAAAAlwSFlzAAACIQAAAiEBPhEQkwAAABl0RVh0U29mdHdhcmUAd3' +
    'd3Lmlua3NjYXBlLm9yZ5vuPBoAAAG+SURBVCiRlZHNahNRAIW/O7mTTJPahLZBA1YUyriI' +
    'NRAE3bQIKm40m8K8gLj0CRQkO32ELHUlKbgoIu4EqeJPgtCaoBuNtjXt5LeTMZk0mbmuWi' +
    'uuPLsD3+HAOUIpxf9IHjWmaUbEyWv5ROrsVULhcHP761rUfnN3Y2Otc8CIg4YT85lzuVsP' +
    'P+Qupw1vpPjRCvhS9ymvV0e77x7nNj+uvADQAIQQ+uLyvdfLV9JGZi7EdEwQlqBpEJ019f' +
    '0z1mo2u5Q8DMydv25lshemmj1FueZTawbs7inarqLbV7Qjab1upB9YlhWSAHLavLHZCvg1' +
    'VEhN0PMU9W7At4bPVidg7CtkLLXkut+lBPD6/Ub155jJiADAHSpaLmx3ApyBQoYEUd0PBo' +
    'OBkAC6+3llvda/YxgGgYL+UNHf/zN3KiExGlsvTdP0NYDkhPdWrz35ZDsBzV5wCMuQwEyF' +
    'mXFeeadjzfuFQmGkAZRKpdGC/n7x+M6jqvA9Zo6FWDhlcHE+wqT93J1tP7vpOE7rrx8ALM' +
    'uasPf8S12St4WmJ6bYWTUC52k8Hm8Vi0X/nwBAPp/XKpWKdF1X2LYdlMvlsToC/QYTls7D' +
    'LFr/PAAAAABJRU5ErkJggg%3D%3D';
    
    function CrosshairOverlay(params) {
        params = T5.ex({
            size: 12,
            zindex: 150
        }, params);
        
        function drawCrosshair(context, centerPos, size) {
            var strokeStyles = ['#FFFFFF', '#333333'],
                lineWidths = [3, 1.5];
                
            context.lineCap = 'round';
                
            for (var ii = 0; ii < strokeStyles.length; ii++) {
                var lineSize = size; //  - (ii*2);
                
                // initialise the context line style
                context.lineWidth = lineWidths[ii];
                context.strokeStyle = strokeStyles[ii];

                context.beginPath();
                context.moveTo(centerPos.x, centerPos.y - lineSize);
                context.lineTo(centerPos.x, centerPos.y + lineSize);
                context.moveTo(centerPos.x - lineSize, centerPos.y);
                context.lineTo(centerPos.x + lineSize, centerPos.y);
                
                context.arc(
                    centerPos.x, 
                    centerPos.y, 
                    size * 0.6666, 
                    0, 
                    2 * Math.PI, 
                    false);
                    
                context.stroke();
            } // for
        } // drawCrosshair
        
        function createCrosshair() { 
            var newCanvas = T5.Images.newCanvas(params.size * 4, params.size * 4);

            // draw the cross hair
            drawCrosshair(
                newCanvas.getContext('2d'), 
                T5.XY.init(newCanvas.width / 2, newCanvas.height / 2), 
                params.size);
            
            // return the cross hair canvas
            return newCanvas;
        }
        
        var drawPos = null,
            crosshair = createCrosshair();
        
        return T5.ex(new T5.ViewLayer(params), {
            draw: function(context, offset, dimensions, state, view) {
                if (! drawPos) {
                    drawPos = T5.D.getCenter(dimensions);
                    drawPos = T5.XY.init(
                        Math.round(drawPos.x - crosshair.width / 2), 
                        Math.round(drawPos.y - crosshair.height / 2));
                } // if

                context.drawImage(crosshair, drawPos.x, drawPos.y);
            }
        });
    } // CrosshairOverlay
    
    var module = {
        // change this value to have the annotations tween in 
        // (eg. T5.easing('sineout'))
        AnnotationTween: null,
        
        /**
        # T5.Geo.UI.GeoTileGrid
        _extends:_ T5.TileGrid
        
        
        The GeoTileGrid class is used to __wrap__ and extend a standard T5.TileGrid and make 
        it "Geospatially aware".  Essentially a GeoTileGrid is initialized by passing an existing 
        TileGrid and a center position (T5.Geo.Position) and center xy coordinate (T5.Vector) and 
        this allows it to translate screen coordinates into latitude / longitude pairs.
        
        ## Constructor
        `new T5.Geo.UI.GeoTileGrid(params);`
        
        ### Initialization Params
        
        - `grid` (T5.TileGrid, default = null) the grid to wrap and make Geospatial aware
        
        - `centerPos` (T5.Geo.Position, default = empty pos) the latitude and longitude of the 
        center of the grid
        
        - `centerXY` (T5.Vector, default = empty vector) the center xy coordinate of the grid (relative 
        to the top left tile, xy coordinate = 0,0)
        
        - `radsPerPixel` (float, default = 0) the number of radians per pixel.  This value is used in 
        the calculation of screen coordinates to real world positions.  While for both the current map 
        provider implementations this value is the same, I expect it could vary from provider to provider.
        
        ## Methods
        */
        GeoTileGrid: function(params) {
            // extend the params with some defaults
            params = T5.ex({
                grid: null,
                centerPos: new T5.Geo.Position(),
                centerXY: T5.XY.init(),
                radsPerPixel: 0
            }, params);
            
            // determine the mercator 
            var radsPerPixel = params.radsPerPixel,
                centerMercatorPix = T5.Geo.P.toMercatorPixels(params.centerPos);
                
            // COG.Log.info("tile grid created, rads per pixel = " + radsPerPixel);
            
            // calculate the bottom left mercator pix
            // the position of the bottom left mercator pixel is 
            // determined by params.subtracting the actual 
            var blPixX = ((centerMercatorPix.x / radsPerPixel) - params.centerXY.x) >> 0,
                blPixY = ((centerMercatorPix.y / radsPerPixel) - params.centerXY.y) >> 0,
                tlPixY = null;
            
            // initialise self
            var self = T5.ex({}, params.grid, {
                /** 
                ### getGridXYForPosition(pos)
                Returns a T5.Vector that relates to the grid position of the T5.Geo.Position value passed in 
                the pos parameter to the method.  This method is used extensively to calculate the position 
                that shapes / points should be drawn to the grid based on their geospatial position.
                */
                getGridXYForPosition: function(pos) {
                    var vector = new T5.Geo.GeoVector(pos);
                    self.syncVectors([vector]);
                    
                    return vector;
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
                            xy.setRadsPerPixel(radsPerPixel, -blPixX, -tlPixY);

                            // update the min x and min y
                            minX = (typeof minX === 'undefined') || xy.x < minX ? xy.x : minX;
                            minY = (typeof minY === 'undefined') || xy.y < minY ? xy.y : minY;
                            
                            // update the max x and max y
                            maxX = (typeof maxX === 'undefined') || xy.x > maxX ? xy.x : maxX;
                            maxY = (typeof maxY === 'undefined') || xy.y > maxY ? xy.y : maxY;
                        } // if
                    } // for
                    
                    return T5.XYRect.init(minX, minY, maxY, maxY);
                },
                
                /**
                ### getPixelDistance(distance)
                Convert a pixel distance to a real world distance
                */
                getPixelDistance: function(distance) {
                    var radians = T5.Geo.dist2rad(distance);
                    return radians / radsPerPixel >> 0;
                },
                
                /**
                ### pixelsToPos(vector)
                CBasically the opposite of the `getGridXYForPosition`.  Returns a T5.Geo.Position based on 
                the xy value of the T5.Vector that is passed to the method.  Very useful when you need to 
                translate screen / grid coordinates into a latitude longitude.  For instance, in the case 
                where the user clicks on the map and you need to know the latitude and longitude of that 
                click / touch.
                */
                pixelsToPos: function(vector) {
                    return T5.Geo.P.fromMercatorPixels(
                        (blPixX + vector.x) * radsPerPixel, 
                        ((blPixY + self.gridDimensions.height) -
                            vector.y) * radsPerPixel);
                }
            });
            
            tlPixY = blPixY + self.gridDimensions.height;
            return self;
        },
        
        /** 
        # T5.Geo.UI.RouteOverlay
        _extends:_ T5.PathLayer
        
        
        The RouteOverlay class is used to render the route geometry to the map.
        
        ## Constructor
        `new T5.Geo.UI.RouteOverlay(params)`
        
        ### Initialization Parameters
        To be completed
        */
        RouteOverlay: function(params) {
            params = T5.ex({
                data: null,
                pixelGeneralization: 8,
                partialDraw: false,
                strokeStyle: 'rgba(0, 51, 119, 0.9)',
                waypointFillStyle: '#FFFFFF',
                lineWidth: 4,
                zindex: 50
            }, params);
            
            var coordinates = [],
                instructionCoords = [];
            
            function vectorizeRoute() {
                if (params.data && params.data.instructions) {
                    var instructions = params.data.instructions,
                        positions = new Array(instructions.length);
                    
                    for (var ii = instructions.length; ii--; ) {
                        positions[ii] = instructions[ii].position;
                    } // for

                    T5.Geo.P.vectorize(positions).bind(
                        'complete',
                        function(evt, coords) {
                            instructionCoords = coords;
                        });
                } // if
                
                if (params.data && params.data.geometry) {
                    T5.Geo.P.vectorize(params.data.geometry).bind(
                        'complete', 
                        function(evt, coords) {
                            coordinates = coords;
                            
                            // now update the coordinates
                            self.updateCoordinates(coordinates, instructionCoords, true);
                        });
                } // if
            } // vectorizeRoute
            
            // create the view layer the we will draw the view
            var self = new T5.PathLayer(params);
            
            // vectorize the data
            vectorizeRoute();
            return self;
        },
        
        /**
        # T5.Geo.UI.Poly
        _extends:_ T5.Poly
        
        
        This is a special type of T5.Poly that will take positions for the first
        argument of the constructor rather than vectors.  If the initialization
        parameter `autoParse` is set to true (which it is by default), this will 
        parsed by the T5.Geo.P.parse function and converted into a T5.Geo.GeoVector.
        
        ## Constructor
        `new T5.Geo.UI.Poly(positions, params);`
        
        ### Initialization Parameters
        - autoParse (boolean, default = true) - whether or not the values in the 
        positions array that is the first constructor argument should be run through
        the T5.Geo.P.parse function or not.  Note that this function is capable of 
        handling both string and T5.Geo.Position values as position values are
        simply passed straight through.
        
        */
        Poly: function(positions, params) {
            params = T5.ex({
                autoParse: true
            }, params);
            
            // initialise variables
            var vectors = new Array(positions.length),
                autoParse = params.autoParse,
                GeoVector = T5.Geo.GeoVector,
                parse = T5.Geo.P.parse;

            // iterate through the vectors and convert to geovectors
            for (var ii = positions.length; ii--; ) {
                vectors[ii] = new GeoVector(
                    autoParse ? parse(positions[ii]) : positions[ii]
                );
            } // for
            
            return new T5.Poly(vectors, params);
        },
        
        /**
        # T5.Geo.UI.Annotation
        
        __deprecated__ (see T5.ImageAnnotation)
        
        */
        Annotation: function(params) {
            params = T5.ex({
                pos: null
            }, params);
            
            params.xy = new T5.Geo.GeoVector(params.pos);
            return new T5.ImageAnnotation(params);
        },
        
        /**
        # T5.Geo.UI.LocationOverlay
        
        */
        LocationOverlay: function(params) {
            params = T5.ex({
                pos: null,
                accuracy: null,
                zindex: 90
            }, params);
            
            // initialise the locator icon image
            var iconImage = new Image(),
                iconOffset = T5.XY.init(),
                centerXY = T5.XY.init(),
                indicatorRadius = null;
                
            // load the image
            iconImage.src = LOCATOR_IMAGE;
            iconImage.onload = function() {
                iconOffset = T5.XY.init(
                    iconImage.width / 2, 
                    iconImage.height / 2);
            };
            
            var self = T5.ex(new T5.ViewLayer(params), {
                pos: params.pos,
                accuracy: params.accuracy,
                drawAccuracyIndicator: false,
                
                draw: function(context, offset, dimensions, state, view) {
                    var centerX = centerXY.x - offset.x,
                        centerY = centerXY.y - offset.y;

                    if (indicatorRadius) {
                        context.fillStyle = 'rgba(30, 30, 30, 0.2)';
                        
                        context.beginPath();
                        context.arc(
                            centerX, 
                            centerY, 
                            indicatorRadius, 
                            0, 
                            Math.PI * 2, 
                            false);
                        context.fill();
                    } // if

                    if (iconImage.complete && iconImage.width > 0) {
                        context.drawImage(
                            iconImage, 
                            centerX - iconOffset.x, 
                            centerY - iconOffset.y, 
                            iconImage.width, 
                            iconImage.height);
                    } // if
                    
                    self.changed();
                },
                
                update: function(grid) {
                    if (grid) {
                        indicatorRadius = Math.floor(grid.getPixelDistance(self.accuracy) * 0.5);
                        centerXY = grid.getGridXYForPosition(self.pos);
                        
                        self.changed();
                    } // if
                }
            });
            
            self.bind('gridUpdate', function(evt, grid) {
                self.update(grid);
            });
            
            return self;
        },
        
        /**
        # T5.Geo.UI.AnnotationsOverlay
        
        __deprecated__ (see T5.MarkerLayer)
        
        */
        AnnotationsOverlay: function(params) {
            params = T5.ex({
                pois: null,
                map: null,
                zindex: 100
            }, params);
            
            var annotations = [],
                animating = false,
                staticAnnotations = [];
                
            function createAnnotationForPOI(poi) {
                if (poi && poi.pos) {
                    var evt = {
                        poi: poi,
                        annotation: null
                    };
                    
                    if (params.map) {
                        params.map.trigger('getAnnotationForPOI', evt);
                    } // if
                        
                    if (! evt.annotation) {
                        evt.annotation = new T5.Annotation({
                            xy: new T5.Geo.GeoVector(poi.pos)
                        });
                    } // if
                    
                    if (evt.annotation) {
                        evt.annotation.isNew = poi.isNew;
                        poi.isNew = false;
                    } // if
                    
                    return evt.annotation;
                } // if
            } // createAnnotationForPOI
            
            function updateAnnotations(newPOIs) {
                try {
                    // reset the annotations array
                    annotations = [];
                    
                    // iterate through the pois and generate the annotations
                    for (var ii = 0; ii < newPOIs.length; ii++) {
                        if (newPOIs[ii].pos) {
                            var newAnnotation =
                                createAnnotationForPOI(newPOIs[ii]);
                                
                            if (newAnnotation) {
                                annotations.push(newAnnotation); 
                            } // if
                        } // if
                    } // for
                    
                    updateAnnotationCoordinates(annotations);
                }
                catch (e) {
                    COG.Log.exception(e);
                }
            } // updateAnnotations
            
            function updateAnnotationCoordinates(annotationsArray, grid) {
                var annotationsCount = annotationsArray.length,
                    parent = self.getParent();
                
                grid = grid ? grid : (parent ? parent.getTileLayer() : null);
                
                // iterate through the annotations and 
                // calculate the xy coordinates
                if (grid) {
                    for (var ii = annotationsCount; ii--; ) {
                        // update the annotation xy coordinates
                        grid.syncVectors([annotationsArray[ii].xy]);
                    } // for
                } // if
                
                // sort the array in the appropriate order
                annotationsArray.sort(function(itemA, itemB) {
                    var diff = itemB.xy.y - itemA.xy.y;
                    if (diff === 0) {
                        diff = itemB.xy.x - itemA.xy.x;
                    } // if
                    
                    return diff;
                });
            }

            // create the view layer the we will draw the view
            var self = T5.ex(new T5.ViewLayer(params), {
                cycle: function(tickCount, offset, state, redraw) {
                    return animating;
                },
                
                draw: function(context, offset, dimensions, state, view) {
                    // initialise variables
                    var ii;
                    
                    // reset animating to false
                    animating = false;
                    context.fillStyle = 'rgba(255, 0, 0, 0.75)';
                    context.globalCompositeOperation = 'source-over';
                
                    // iterate through the annotations and draw them
                    for (ii = annotations.length; ii--; ) {
                        annotations[ii].draw(
                            context, 
                            offset, 
                            state, 
                            self, 
                            view);
                            
                        animating = animating ||
                            annotations[ii].isAnimating();
                    } // for

                    for (ii = staticAnnotations.length; ii--; ) {
                        staticAnnotations[ii].draw(
                            context, 
                            offset, 
                            state, 
                            self, 
                            view);
                            
                        animating = animating ||
                            staticAnnotations[ii].isAnimating();
                    } // for
                    
                    return animating ? 1 : 0;
                },
                
                add: function(annotation) {
                    // if annotation is an array, then iterate through and add them
                    if (annotation && annotation.length) {
                        for (var ii = annotation.length; ii--; ) {
                            staticAnnotations[staticAnnotations.length] = annotation[ii];
                        } // for
                    }
                    else if (annotation) {
                        staticAnnotations[staticAnnotations.length] = annotation;
                    } // if..else
                    
                    // update the annotation coordinates
                    updateAnnotationCoordinates(staticAnnotations);
                    
                    // wake and invalidate the parent
                    self.changed();
                },
                
                clear: function(includeNonStatic) {
                    staticAnnotations = [];
                    updateAnnotationCoordinates(staticAnnotations);
                    
                    // if non static annotations should be cleared 
                    // also, then do it
                    if (includeNonStatic) {
                        annotations = [];
                        updateAnnotationCoordinates(annotations);
                    } // if
                    
                    // wake the parent
                    self.changed();
                }
            });

            COG.listen('geo.pois-updated', function(args) {
                // if the event source id matches our current 
                // poi storage, then apply updates
                if (params.pois && (params.pois.id == args.srcID)) {
                    updateAnnotations(args.pois);
                    self.changed();
                } // if
            });
            
            self.bind('gridUpdate', function(evt, grid) {
                updateAnnotationCoordinates(annotations, grid);
                updateAnnotationCoordinates(staticAnnotations, grid);
                
                self.changed();
            });
            
            return self;
        }
    };
    
    // TODO: remove this once clients have removed references
    module.ImageAnnotation = module.Annotation;
    
    return module;
})();
