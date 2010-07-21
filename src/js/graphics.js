/*
File:  slick.tiler.js
This file is used to define the tiler and supporting classes for creating a scrolling
tilable grid using the HTML canvas.  At this stage, the Tiler is designed primarily for
mobile devices, however, if the demand is there it could be tweaked to also support other
HTML5 compatible browsers

Section: Version History
21/05/2010 (DJO) - Created File
*/

// define the slick tile borders
SLICK.Border = {
    NONE: 0,
    TOP: 1,
    RIGHT: 2,
    BOTTOM: 3,
    LEFT: 4
}; // Border

SLICK.Graphics = (function() {
    
    // initialise variables
    var viewCounter = 0;
    
    var module = {
        // define module requirements
        requires: ["Resources"],
        
        /**
        Scale the source canvas to a new canvas
        */
        scaleCanvas: function(srcCanvas, scaleFactor) {
            // create the new canvas
            var fnresult = document.createElement("canvas");
            fnresult.width = srcCanvas.width * scaleFactor;
            fnresult.height = srcCanvas.height * scaleFactor;
            
            var context = fnresult.getContext("2d");
            
            // draw the source canvas scaled correctly to the destination canvas
            context.drawImage(
                srcCanvas,
                0, 0, srcCanvas.width, srcCanvas.height,
                0, 0, fnresult.width, fnresult.height);
                
            // return the new canvas
            return fnresult;
        },
        
        drawScaledRect: function(context, dimensions, srcCanvas, startRect, endRect) {
            // TODO: this needs to be FASTER!!!
            
            // get the scaling rects (from the scalable behaviour - we have checked this is implemented previously)
            var startRectSize = startRect.getSize();
            var endRectSize = endRect.getSize();
            var endRectCenter = endRect.getCenter();
            
            // determine the size ratio
            var sizeRatio = startRectSize != 0 ? endRectSize / startRectSize : 1;
            var delta = null;
            var startDrawRect = startRect.duplicate();
            var endDrawRect = endRect.duplicate();
            var aspectRatio = dimensions.width / dimensions.height;

            // if we are scaling down, then
            // TODO: expand the start and end rects so the displays fill the screen
            if (startRectSize > endRectSize) {
                delta = startRect.getRequiredDelta(new SLICK.Rect(0, 0, dimensions.width, dimensions.height));
                
                // apply the delta to the start draw rect
                startDrawRect.applyDelta(delta);
                
                // determine the end draw rect
                endDrawRect.applyDelta(delta, sizeRatio, aspectRatio);
            }
            // otherwise
            else {
                delta = endRect.getRequiredDelta(new SLICK.Rect(0, 0, dimensions.width, dimensions.height));
                
                // apply the required delta to the end rect
                endDrawRect.applyDelta(delta);

                // apply the delta to the start rect by the inverse size ratio
                startDrawRect.applyDelta(delta, 1 / sizeRatio, aspectRatio);
            } // if..else
            
            if (startRect && endRect) {
                context.drawImage(
                    srcCanvas,
                    startDrawRect.origin.x, 
                    startDrawRect.origin.y,
                    startDrawRect.dimensions.width,
                    startDrawRect.dimensions.height,
                    endDrawRect.origin.x,
                    endDrawRect.origin.y,
                    endDrawRect.dimensions.width,
                    endDrawRect.dimensions.height);
            } // if            
        },
        
        drawRect: function(context, rect) {
            context.strokeRect(rect.origin.x, rect.origin.y, rect.dimensions.width, rect.dimensions.height);
        },
        
        DisplayState: {
            NONE: 0,
            ACTIVE: 1,
            ANIMATING: 2,
            INTERACTING: 4,
            FROZEN: 8,
            PINCHZOOM: 16
        },
        
        AnyDisplayState: 255,
        
        ViewLayer: function(params) {
            params = GRUNT.extend({
                id: "",
                draw: null,
                centerOnScale: true,
                zindex: 0,
                canCache: false,
                checkOK: null,
                validStates: module.DisplayState.ACTIVE | module.DisplayState.INTERACTING | module.DisplayState.PINCHZOOM
            }, params);
            
            var changeListeners = [];

            var self = {
                getId: function() {
                    return params.id;
                },
                
                setId: function(value) {
                    params.id = value;
                },
                
                getZIndex: function() {
                    return params.zindex;
                },
                
                isAnimating: function() {
                    return false;
                },
                
                addToView: function(view) {
                    view.setLayer(params.id, self);
                },
                
                beginDraw: function(args) {
                    if (params.beginDraw) {
                        params.beginDraw(args);
                    } // if
                },
                
                canDraw: function(currentState) {
                    return currentState & params.validStates !== 0;
                },
                
                checkOK: function(drawArgs) {
                    if (params.checkOK) { 
                        return params.checkOK(drawArgs);
                    }
                    
                    return true;
                },
                
                draw: function(args) {
                    if (params.draw) {
                        params.draw(args);
                    } // if
                },
                
                layerChanged: function() {
                    for (var ii = 0; ii < changeListeners.length; ii++) {
                        changeListeners[ii](self);
                    } // for
                },
                
                notify: function(eventType) {
                    
                },
                
                /**
                The remove method enables a view to flag that it is ready or should be removed
                from any views that it is contained in.  This was introduced specifically for
                animation layers that should only exist as long as an animation is active.
                */
                remove: function() {
                    GRUNT.WaterCooler.say("layer.remove", { id: params.id });
                },
                
                registerChangeListener: function(callback) {
                    changeListeners.push(callback);
                },
                
                setBufferOffset: function(x, y) {
                    bufferOffset.x = x; bufferOffset.y = y;
                },
                
                canCache: function() {
                    return params.canCache;
                }
            }; // self
            
            return self;
        },
        
        StatusViewLayer: function(params) {
            return new module.ViewLayer({
                validStates: module.AnyDisplayState,
                zindex: 5000,
                draw: function(drawArgs) {
                    drawArgs.context.fillStyle = "#FF0000";
                    drawArgs.context.fillRect(10, 10, 50, 50);
                    
                    drawArgs.context.fillStyle = "#FFFFFF";
                    drawArgs.context.font = "bold 10px sans";
                    drawArgs.context.fillText(drawArgs.displayState, 20, 20);
                }
            });
        },
        
        AnimatedPathLayer: function(params) {
            params = GRUNT.extend({
                path: [],
                id: GRUNT.generateObjectID("pathAnimation"),
                easing: SLICK.Animation.Easing.Sine.InOut,
                canCache: false,
                validStates: module.DisplayState.ACTIVE | module.DisplayState.INTERACTING | module.DisplayState.ANIMATING,
                drawIndicator: drawDefaultIndicator,
                duration: 2000
            }, params);
            
            // generate the edge data for the specified path
            var edgeData = SLICK.VectorMath.edges(params.path), 
                tween,
                pathOffset = 0;
            
            function drawDefaultIndicator(drawArgs, indicatorXY) {
                // draw an arc at the specified position
                drawArgs.context.fillStyle = "#222222";
                drawArgs.context.beginPath();
                drawArgs.context.arc(
                    indicatorXY.x - drawArgs.offset.x, 
                    indicatorXY.y - drawArgs.offset.y,
                    4,
                    0,
                    Math.PI * 2,
                    false);                    
                drawArgs.context.fill();
            } // drawDefaultIndicator
            
            // calculate the tween
            tween = SLICK.Animation.tweenValue(
                0, 
                edgeData.total, 
                params.easing, 
                function() {
                    self.remove();
                },
                params.duration);
                
            // if we are autocentering then we need to cancel on interaction
            // tween.cancelOnInteract = autoCenter;
                
            // request updates from the tween
            tween.requestUpdates(function(updatedValue, complete) {
                pathOffset = updatedValue;

                if (complete) {
                    self.remove();
                } // if
            });
            
            // initialise self
            var self = new module.ViewLayer(GRUNT.extend(params, {
                draw: function(drawArgs) {
                    var edgeIndex = 0;
                
                    // iterate through the edge data and determine the current journey coordinate index
                    while ((edgeIndex < edgeData.accrued.length) && (edgeData.accrued[edgeIndex] < pathOffset)) {
                        edgeIndex++;
                    } // while
                
                    // if the edge index is valid, then let's determine the xy coordinate
                    if (edgeIndex < params.path.length-1) {
                        var extra = pathOffset - (edgeIndex > 0 ? edgeData.accrued[edgeIndex - 1] : 0);
                    
                        // if the draw indicator method is specified, then draw
                        if (params.drawIndicator) {
                            params.drawIndicator(drawArgs, SLICK.VectorMath.pointOnEdge(params.path[edgeIndex], params.path[edgeIndex + 1], edgeData.edges[edgeIndex], extra));
                        } // if
                    } // if
                }
            }));
            
            return self;
        },
        
        View: function(params) {
            // initialise defaults
            params = GRUNT.extend({
                id: "view_" + viewCounter++,
                container: "",
                defineLayers: null,
                pannable: false,
                scalable: false,
                scaleDamping: false,
                bufferRefresh: 100,
                // TODO: padding breaks pinch zoom functionality... need to fix...
                padding: 0,
                fps: 40,
                onPan: null,
                onPinchZoom: null,
                onScale: null,
                onDraw: null,
                autoSize: false,
                pinchZoomDebug: true
            }, params);
            
            // get the container context
            var canvas = document.getElementById(params.container),
                main_context = null,
                cachedCanvas = null,
                cachedContext = null,
                cachedOffset = new SLICK.Vector(),
                cachedZIndex = 0,
                cachedArgs = null,
                layerChangesSinceCache = 0,
                lastInvalidate = 0,
                dimensions = null,
                drawArgs = null,
                forceRedraw = false,
                idle = false,
                status = module.DisplayState.ACTIVE;
            
            // calculate the repaint interval
            var repaintInterval = params.fps ? (1000 / params.fps) : 40;
            var bufferTime = 0;

            GRUNT.Log.info("Creating a new view instance, attached to container: " + params.container + ", canvas = ", canvas);

            if (canvas) {
                // if we are autosizing the set the size
                if (params.autoSize) {
                    GRUNT.Log.info("autosizing view: window.height = " + window.innerHeight + ", width = " + window.innerWidth);
                    canvas.height = window.innerHeight - canvas.offsetTop - 49;
                    canvas.width = window.innerWidth - canvas.offsetLeft;
                } // if
                
                
                try {
                    main_context = canvas.getContext('2d');
                } 
                catch (e) {
                    GRUNT.Log.exception(e);
                    throw new Error("Could not initialise canvas on specified view element");
                }
            } // if
            
            // create the cached context
            cachedCanvas = document.createElement('canvas');
            cachedCanvas.width = canvas.width + params.padding * 2;
            cachedCanvas.height = canvas.height + params.padding * 2;
            cachedContext = cachedCanvas.getContext("2d"); 
            
            // initialise the layers
            var layers = [];
            if (params.defineLayers) {
                layers = params.defineLayers();
            } // if
            
            var pannable = null;
            if (params.pannable) {
                pannable = new SLICK.Pannable({
                    container: params.container,
                    onPan: function(x, y) {
                        self.invalidate();
                        
                        if (params.onPan) {
                            params.onPan(x, y);
                        } // if
                    },
                    
                    onPanEnd: function(x, y) {
                    }
                });
            } // if
            
            var scalable = null;
            var scaleFactor = 1;
            if (params.scalable) {
                scalable = new SLICK.Scalable({
                    scaleDamping: params.scaleDamping,
                    container: params.container,
                    onPinchZoom: function(touchesStart, touchesCurrent) {
                        self.invalidate();
                        
                        if (params.onPinchZoom) {
                            params.onPinchZoom(touchesStart, touchesCurrent);
                        } // if
                        
                        // flag that we are scaling
                        status = module.DisplayState.PINCHZOOM;
                    },
                    
                    onScale: function(scaleFactor) {
                        // notify layers that we are adjusting scale
                        notifyLayers("scale");
                        
                        if (params.onScale) {
                            params.onScale(scaleFactor);
                        }
                        
                        // reset the scaling flag
                        status = module.DisplayState.ACTIVE;
                    }
                });
            } // if
            
            function addLayer(id, value) {
                // look for the appropriate position to add the layer
                var addIndex = 0;
                while (addIndex < layers.length) {
                    // if the zindex of the current layer is greater than the new layer, then break from the loop
                    if (layers[addIndex].getZIndex() >= value.getZIndex()) {
                        break;
                    } // if
                    
                    addIndex++;
                } // while
                
                // make sure the layer has the correct id
                value.setId(id);
                
                // attach the change listener
                value.registerChangeListener(function() {
                    layerChangesSinceCache++;
                });

                // if we need to insert the new layer in before the last layer, then splice it in
                if (addIndex < layers.length) {
                    layers.splice(addIndex, 0, value);
                }
                // otherwise, just push it on the end
                else {
                    layers.push(value);
                } // if..else
                
                // fire a notify event for adding the layer
                self.notifyLayerListeners("add", id, value);
            } // addLayer
            
            function getLayerIndex(id) {
                for (var ii = 0; ii < layers.length; ii++) {
                    if (layers[ii].getId() == id) {
                        return ii;
                    } // if
                } // for
                
                return -1;
            } // getLayerIndex
            
            /* layer listeners code */
            
            var layerListeners = [];
            function notifyLayers(eventType) {
                for (var ii = 0; ii < layers.length; ii++) {
                    layers[ii].notify(eventType);
                } // for
            } // notifyLayers
            
            /* saved canvas / context code */
            
            function cacheContext() {
                // get the context
                cachedZIndex = 1000;
                
                // if we have valid draw args from the last successful draw, then draw the buffers that can't scale
                if (drawArgs) {
                    var shouldRedraw = 
                            (layerChangesSinceCache > 0) || (! cachedArgs) || 
                            (! cachedArgs.offset.matches(drawArgs.offset)) || 
                            (! cachedArgs.dimensions.matches(drawArgs.dimensions));
                            
                    if (shouldRedraw) {
                        // GRUNT.Log.info("UPDATING CACHE");
                        // GRUNT.Log.info("cached args vs draw args", cachedArgs, drawArgs);
                        
                        // clear the cached context
                        cachedContext.clearRect(0, 0, cachedCanvas.width, cachedCanvas.height);
                        
                        // update the cached args
                        cachedArgs = GRUNT.extend({}, drawArgs);

                        // update the draw args to use the saved context rather than the main context
                        drawArgs.context = cachedContext;

                        // update the offset to take into account the buffer
                        drawArgs.offset = drawArgs.offset.offset(-params.padding, -params.padding);

                        // grow the dimensions
                        drawArgs.dimensions = drawArgs.dimensions.grow(params.padding * 2, params.padding * 2);

                        // iterate through the layers, and for any layers that cannot draw on scale, draw them to 
                        // the saved context
                        for (var ii = 0; ii < layers.length; ii++) {
                            if (layers[ii].canCache() && (! layers[ii].isAnimating())) {
                                layers[ii].draw(drawArgs);

                                // calculate the zindex as the zindex of the lowest saved layer
                                cachedZIndex = Math.min(cachedZIndex, layers[ii].getZIndex());
                            } // if
                        } // for

                        // reset the layer changes since cache count
                        layerChangesSinceCache = 0;

                        // update the saved offset
                        cachedOffset = drawArgs.offset.duplicate();                        
                    }
                } // if
            } // getSavedContext
            
            /* draw code */
            
            var drawing = false;
            
            function drawView(tickCount, interacting) {
                if (drawing) { return; }
                
                // if the dimensions have not been defined, then get them
                if (! dimensions) {
                    dimensions = self.getDimensions();
                } // if
                
                var currentOffset = pannable ? pannable.getOffset() : new SLICK.Vector();
                var offsetChanged = (! drawArgs) || (! drawArgs.offset.matches(currentOffset));
                var dimensionsChanged = (! drawArgs) || (! drawArgs.dimensions.matches(dimensions));
                
                // initialise the draw params
                drawArgs = {
                    context: null, 
                    displayState: status,
                    offset: currentOffset,
                    offsetChanged: offsetChanged,
                    animating: interacting || pannable.isAnimating(),
                    dimensions: dimensions,
                    dimensionsChanged: dimensionsChanged,
                    scaleFactor: self.getScaleFactor(),
                    scaling: scalable,
                    ticks: tickCount
                };
                
                try {
                    drawing = true;
                    var savedDrawn = false;
                    
                    // clear the canvas
                    // TODO: handle scaling clearing the background correctly...
                    if (drawArgs.scaleFactor != 1) {
                        main_context.clearRect(0, 0, canvas.width, canvas.height);
                    } // if
                    
                    // iterate through the layers and draw them
                    for (var ii = 0; ii < layers.length; ii++) {
                        // tell the layer we are going through a draw cycle
                        // it may not get drawn, but it can give it a chance to check if it needs to 
                        // load something, animate something, etc
                        layers[ii].beginDraw(drawArgs);
                        
                        // add the context to the draw args
                        drawArgs.context = main_context;
                        
                        // draw the layer output to the main canvas
                        // but only if we don't have a scale buffer or the layer is a draw on scale layer
                        if (((! interacting) || (! layers[ii].canCache())) && layers[ii].canDraw(status)) {
                            layers[ii].draw(drawArgs);
                        } // if
                        
                        // draw the saved context if required and at the appropriate zindex
                        if (interacting && (! savedDrawn) && (cachedZIndex >= layers[ii].getZIndex())) {
                            var relativeOffset = cachedOffset.diff(drawArgs.offset);
                            
                            if (drawArgs.scaleFactor !== 1) {
                                // get the end rect
                                var startRect = scalable.getStartRect();
                                var endRect = scalable.getEndRect();
                                
                                // draw the scaled rect
                                module.drawScaledRect(
                                    main_context,
                                    dimensions.grow(params.padding * 2, params.padding * 2),
                                    cachedCanvas,
                                    startRect,
                                    endRect);
                                
                                if (params.pinchZoomDebug) {
                                    main_context.strokeStyle = "#0000FF";
                                    main_context.lineWidth = 4;
                                    module.drawRect(main_context, startRect);

                                    main_context.strokeStyle = "#FF0000";
                                    module.drawRect(main_context, endRect);
                                }
                            } 
                            else {
                                main_context.drawImage(cachedCanvas, relativeOffset.x, relativeOffset.y);
                            } // if..else

                            savedDrawn = true;
                        } // if
                    } // for
                
                    // if we have an on draw parameter specified, then draw away
                    if (params.onDraw) {
                        params.onDraw(drawArgs);
                    } // if
                } 
                finally {
                    drawing = false;
                } // try..finally
            } // drawView
            
            // initialise self
            var self = GRUNT.extend({}, pannable, scalable, {
                id: params.id,
                
                getContext: function() {
                    return buffer_context;
                },
                
                getDimensions: function() {
                    if (canvas) {
                        return new SLICK.Dimensions(canvas.width, canvas.height);
                    } // if
                },
                
                /* layer getter and setters */
                
                getLayer: function(id) {
                    // look for the matching layer, and return when found
                    for (var ii = 0; ii < layers.length; ii++) {
                        if (layers[ii].getId() == id) {
                            return layers[ii];
                        } // if
                    } // for
                    
                    return null;
                },
                
                setLayer: function(id, value) {
                    // look for the matching layer, it not found, then add it
                    for (var ii = 0; ii < layers.length; ii++) {
                        if (layers[ii].getId() == id) {
                            layers[ii] = value;
                            return;
                        } // if
                    } // for
                    
                    if (value) {
                        addLayer(id, value);
                    } // if
                    
                    // iterate through the layer update listeners and fire the callbacks
                    self.notifyLayerListeners("update", id, value);
                },
                
                eachLayer: function(callback) {
                    // iterate through each of the layers and fire the callback for each 
                    for (var ii = 0; ii < layers.length; ii++) {
                        callback(layers[ii]);
                    } // for
                },
                
                setDisplayStatus: function(value) {
                    status = value;
                },
                
                removeLayer: function(id, timeout) {
                    // if timeout not set, then set to fire instantly
                    setTimeout(function() {
                        var layerIndex = getLayerIndex(id);
                        if ((layerIndex >= 0) && (layerIndex < layers.length)) {
                            self.notifyLayerListeners("remove", id, layers[layerIndex]);

                            layers.splice(layerIndex, 1);
                        } // if
                    }, timeout ? timeout : 1);
                },
                
                registerLayerListener: function(callback) {
                    layerListeners.push(callback);
                },
                
                notifyLayerListeners: function(eventType, id, layer) {
                    for (var ii = 0; ii < layerListeners.length; ii++) {
                        layerListeners[ii](eventType, id, layer);
                    } // for
                },
                
                invalidate: function(args) {
                    lastInvalidate = SLICK.Clock.getTime(true);
                }
            });
            
            // get the dimensions
            dimensions = self.getDimensions();
            
            GRUNT.Log.info("setting repaint interval to " + repaintInterval + " ms");

            // create an interval to do a proper redraw on the layers
            setInterval(function() {
                try {
                    // check to see if we are panning
                    var tickCount = SLICK.Clock.getTime(),
                        userInteracting = (status == module.DisplayState.PINCHZOOM) || (tickCount - lastInvalidate < params.bufferRefresh),
                        drawOK = true;
                        
                    // if the user is interating, cancel any active animation
                    if (userInteracting) {
                        SLICK.Animation.cancel(function(tweenInstance) {
                            return tweenInstance.cancelOnInteract;
                        });
                    } // if
                    
                    // update any active tweens
                    SLICK.Animation.update(tickCount);

                    // check that all is right with each layer
                    for (var ii = 0; ii < layers.length; ii++) {
                        if (drawOK) {
                            layers[ii].checkOK(drawArgs);
                        } // if
                    } // for
                    
                    // update the idle status
                    idle = idle && (! userInteracting) && (! SLICK.Animation.isTweening());
                    
                    // if drawing is not ok at the moment, flick to interacing mode
                    if (drawOK) {
                        drawView(tickCount, userInteracting);

                        // if the user is not interacting, then save the current context
                        if ((! userInteracting) && (! SLICK.Animation.isTweening())) {
                            cacheContext();
                            
                            // if the idle flag is not set, then fire the view idle event
                            if (! idle) {
                                idle = true;
                                GRUNT.WaterCooler.say("view-idle", { id: self.id });
                            }
                        } // if
                        
                        forceRedraw = false;
                    } // if
                }
                catch (e) {
                    GRUNT.Log.exception(e);
                }
            }, repaintInterval);
            
            // listen for layer removals
            GRUNT.WaterCooler.listen("layer.remove", function(args) {
                if (args.id) {
                    self.removeLayer(args.id);
                } // if
            });
            
            // add a status view layer for experimentation sake
            // self.setLayer("status", new module.StatusViewLayer());
            
            return self;
        },
        
        // FIXME: Good idea, but doesn't work - security exceptions in chrome...
        // some good information here:
        // http://stackoverflow.com/questions/2888812/save-html-5-canvas-to-a-file-in-chrome
        // looks like implementing this isn't going to fly without some support from a device-side
        ImageCache: (function() {
            // initialise variables
            var storageCanvas = null;
            
            function getStorageContext(image) {
                if (! storageCanvas) {
                    storageCanvas = document.createElement('canvas');
                }  // if

                // update the canvas to the correct width
                storageCanvas.width = image.width;
                storageCanvas.height = image.height;
                
                return storageCanvas.getContext('2d');
            }
            
            function imageToCanvas(image) {
                // get the storage context
                var context = getStorageContext(image);
                
                // draw the image to the context
                context.drawImage(image, 0, 0);
                
                // return the canvas
                return storageCanvas;
            }
            
            // initialise self
            var self = {
                // TODO: use this method to return an image from the key value local storage 
                getImage: function(url, sessionParamRegex) {
                    // ask the resources module to get the cacheable key for the url
                    var cacheKey = SLICK.Resources.Cache.getUrlCacheKey(url, sessionParamRegex);
                    
                    return null;
                },
                
                cacheImage: function(url, sessionParamRegex, image) {
                    // get the cache key
                    var cacheKey = SLICK.Resources.Cache.getUrlCacheKey(url, sessionParamRegex);
                    
                    // if we have local storage then save it
                    if (image) {
                        SLICK.Resources.Cache.write(cacheKey, imageToCanvas(image).toDataURL('image/png'));
                    } // if
                }
            };
            
            return self;
        })(),

        Sprite: function(params) {
            // initailise variables
            var listeners = [];
            
            // initialise self
            var self = {
                loaded: false,
                
                changed: function(tile) {
                    for (var ii = 0; ii < listeners.length; ii++) {
                        listeners[ii](tile);
                    } // for
                },
                
                draw: function(context, x, y) {
                    
                },
                
                load: function() {
                },
                
                requestUpdates: function(callback) {
                    listeners.push(callback);
                }
            };
            
            return self;
        }
    }; 
    
    return module;
})();


