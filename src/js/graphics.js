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
        
        ViewLayer: function(params) {
            params = GRUNT.extend({
                id: "",
                drawBuffer: null,
                draw: null,
                centerOnScale: true
            }, params);

            var buffer = null;
            var bufferContext = null;
            var bufferOffset = new SLICK.Vector();
            var frozen = false;
            var lastOffset;
            var lastScaleFactor;
            var lastStartRect;
            var lastEndRect;
            
            // if this is a buffered layer, then initialise the buffer
            if (params.drawBuffer) {
                // if width and height are not defined, then raise an exception
                if ((! params.width) || (! params.height)) {
                    throw new Error("Width and height required to define a buffered view layer");
                } // if
            
                // define a buffer for the layer
                buffer = document.createElement("canvas");
                buffer.width = params.width;
                buffer.height = params.height;
                
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
                
                drawBuffer: function(offset, dimensions) {
                    if (params.drawBuffer) {
                        bufferOffset = offset;
                        params.drawBuffer(bufferContext, offset, dimensions);
                    } // if
                },
                
                draw: function(context, offset, dimensions, scaleFactor, scaling) {
                    // if we are frozen then update the offset and scale factors
                    if (frozen) {
                        offset = lastOffset;
                        scaleFactor = lastScaleFactor;
                    } // if
                    
                    // if we are buffered, then draw the buffer to the canvas
                    if (buffer) {
                        var startRect = frozen ? lastStartRect : scaling.getStartRect();
                        var endRect = frozen ? lastEndRect : scaling.getEndRect();
                        
                        if (scaleFactor != 1) {
                            module.drawScaledRect(context, dimensions, buffer, startRect, endRect);
                        }
                        else {
                            // calculate the relative offset
                            var relativeOffset = bufferOffset.diff(offset);

                            // draw the image to the canvas
                            context.drawImage(buffer, relativeOffset.x, relativeOffset.y, dimensions.width, dimensions.height);
                        } // if..else
                        
                        // update the last start and end rect
                        lastStartRect = startRect;
                        lastEndRect = endRect;
                    } // if
                    
                    if (params.draw) {
                        params.draw(context, offset, dimensions, scaleFactor);
                    } // if

                    // update the last offset and scale factor
                    lastOffset = offset;
                    lastScaleFactor = scaleFactor;
                },
                
                getFrozen: function() {
                    return frozen;
                },
                
                setFrozen: function(value) {
                    frozen = value;
                },
                
                setBufferOffset: function(x, y) {
                    bufferOffset.x = x; bufferOffset.y = y;
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
                redrawDelay: 100,
                onPan: null,
                onPinchZoom: null,
                onScale: null
            }, params);
            
            // get the container context
            var canvas = document.getElementById(params.container);
            var main_context = null;
            var lastPan = 0;
            var dimensions;

            GRUNT.Log.info("Creating a new view instance, attached to container: " + params.container + ", canvas = ", canvas);

            if (canvas) {
                try {
                    main_context = canvas.getContext('2d');
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
                        lastPan = new Date().getTime();
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
                    },
                    
                    onScale: function(scaleFactor) {
                        if (params.onScale) {
                            params.onScale(scaleFactor);
                        }
                    }
                });
            } // if
            
            function getLayerIndex(id) {
                for (var ii = 0; ii < layers.length; ii++) {
                    if (layers[ii].getId() == id) {
                        return ii;
                    } // if
                } // for
                
                return -1;
            } // getLayerIndex

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
                        // make sure the layer has the correct id
                        value.setId(id);

                        // didn't find the layer, add it
                        layers.push(value);
                    } // if
                },
                
                /**
                Freeze the specified layer in a specified position.  This means that the layer will 
                not move from it's current position when the other layers pan.
                */
                freezeLayer: function(id) {
                    var layerIndex = getLayerIndex(id);
                    if ((layerIndex >= 0) && (layerIndex < layers.length)) {
                        layers[layerIndex].setFrozen(true);
                    } // if
                },
                
                removeLayer: function(id, timeout) {
                    // if timeout not set, then set to fire instantly
                    setTimeout(function() {
                        GRUNT.Log.info("attempting to remove layer: " + id);
                        var layerIndex = getLayerIndex(id);
                        if ((layerIndex >= 0) && (layerIndex < layers.length)) {
                            GRUNT.Log.info("removing layer: " + id);
                            layers.splice(layerIndex, 1);
                        } // if
                    }, timeout ? timeout : 1);
                },

                invalidate: function(args) {
                    // iterate through the layers and draw them
                    for (var ii = 0; ii < layers.length; ii++) {
                        // draw the layer output to the main canvas
                        layers[ii].draw(main_context, pannable ? pannable.getOffset() : new SLICK.Vector(), dimensions, self.getScaleFactor(), scalable);
                    } // for
                }
            });
            
            // get the dimensions
            dimensions = self.getDimensions();

            // create an interval to do a proper redraw on the layers
            setInterval(function() {
                // if we are actively panning, don't do anything - it makes the display look choppy...
                if ((new Date().getTime()) - lastPan < params.redrawDelay) { return; }
                
                // iterate through the layers and draw them
                for (var ii = 0; ii < layers.length; ii++) {
                    layers[ii].drawBuffer(pannable ? pannable.getOffset() : new SLICK.Vector(), dimensions);
                } // for
                
                self.invalidate();
            }, params.redrawDelay);
            
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


