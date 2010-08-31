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
                id: "",
                centerOnScale: true,
                created: new Date().getTime(),
                scalePosition: true,
                zindex: 0,
                supportFastDraw: false,
                validStates: module.DefaultDisplayStates
            }, params);
            
            var parent = null,
                id = params.id;
            
            var self = GRUNT.extend({
                addToView: function(view) {
                    view.setLayer(id, self);
                },
                
                shouldDraw: function(displayState) {
                    var stateValid = (displayState & params.validStates) !== 0,
                        fastDraw = parent ? (parent.fastDraw && (displayState !== DISPLAY_STATE.ACTIVE)) : false;

                    return stateValid && (fastDraw ? params.supportFastDraw : true);
                },
                
                cycle: function(tickCount, offset, state) {
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
                validStates: module.ActiveDisplayStates | DISPLAY_STATE.PAN | DISPLAY_STATE.PINCHZOOM,
                drawIndicator: null,
                duration: 2000,
                autoCenter: false
            }, params);
            
            // generate the edge data for the specified path
            var edgeData = TILE5.V.edges(params.path), 
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
                cycle: function(tickCount, offset, state) {
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

                        theta = TILE5.V.theta(v1, v2, edgeData.edges[edgeIndex]);
                        indicatorXY = TILE5.V.pointOnEdge(v1, v2, theta, extra);

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
                autoSize: false
            }, params);
            
            // get the container context
            var layers = [],
                canvas = document.getElementById(params.container),
                mainContext = null,
                offset = new TILE5.Vector(),
                clearBackground = false,
                lastTickCount = null,
                lastInteraction = 0,
                frozen = false,
                deviceScaling = 1,
                dimensions = null,
                centerPos = null,
                wakeTriggers = 0,
                fpsLayer = null,
                endCenter = null,
                idle = false,
                paintTimeout = 0,
                idleTimeout = 0,
                rescaleTimeout = 0,
                bufferTime = 0,
                zoomCenter = null,
                tickCount = 0,
                deviceFps = TILE5.Device.getConfig().targetFps,
                redrawInterval = 0,
                scaling = false,
                startRect = null,
                endRect = null,
                scaleFactor = 1,
                aniProgress = null,
                tweenStart = null,
                startCenter = null,
                state = module.DisplayState.ACTIVE;
                
            GRUNT.Log.info("Creating a new view instance, attached to container: " + params.container + ", canvas = ", canvas);
            
            /* panning functions */
            
            function pan(x, y, tweenFn) {
                // GRUNT.Log.info("captured pan event: x = " + x + ", y = " + y);
                
                // update the offset by the specified amount
                self.updateOffset(offset.x + x, offset.y + y, tweenFn);
                
                lastInteraction = TILE5.Clock.getTime(true);
                wake();
                
                state = DISPLAY_STATE.PAN;                
            } // pan
            
            function panEnd(x, y) {
                state = DISPLAY_STATE.ACTIVE;
                setTimeout(wake, 50);
            } // panEnd
            
            /* scaling functions */
            
            function animateZoom() {
                // flag that we are scaling
                state = module.DisplayState.PINCHZOOM;
                wake();
                
                self.trigger("animate");
            } // animateZoom
            
            function checkTouches(start, end) {
                startRect = TILE5.V.getRect(start);
                endRect = TILE5.V.getRect(end);

                // get the sizes of the rects
                var startSize = TILE5.D.getSize(startRect.dimensions),
                    endSize = TILE5.D.getSize(endRect.dimensions);

                // update the zoom center
                startCenter = TILE5.R.getCenter(startRect);
                endCenter = TILE5.R.getCenter(endRect);

                // determine the ratio between the start rect and the end rect
                scaleFactor = (startRect && (startSize !== 0)) ? (endSize / startSize) : 1;
            } // checkTouches            
            
            function pinchZoom(touchesStart, touchesCurrent) {
                checkTouches(touchesStart, touchesCurrent);
                scaling = scaleFactor !== 1;
                
                if (scaling) {
                    lastInteraction = TILE5.Clock.getTime(true);
                    state = module.DisplayState.PINCHZOOM;

                    wake();
                } // if
            } // pinchZoom
            
            function pinchZoomEnd(touchesStart, touchesEnd) {
                checkTouches(touchesStart, touchesEnd);

                scaleView();
                
                // restore the scale amount to 1
                scaleFactor = 1;
            } // pinchZoomEnd
            
            function wheelZoom(relXY, zoom) {
                self.zoom(relXY, Math.min(Math.pow(2, Math.round(Math.log(zoom))), 8), 500);
            } // wheelZoom
            
            function scaleView() {
                // TODO: can this be removed
                GRUNT.WaterCooler.say("view.scale", { id: self.id });
                
                scaling = false;
                self.trigger("scale", scaleFactor, startRect ? calcPinchZoomCenter() : endCenter);

                // reset the status flag
                state = module.DisplayState.ACTIVE;
                scaleFactor = 1;
                wake();
            } // scaleView
            
            /* view initialization */
            
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
            
            function calcPinchZoomCenter() {
                var center = TILE5.D.getCenter(dimensions),
                    endDist = TILE5.V.distance([endCenter, center]),
                    endTheta = TILE5.V.theta(endCenter, center, endDist),
                    shiftDelta = TILE5.V.diff(startCenter, endCenter);
                    
                center = TILE5.V.pointOnEdge(endCenter, center, endTheta, endDist / scaleFactor);

                center.x = center.x + shiftDelta.x;
                center.y = center.y + shiftDelta.y; 
                
                return center;
            } // calcPinchZoomCenter
            
            function calcZoomCenter() {
                var displayCenter = TILE5.D.getCenter(dimensions),
                    shiftFactor = (aniProgress ? aniProgress : 1) / 2,
                    centerOffset = TILE5.V.diff(startCenter, endCenter);

                if (startRect) {
                    zoomCenter = new TILE5.Vector(endCenter.x + centerOffset.x, endCenter.y + centerOffset.y);
                } 
                else {
                    zoomCenter = new TILE5.Vector(endCenter.x - centerOffset.x * shiftFactor, endCenter.y - centerOffset.y * shiftFactor);
                } // if..else
            } // calcZoomCenter
            
            function triggerIdle() {
                GRUNT.WaterCooler.say("view.idle", { id: self.id });
                
                idle = true;
                idleTimeout = 0;
            } // idle
            
            function drawView(context, offset) {
                var changeCount = 0,
                    drawState = self.getDisplayState(),
                    startTicks = new Date().getTime(),
                    isPinchZoom = (drawState & DISPLAY_STATE.PINCHZOOM) !== 0,
                    delayDrawLayers = [];
                
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
                
                // conver the offset x and y to integer values
                // while canvas implementations work fine with real numbers, the actual drawing of images
                // will not look crisp when a real number is used rather than an integer (or so I've found)
                offset.x = Math.floor(offset.x);
                offset.y = Math.floor(offset.y);
                
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
                    var cycleChanges = layers[ii].cycle(tickCount, offset, state);
                    changeCount += cycleChanges ? cycleChanges : 0;
                } // for
                
                // draw the view
                if (lastTickCount + redrawInterval < tickCount) {
                    changeCount += drawView(mainContext, offset);

                    // update the last tick count
                    lastTickCount = tickCount;
                } // if

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
            var self = GRUNT.extend({}, params, new GRUNT.Observable(), {
                id: params.id,
                deviceScaling: deviceScaling,
                fastDraw: params.fastDraw || TILE5.Device.getConfig().requireFastDraw,
                
                // TODO: change name to be scaling related
                animate: function(targetScaleFactor, startXY, targetXY, tweenFn, callback) {

                    function finishAnimation() {
                        // if we have a callback to complete, then call it
                        if (callback) {
                            callback();
                        } // if

                        scaleView();

                        // reset the scale factor
                        scaleFactor = 1;
                        aniProgress = null;
                    } // finishAnimation

                    // update the zoom center
                    scaling = true;
                    startCenter = TILE5.V.copy(startXY);
                    endCenter = TILE5.V.copy(targetXY);
                    startRect = null;

                    // if tweening then update the targetXY
                    if (tweenFn) {
                        tweenStart = scaleFactor;

                        var tween = TILE5.Animation.tweenValue(0, targetScaleFactor - tweenStart, tweenFn, finishAnimation, 1000);
                        tween.requestUpdates(function(updatedValue, completed) {
                            // calculate the completion percentage
                            aniProgress = updatedValue / (targetScaleFactor - tweenStart);

                            // update the scale factor
                            scaleFactor = tweenStart + updatedValue;

                            // trigger the on animate handler
                            animateZoom();
                        });
                    }
                    // otherwise, update the scale factor and fire the callback
                    else {
                        scaleFactor = targetScaleFactor;
                        finishAnimation();
                    }  // if..else
                },
                
                centerOn: function(offset) {
                    self.setOffset(offset.x - (canvas.width / 2), offset.y - (canvas.height / 2));
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
                        startXY = TILE5.D.getCenter(dimensions);
                    } // if
                    
                    // if the target xy is not defined, then use the canvas center
                    if (! targetXY) {
                        targetXY = TILE5.D.getCenter(dimensions);
                    } // if
                    
                    self.animate(targetScaling, startXY, targetXY, tweenFn, callback);
                    return self;
                },
                
                removeLayer: function(id) {
                    var layerIndex = getLayerIndex(id);
                    if ((layerIndex >= 0) && (layerIndex < layers.length)) {
                        GRUNT.WaterCooler.say("layer.removed", { layer: layers[layerIndex] });

                        layers.splice(layerIndex, 1);
                    } // if
                },
                
                /* offset methods */
                
                getOffset: function() {
                    return TILE5.V.copy(offset);
                },
                
                setOffset: function(x, y) {
                    offset.x = x; 
                    offset.y = y;
                },
                
                updateOffset: function(x, y, tweenFn) {
                    if (tweenFn) {
                        var endPosition = new TILE5.Vector(x, y);

                        animating = true;
                        var tweens = TILE5.Animation.tweenVector(offset, endPosition.x, endPosition.y, tweenFn, function() {
                            animating = false;
                            self.panEnd(0, 0);
                        });

                        // set the tweens to cancel on interact
                        for (var ii = tweens.length; ii--; ) {
                            tweens[ii].cancelOnInteract = true;
                            tweens[ii].requestUpdates(function(updatedValue, complete) {
                                if (params.onAnimate) {
                                    params.onAnimate(offset.x, offset.y);
                                } // if
                            });
                        } // for
                    }
                    else {
                        self.setOffset(x, y);
                    } // if..else
                },
                
                zoom: function(targetXY, newScaleFactor, rescaleAfter) {
                    scaleFactor = newScaleFactor;
                    scaling = scaleFactor !== 1;

                    startCenter = TILE5.D.getCenter(self.getDimensions());
                    endCenter = scaleFactor > 1 ? TILE5.V.copy(targetXY) : TILE5.D.getCenter(self.getDimensions());
                    startRect = null;
                    
                    // GRUNT.Log.info("target xy = " + TILE5.V.toString(targetXY) + ", start center = " + TILE5.V.toString(startCenter) + ", end center = " + TILE5.V.toString(endCenter));

                    clearTimeout(rescaleTimeout);

                    if (scaling) {
                        lastInteraction = TILE5.Clock.getTime(true);
                        state = module.DisplayState.PINCHZOOM;

                        wake();
                        if (rescaleAfter) {
                            rescaleTimeout = setTimeout(scaleView, parseInt(rescaleAfter, 10));
                        } // if
                    } // if
                }
            });
            
            // get the dimensions
            dimensions = self.getDimensions();
            centerPos = TILE5.D.getCenter(dimensions);
            
            // calculate the redaw interval based on the device fps
            if (deviceFps) {
                redrawInterval = Math.ceil(1000 / deviceFps);
            } // if
            
            GRUNT.Log.info("redraw interval calaculated @ " + redrawInterval);
            
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
            
            // capture touch events
            TILE5.Touch.captureTouch(canvas, {
                observable: self
            });

            self.bind("move", pan);
            self.bind("moveEnd", panEnd);
            self.bind("pinchZoom", pinchZoom);
            self.bind("pinchZoomEnd", pinchZoomEnd);
            self.bind("wheelZoom", wheelZoom);
            
            // add a status view layer for experimentation sake
            // self.setLayer("status", new module.StatusViewLayer());
            wake();
            return self;
        }
    }; 
    
    return module;
})();


