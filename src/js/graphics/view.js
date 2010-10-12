/**
View
====

The View is the fundamental building block for tiling and 
mapping interface.  Which this class does not implement any of 
the logic required for tiling, it does handle the redraw logic.  
Applications implementing Tile5 maps will not need to be aware of 
the implementation specifics of the View, but for those interested 
in building extensions or customizations should definitely take a look.  
Additionally, it is worth being familiar with the core methods that 
are implemented here around the layering as these are used extensively 
when creating overlays and the like for the map implementations.

## Constructor Parameters (Required)

- `container` 

## Constructor Parameters (Optional)

- `id`

- `autoSize`

- `fastDraw`

- `intertia`

- `pannable`

- `scalable`

- `panAnimationEasing`

- `panAnimationDuration`

- `pinchZoomAnimateTrigger`

- `adjustScaleFactor`

## Methods

*/
T5.View = function(params) {
    // initialise defaults
    params = T5.ex({
        id: GT.objId('view'),
        container: "",
        fastDraw: false,
        inertia: true,
        pannable: true,
        scalable: true,
        panAnimationEasing: T5.easing('sine.out'),
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
        cycleWorker = null,
        frozen = false,
        deviceScaling = 1,
        dimensions = null,
        wakeTriggers = 0,
        endCenter = null,
        idle = false,
        panimating = false,
        paintTimeout = 0,
        idleTimeout = 0,
        rescaleTimeout = 0,
        zoomCenter = null,
        rotation = 0,
        tickCount = 0,
        scaling = false,
        startRect = null,
        endRect = null,
        scaleFactor = 1,
        lastDrawScaleFactor = 1,
        aniProgress = null,
        tweenStart = null,
        startCenter = null,
        isFlash = typeof FlashCanvas !== 'undefined',
        touchHelper = null,
        
        /* state shortcuts */
        
        stateActive = T5.viewState('ACTIVE'),
        statePan = T5.viewState('PAN'),
        statePinch = T5.viewState('PINCH'),
        
        state = stateActive;
        
    // some function references for speed
    var vectorRect = T5.V.getRect,
        dimensionsSize = T5.D.getSize,
        rectCenter = T5.R.getCenter;
        
    /* panning functions */
    
    function pan(x, y, tweenFn, tweenDuration) {
        // update the offset by the specified amount
        panimating = typeof(tweenFn) !== "undefined";

        state = statePan;
        wake();
        self.updateOffset(offset.x + x, offset.y + y, tweenFn, tweenDuration);
    } // pan
    
    function panInertia(x, y) {
        if (params.inertia) {
            pan(x, y, params.panAnimationEasing, params.panAnimationDuration);
        } // if
    } // panIntertia
    
    function panEnd(x, y) {
        state = stateActive;
        panimating = false;
        
        GT.Loopage.join({
            execute: wake,
            after: 50,
            single: true
        });
    } // panEnd
    
    /* scaling functions */
    
    function resetZoom() {
        scaleFactor = 1;
    } // resetZoom
    
    function checkTouches(start, end) {
        startRect = vectorRect(start);
        endRect = vectorRect(end);

        // get the sizes of the rects
        var startSize = dimensionsSize(startRect.dimensions),
            endSize = dimensionsSize(endRect.dimensions);

        // update the zoom center
        startCenter = rectCenter(startRect);
        endCenter = rectCenter(endRect);

        // determine the ratio between the start rect and the end rect
        scaleFactor = (startRect && (startSize !== 0)) ? (endSize / startSize) : 1;
    } // checkTouches            
    
    function pinchZoom(touchesStart, touchesCurrent) {
        checkTouches(touchesStart, touchesCurrent);
        scaling = scaleFactor !== 1;
        
        if (scaling) {
            state = statePinch;
            wake();
        } // if
    } // pinchZoom
    
    function pinchZoomEnd(touchesStart, touchesEnd, pinchZoomTime) {
        checkTouches(touchesStart, touchesEnd);
        
        if (params.adjustScaleFactor) {
            scaleFactor = params.adjustScaleFactor(scaleFactor);
            GT.Log.info("scale factor adjusted to: " + scaleFactor);
        } // if

        if (pinchZoomTime < params.pinchZoomAnimateTrigger) {
            // TODO: move this to the map to override
            animateZoom(
                lastDrawScaleFactor, 
                scaleFactor, 
                startCenter, 
                calcPinchZoomCenter(), 
                // TODO: make the animation configurable
                T5.easing('sine.out'),
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
        scaling = false;
        self.trigger("scale", scaleFactor, startRect ? calcPinchZoomCenter() : endCenter);

        state = stateActive;
        wake();
    } // scaleView
    
    function handleContainerUpdate(name, value) {
        canvas = document.getElementById(value);
        
        // attach to the new canvas
        attachToCanvas();
    } // handleContainerUpdate
    
    function handleRotationUpdate(name, value) {
        rotation = value;
    } // handlePrepCanvasCallback
    
    /* private functions */
    
    function attachToCanvas() {
        if (canvas) {
            T5.resetTouch(canvas);

            // if we are autosizing the set the size
            if (params.autoSize) {
                canvas.height = window.innerHeight - canvas.offsetTop;
                canvas.width = window.innerWidth - canvas.offsetLeft;
            } // if

            try {
                mainContext = canvas.getContext('2d');
                mainContext.globalCompositeOperation = 'source-over';
                mainContext.clearRect(0, 0, canvas.width, canvas.height);
            } 
            catch (e) {
                GT.Log.exception(e);
                throw new Error("Could not initialise canvas on specified view element");
            }
            
            // capture touch events
            touchHelper = T5.captureTouch(canvas, {
                observable: self
            });
            
            // enable inertia if configured
            if (params.inertia) {
                touchHelper.inertiaEnable(params.panAnimationDuration, dimensions);
            } // if
            
            // get the dimensions
            dimensions = self.getDimensions();
            
            // iterate through the layers, and change the context
            for (var ii = layers.length; ii--; ) {
                layerContextChange(layers[ii]);
            } // for

            // tell the view to redraw
            wake();
        } // if        
    } // attachToCanvas
    
    function addLayer(id, value) {
        // make sure the layer has the correct id
        value.setId(id);
        value.added = T5.time();
        
        layerContextChanged(value);
        
        // tell the layer that I'm going to take care of it
        value.setParent(self);
        
        // add the new layer
        layers.push(value);
        
        // sort the layers
        layers.sort(function(itemA, itemB) {
            var result = itemB.zindex - itemA.zindex;
            if (result === 0) {
                result = itemB.added - itemA.added;
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
            var tween = T5.tweenValue(
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
                state = statePinch;
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
    
    function drawView(context, offset, updateRect) {
        var changeCount = 0,
            drawState = panimating ? statePan : (frozen ? T5.viewState('FROZEN') : state),
            startTicks = T5.time(),
            isPinchZoom = (drawState & statePinch) !== 0,
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
            } // if..else
            
            // constrain the draw area where appropriate
            if (! updateRect.invalid) {
                context.beginPath();
                // GT.Log.info("applying clip rect:", updateRect);
                context.rect(
                    updateRect.origin.x, 
                    updateRect.origin.y, 
                    updateRect.dimensions.width,
                    updateRect.dimensions.height);
                context.clip();
            } // if
            
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
        
        GT.Log.trace("draw complete", startTicks);
        
        return changeCount;
    } // drawView
    
    function cycle(tickCount, worker) {
        // check to see if we are panning
        var changed = false,
            updateRect = T5.R.empty(),
            interacting = (! panimating) && 
                ((state === statePinch) || (state === statePan));
                
        // conver the offset x and y to integer values
        // while canvas implementations work fine with real numbers, the actual drawing of images
        // will not look crisp when a real number is used rather than an integer (or so I've found)
        offset.x = Math.floor(offset.x);
        offset.y = Math.floor(offset.y);
        
        if (interacting) {
            T5.cancelAnimation(function(tweenInstance) {
                return tweenInstance.cancelOnInteract;
            });
            
            idle = false;
            if (idleTimeout !== 0) {
                clearTimeout(idleTimeout);
                idleTimeout = 0;
            } // if
        }  // if
        
        // if any of the following are true, then we need to draw the whole canvas so just
        // ignore the rect checking
        updateRect.invalid = clearBackground || 
            (state === T5.viewState('PAN')) || (state === T5.viewState('PINCH')) || 
            T5.isTweening();

        // check that all is right with each layer
        for (var ii = layers.length; ii--; ) {
            layers[ii].cycle(tickCount, offset, state, updateRect);
        } // for
        
        if (updateRect.invalid || (! T5.R.isEmpty(updateRect))) {
            drawView(mainContext, offset, updateRect);
            changed = true;
        } // if

        // include wake triggers in the change count
        if ((! changed) && (wakeTriggers === 0) && (! isFlash)) {
            worker.trigger('complete');
        } 
        else if ((! idle) && (idleTimeout === 0)) {
            idleTimeout = setTimeout(triggerIdle, 500);
        } // if..else
        
        wakeTriggers = 0;
        GT.Log.trace("Completed draw cycle", tickCount);
    } // cycle
    
    function wake() {
        wakeTriggers++;
        if (frozen || cycleWorker) { return; }
        
        // create the cycle worker
        cycleWorker = GT.Loopage.join({
            execute: cycle,
            frequency: 5
        });
        
        // bind to the complete method
        cycleWorker.bind('complete', function() {
            cycleWorker = null;
        });
    } // wake
    
    function layerContextChanged(layer) {
        layer.trigger("contextChanged", mainContext);
    } // layerContextChanged
    
    /* object definition */
    
    // initialise self
    var self = {
        id: params.id,
        deviceScaling: deviceScaling,
        fastDraw: params.fastDraw || T5.getConfig().requireFastDraw,
        
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
        
        /**
        - `centerOn(offset: Vector)`
        
        Move the center of the view to the specified offset
        */
        centerOn: function(offset) {
            self.setOffset(offset.x - (canvas.width / 2), offset.y - (canvas.height / 2));
        },

        /**
        - `getDimensions()`
        
        Return the Dimensions of the View
        */
        getDimensions: function() {
            if (canvas) {
                return new T5.Dimensions(canvas.width, canvas.height);
            } // if
        },
        
        /**
        - `getZoomCenter()`
        
        */
        getZoomCenter: function() {
            return zoomCenter;
        },
        
        /* layer getter and setters */
        
        /**
        - `getLayer(id: String)`
        
        Get the ViewLayer with the specified id, return null if not found
        */
        getLayer: function(id) {
            // look for the matching layer, and return when found
            for (var ii = 0; ii < layers.length; ii++) {
                if (layers[ii].getId() == id) {
                    return layers[ii];
                } // if
            } // for
            
            return null;
        },
        
        /**
        - `setLayer(id: String, value: ViewLayer)`
        
        Either add or update the specified view layer
        */
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

            wake();
        },
        
        /**
        - `eachLayer(callback: Function)`
        
        Iterate through each of the ViewLayers and pass each to the callback function 
        supplied.
        */
        eachLayer: function(callback) {
            // iterate through each of the layers and fire the callback for each 
            for (var ii = 0; ii < layers.length; ii++) {
                callback(layers[ii]);
            } // for
        },
        
        /**
        - `clearBackground()`
        
        */
        clearBackground: function() {
            GT.Log.info("clear background requested");
            clearBackground = true;
            wake();
        },
        
        /**
        - `freeze()`
        
        */
        freeze: function() {
            frozen = true;
        },
        
        /**
        - `unfreeze()`
        
        */
        unfreeze: function() {
            frozen = false;
            
            wake();
        },
        
        /**
        - `scale(targetScaling, tweenFn, callback, startXY, targetXY)`
        
        */
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
        
        /**
        - `removeLayer(id: String)`
        
        Remove the ViewLayer specified by the id
        */
        removeLayer: function(id) {
            var layerIndex = getLayerIndex(id);
            if ((layerIndex >= 0) && (layerIndex < layers.length)) {
                GT.say("layer.removed", { layer: layers[layerIndex] });

                layers.splice(layerIndex, 1);
            } // if
        },
        
        /* offset methods */
        
        /**
        - `getOffset()`
        
        Return a Vector containing the current view offset
        */
        getOffset: function() {
            return T5.V.copy(offset);
        },
        
        /**
        - `setOffset(x: Integer, y: Integer)`
        
        */
        setOffset: function(x, y) {
            offset.x = x; 
            offset.y = y;
        },
        
        /**
        - `updateOffset(x, y, tweenFn, tweenDuration, callback)`
        
        */
        updateOffset: function(x, y, tweenFn, tweenDuration, callback) {
            
            function updateOffsetAnimationEnd() {
                panEnd(0, 0);
                if (callback) {
                    callback();
                } // if
            } // updateOffsetAnimationEnd
            
            if (tweenFn) {
                var endPosition = new T5.Vector(x, y);

                var tweens = T5.tweenVector(
                                offset, 
                                endPosition.x, 
                                endPosition.y, 
                                tweenFn, 
                                updateOffsetAnimationEnd,
                                tweenDuration);

                // set the tweens to cancel on interact
                for (var ii = tweens.length; ii--; ) {
                    tweens[ii].cancelOnInteract = true;
                    tweens[ii].requestUpdates(wake);
                } // for

                // set the panimating flag to true
                panimating = true;
            }
            else {
                self.setOffset(x, y);
            } // if..else
        },
        
        /**
        - `zoom(targetXY, newScaleFactor, rescaleAfter)`
        
        */
        zoom: function(targetXY, newScaleFactor, rescaleAfter) {
            panimating = false;
            scaleFactor = newScaleFactor;
            scaling = scaleFactor !== 1;

            startCenter = T5.D.getCenter(self.getDimensions());
            endCenter = scaleFactor > 1 ? T5.V.copy(targetXY) : T5.D.getCenter(self.getDimensions());
            startRect = null;
            
            clearTimeout(rescaleTimeout);

            if (scaling) {
                state = statePinch;
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
    GT.listen("layer.remove", function(args) {
        if (args.id) {
            self.removeLayer(args.id);
        } // if
    });
    
    deviceScaling = T5.getConfig().getScaling();
    
    // make the view observable
    GT.observable(self);
    
    // listen for being woken up
    self.bind("wake", wake);
    
    // handle invalidation
    self.bind("invalidate", self.clearBackground);
    
    // if this is pannable, then attach event handlers
    if (params.pannable) {
        self.bind("pan", pan);
        self.bind("panEnd", panEnd);

        // handle intertia events
        self.bind("inertiaPan", panInertia);
        self.bind("inertiaCancel", function() {
            panimating = false;
            wake();
        });
    } // if

    // if this view is scalable, attach zooming event handlers
    if (params.scalable) {
        self.bind("pinchZoom", pinchZoom);
        self.bind("pinchZoomEnd", pinchZoomEnd);
        self.bind("wheelZoom", wheelZoom);
    } // if
    
    // make the view configurable
    GT.configurable(
        self, 
        ["inertia", "container", 'rotation'], 
        GT.paramTweaker(params, null, {
            "container": handleContainerUpdate,
            'rotation':  handleRotationUpdate
        }),
        true);
    
    // attach the map to the canvas
    attachToCanvas();
    
    return self;
}; // T5.View

