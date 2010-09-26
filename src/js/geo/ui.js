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
            var newCanvas = T5.newCanvas(params.size * 4, params.size * 4);

            // draw the cross hair
            drawCrosshair(
                newCanvas.getContext('2d'), 
                new T5.Vector(newCanvas.width / 2, newCanvas.height / 2), 
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
                    drawPos = new T5.Vector(
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
        
        GeoTileGrid: function(params) {
            // extend the params with some defaults
            params = T5.ex({
                grid: null,
                centerPos: new T5.Geo.Position(),
                centerXY: new T5.Vector(),
                radsPerPixel: 0
            }, params);
            
            // determine the mercator 
            var radsPerPixel = params.radsPerPixel,
                centerMercatorPix = T5.Geo.P.toMercatorPixels(params.centerPos);
                
            GT.Log.info("tile grid created, rads per pixel = " + radsPerPixel);
            
            // calculate the bottom left mercator pix
            // the position of the bottom left mercator pixel is 
            // determined by params.subtracting the actual 
            var blPixX = (centerMercatorPix.x / radsPerPixel) - params.centerXY.x,
                blPixY = (centerMercatorPix.y / radsPerPixel) - params.centerXY.y;
            
            // initialise self
            var self = T5.ex({}, params.grid, {
                getBoundingBox: function(x, y, width, height) {
                    return new T5.Geo.BoundingBox(
                        self.pixelsToPos(new T5.Vector(x, y + height)),
                        self.pixelsToPos(new T5.Vector(x + width, y)));
                },
                
                getGridXYForPosition: function(pos) {
                    // determine the mercator pixels for teh position
                    var posPixels = T5.Geo.P.toMercatorPixels(pos);

                    // calculate the offsets
                    var offsetX = (posPixels.x / radsPerPixel) - blPixX;
                    var offsetY = self.gridDimensions.height - 
                            ((posPixels.y / radsPerPixel) - blPixY);

                    return new T5.Vector(offsetX, offsetY);
                },
                
                getPixelDistance: function(distance) {
                    var radians = T5.Geo.dist2rad(distance);
                    return Math.floor(radians / params.radsPerPixel);
                },
                
                pixelsToPos: function(vector) {
                    return T5.Geo.P.fromMercatorPixels(
                        (blPixX + vector.x) * radsPerPixel, 
                        ((blPixY + self.gridDimensions.height) -
                            vector.y) * radsPerPixel);
                }
            });
            
            return self;
        },
        
        /** 
        Route Overlay
        */
        RouteOverlay: function(params) {
            params = T5.ex({
                data: null,
                pixelGeneralization: 8,
                calculationsPerCycle: 250,
                partialDraw: false,
                strokeStyle: 'rgba(0, 51, 119, 0.9)',
                waypointFillStyle: '#FFFFFF',
                lineWidth: 4,
                zindex: 50
            }, params);
            
            var recalc = true,
                last = null,
                coordinates = [],
                geometryCalcIndex = 0,
                instructionCoords = [],
                spawnedAnimations = [];
                
            function calcCoordinates(grid) {
                instructionCoords = [];
                if (! grid) { return; }
                
                var startTicks = GT.Log.getTraceTicks(),
                    ii, current, include,
                    geometry = params.data ? params.data.geometry : [],
                    geometryLen = geometry.length,
                    instructions = params.data ? 
                        params.data.instructions : 
                        [],
                        
                    instructionsLength = instructions.length,
                    calculationsPerCycle = params.calculationsPerCycle,
                    currentCalculations = 0;
                    
                // iterate through the position geometry 
                // and determine xy coordinates
                for (ii = geometryCalcIndex; ii < geometryLen; ii++) {
                    // calculate the current position
                    current = grid.getGridXYForPosition(geometry[ii]);

                    // determine whether the current point should be included
                    include = 
                        (! last) || 
                        (ii === 0) || 
                        (Math.abs(current.x - last.x) + 
                            Math.abs(current.y - last.y) >
                            params.pixelGeneralization);
                        
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
                GT.Log.trace(
                    geometryLen + ' geometry points generalized to ' + 
                    coordinates.length + ' coordinates', startTicks);
                
                // iterate throught the instructions and add any 
                // points to the instruction coordinates array
                last = null;
                for (ii = instructionsLength; ii--; ) {
                    if (instructions[ii].position) {
                        // calculate the current position
                        current = grid.getGridXYForPosition(
                            instructions[ii].position);

                        // determine whether the current point 
                        // should be included
                        include = 
                            (! last) || 
                            (ii === 0) || 
                            (Math.abs(current.x - last.x) + 
                                Math.abs(current.y - last.y) >
                                params.pixelGeneralization);

                        if (include) {
                            instructionCoords.push(current);

                            // update the last
                            last = current;
                        } // if
                    } // if
                } // for
            } // calcCoordinates
            
            // create the view layer the we will draw the view
            var self = T5.ex(new T5.ViewLayer(params), {
                getAnimation: function(easingFn, duration, drawCallback, autoCenter) {
                    if (recalc) {
                        return null;
                    } // if
                    
                    // define the layer id
                    var layerId = 'routeAnimation' + routeAnimationCounter++;
                    spawnedAnimations.push(layerId);

                    // create a new animation layer based on the coordinates
                    return new T5.AnimatedPathLayer({
                        id: layerId,
                        path: coordinates,
                        zindex: params.zindex + 1,
                        easing: easingFn ? 
                            easingFn : 
                            T5.T5.easing('sine.inout'),
                            
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
                        context.moveTo(
                            coordinates[coordLength - 1].x - offset.x, 
                            coordinates[coordLength - 1].y - offset.y);

                        for (ii = coordLength; ii--; ) {
                            context.lineTo(
                                coordinates[ii].x - offset.x,
                                coordinates[ii].y - offset.y);
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
            GT.listen('grid.updated', function(args) {
                // tell all the spawned animations to remove themselves
                for (var ii = spawnedAnimations.length; ii--; ) {
                    GT.say(
                        'layer.remove', { id: spawnedAnimations[ii] });
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
            params = T5.ex({
                xy: null,
                pos: null,
                draw: null,
                calcXY: null,
                tweenIn: module.AnnotationTween,
                animationSpeed: null
            }, params);
            
            var animating = false;
            
            var self = {
                xy: params.xy,
                pos: params.pos,
                isNew: true,
                
                isAnimating: function() {
                    return animating;
                },
                
                calcXY: function(grid) {
                    self.xy = grid.getGridXYForPosition(self.pos);
                    if (params.calcXY) {
                        params.calcXY(grid);
                    } // if
                },
                
                draw: function(context, offset, state, overlay, view) {
                    if (! self.xy) { return; }
                    
                    if (self.isNew && (params.tweenIn)) {
                        // get the end value and update the y value
                        var endValue = self.xy.y;

                        // set the y to offscreen
                        self.xy.y = offset.y - 20;
                        
                        // animate the annotation
                        animating = true;
                        
                        T5.tween(
                            self.xy, 
                            'y',
                            endValue, 
                            params.tweenIn, 
                            function() {
                                self.xy.y = endValue;
                                animating = false;
                            }, 
                            params.animationSpeed ? 
                                params.animationSpeed : 
                                250 + (Math.random() * 500)
                        );
                    } // if
                    
                    if (params.draw) {
                        params.draw(
                            context, 
                            offset, 
                            new T5.Vector(
                                self.xy.x - offset.x, 
                                self.xy.y - offset.y
                            ), 
                            state, 
                            overlay, 
                            view);
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
            params = T5.ex({
                imageUrl: null,
                animatingImageUrl: null,
                imageAnchor: null
            }, params);
            
            var imageOffset = params.imageAnchor ?
                    T5.V.invert(params.imageAnchor) : 
                    null;
            
            function getImageUrl() {
                if (params.animatingImageUrl && self.isAnimating()) {
                    // we want a smooth transition, so make 
                    // sure the end image is loaded
                    T5.Images.load(params.imageUrl);
                    
                    // return the animating image url
                    return params.animatingImageUrl;
                }
                else {
                    return params.imageUrl;
                } // if..else
            } // getImageUrl
            
            function drawImage(context, offset, xy, state, overlay, view) {
                // get the image
                var imageUrl = getImageUrl(),
                    image = T5.Images.get(imageUrl);
                    
                if (! image) {
                    T5.Images.load(
                        imageUrl, 
                        function(loadedImage, fromCache) {
                            overlay.wakeParent();
                        }
                    );
                }
                else if (image.complete && (image.width > 0)) {
                    if (! imageOffset) {
                        imageOffset = new T5.Vector(
                            -image.width >> 1, 
                            -image.height >> 1
                        );
                    } // if
                    
                    // determine the position to draw the image
                    var imageXY = T5.V.offset(
                                        xy,
                                        imageOffset.x,
                                        imageOffset.y);

                    // draw the image
                    context.drawImage(
                        image,
                        imageXY.x,
                        imageXY.y,
                        image.width,
                        image.height);
                } // if
            } // drawImage
            
            params.draw = drawImage;

            var self = new module.Annotation(params);
            return self;
        },
        
        LocationAnnotation: function(params) {
            params = T5.ex({
                accuracy: null
            }, params);
            
            // initialise the locator icon image
            var iconImage = new Image(),
                iconOffset = new T5.Vector(),
                indicatorRadius = null;
                
            // load the image
            iconImage.src = LOCATOR_IMAGE;
            iconImage.onload = function() {
                iconOffset = new T5.Vector(
                    iconImage.width / 2, 
                    iconImage.height / 2);
            };
            
            var self = new module.Annotation(T5.ex({
                calcXY: function(grid) {
                    indicatorRadius = 
                    Math.floor(grid.getPixelDistance(self.accuracy) * 0.5);
                },
                
                draw: function(context, offset, xy, state, overlay, view) {
                    var centerX = xy.x - iconOffset.x,
                        centerY = xy.y - iconOffset.y;

                    if (indicatorRadius && self.drawAccuracyIndicator) {
                        context.fillStyle = 'rgba(30, 30, 30, 0.2)';
                        
                        context.beginPath();
                        context.arc(
                            xy.x, 
                            xy.y, 
                            indicatorRadius, 
                            0, 
                            Math.PI * 2, 
                            false);
                        context.fill();
                    } // if

                    if (iconImage.complete && iconImage.width > 0) {
                        context.drawImage(
                            iconImage, 
                            centerX, 
                            centerY, 
                            iconImage.width, 
                            iconImage.height);
                    } // if

                    view.trigger('invalidate');
                }
            }, params));
            
            // initialise the indicator radius
            self.accuracy = params.accuracy;
            self.drawAccuracyIndicator = false;
            
            return self;
        },
        
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
                        evt.annotation = new module.Annotation({
                            pos: poi.pos
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
                    GT.Log.exception(e);
                }
            } // updateAnnotations
            
            function updateAnnotationCoordinates(annotationsArray) {
                var grid = params.map ? params.map.getTileLayer() : null,
                    annotationsCount = annotationsArray.length;
                
                // iterate through the annotations and 
                // calculate the xy coordinates
                if (grid) {
                    for (var ii = annotationsCount; ii--; ) {
                        // update the annotation xy coordinates
                        annotationsArray[ii].calcXY(grid);
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
                cycle: function(tickCount, offset, state) {
                    return animating ? 1 : 0;
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
                    staticAnnotations.push(annotation);
                    updateAnnotationCoordinates(staticAnnotations);
                    self.wakeParent();
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
                    self.wakeParent();
                }
            });

            GT.listen('geo.pois-updated', function(args) {
                // if the event source id matches our current 
                // poi storage, then apply updates
                if (params.pois && (params.pois.id == args.srcID)) {
                    updateAnnotations(args.pois);
                    self.wakeParent();
                } // if
            });
            
            // list for grid updates
            GT.listen('grid.updated', function(args) {
                updateAnnotationCoordinates(annotations);
                updateAnnotationCoordinates(staticAnnotations);
                self.wakeParent();
            });
            
            return self;
        }
    };
    
    return module;
})();
