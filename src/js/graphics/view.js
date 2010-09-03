T5.View = function(params) {
    // initialise defaults
    params = T5.ex({
        id: GRUNT.generateObjectID('view'),
        container: "",
        clearOnDraw: false,
        scaleDamping: false,
        fastDraw: false,
        fillStyle: "rgb(200, 200, 200)",
        initialDrawMode: "source-over",
        bufferRefresh: 100,
        defaultFreezeDelay: 500,
        inertia: true,
        panAnimationEasing: T5.Easing.Sine.Out,
        panAnimationDuration: 750,
        pinchZoomAnimateTrigger: 400,
        adjustScaleFactor: null,
        autoSize: false
    }, params);
    
    // get the container context
    var layers = [],
        canvas = document.getElementById(params.container),
        mainContext = null,
        offset = new T5.Vector(),
        clearBackground = false,
        lastTickCount = null,
        frozen = false,
        deviceScaling = 1,
        dimensions = null,
        centerPos = null,
        wakeTriggers = 0,
        fpsLayer = null,
        endCenter = null,
        idle = false,
        panimating = false,
        paintTimeout = 0,
        repaint = false,
        idleTimeout = 0,
        rescaleTimeout = 0,
        bufferTime = 0,
        zoomCenter = null,
        tickCount = 0,
        deviceFps = T5.Device.getConfig().targetFps,
        redrawInterval = 0,
        scaling = false,
        startRect = null,
        endRect = null,
        scaleFactor = 1,
        lastDrawScaleFactor = 1,
        aniProgress = null,
        tweenStart = null,
        startCenter = null,
        touchHelper = null,
        state = T5.ViewState.ACTIVE;
        
    /* panning functions */
    
    function pan(x, y, tweenFn, tweenDuration) {
        // update the offset by the specified amount
        panimating = typeof(tweenFn) !== "undefined";
        self.updateOffset(offset.x + x, offset.y + y, tweenFn, tweenDuration);
        
        wake();
        state = T5.ViewState.PAN;                
    } // pan
    
    function panInertia(x, y) {
        if (params.inertia) {
            pan(x, y, params.panAnimationEasing, params.panAnimationDuration);
        } // if
    } // panIntertia
    
    function panEnd(x, y) {
        state = T5.ViewState.ACTIVE;
        panimating = false;
        setTimeout(wake, 50);
    } // panEnd
    
    /* scaling functions */
    
    function resetZoom() {
        scaleFactor = 1;
    } // resetZoom
    
    function checkTouches(start, end) {
        startRect = T5.V.getRect(start);
        endRect = T5.V.getRect(end);

        // get the sizes of the rects
        var startSize = T5.D.getSize(startRect.dimensions),
            endSize = T5.D.getSize(endRect.dimensions);

        // update the zoom center
        startCenter = T5.R.getCenter(startRect);
        endCenter = T5.R.getCenter(endRect);

        // determine the ratio between the start rect and the end rect
        scaleFactor = (startRect && (startSize !== 0)) ? (endSize / startSize) : 1;
    } // checkTouches            
    
    function pinchZoom(touchesStart, touchesCurrent) {
        checkTouches(touchesStart, touchesCurrent);
        scaling = scaleFactor !== 1;
        
        if (scaling) {
            state = T5.ViewState.PINCHZOOM;

            wake();
        } // if
    } // pinchZoom
    
    function pinchZoomEnd(touchesStart, touchesEnd, pinchZoomTime) {
        checkTouches(touchesStart, touchesEnd);
        
        if (params.adjustScaleFactor) {
            scaleFactor = params.adjustScaleFactor(scaleFactor);
            GRUNT.Log.info("scale factor adjusted to: " + scaleFactor);
        } // if

        if (pinchZoomTime < params.pinchZoomAnimateTrigger) {
            // TODO: move this to the map to override
            animateZoom(
                lastDrawScaleFactor, 
                scaleFactor, 
                startCenter, 
                calcPinchZoomCenter(), 
                // TODO: make the animation configurable
                T5.Easing.Sine.Out,
                function() {
                    scaleView();
                    resetZoom();
                },
                // TODO: make the animation duration configurable
                300);
                
            // reset the scale factor to the last draw scale factor
            scaleFactor = lastDrawScaleFactor;
        }
        else {
            scaleView();
            resetZoom();
        } // if..else
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
        state = T5.ViewState.ACTIVE;
        wake();
    } // scaleView
    
    function handleContainerUpdate(name, value) {
        canvas = document.getElementById(value);
        
        // attach to the new canvas
        attachToCanvas();
    } // handleContainerUpdate
    
    /* private functions */
    
    function attachToCanvas() {
        if (canvas) {
            T5.Touch.resetTouch(canvas);

            // if we are autosizing the set the size
            if (params.autoSize) {
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
            
            // capture touch events
            touchHelper = T5.Touch.capture(canvas, {
                observable: self
            });
            
            // enable inertia if configured
            if (params.inertia) {
                touchHelper.inertiaEnable(params.panAnimationDuration, dimensions);
            } // if
            
            // get the dimensions
            dimensions = self.getDimensions();
            centerPos = T5.D.getCenter(dimensions);

            // tell the view to redraw
            wake();
        } // if        
    } // attachToCanvas
    
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
    
    /* animation code */
    
    function animateZoom(scaleFactorFrom, scaleFactorTo, startXY, targetXY, tweenFn, callback, duration) {
        
        function finishAnimation() {
            // if we have a callback to complete, then call it
            if (callback) {
                callback();
            } // if

            scaleView();

            // reset the scale factor
            resetZoom();
            aniProgress = null;
        } // finishAnimation
        
        // update the zoom center
        scaling = true;
        startCenter = T5.V.copy(startXY);
        endCenter = T5.V.copy(targetXY);
        startRect = null;

        // if tweening then update the targetXY
        if (tweenFn) {
            var tween = T5.Animation.tweenValue(
                            0, 
                            scaleFactorTo - scaleFactorFrom, 
                            tweenFn, 
                            finishAnimation, 
                            duration ? duration : 1000);
                            
            tween.requestUpdates(function(updatedValue, completed) {
                // calculate the completion percentage
                aniProgress = updatedValue / (scaleFactorTo - scaleFactorFrom);

                // update the scale factor
                scaleFactor = scaleFactorFrom + updatedValue;

                // trigger the on animate handler
                state = T5.ViewState.PINCHZOOM;
                wake();

                self.trigger("animate");
            });
        }
        // otherwise, update the scale factor and fire the callback
        else {
            scaleFactor = targetScaleFactor;
            finishAnimation();
        }  // if..else                
    } // animateZoom
    
    /* draw code */
    
    function calcPinchZoomCenter() {
        var center = T5.D.getCenter(dimensions),
            endDist = T5.V.distance([endCenter, center]),
            endTheta = T5.V.theta(endCenter, center, endDist),
            shiftDelta = T5.V.diff(startCenter, endCenter);
            
        center = T5.V.pointOnEdge(endCenter, center, endTheta, endDist / scaleFactor);

        center.x = center.x + shiftDelta.x;
        center.y = center.y + shiftDelta.y; 
        
        return center;
    } // calcPinchZoomCenter
    
    function calcZoomCenter() {
        var displayCenter = T5.D.getCenter(dimensions),
            shiftFactor = (aniProgress ? aniProgress : 1) / 2,
            centerOffset = T5.V.diff(startCenter, endCenter);

        if (startRect) {
            zoomCenter = new T5.Vector(
                            endCenter.x + centerOffset.x, 
                            endCenter.y + centerOffset.y);
        } 
        else {
            zoomCenter = new T5.Vector(
                            endCenter.x - centerOffset.x * shiftFactor, 
                            endCenter.y - centerOffset.y * shiftFactor);
        } // if..else
    } // calcZoomCenter
    
    function triggerIdle() {
        self.trigger("idle");
        
        idle = true;
        idleTimeout = 0;
    } // idle
    
    function drawView(context, offset) {
        var changeCount = 0,
            drawState = self.getDisplayState(),
            startTicks = T5.time(),
            isPinchZoom = (drawState & T5.ViewState.PINCHZOOM) !== 0,
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
                offset = T5.V.offset(offset, zoomCenter.x, zoomCenter.y);
            } // if
        } // if
        
        context.save();
        try {
            lastDrawScaleFactor = scaleFactor;
            
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
                    var layerChanges = layers[ii].draw(
                                            context, 
                                            offset, 
                                            dimensions, 
                                            drawState, 
                                            self);

                    changeCount += layerChanges ? layerChanges : 0;
                } // if
            } // for
        }
        finally {
            context.restore();
        } // try..finally
        
        GRUNT.Log.trace("draw complete", startTicks);
        
        repaint = false;
        return changeCount;
    } // drawView
    
    function cycle() {
        // check to see if we are panning
        var changeCount = 0,
            interacting = (! panimating) && (
                                (state === T5.ViewState.PINCHZOOM) || 
                                (state === T5.ViewState.PAN));
            
        // get the tickcount
        tickCount = T5.time();
        
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
            T5.Animation.cancel(function(tweenInstance) {
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
    
    function invalidate() {
        repaint = true;
    } // invalidate
    
    /* object definition */
    
    // initialise self
    var self = {
        id: params.id,
        deviceScaling: deviceScaling,
        fastDraw: params.fastDraw || T5.Device.getConfig().requireFastDraw,
        
        // TODO: change name to be scaling related
        animate: function(targetScaleFactor, startXY, targetXY, tweenFn, callback) {
            animateZoom(
                scaleFactor, 
                targetScaleFactor, 
                startXY, 
                targetXY, 
                tweenFn, 
                callback);
        },
        
        centerOn: function(offset) {
            self.setOffset(offset.x - (canvas.width / 2), offset.y - (canvas.height / 2));
        },
        
        getDimensions: function() {
            if (canvas) {
                return new T5.Dimensions(canvas.width, canvas.height);
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
        
        needRepaint: function() {
            return repaint;
        },
        
        snapshot: function(zindex) {
        },
        
        getDisplayState: function() {
            return frozen ? T5.ViewState.FROZEN : state;
        },
        
        scale: function(targetScaling, tweenFn, callback, startXY, targetXY) {
            // if the start XY is not defined, used the center
            if (! startXY) {
                startXY = T5.D.getCenter(dimensions);
            } // if
            
            // if the target xy is not defined, then use the canvas center
            if (! targetXY) {
                targetXY = T5.D.getCenter(dimensions);
            } // if
            
            self.animate(
                    targetScaling, 
                    startXY, 
                    targetXY, 
                    tweenFn, 
                    callback);

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
            return T5.V.copy(offset);
        },
        
        setOffset: function(x, y) {
            offset.x = x; 
            offset.y = y;
        },
        
        updateOffset: function(x, y, tweenFn, tweenDuration) {
            
            function updateOffsetAnimationEnd() {
                panEnd(0, 0);
            } // updateOffsetAnimationEnd
            
            if (tweenFn) {
                var endPosition = new T5.Vector(x, y);

                var tweens = T5.Animation.tweenVector(
                                offset, 
                                endPosition.x, 
                                endPosition.y, 
                                tweenFn, 
                                updateOffsetAnimationEnd,
                                tweenDuration);

                // set the tweens to cancel on interact
                for (var ii = tweens.length; ii--; ) {
                    tweens[ii].cancelOnInteract = true;
                    tweens[ii].requestUpdates(function(updatedValue, complete) {
                        wake();
                        
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
            panimating = false;
            scaleFactor = newScaleFactor;
            scaling = scaleFactor !== 1;

            startCenter = T5.D.getCenter(self.getDimensions());
            endCenter = scaleFactor > 1 ? T5.V.copy(targetXY) : T5.D.getCenter(self.getDimensions());
            startRect = null;
            
            clearTimeout(rescaleTimeout);

            if (scaling) {
                state = T5.ViewState.PINCHZOOM;

                wake();
                if (rescaleAfter) {
                    rescaleTimeout = setTimeout(function() {
                        scaleView();
                        resetZoom();
                    }, parseInt(rescaleAfter, 10));
                } // if
            } // if
        }
    };

    // listen for layer removals
    GRUNT.WaterCooler.listen("layer.remove", function(args) {
        if (args.id) {
            self.removeLayer(args.id);
        } // if
    });
    
    deviceScaling = T5.Device.getConfig().getScaling();
    
    // make the view observable
    GRUNT.observable(self);
    
    // listen for being woken up
    self.bind("wake", wake);
    
    // handle invalidation
    self.bind("invalidate", invalidate);
    
    self.bind("pan", pan);
    self.bind("panEnd", panEnd);
    self.bind("pinchZoom", pinchZoom);
    self.bind("pinchZoomEnd", pinchZoomEnd);
    self.bind("wheelZoom", wheelZoom);
    
    // handle intertia events
    self.bind("inertiaPan", panInertia);
    self.bind("inertiaCancel", function() {
        panimating = false;
        wake();
    });
    
    // make the view configurable
    GRUNT.configurable(
        self, 
        ["inertia", "container"], 
        GRUNT.paramTweaker(params, null, {
            "container": handleContainerUpdate
        }),
        true);
    
    // attach the map to the canvas
    attachToCanvas();
    
    return self;
}; // T5.View
