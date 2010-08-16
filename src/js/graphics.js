/*
File:  TILE5.tiler.js
This file is used to define the tiler and supporting classes for creating a scrolling
tilable grid using the HTML canvas.  At this stage, the Tiler is designed primarily for
mobile devices, however, if the demand is there it could be tweaked to also support other
HTML5 compatible browsers

Section: Version History
21/05/2010 (DJO) - Created File
*/

// define the TILE5 tile borders
TILE5.Border = {
    NONE: 0,
    TOP: 1,
    RIGHT: 2,
    BOTTOM: 3,
    LEFT: 4
}; // Border

TILE5.Graphics = (function() {
    // initialise display state constants that will be exposed through the module
    var DISPLAY_STATE = {
        NONE: 0,
        ACTIVE: 1,
        ANIMATING: 4,
        PAN: 8,
        PINCHZOOM: 16,
        FREEZE: 128
    };
    
    // initialise variables
    var viewCounter = 0;
    
    var module = {
        DisplayState: DISPLAY_STATE,
        
        // some precanned display states
        AnyDisplayState: 255,
        ActiveDisplayStates: DISPLAY_STATE.ACTIVE | DISPLAY_STATE.ANIMATING,
        DefaultDisplayStates: DISPLAY_STATE.ACTIVE | DISPLAY_STATE.ANIMATING | DISPLAY_STATE.PAN | DISPLAY_STATE.PINCHZOOM,
        
        ViewLayer: function(params) {
            params = GRUNT.extend({
                centerOnScale: true,
                created: new Date().getTime(),
                scalePosition: true,
                zindex: 0,
                supportFastDraw: false,
                validStates: module.DefaultDisplayStates
            }, params);
            
            var parent = null,
                id = "";
            
            var self = GRUNT.extend({
                addToView: function(view) {
                    view.setLayer(id, self);
                },
                
                shouldDraw: function(displayState) {
                    var stateValid = (displayState & params.validStates) !== 0,
                        fastDraw = parent ? (parent.fastDraw && (displayState !== DISPLAY_STATE.ACTIVE)) : false;

                    return stateValid && (fastDraw ? params.supportFastDraw : true);
                },
                
                cycle: function(tickCount, offset) {
                    return 0;
                },
                
                draw: function(context, offset, dimensions, state, view) {
                },
                
                /**
                The remove method enables a view to flag that it is ready or should be removed
                from any views that it is contained in.  This was introduced specifically for
                animation layers that should only exist as long as an animation is active.
                */
                remove: function() {
                    GRUNT.WaterCooler.say("layer.remove", { id: id });
                },
                
                wakeParent: function() {
                    // if we have a parent, then wake them, if we have no parent, well just panic and wake everybody up
                    GRUNT.WaterCooler.say("view.wake", { id: parent ? parent.id : null });
                },
                
                getId: function() {
                    return id;
                },
                
                setId: function(value) {
                    id = value;
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
        
        AnimatedPathLayer: function(params) {
            params = GRUNT.extend({
                path: [],
                id: GRUNT.generateObjectID("pathAnimation"),
                easing: TILE5.Animation.Easing.Sine.InOut,
                canCache: false,
                validStates: module.ActiveDisplayStates | DISPLAY_STATE.PAN | DISPLAY_STATE.PINCHZOOM,
                drawIndicator: null,
                duration: 2000,
                autoCenter: false
            }, params);
            
            // generate the edge data for the specified path
            var edgeData = TILE5.VectorMath.edges(params.path), 
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
            tween = TILE5.Animation.tweenValue(
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

                        theta = TILE5.VectorMath.theta(v1, v2, edgeData.edges[edgeIndex]);
                        indicatorXY = TILE5.VectorMath.pointOnEdge(v1, v2, theta, extra);

                        if (params.autoCenter) {
                            var parent = self.getParent();
                            if (parent) {
                                parent.centerOn(indicatorXY);
                            } // if
                        } // if
                    } // if

                    return indicatorXY ? 1 : 0;
                },
                
                draw: function(context, offset, dimensions, state, view) {
                    if (indicatorXY) {
                        // if the draw indicator method is specified, then draw
                        (params.drawIndicator ? params.drawIndicator : drawDefaultIndicator)(
                            context,
                            offset,
                            new TILE5.Vector(indicatorXY.x - offset.x, indicatorXY.y - offset.y),
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
            
            // initialise variables
            var fps = null;
            
            function determineFPS() {
                var sumFPS = 0,
                    delaysLen = self.delays.length;
                    
                for (var ii = delaysLen; ii--; ) {
                    sumFPS += self.delays[ii];
                } // for
                
                if (delaysLen !== 0) {
                    fps = Math.floor(1000 / (sumFPS / delaysLen));
                } // if
            } // determineFPS
            
            // initialise self
            var self = GRUNT.extend(new module.ViewLayer(params), {
                delays: [],
                
                draw: function(context, offset, dimensions, state, view) {
                    context.font = "bold 8pt Arial";
                    context.textAlign = "right";
                    context.fillStyle = "rgba(0, 0, 0, 0.8)";
                    context.fillText((fps ? fps : "?") + " fps", dimensions.width - 20, 20);
                }
            });
            
            setInterval(determineFPS, 1000);
            
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
                
                draw: function(context, offset, dimensions, state, view) {
                    // get the stats from the resource loaded
                    var stats = TILE5.Resources.getStats(),
                        ledSize = params.indicatorSize,
                        indicatorLeft = 10,
                        spacing = 2,
                        ii,
                        ypos;
                        
                    if (stats.imageCacheFullness) {
                        context.strokeStyle = "rgba(0, 0, 255, 1)";
                        
                        context.beginPath();
                        context.arc(15, 15, 5, 0, Math.PI * 2 * stats.imageCacheFullness, false);
                        context.stroke();
                        
                        indicatorLeft = 30;
                    } // if
                    
                    if (stats.imageLoadingCount >= 0) {
                        // draw indicators for the number of images loading
                        context.fillStyle = "rgba(0, 255, 0, 0.7)";
                        for (ii = stats.imageLoadingCount; ii--; ) {
                            context.fillRect(indicatorLeft + (ii * (ledSize+spacing)), 10, ledSize, ledSize);
                        } // for
                    } // if

                    if (stats.queuedImageCount >= 0) {
                        // draw indicators for the number of images queued
                        context.fillStyle = "rgba(255, 0, 0, 0.7)";
                        for (ii = stats.queuedImageCount; ii--; ) {
                            context.fillRect(indicatorLeft + (ii * (ledSize+spacing)), 10 + ledSize + spacing, ledSize, ledSize);
                        } // for
                    } // if
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
                displayFPS: false,
                displayResourceStats: false,
                scaleDamping: false,
                fastDraw: false,
                fillStyle: "rgb(200, 200, 200)",
                initialDrawMode: "source-over",
                bufferRefresh: 100,
                defaultFreezeDelay: 500,
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
                offset = new TILE5.Vector(),
                clearBackground = false,
                lastScaleFactor = 1,
                lastTickCount = null,
                lastInteraction = 0,
                frozen = false,
                deviceScaling = 1,
                translateDelta = new TILE5.Vector(),
                dimensions = null,
                centerPos = null,
                wakeTriggers = 0,
                fpsLayer = null,
                endCenter = null,
                pannable = null,
                scalable = null,
                idle = false,
                paintTimeout = 0,
                idleTimeout = 0,
                bufferTime = 0,
                zoomCenter = null,
                tickCount = 0,
                state = module.DisplayState.ACTIVE;
                
            GRUNT.Log.info("Creating a new view instance, attached to container: " + params.container + ", canvas = ", canvas);

            if (canvas) {
                TILE5.Touch.resetTouch(canvas);
                
                // if we are autosizing the set the size
                if (params.autoSize) {
                    GRUNT.Log.info("autosizing view: window.height = " + window.innerHeight + ", width = " + window.innerWidth);
                    canvas.height = window.innerHeight - canvas.offsetTop;
                    canvas.width = window.innerWidth - canvas.offsetLeft;
                } // if
                
                try {
                    mainContext = canvas.getContext('2d');
                    mainContext.globalCompositeOperation = params.initialDrawMode;
                    mainContext.clearRect(0, 0, canvas.width, canvas.height);
                } 
                catch (e) {
                    GRUNT.Log.exception(e);
                    throw new Error("Could not initialise canvas on specified view element");
                }
            } // if
            
            if (params.pannable) {
                pannable = new TILE5.Pannable({
                    container: params.container,
                    onAnimate: function(x, y) {
                        wake();
                    },
                    onPan: function(x, y) {
                        lastInteraction = TILE5.Clock.getTime(true);
                        wake();
                        
                        // add the current pan on the vector
                        translateDelta = TILE5.V.offset(translateDelta, x, y);
                        
                        if (params.onPan) {
                            params.onPan(x, y);
                        } // if
                        
                        state = DISPLAY_STATE.PAN;
                    },
                    
                    onPanEnd: function(x, y) {
                        wake();
                        
                        state = DISPLAY_STATE.ACTIVE;
                    }
                });
            } // if
            
            if (params.scalable) {
                scalable = new TILE5.Scalable({
                    scaleDamping: params.scaleDamping,
                    container: params.container,
                    
                    onAnimate: function() {
                        // flag that we are scaling
                        state = module.DisplayState.PINCHZOOM;
                        
                        wake();
                    },
                    
                    onPinchZoom: function(touchesStart, touchesCurrent) {
                        lastInteraction = TILE5.Clock.getTime(true);
                        wake();
                        
                        if (params.onPinchZoom) {
                            params.onPinchZoom(touchesStart, touchesCurrent);
                        } // if
                        
                        // flag that we are scaling
                        state = module.DisplayState.PINCHZOOM;
                    },
                    
                    onScale: function(endScaleFactor, zoomXY, keepCenter) {
                        GRUNT.WaterCooler.say("view.scale", { id: self.id });
                        
                        /*
                        // take a snapshot
                        if (endScaleFactor > 1) {
                            self.snapshot();
                        }
                        else {
                            self.clearBackground();
                        } // if..else
                        */
                        
                        // reset the status flag
                        state = module.DisplayState.ACTIVE;
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
                value.setId(id);
                
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
            } // addLayer
            
            function getLayerIndex(id) {
                for (var ii = layers.length; ii--; ) {
                    if (layers[ii].getId() == id) {
                        return ii;
                    } // if
                } // for
                
                return -1;
            } // getLayerIndex
            
            /* draw code */
            
            function calcZoomCenter() {
                var scaleInfo = scalable.getScaleInfo(),
                    displayCenter = self.getDimensions().getCenter(),
                    shiftFactor = (scaleInfo.progress ? scaleInfo.progress : 1) * 0.5;
                    
                // update the end center
                endCenter = scaleInfo.center;

                if (scaleInfo.startRect) {
                    var startCenter = scaleInfo.startRect.getCenter(),
                        centerOffset = TILE5.V.diff(startCenter, endCenter);

                    zoomCenter = new TILE5.Vector(endCenter.x + centerOffset.x, endCenter.y + centerOffset.y);
                } 
                else {
                    var offsetDiff = TILE5.V.diff(scaleInfo.start, endCenter);
                        
                    zoomCenter = new TILE5.Vector(endCenter.x - offsetDiff.x * shiftFactor, endCenter.y - offsetDiff.y * shiftFactor);
                } // if..else
            } // calcZoomCenter
            
            function triggerIdle() {
                GRUNT.WaterCooler.say("view.idle", { id: self.id });
                
                idle = true;
                idleTimeout = 0;
            } // idle
            
            function drawView(context, offset) {
                var changeCount = 0,
                    scaleFactor = self.getScaleFactor(),
                    drawState = self.getDisplayState(),
                    startTicks = new Date().getTime(),
                    isPinchZoom = (drawState & DISPLAY_STATE.PINCHZOOM) !== 0,
                    delayDrawLayers = [];
                
                // update the last scale factor
                lastScaleFactor = self.getScaleFactor();

                var savedDrawn = false,
                    ii = 0;
                    
                if (clearBackground || isPinchZoom) {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    clearBackground = false;
                } // if
                
                // if we are scaling then do some calcs
                if (isPinchZoom) {
                    calcZoomCenter();
                    
                    // offset the draw args
                    if (zoomCenter) {
                        offset = TILE5.V.offset(offset, zoomCenter.x, zoomCenter.y);
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
                        // draw the layer output to the main canvas
                        // but only if we don't have a scale buffer or the layer is a draw on scale layer
                        if (layers[ii].shouldDraw(drawState)) {
                            var layerChanges = layers[ii].draw(context, offset, dimensions, drawState, self);
                            changeCount += layerChanges ? layerChanges : 0;
                        } // if
                    } // for
                }
                finally {
                    context.restore();
                } // try..finally
                
                GRUNT.Log.trace("draw complete", startTicks);
                
                return changeCount;
            } // drawView
            
            function cycle() {
                // check to see if we are panning
                var changeCount = 0,
                    interacting = (state === DISPLAY_STATE.PINCHZOOM) || (state === DISPLAY_STATE.PAN);
                    
                // get the tickcount
                tickCount = new Date().getTime();
                
                // get the updated the offset
                offset = pannable ? pannable.getOffset() : new TILE5.Vector();
                
                // if we have an fps layer, then update the fps
                if (fpsLayer && lastTickCount) {
                    fpsLayer.delays.push(tickCount - lastTickCount);
                } // if
                    
                if (interacting) {
                    TILE5.Animation.cancel(function(tweenInstance) {
                        return tweenInstance.cancelOnInteract;
                    });
                    
                    idle = false;
                    if (idleTimeout !== 0) {
                        clearTimeout(idleTimeout);
                        idleTimeout = 0;
                    } // if
                }  // if

                // check that all is right with each layer
                for (var ii = layers.length; ii--; ) {
                    var cycleChanges = layers[ii].cycle(tickCount, offset);
                    changeCount += cycleChanges ? cycleChanges : 0;
                } // for
                
                // draw the view
                changeCount += drawView(mainContext, offset);

                // update the last tick count
                lastTickCount = tickCount;
                
                // include wake triggers in the change count
                paintTimeout = 0;
                if (wakeTriggers + changeCount > 0) {
                    wake();
                } 
                else {
                    if ((! idle) && (idleTimeout === 0)) {
                        idleTimeout = setTimeout(triggerIdle, 500);
                    } // if
                } // if..else
                
                GRUNT.Log.trace("Completed draw cycle", tickCount);
            } // cycle
            
            function wake() {
                wakeTriggers++;
                if (frozen || (paintTimeout !== 0)) { return; }
            
                wakeTriggers = 0;
                paintTimeout = setTimeout(cycle, 0);
            } // wake
            
            // initialise self
            var self = GRUNT.extend({}, params, pannable, scalable, {
                id: params.id,
                deviceScaling: deviceScaling,
                fastDraw: params.fastDraw || TILE5.Device.getConfig().requireFastDraw,
                
                centerOn: function(offset) {
                    pannable.setOffset(offset.x - (canvas.width * 0.5), offset.y - (canvas.height * 0.5));
                },
                
                getDimensions: function() {
                    if (canvas) {
                        return new TILE5.Dimensions(canvas.width, canvas.height);
                    } // if
                },
                
                getZoomCenter: function() {
                    return zoomCenter;
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
                    // if the layer already exists, then remove it
                    for (var ii = 0; ii < layers.length; ii++) {
                        if (layers[ii].getId() === id) {
                            layers.splice(ii, 1);
                            break;
                        } // if
                    } // for
                    
                    if (value) {
                        addLayer(id, value);
                    } // if
                    
                    GRUNT.WaterCooler.say("layer.update", { id: id });
                    wake();
                },
                
                eachLayer: function(callback) {
                    // iterate through each of the layers and fire the callback for each 
                    for (var ii = 0; ii < layers.length; ii++) {
                        callback(layers[ii]);
                    } // for
                },
                
                clearBackground: function() {
                    clearBackground = true;
                },
                
                freeze: function() {
                    frozen = true;
                },
                
                unfreeze: function() {
                    frozen = false;
                    
                    wake();
                },
                
                snapshot: function(zindex) {
                },
                
                getDisplayState: function() {
                    return frozen ? DISPLAY_STATE.FROZEN : state;
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
                
                removeLayer: function(id) {
                    var layerIndex = getLayerIndex(id);
                    if ((layerIndex >= 0) && (layerIndex < layers.length)) {
                        GRUNT.WaterCooler.say("layer.removed", { layer: layers[layerIndex] });

                        layers.splice(layerIndex, 1);
                    } // if
                }
            });
            
            // get the dimensions
            dimensions = self.getDimensions();
            centerPos = dimensions.getCenter();
            
            // listen for layer removals
            GRUNT.WaterCooler.listen("layer.remove", function(args) {
                if (args.id) {
                    self.removeLayer(args.id);
                } // if
            });
            
            GRUNT.WaterCooler.listen("view.wake", function(args) {
                if ((! args.id) || (args.id === self.id)) {
                    wake();
                } // if
            });
            
            deviceScaling = TILE5.Device.getConfig().getScaling();
            
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
        }
    }; 
    
    return module;
})();


