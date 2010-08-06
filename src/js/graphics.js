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
    // initialise display state constants that will be exposed through the module
    var DISPLAY_STATE = {
        NONE: 0,
        ACTIVE: 1,
        ANIMATING: 2,
        PAN: 4,
        PINCHZOOM: 8,
        GENCACHE: 32,
        SNAPSHOT: 64
    };
    
    // initialise variables
    var viewCounter = 0;
    
    var module = {
        // define module requirements
        requires: ["Resources"],
        
        drawRect: function(context, rect) {
            context.strokeRect(rect.origin.x, rect.origin.y, rect.dimensions.width, rect.dimensions.height);
        },
        
        DisplayState: DISPLAY_STATE,
        
        // some precanned display states
        AnyDisplayState: 255,
        ActiveDisplayStates: DISPLAY_STATE.ACTIVE | DISPLAY_STATE.ANIMATING,
        
        ViewLayer: function(params) {
            params = GRUNT.extend({
                id: "",
                centerOnScale: true,
                created: new Date().getTime(),
                scalePosition: true,
                zindex: 0,
                validStates: module.ActiveDisplayStates | DISPLAY_STATE.PAN | DISPLAY_STATE.PINCHZOOM | DISPLAY_STATE.SNAPSHOT
            }, params);
            
            var changeListeners = [],
                parent = null;

            var self = GRUNT.extend({
                isAnimating: function() {
                    return false;
                },
                
                addToView: function(view) {
                    view.setLayer(params.id, self);
                },
                
                shouldDraw: function(displayState) {
                    return (displayState & params.validStates) !== 0;
                },
                
                cycle: function(tickCount, offset) {
                    return 0;
                },
                
                draw: function(context, offset, dimensions, view) {
                },
                
                layerChanged: function() {
                    for (var ii = changeListeners.length; ii--; ) {
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
                
                wakeParent: function() {
                    // if we have a parent, then wake them, if we have no parent, well just panic and wake everybody up
                    GRUNT.WaterCooler.say("view.wake", { id: parent ? parent.id : null });
                },
                
                getParent: function() {
                    return parent;
                },
                
                setParent: function(view) {
                    parent = view;
                }
            }, params); // self
            
            return self;
        },
        
        StatusViewLayer: function(params) {
            return new module.ViewLayer({
                validStates: module.AnyDisplayState,
                zindex: 5000,
                draw: function(context, offset, dimensions, view) {
                    context.fillStyle = "#FF0000";
                    context.fillRect(10, 10, 50, 50);
                    
                    context.fillStyle = "#FFFFFF";
                    context.font = "bold 10px sans";
                    context.fillText(view.getDisplayState(), 20, 20);
                }
            });
        },
        
        AnimatedPathLayer: function(params) {
            params = GRUNT.extend({
                path: [],
                id: GRUNT.generateObjectID("pathAnimation"),
                easing: SLICK.Animation.Easing.Sine.InOut,
                canCache: false,
                validStates: module.ActiveDisplayStates | DISPLAY_STATE.PAN | DISPLAY_STATE.PINCHZOOM,
                drawIndicator: null,
                duration: 2000,
                autoCenter: false
            }, params);
            
            // generate the edge data for the specified path
            var edgeData = SLICK.VectorMath.edges(params.path), 
                tween,
                theta,
                indicatorXY = null,
                pathOffset = 0;
            
            function drawDefaultIndicator(context, offset, indicatorXY) {
                // draw an arc at the specified position
                context.fillStyle = "#FFFFFF";
                context.strokeStyle = "#222222";
                context.beginPath();
                context.arc(
                    indicatorXY.x, 
                    indicatorXY.y,
                    4,
                    0,
                    Math.PI * 2,
                    false);             
                context.stroke();
                context.fill();
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
            var self =  GRUNT.extend(new module.ViewLayer(params), {
                cycle: function(tickCount, offset) {
                    var edgeIndex = 0;

                    // iterate through the edge data and determine the current journey coordinate index
                    while ((edgeIndex < edgeData.accrued.length) && (edgeData.accrued[edgeIndex] < pathOffset)) {
                        edgeIndex++;
                    } // while

                    // reset offset xy
                    indicatorXY = null;

                    // if the edge index is valid, then let's determine the xy coordinate
                    if (edgeIndex < params.path.length-1) {
                        var extra = pathOffset - (edgeIndex > 0 ? edgeData.accrued[edgeIndex - 1] : 0),
                            v1 = params.path[edgeIndex],
                            v2 = params.path[edgeIndex + 1];

                        theta = SLICK.VectorMath.theta(v1, v2, edgeData.edges[edgeIndex]);
                        indicatorXY = SLICK.VectorMath.pointOnEdge(v1, v2, theta, extra);

                        if (params.autoCenter) {
                            var parent = self.getParent();
                            if (parent) {
                                parent.centerOn(indicatorXY);
                            } // if
                        } // if
                    } // if

                    return indicatorXY ? 1 : 0;
                },
                
                draw: function(context, offset, dimensions, view) {
                    if (indicatorXY) {
                        // if the draw indicator method is specified, then draw
                        (params.drawIndicator ? params.drawIndicator : drawDefaultIndicator)(
                            context,
                            offset,
                            new SLICK.Vector(indicatorXY.x - offset.x, indicatorXY.y - offset.y),
                            theta
                        );
                    } // if
                }
            });

            return self;
        },
        
        FPSLayer: function(params) {
            params = GRUNT.extend({
                zindex: 1000,
                scalePosition: false
            }, params);
            
            // initialise self
            var self = GRUNT.extend(new module.ViewLayer(params), {
                fps: null,
                
                draw: function(context, offset, dimensions, view) {
                    context.save();
                    try {
                        context.font = "bold 8pt Arial";
                        context.textAlign = "right";
                        context.fillStyle = "rgba(0, 0, 0, 0.8)";
                        context.fillText((self.fps ? self.fps : "?") + " fps", dimensions.width - 20, 20);
                    }
                    finally {
                        context.restore();
                    } // try..finally
                }
            });
            
            return self;
        },
        
        ResourceStatsLayer: function(params) {
            params = GRUNT.extend({
                zindex: 500,
                indicatorSize: 5,
                scalePosition: false,
                validStates: DISPLAY_STATE.ACTIVE | DISPLAY_STATE.PAN
            }, params);
            
            // initialise self
            var self = GRUNT.extend(new module.ViewLayer(params), {
                fps: null,
                
                draw: function(context, offset, dimensions, view) {
                    // get the stats from the resource loaded
                    var stats = SLICK.Resources.getStats(),
                        ledSize = params.indicatorSize,
                        spacing = 2,
                        ii,
                        ypos;
                    
                    // draw indicators for the number of images loading
                    context.fillStyle = "rgba(0, 255, 0, 0.7)";
                    for (ii = stats.imageLoadingCount; ii--; ) {
                        context.fillRect(10, 10 + (ii * (ledSize+spacing)), ledSize, ledSize);
                    } // for
                    
                    // draw indicators for the number of images queued
                    context.fillStyle = "rgba(255, 0, 0, 0.7)";
                    for (ii = stats.queuedImageCount; ii--; ) {
                        context.fillRect(10 + ledSize + spacing, 10 + (ii * (ledSize+spacing)), ledSize, ledSize);
                    } // for
                }
            });
            
            return self;
        },
        
        LoadingLayer: function(params) {
            params = GRUNT.extend({
                
            }, params);
            
            
        },
        
        View: function(params) {
            // initialise defaults
            params = GRUNT.extend({
                id: "view_" + viewCounter++,
                container: "",
                pannable: false,
                scalable: false,
                clearOnDraw: false,
                // TODO: move these into a different option location
                displayFPS: true,
                displayResourceStats: true,
                scaleDamping: false,
                fillStyle: "rgb(200, 200, 200)",
                bufferRefresh: 100,
                snapshotFreezeTime: 0,
                // TODO: calculate the padding based on screen size
                padding: 100,
                fps: 25,
                cacheFPS: 5,
                onPan: null,
                onPinchZoom: null,
                onScale: null,
                onDraw: null,
                autoSize: false
            }, params);
            
            // get the container context
            var layers = [],
                canvas = document.getElementById(params.container),
                mainContext = null,
                cachedCanvas = null,
                cachedContext = null,
                clearCacheBackground = false,
                offset = new SLICK.Vector(),
                cachedOffset = new SLICK.Vector(),
                cachedZIndex = 0,
                layerChangesSinceCache = 0,
                lastScaleFactor = 1,
                lastTickCount = null,
                lastInteraction = 0,
                deviceScaling = 1,
                translateDelta = new SLICK.Vector(),
                dimensions = null,
                paddedDimensions = null,
                centerPos = null,
                wakeTriggers = 0,
                layerListeners = [],
                fpsLayer = null,
                endCenter = null,
                pannable = null,
                scalable = null,
                idle = false,
                paintTimeout = 0,
                bufferTime = 0,
                zoomCenter = null,
                tickCount = 0,
                lastCacheTickCount = 0,
                cacheDelay = 1000 / (params.cacheFPS ? params.cacheFPS : 1),
                status = module.DisplayState.ACTIVE;
            
            GRUNT.Log.info("Creating a new view instance, attached to container: " + params.container + ", canvas = ", canvas);

            if (canvas) {
                // if we are autosizing the set the size
                if (params.autoSize) {
                    GRUNT.Log.info("autosizing view: window.height = " + window.innerHeight + ", width = " + window.innerWidth);
                    canvas.height = window.innerHeight - canvas.offsetTop - 49;
                    canvas.width = window.innerWidth - canvas.offsetLeft;
                } // if
                
                try {
                    mainContext = canvas.getContext('2d');
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
            cachedContext.globalCompositeOperation = "copy";

            if (params.pannable) {
                pannable = new SLICK.Pannable({
                    container: params.container,
                    onAnimate: function(x, y) {
                        wake();
                    },
                    onPan: function(x, y) {
                        clearCacheBackground = true;
                        lastInteraction = SLICK.Clock.getTime(true);
                        wake();
                        
                        // add the current pan on the vector
                        translateDelta.add(new SLICK.Vector(x, y));
                        
                        if (params.onPan) {
                            params.onPan(x, y);
                        } // if
                        
                        status = DISPLAY_STATE.PAN;
                    },
                    
                    onPanEnd: function(x, y) {
                        layerChangesSinceCache++;
                        wake();
                        
                        var tmpOffset = self.getOffset();
                        tmpOffset.x = tmpOffset.x % 256;
                        tmpOffset.y = tmpOffset.y % 256;
                        GRUNT.Log.info("current guide offset = " + tmpOffset);
                        
                        status = DISPLAY_STATE.ACTIVE;
                    }
                });
            } // if
            
            if (params.scalable) {
                scalable = new SLICK.Scalable({
                    scaleDamping: params.scaleDamping,
                    container: params.container,
                    
                    onAnimate: function() {
                        // flag that we are scaling
                        status = module.DisplayState.PINCHZOOM;
                        
                        wake();
                    },
                    
                    onPinchZoom: function(touchesStart, touchesCurrent) {
                        lastInteraction = SLICK.Clock.getTime(true);
                        wake();
                        
                        if (params.onPinchZoom) {
                            params.onPinchZoom(touchesStart, touchesCurrent);
                        } // if
                        
                        // flag that we are scaling
                        status = module.DisplayState.PINCHZOOM;
                    },
                    
                    onScale: function(endScaleFactor, zoomXY, keepCenter) {
                        GRUNT.WaterCooler.say("view.scale", { id: self.id });
                        
                        // take a snapshot
                        self.snapshot();
                        
                        // notify layers that we are adjusting scale
                        notifyLayers("scale");
                        
                        // reset the status flag
                        status = module.DisplayState.ACTIVE;
                        wake();
                        
                        // if we are attempting to keep the center of the control
                        // FIXME: GET THIS RIGHT!!!!
                        if (keepCenter) {
                        } // if

                        if (params.onScale) {
                            params.onScale(endScaleFactor, zoomXY);
                        }
                    }
                });
            } // if
            
            function addLayer(id, value) {
                // make sure the layer has the correct id
                value.id = id;
                
                // attach the change listener
                value.registerChangeListener(function() {
                    layerChangesSinceCache++;
                    wake();
                });
                
                // tell the layer that I'm going to take care of it
                value.setParent(self);
                
                // add the new layer
                layers.push(value);
                
                // sort the layers
                layers.sort(function(itemA, itemB) {
                    var result = itemB.zindex - itemA.zindex;
                    if (result === 0) {
                        result = itemB.created - itemA.created;
                    } // if
                    
                    return result;
                });

                // fire a notify event for adding the layer
                self.notifyLayerListeners("add", id, value);
            } // addLayer
            
            function getLayerIndex(id) {
                for (var ii = layers.length; ii--; ) {
                    if (layers[ii].id == id) {
                        return ii;
                    } // if
                } // for
                
                return -1;
            } // getLayerIndex
            
            /* layer listeners code */
            
            function notifyLayers(eventType) {
                for (var ii = layers.length; ii--; ) {
                    layers[ii].notify(eventType);
                } // for
            } // notifyLayers
            
            /* saved canvas / context code */
            
            function cacheContext(overrideStatus) {
                var changeCount = 0,
                    startTicks = GRUNT.Log.getTraceTicks();
                
                // get the context
                cachedZIndex = 1000;
                
                // let the world know
                GRUNT.WaterCooler.say("view.cache", { id: params.id });
                
                if (clearCacheBackground) {
                    cachedContext.clearRect(0, 0, cachedCanvas.width, cachedCanvas.height);
                    clearCacheBackground = false;
                } // if
                
                // update the offset to take into account the buffer
                var paddedOffset = offset.offset(-params.padding, -params.padding);
                
                GRUNT.Log.trace("prepped cached canvas", startTicks);
                
                // iterate through the layers, and for any layers that cannot draw on scale, draw them to 
                // the saved context
                for (var ii = layers.length; ii--; ) {
                    if (layers[ii].shouldDraw(overrideStatus ? overrideStatus : DISPLAY_STATE.GENCACHE)) {
                        var layerChangeCount = layers[ii].draw(cachedContext, paddedOffset, paddedDimensions, self);
                        changeCount += layerChangeCount ? layerChangeCount: 0;

                        // calculate the zindex as the zindex of the lowest saved layer
                        cachedZIndex = Math.min(cachedZIndex, layers[ii].zindex);
                    } // if
                } // for

                // reset the layer changes since cache count
                layerChangesSinceCache = 0;

                // update the saved offset
                cachedOffset = offset.duplicate();
                lastCacheTickCount = tickCount;
                
                GRUNT.Log.trace("cached context", startTicks);
                
                return changeCount;
            } // getSavedContext
            
            /* draw code */
            
            function calcZoomCenter() {
                var scaleInfo = scalable.getScaleInfo(),
                    displayCenter = self.getDimensions().getCenter(),
                    shiftFactor = (scaleInfo.progress ? scaleInfo.progress : 1) * 0.5;
                    
                // update the end center
                endCenter = scaleInfo.center;

                if (scaleInfo.startRect) {
                    var startCenter = scaleInfo.startRect.getCenter(),
                        centerOffset = startCenter.diff(endCenter);

                    zoomCenter = new SLICK.Vector(endCenter.x + centerOffset.x, endCenter.y + centerOffset.y);
                } 
                else {
                    var offsetDiff = scaleInfo.start.diff(endCenter);
                        
                    zoomCenter = new SLICK.Vector(endCenter.x - offsetDiff.x * shiftFactor, endCenter.y - offsetDiff.y * shiftFactor);
                } // if..else
            } // calcZoomCenter
            
            function drawLayer(layer, context, offset, overrideStatus) {
                var changeCount = 0;
                
                // draw the layer output to the main canvas
                // but only if we don't have a scale buffer or the layer is a draw on scale layer
                if (layer.shouldDraw(overrideStatus ? overrideStatus : status)) {
                    changeCount = layer.draw(context, offset, dimensions, self);
                } // if
                
                return changeCount ? changeCount : 0;
            } // drawLayer
            
            function drawView(context, offset, overrideStatus) {
                var changeCount = 0,
                    scaleFactor = self.getScaleFactor(),
                    isPinchZoom = (self.getDisplayStatus() & DISPLAY_STATE.PINCHZOOM) !== 0,
                    delayDrawLayers = [];
                
                // update the last scale factor
                lastScaleFactor = self.getScaleFactor();

                var savedDrawn = false,
                    ii = 0;
                    
                // draw the cached canvas
                if (overrideStatus || ((! isPinchZoom) && (layerChangesSinceCache > 0) && (lastCacheTickCount + cacheDelay <= tickCount))) {
                    changeCount += cacheContext(overrideStatus);
                } // if
                
                // if we need to clear on every draw then do so
                if (params.clearOnDraw || isPinchZoom) {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                } // if

                // if we are scaling then do some calcs
                if (isPinchZoom) {
                    calcZoomCenter();
                    
                    // offset the draw args
                    if (zoomCenter) {
                        offset.add(zoomCenter);
                    } // if
                } // if
                
                context.save();
                try {
                    // if the device dpi has scaled, then apply that to the display
                    if (deviceScaling !== 1) {
                        context.scale(deviceScaling, deviceScaling);
                    }
                    // if we are scaling, then tell the canvas to scale
                    else if (isPinchZoom) {
                        context.translate(endCenter.x, endCenter.y);
                        context.scale(scaleFactor, scaleFactor);
                    }
                    
                    for (ii = layers.length; ii--; ) {
                        if ((! isPinchZoom) || layers[ii].scalePosition) {
                            changeCount += drawLayer(layers[ii], context, offset, overrideStatus);
                        }
                        else {
                            delayDrawLayers.unshift(layers[ii]);
                        } // if..else
                        
                        // draw the saved context if required and at the appropriate zindex
                        if ((! savedDrawn) && (cachedZIndex < layers[ii].zindex)) {
                            var relativeOffset = cachedOffset.diff(offset).offset(-params.padding, -params.padding);
                            
                            context.drawImage(cachedCanvas, relativeOffset.x, relativeOffset.y);
                            savedDrawn = true;
                        } // if
                    } // for
                }
                finally {
                    context.restore();
                } // try..finally
                
                // iterate through the layers that couldn't be drawn in the main loop and draw them now...
                for (ii = delayDrawLayers.length; ii--; ) {
                    changeCount += drawLayer(delayDrawLayers[ii], context, offset, overrideStatus);
                } // for
                
                return changeCount;
            } // drawView
            
            function cycle() {
                // check to see if we are panning
                var changeCount = 0,
                    interacting = (status == module.DisplayState.PINCHZOOM) || (tickCount - lastInteraction < params.bufferRefresh);
                
                // get the updated the offset
                tickCount = SLICK.Clock.getTime();
                offset = pannable ? pannable.getOffset() : new SLICK.Vector();
                
                // if we have an fps layer, then update the fps
                if (fpsLayer && lastTickCount) {
                    fpsLayer.fps = Math.floor(1000 / (tickCount - lastTickCount));
                } // if
                    
                if (interacting) {
                    SLICK.Animation.cancel(function(tweenInstance) {
                        return tweenInstance.cancelOnInteract;
                    });
                }  // if

                // check that all is right with each layer
                for (var ii = layers.length; ii--; ) {
                    var cycleChanges = layers[ii].cycle(tickCount, offset);
                    changeCount += cycleChanges ? cycleChanges : 0;
                } // for
                
                // update the idle status
                idle = idle && (! interacting);
                
                // draw the view
                changeCount += drawView(mainContext, offset);

                // if the user is not interacting, then save the current context
                if ((! interacting) && (! idle)) {
                    idle = true;
                    GRUNT.WaterCooler.say("view-idle", { id: self.id });
                } // if
                
                // update the last tick count
                lastTickCount = tickCount;
                
                // include wake triggers in the change count
                paintTimeout = 0;
                if (wakeTriggers + changeCount > 0) {
                    wake();
                } // if
            } // cycle
            
            function wake() {
                wakeTriggers++;
                if (paintTimeout !== 0) { return; }
                
                wakeTriggers = 0;
                paintTimeout = setTimeout(cycle, 0);
            } // wake
            
            // initialise self
            var self = GRUNT.extend({}, params, pannable, scalable, {
                id: params.id,
                deviceScaling: deviceScaling,
                
                centerOn: function(offset) {
                    pannable.setOffset(offset.x - (canvas.width * 0.5), offset.y - (canvas.height * 0.5));
                },
                
                getDimensions: function() {
                    if (canvas) {
                        return new SLICK.Dimensions(canvas.width, canvas.height);
                    } // if
                },
                
                getZoomCenter: function() {
                    return zoomCenter;
                },
                
                /* layer getter and setters */
                
                getLayer: function(id) {
                    // look for the matching layer, and return when found
                    for (var ii = 0; ii < layers.length; ii++) {
                        if (layers[ii].id == id) {
                            if (! (/^grid/i).test(id)) {
                                GRUNT.Log.info("found layer: " + id);
                            } // if
                            
                            return layers[ii];
                        } // if
                    } // for
                    
                    return null;
                },
                
                setLayer: function(id, value) {
                    // if the layer already exists, then remove it
                    for (var ii = 0; ii < layers.length; ii++) {
                        if (layers[ii].id === id) {
                            layers.splice(ii, 1);
                            break;
                        } // if
                    } // for
                    
                    if (value) {
                        addLayer(id, value);
                    } // if
                    
                    // iterate through the layer update listeners and fire the callbacks
                    self.notifyLayerListeners("update", id, value);
                    layerChangesSinceCache++;
                    wake();
                },
                
                eachLayer: function(callback) {
                    // iterate through each of the layers and fire the callback for each 
                    for (var ii = 0; ii < layers.length; ii++) {
                        callback(layers[ii]);
                    } // for
                },
                
                snapshot: function(zindex) {
                    var startTicks = GRUNT.Log.getTraceTicks();
                    
                    cachedContext.save();
                    try {
                        // now draw the snapshot to the cached canvas
                        cachedContext.fillStyle = "rgba(30, 30, 30)";
                        cachedContext.fillRect(params.padding, params.padding, dimensions.width, dimensions.height);
                        cachedContext.globalAlpha = 0.5;
                        cachedContext.drawImage(canvas, params.padding, params.padding);
                    }
                    finally {
                        cachedContext.restore();
                    }
                    
                    GRUNT.Log.trace("taken snapshot", startTicks);
                },
                
                getDisplayStatus: function() {
                    return status;
                },
                
                setDisplayStatus: function(value) {
                    status = value;
                },
                
                scale: function(targetScaling, tweenFn, callback, startXY, targetXY) {
                    // if the start XY is not defined, used the center
                    if (! startXY) {
                        startXY = self.getDimensions().getCenter();
                    } // if
                    
                    // if the target xy is not defined, then use the canvas center
                    if (! targetXY) {
                        targetXY = self.getDimensions().getCenter();
                    } // if
                    
                    // if the view is scalable then go for it
                    if (scalable) {
                        scalable.animate(targetScaling, startXY, targetXY, tweenFn, callback);
                    }
                    
                    return scalable;
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
                }
            });
            
            // get the dimensions
            dimensions = self.getDimensions();
            centerPos = dimensions.getCenter();
            paddedDimensions = dimensions.grow(params.padding, params.padding);
            
            // listen for layer removals
            GRUNT.WaterCooler.listen("layer.remove", function(args) {
                if (args.id) {
                    self.removeLayer(args.id);
                } // if
            });
            
            GRUNT.WaterCooler.listen("view.wake", function(args) {
                layerChangesSinceCache++;
                if ((! args.id) || (args.id === self.id)) {
                    wake();
                } // if
            });
            
            deviceScaling = SLICK.getDeviceConfig().getScaling();
            
            // if we need to display the fps for the view, then create a suitable layer
            if (params.displayFPS) {
                fpsLayer =  new module.FPSLayer();
                self.setLayer("fps", fpsLayer);
            } // if
            
            if (params.displayResourceStats) {
                self.setLayer("resourceStats", new module.ResourceStatsLayer());
            } // if
            
            // add a status view layer for experimentation sake
            // self.setLayer("status", new module.StatusViewLayer());
            wake();
            return self;
        },
        
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


