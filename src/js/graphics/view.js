/**
# T5.View
The View is the fundamental building block for tiling and 
mapping interface.  Which this class does not implement any of 
the logic required for tiling, it does handle the redraw logic.  
Applications implementing Tile5 maps will not need to be aware of 
the implementation specifics of the View, but for those interested 
in building extensions or customizations should definitely take a look.  
Additionally, it is worth being familiar with the core methods that 
are implemented here around the layering as these are used extensively 
when creating overlays and the like for the map implementations.

## Constructor
`T5.View(params)`

### Initialization Parameters

- `container` (required)

- `id`

- `autoSize`

- `fastDraw`

- `inertia`

- `pannable`

- `scalable`

- `panAnimationEasing`

- `panAnimationDuration`

- `pinchZoomAnimateTrigger`

- `adjustScaleFactor`

- `fps` (int, default = 25) - the frame rate of the view, by default this is set to 
25 frames per second but can be increased or decreased to compensate for device 
performance.  In reality though on slower devices, the framerate will scale back 
automatically, but it can be prudent to set a lower framerate to leave some cpu for 
other processes :)


## Events

### scale
This event is fired when the view has been scaled.
<pre>
view.bind('scale', function(evt, scaleFactor, scaleXY) {
});
</pre>

- scaleFactor (Float) - the amount the view has been scaled by.
When the view is being scaled down this will be a value less than
1 and when it is being scaled up it will be greater than 1.
- scaleXY (T5.Vector) - the relative position on the view where
the scaling operation is centered.


### tap
This event is fired when the view has been tapped (or the left
mouse button has been pressed)
<pre>
view.bind('tap', function(evt, absXY, relXY, gridXY) {
});
</pre>

- absXY (T5.Vector) - the absolute position of the tap
- relXY (T5.Vector) - the position of the tap relative to the top left
position of the view.
- gridXY (T5.Vector) - the xy coordinates of the tap relative to the
scrolling grid offset.


### resize
This event is fired when the view has been resized (either manually or
automatically).
<pre>
view.bind('resize', function(evt, width, height) {

});
</pre>

### idle
This event is fired once the view has gone into an idle state (once draw
operations haven't been required for 500ms).
<pre>
view.bind('idle', function(evt) {
});
</pre>

### drawComplete
Triggered when drawing the view has been completed (who would have thought).
<pre>
view.bind('drawComplete', function(evt, offset, tickCount) {
});
</pre>

- offset (T5.Vector) - the view offset that was used for the draw operation
- tickCount - the tick count at the start of the draw operation.


## Methods
*/
T5.View = function(params) {
    // initialise defaults
    params = T5.ex({
        id: COG.objId('view'),
        container: "",
        fastDraw: false,
        inertia: true,
        pannable: true,
        scalable: true,
        panAnimationEasing: T5.easing('sine.out'),
        panAnimationDuration: 750,
        pinchZoomAnimateTrigger: 400,
        adjustScaleFactor: null,
        autoSize: true,
        tapExtent: 10,
        fps: 25
    }, params);
    
    // get the container context
    var layers = [],
        layerCount = 0,
        canvas = document.getElementById(params.container),
        mainContext = null,
        offsetX = 0,
        offsetY = 0,
        cycleOffset = null,
        cycleRect = null,
        clearBackground = false,
        cycleWorker = null,
        deviceScaling = 1,
        dimensions = T5.D.init(),
        wakeTriggers = 0,
        endCenter = null,
        idle = false,
        panimating = false,
        paintTimeout = 0,
        idleTimeout = 0,
        rescaleTimeout = 0,
        zoomCenter = T5.XY.init(),
        rotation = 0,
        tickCount = 0,
        scaling = false,
        startRect = null,
        endRect = null,
        stateOverride = null,
        redraw = false,
        redrawEvery = 40,
        resizeCanvasTimeout = 0,
        scaleFactor = 1,
        lastScaleFactor = 0,
        lastDrawScaleFactor = 1,
        aniProgress = null,
        tweenStart = null,
        startCenter = null,
        isFlash = typeof FlashCanvas !== 'undefined',
        cycleDelay = ~~(1000 / params.fps),
        touchHelper = null,
        
        /* state shortcuts */
        
        stateActive = T5.viewState('ACTIVE'),
        statePan = T5.viewState('PAN'),
        statePinch = T5.viewState('ZOOM'),
        stateAnimating = T5.viewState('ANIMATING'),
        
        state = stateActive;
        
    // some function references for speed
    var vectorRect = T5.XY.getRect,
        rectDiagonal = T5.XYRect.diagonalSize,
        rectCenter = T5.XYRect.center;
        
    /* event handlers */
    
    function handlePan(evt, x, y, inertia) {
        state = statePan;
        wake();
        
        if (inertia && params.inertia) {
            // update the offset by the specified amount
            panimating = true;
            updateOffset(offsetX + x, offsetY + y, params.panAnimationEasing, params.panAnimationDuration);
        }
        else if (! inertia) {
            updateOffset(offsetX + x, offsetY + y);
        } // if..else
    } // pan
    
    function panEnd(evt, x, y) {
        state = stateActive;
        panimating = false;
        
        COG.Loopage.join({
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
        var startSize = rectDiagonal(startRect),
            endSize = rectDiagonal(endRect);

        // update the zoom center
        startCenter = rectCenter(startRect);
        endCenter = rectCenter(endRect);

        // determine the ratio between the start rect and the end rect
        scaleFactor = (startRect && (startSize !== 0)) ? (endSize / startSize) : 1;
    } // checkTouches            
    
    function pinchZoom(evt, touchesStart, touchesCurrent) {
        checkTouches(touchesStart, touchesCurrent);
        scaling = scaleFactor !== 1;
        
        if (scaling) {
            state = statePinch;
            wake();
        } // if
    } // pinchZoom
    
    function pinchZoomEnd(evt, touchesStart, touchesEnd, pinchZoomTime) {
        checkTouches(touchesStart, touchesEnd);
        
        if (params.adjustScaleFactor) {
            scaleFactor = params.adjustScaleFactor(scaleFactor);
            COG.Log.info("scale factor adjusted to: " + scaleFactor);
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
    
    function wheelZoom(evt, relXY, zoom) {
        self.zoom(relXY, Math.min(Math.pow(2, Math.round(Math.log(zoom))), 8), 500);
    } // wheelZoom
    
    function scaleView() {
        var scaleEndXY = startRect ? calcPinchZoomCenter() : endCenter;
        
        // round the scaling factor to 1 decimal place
        scaleFactor = Math.round(scaleFactor * 10) / 10;
        
        // flag scaling as false
        scaling = false;
        
        // flag to the layers that we are scaling
        for (var ii = layers.length; ii--; ) {
            layers[ii].trigger('scale', scaleFactor, scaleEndXY);
        } // for

        // trigger the scale
        self.trigger("scale", scaleFactor, scaleEndXY);
        
        state = stateActive;
        wake();
    } // scaleView
    
    function handleContainerUpdate(name, value) {
        canvas = document.getElementById(value);
        
        // attach to the new canvas
        attachToCanvas();
    } // handleContainerUpdate
    
    function handleResize(evt) {
        clearTimeout(resizeCanvasTimeout);
        resizeCanvasTimeout = setTimeout(attachToCanvas, 50);
    } // handleResize
    
    function handleRotationUpdate(name, value) {
        rotation = value;
    } // handlePrepCanvasCallback
    
    function handleTap(evt, absXY, relXY) {
        // calculate the grid xy
        var gridXY = T5.XY.offset(relXY, offsetX, offsetY);
        
        // iterate through the layers, and inform of the tap event
        for (var ii = layers.length; ii--; ) {
            evt.cancel = evt.cancel || 
                layers[ii].trigger('tap', absXY, relXY, gridXY).cancel;
        } // for
    } // handleTap
    
    /* exports */
    
    /**
    ### pan(x, y, tweenFn, tweenDuration, callback)
    */
    function pan(x, y, tweenFn, tweenDuration, callback) {
        updateOffset(offsetX + x, offsetY + y, tweenFn, tweenDuration, callback);
    } // pan
        
    /**
    ### updateOffset(x, y, tweenFn, tweenDuration, callback)
    */
    function updateOffset(x, y, tweenFn, tweenDuration, callback) {
        
        // initialise variables
        var tweensComplete = 0;
        
        function updateOffsetAnimationEnd() {
            tweensComplete += 1;
            
            if (tweensComplete >= 2) {
                panEnd(0, 0);
                if (callback) {
                    callback();
                } // if
            } // if
        } // updateOffsetAnimationEnd
        
        if (tweenFn) {
            var tweenX = T5.tweenValue(offsetX, x, tweenFn, 
                    updateOffsetAnimationEnd, tweenDuration),
                    
                tweenY = T5.tweenValue(offsetY, y, tweenFn, 
                    updateOffsetAnimationEnd, tweenDuration);
                    
            // attach update listeners
            tweenX.cancelOnInteract = true;
            tweenX.requestUpdates(function(updatedVal) {
                offsetX = updatedVal;
                panimating = true;
                wake();
            });
            
            tweenY.cancelOnInteract = true;
            tweenY.requestUpdates(function(updatedVal) {
                offsetY = updatedVal;
                panimating = true;
                wake();
            });
        }
        else {
            offsetX = x;
            offsetY = y;
        } // if..else
    } // updateOffset
    
    /* private functions */
    
    function attachToCanvas() {
        var ii;
        
        if (canvas) {
            COG.Touch.release(canvas);

            // if we are autosizing the set the size
            if (params.autoSize && canvas.parentNode) {
                var rect = canvas.parentNode.getBoundingClientRect();
                
                if (rect.height !== 0 && rect.width !== 0) {
                    canvas.height = rect.height;
                    canvas.width = rect.width;
                } // if
            } // if

            try {
                // ensure that the canvas has an id, as the styles reference it
                if (! canvas.id) {
                    canvas.id = params.id + '_canvas';
                } // if
                
                // get the canvas context
                mainContext = canvas.getContext('2d');
                mainContext.clearRect(0, 0, canvas.width, canvas.height);
            } 
            catch (e) {
                COG.Log.exception(e);
                throw new Error("Could not initialise canvas on specified view element");
            }
            
            // capture touch events
            touchHelper = COG.Touch.capture(canvas, {
                observable: self
            });
            
            // initialise the dimensions
            if (dimensions.height !== canvas.height || dimensions.width !== canvas.width) {
                dimensions = T5.D.init(canvas.width, canvas.height);
                
                // trigger the resize event for the view
                self.trigger('resize', canvas.width, canvas.height);
                
                // and then tell all the layers
                for (ii = layerCount; ii--; ) {
                    layers[ii].trigger('resize', canvas.width, canvas.height);
                } // for
            } // if
            
            // enable inertia if configured
            if (params.inertia) {
                touchHelper.inertiaEnable(params.panAnimationDuration, dimensions);
            } // if
            
            // iterate through the layers, and change the context
            for (ii = layerCount; ii--; ) {
                layerContextChanged(layers[ii]);
            } // for

            // tell the view to redraw
            invalidate();
        } // if        
    } // attachToCanvas
    
    function addLayer(id, value) {
        // make sure the layer has the correct id
        value.setId(id);
        value.added = T5.ticks();
        
        // bind to the remove event
        value.bind('remove', function() {
            self.removeLayer(id);
        });
        
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
        
        // update the layer count
        layerCount = layers.length;
        return value;
    } // addLayer
    
    function getLayerIndex(id) {
        for (var ii = layerCount; ii--; ) {
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
        startCenter = T5.XY.offset(startXY, cycleRect.x1, cycleRect.y1);
        endCenter = T5.XY.offset(targetXY, cycleRect.x1, cycleRect.y1);
        startRect = null;

        COG.Log.info('zoom from: ', startCenter);
        COG.Log.info('zoom to:   ', endCenter);
        
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
            endDist = T5.XY.distance([endCenter, center]),
            endTheta = T5.XY.theta(endCenter, center, endDist),
            shiftDelta = T5.XY.diff(startCenter, endCenter);
            
        center = T5.XY.extendBy(endCenter, endTheta, endDist / scaleFactor);

        center.x = center.x + shiftDelta.x;
        center.y = center.y + shiftDelta.y; 
        
        return center;
    } // calcPinchZoomCenter
    
    function calcZoomCenter() {
        var displayCenter = T5.D.getCenter(dimensions),
            shiftFactor = (aniProgress ? aniProgress : 1) / 2,
            centerOffset = T5.XY.diff(startCenter, endCenter);

        if (startRect) {
            zoomCenter.x = endCenter.x + centerOffset.x;
            zoomCenter.y = endCenter.y + centerOffset.y;
        } 
        else {
            zoomCenter.x = endCenter.x - centerOffset.x * shiftFactor;
            zoomCenter.y = endCenter.y - centerOffset.y * shiftFactor;
        } // if..else
    } // calcZoomCenter
    
    function triggerIdle() {
        self.trigger('idle', self);
        
        idle = true;
        idleTimeout = 0;
    } // idle
    
    function drawView(context, drawState, rect, redraw, tickCount) {
        var isPinchZoom = (drawState & statePinch) !== 0,
            delayDrawLayers = [],
            ii = 0;

        // Change to force update
        if (clearBackground || isPinchZoom) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            clearBackground = false;
        } // if
        
        // if we are scaling then do some calcs
        if (isPinchZoom) {
            calcZoomCenter();
            
            // offset the draw args
            // rect.x1 += zoomCenter.x;
            // rect.y1 += zoomCenter.y;
            // rect.x2 += zoomCenter.x;
            // rect.y2 += zoomCenter.y;
            // offset = T5.XY.offset(offset, zoomCenter.x, zoomCenter.y);
        } // if
        
        // COG.Log.info("draw state = " + drawState);
        
        context.save();
        try {
            lastDrawScaleFactor = scaleFactor;
            
            // if the device dpi has scaled, then apply that to the display
            if (deviceScaling !== 1) {
                context.scale(deviceScaling, deviceScaling);
            }
            // if we are scaling, then tell the canvas to scale
            else if (isPinchZoom) {
                // context.translate(endCenter.x, endCenter.y);
                // context.translate(-rect.width / 2, -rect.height / 2 * scaleFactor);
                context.scale(scaleFactor, scaleFactor);
            } // if..else
            
            context.translate(-rect.x1, -rect.y1);
            
            for (ii = layerCount; ii--; ) {
                // draw the layer output to the main canvas
                // but only if we don't have a scale buffer or the layer is a draw on scale layer
                if (layers[ii].shouldDraw(drawState, rect, redraw)) {
                    layers[ii].draw(
                        context, 
                        rect, 
                        drawState, 
                        self,
                        redraw,
                        tickCount);
                        
                    // trigger that the draw has been completed
                    layers[ii].trigger('drawComplete', rect, tickCount);
                } // if
            } // for
        }
        finally {
            context.restore();
        } // try..finally
        
        // trigger the draw complete for the view
        self.trigger('drawComplete', rect, tickCount);
        COG.Log.trace("draw complete", tickCount);
    } // drawView
    
    function cycle(tickCount, worker) {
        // check to see if we are panning
        var draw = false,
            currentState = stateOverride ? stateOverride : (panimating ? statePan : state),
            interacting = (! panimating) && 
                ((currentState === statePinch) || (currentState === statePan)),
            // if any of the following are true, then we need to draw the whole canvas so just
            requireRedraw = redraw || 
                        currentState === statePan || 
                        currentState === statePinch || 
                        T5.isTweening();

        // convert the offset x and y to integer values
        // while canvas implementations work fine with real numbers, the actual drawing of images
        // will not look crisp when a real number is used rather than an integer (or so I've found)
        cycleOffset = T5.XY.init(offsetX >> 0, offsetY >> 0);
        
        // calculate the cycle rect
        cycleRect = T5.XYRect.fromCenter(
                        cycleOffset.x, 
                        cycleOffset.y, 
                        dimensions.width, 
                        dimensions.height);
        
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
        
        for (var ii = layerCount; ii--; ) {
            if (layers[ii].animated) {
                // add the animating state to the current state
                state = state | stateAnimating;
            } // if
            
            draw = layers[ii].cycle(tickCount, cycleRect, state, requireRedraw) || draw;
        } // for
        
        // update the require redraw state based on whether we are now in an animating state
        requireRedraw = requireRedraw || ((state & stateAnimating) !== 0);
        
        // if we are scaling and at the same scale factor, don't redraw as its a waste of time
        draw = draw || requireRedraw || ((scaleFactor !== 1) && (scaleFactor !== lastScaleFactor));
        if (draw) {
            drawView(mainContext, currentState, cycleRect, requireRedraw, tickCount);
            lastScaleFactor = scaleFactor;
            
            // reset draw monitoring variables
            redraw = false;
        } // if

        // include wake triggers in the change count
        if ((! draw) && (wakeTriggers === 0) && (! isFlash)) {
            if ((! idle) && (idleTimeout === 0)) {
                idleTimeout = setTimeout(triggerIdle, 500);
            } // if

            worker.trigger('complete');
        } // if
        
        wakeTriggers = 0;
        COG.Log.trace("Completed draw cycle", tickCount);
    } // cycle
    
    function invalidate() {
        redraw = true;
        wake();
    } // invalidate
    
    function wake() {
        wakeTriggers += 1;
        if (cycleWorker) { return; }
        
        // create the cycle worker
        cycleWorker = COG.Loopage.join({
            execute: cycle,
            frequency: cycleDelay
        });
        
        // bind to the complete method
        cycleWorker.bind('complete', function(evt) {
            cycleWorker = null;
        });
    } // wake
    
    function layerContextChanged(layer) {
        layer.trigger("contextChanged", mainContext);
    } // layerContextChanged
    
    /* exports */
    
    /**
    ### eachLayer(callback)
    Iterate through each of the ViewLayers and pass each to the callback function 
    supplied.
    */
    function eachLayer(callback) {
        // iterate through each of the layers and fire the callback for each
        for (var ii = layerCount; ii--; ) {
            callback(layers[ii]);
        } // for
    } // eachLayer
    
    /**
    ### getLayer(id)
    Get the ViewLayer with the specified id, return null if not found
    */
    function getLayer(id) {
        // look for the matching layer, and return when found
        for (var ii = 0; ii < layerCount; ii++) {
            if (layers[ii].getId() == id) {
                return layers[ii];
            } // if
        } // for
        
        return null;
    } // getLayer
    
    /**
    ### getViewRect()
    Return a T5.XYRect for the last drawn view rect
    */
    function getViewRect() {
        return cycleRect ? cycleRect : T5.XYRect.fromCenter(
                                        offsetX, 
                                        offsetY, 
                                        dimensions.width, 
                                        dimensions.height);
    } // getViewRect
    
    /**
    ### setLayer(id: String, value: T5.ViewLayer)
    Either add or update the specified view layer
    */
    function setLayer(id, value) {
        // if the layer already exists, then remove it
        for (var ii = 0; ii < layerCount; ii++) {
            if (layers[ii].getId() === id) {
                layers.splice(ii, 1);
                break;
            } // if
        } // for
        
        if (value) {
            addLayer(id, value);
        } // if

        invalidate();
    } // setLayer
    
    /**
    ### triggerAll(eventName, args*)
    Trigger an event on the view and all layers currently contained in the view
    */
    function triggerAll() {
        self.trigger.apply(null, arguments);
        for (var ii = layers.length; ii--; ) {
            layers[ii].trigger.apply(null, arguments);
        } // for
    } // triggerAll
    
    /* object definition */
    
    // initialise self
    var self = {
        id: params.id,
        deviceScaling: deviceScaling,
        fastDraw: params.fastDraw || T5.getConfig().requireFastDraw,

        /**
        ### animate(targetScaleFactor, startXY, targetXY, tweenFn, callback)
        Performs an animated zoom on the T5.View.
        */
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
        ### centerOn(offset: Vector)
        Move the center of the view to the specified offset
        */
        centerOn: function(offset) {
            offsetX = offset.x - (canvas.width / 2);
            offsetY = offset.y - (canvas.height / 2);
        },

        /**
        ### getDimensions()
        Return the Dimensions of the View
        */
        getDimensions: function() {
            return dimensions;
        },
        
        /**
        ### getZoomCenter()
        */
        getZoomCenter: function() {
            return zoomCenter;
        },
        
        getLayer: getLayer,
        setLayer: setLayer,
        eachLayer: eachLayer,
        
        /**
        ### clearBackground()
        **deprecated**
        */
        clearBackground: function() {
            COG.Log.info('CALL OF DEPRECATED METHOD CLEAR BACKGROUND');
            
            clearBackground = true;
            invalidate();
        },
        
        /**
        ### invalidate()
        The `invalidate` method is used to inform the view that a full redraw
        is required
        */
        invalidate: invalidate,
        
        /**
        ### resize(width: Int, height: Int)
        Perform a manual resize of the canvas associated with the view.  If the 
        view was originally marked as `autosize` this will override that instruction.
        */
        resize: function(width, height) {
            // if the canvas is assigned, then update the height and width and reattach
            if (canvas) {
                // flag the canvas as not autosize
                params.autoSize = false;
                
                // update the canvas width and height
                canvas.width = width;
                canvas.height = height;
                attachToCanvas();

                // trigger the resize event for the view
                self.trigger('resize', canvas.width, canvas.height);
            } // if
        },
        
        /**
        ### scale(targetScaling, tweenFn, callback, startXY, targetXY)
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
        
        triggerAll: triggerAll,
        
        /**
        ### removeLayer(id: String)
        Remove the T5.ViewLayer specified by the id
        */
        removeLayer: function(id) {
            var layerIndex = getLayerIndex(id);
            if ((layerIndex >= 0) && (layerIndex < layerCount)) {
                COG.say("layer.removed", { layer: layers[layerIndex] });

                layers.splice(layerIndex, 1);
                invalidate();
            } // if
            
            // update the layer count
            layerCount = layers.length;
        },
        
        /**
        ### stateOverride(state)
        This function is used to define an override state for the view
        */
        stateOverride: function(value) {
            stateOverride = value;
        },
        
        /* offset methods */
        
        /**
        ### getOffset()
        Return a T5.Vector containing the current view offset
        */
        getOffset: function() {
            // return the last calculated cycle offset
            return cycleOffset ? cycleOffset : T5.XY.init(offsetX, offsetY);
        },
        
        getViewRect: getViewRect,
        updateOffset: updateOffset,
        pan: pan,
        
        /**
        ### zoom(targetXY, newScaleFactor, rescaleAfter)
        */
        zoom: function(targetXY, newScaleFactor, rescaleAfter) {
            panimating = false;
            scaleFactor = newScaleFactor;
            scaling = scaleFactor !== 1;
            
            startCenter = T5.D.getCenter(dimensions);
            endCenter = T5.XY.offset(
                scaleFactor > 1 ? T5.XY.copy(targetXY) : T5.D.getCenter(dimensions),
                cycleRect.x1, cycleRect.y1);
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

    deviceScaling = T5.getConfig().getScaling();
    
    // add the markers layer
    self.markers = addLayer('markers', new T5.MarkerLayer());
    
    // make the view observable
    COG.observable(self);
    
    // listen for being woken up
    self.bind("wake", wake);
    self.bind("invalidate", invalidate);
    
    // if this is pannable, then attach event handlers
    if (params.pannable) {
        self.bind("pan", handlePan);
        self.bind("panEnd", panEnd);

        // handle intertia events
        self.bind("inertiaCancel", function(evt) {
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
    
    // handle tap events
    self.bind('tap', handleTap);
    
    // make the view configurable
    COG.configurable(
        self, 
        ["inertia", "container", 'rotation', 'tapExtent', 'scalable', 'pannable'], 
        COG.paramTweaker(params, null, {
            "container": handleContainerUpdate,
            'rotation':  handleRotationUpdate
        }),
        true);
    
    // attach the map to the canvas
    attachToCanvas();
    
    // if autosized, then listen for resize events
    if (params.autoSize) {
        window.addEventListener('resize', handleResize, false);
    } // if
    
    return self;
}; // T5.View

