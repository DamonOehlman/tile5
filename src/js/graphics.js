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
        
        DisplayStatus: {
            ACTIVE: 0,
            FROZEN: 1
        },
        
        ViewLayer: function(params) {
            params = GRUNT.extend({
                id: "",
                drawBuffer: null,
                draw: null,
                centerOnScale: true,
                zindex: 0,
                bufferPadding: 0,
                drawOnScale: false
            }, params);

            var buffer = null,
                bufferContext = null,
                bufferOffset = new SLICK.Vector(),
                paddingOffset = new SLICK.Vector();
            
            // if this is a buffered layer, then initialise the buffer
            if (params.drawBuffer) {
                // if width and height are not defined, then raise an exception
                if ((! params.width) || (! params.height)) {
                    throw new Error("Width and height required to define a buffered view layer");
                } // if
                
                // calculate the padding offset
                if (params.bufferPadding) {
                    paddingOffset.x = -params.bufferPadding;
                    paddingOffset.y = -params.bufferPadding * (params.height / params.width);
                }
            
                // define a buffer for the layer
                buffer = document.createElement("canvas");
                buffer.width = params.width + Math.abs(paddingOffset.x) * 2;
                buffer.height = params.height + Math.abs(paddingOffset.y) * 2;
                
                // define the context
                bufferContext = buffer.getContext("2d");
            } // if
            
            
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
                
                drawBuffer: function(offset, dimensions, invalidating) {
                    if (params.drawBuffer && (status !== module.DisplayStatus.FROZEN)) {
                        bufferOffset = offset.offset(paddingOffset.x, paddingOffset.y);
                        
                        // draw the buffer
                        // we duplicate the offset and dimensions to prevent them being changes by
                        // a mischevious implementation of a ViewLayer
                        params.drawBuffer(
                            bufferContext, 
                            bufferOffset.duplicate(),
                            dimensions.grow(Math.abs(paddingOffset.x) * 2, Math.abs(paddingOffset.y) * 2), 
                            invalidating);
                    } // if
                },
                
                draw: function(args) {
                    var drawArgs = args;
                    
                    // if we are buffered, then draw the buffer to the canvas (and only when the scale factor is one)
                    if (buffer && drawArgs && (drawArgs.scaleFactor == 1)) {
                        // calculate the relative offset
                        var relativeOffset = bufferOffset.diff(drawArgs.offset);

                        // draw the image to the canvas
                        drawArgs.context.drawImage(buffer, relativeOffset.x, relativeOffset.y, buffer.width, buffer.height);
                    } // if
                    
                    if (params.draw) {
                        params.draw(drawArgs);
                    } // if
                },
                
                notify: function(eventType) {
                    
                },
                
                setBufferOffset: function(x, y) {
                    bufferOffset.x = x; bufferOffset.y = y;
                },
                
                canDrawOnScale: function() {
                    return params.drawOnScale;
                },
                
                isBuffered: function() {
                    return (params.drawBuffer !== null);
                }
            }; // self
            
            return self;
        },
        
        View: function(params) {
            // initialise defaults
            params = GRUNT.extend({
                container: "",
                defineLayers: null,
                pannable: false,
                scalable: false,
                scaleDamping: false,
                bufferRefresh: 100,
                fps: 25,
                onPan: null,
                onPinchZoom: null,
                onScale: null,
                onDraw: null
            }, params);
            
            // get the container context
            var canvas = document.getElementById(params.container),
                main_context = null,
                scalingCanvas = null,
                scalingContext = null,
                lastInvalidate = 0,
                dimensions = null,
                status = module.DisplayStatus.ACTIVE;
            
            // calculate the repaint interval
            var repaintInterval = params.fps ? (1000 / params.fps) : 40;
            var bufferTime = 0;

            GRUNT.Log.info("Creating a new view instance, attached to container: " + params.container + ", canvas = ", canvas);

            if (canvas) {
                try {
                    main_context = canvas.getContext('2d');
                    
                    // create a scaling context if required
                    if (params.scalable) {
                        scalingCanvas = document.createElement('canvas');
                        scalingCanvas.width = canvas.width;
                        scalingCanvas.height = canvas.height;
                    } // if
                } 
                catch (e) {
                    GRUNT.Log.exception(e);
                    throw new Error("Could not initialise canvas on specified view element");
                }
            } // if
            
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
                        
                        // create the scale buffer
                        if (! scalingContext) {
                            scalingContext = scalingCanvas.getContext('2d');
                            scalingContext.drawImage(canvas, 0, 0);
                        } // if
                    },
                    
                    onScale: function(scaleFactor) {
                        // notify layers that we are adjusting scale
                        notifyLayers("scale");
                        
                        if (params.onScale) {
                            params.onScale(scaleFactor);
                        }
                        
                        // reset the scale buffer
                        scalingContext = null;
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

                // if we need to insert the new layer in before the last layer, then splice it in
                GRUNT.Log.info("adding layer '" + id + "' at index " + addIndex);
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
            
            /* draw code */
            
            var drawing = false;
            
            function drawView(tickCount) {
                if (drawing || (status == module.DisplayStatus.FROZEN)) { return; }
                
                // if the dimensions have not been defined, then get them
                if (! dimensions) {
                    dimensions = self.getDimensions();
                } // if
                
                // initialise the draw params
                var drawArgs = {
                    context: main_context,
                    offset: pannable ? pannable.getOffset() : new SLICK.Vector(),
                    dimensions: dimensions,
                    scaleFactor: self.getScaleFactor(),
                    scaling: scalable,
                    ticks: tickCount
                };
                
                try {
                    drawing = true;
                    
                    // clear the canvas
                    main_context.clearRect(0, 0, canvas.width, canvas.height);
                    
                    // iterate through the layers and draw them
                    for (var ii = 0; ii < layers.length; ii++) {
                        // draw the layer output to the main canvas
                        // but only if we don't have a scale buffer or the layer is a draw on scale layer
                        if ((! scalingContext) || (layers[ii].canDrawOnScale())) {
                            layers[ii].draw(drawArgs);
                        } // if
                    } // for

                    // if we have a scale buffer, then draw it
                    if (scalingContext) {
                        module.drawScaledRect(main_context, dimensions, scalingCanvas, scalable.getStartRect(), scalable.getEndRect());
                    } // if
                
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
                        GRUNT.Log.info("attempting to remove layer: " + id);
                        var layerIndex = getLayerIndex(id);
                        if ((layerIndex >= 0) && (layerIndex < layers.length)) {
                            self.notifyLayerListeners("remove", id, layers[layerIndex]);
                            
                            GRUNT.Log.info("removing layer: " + id);
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
                    lastInvalidate = new Date().getTime();
                }
            });
            
            // get the dimensions
            dimensions = self.getDimensions();

            // create an interval to do a proper redraw on the layers
            setInterval(function() {
                // check to see if we are panning
                var tickCount = new Date().getTime();
                var viewInvalidating = tickCount - lastInvalidate < params.bufferRefresh;
                
                bufferTime += repaintInterval;
                if ((! viewInvalidating) && (bufferTime > params.bufferRefresh)) {
                    // iterate through the layers and draw them
                    for (var ii = 0; ii < layers.length; ii++) {
                        layers[ii].drawBuffer(pannable ? pannable.getOffset() : new SLICK.Vector(), dimensions, viewInvalidating);
                    } // for
                    
                    bufferTime = 0;
                } // if
                
                drawView(tickCount);
            }, repaintInterval);
            
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


