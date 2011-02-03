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
view.bind('drawComplete', function(evt, viewRect, tickCount) {
});
</pre>

- offset (T5.Vector) - the view offset that was used for the draw operation
- tickCount - the tick count at the start of the draw operation.


## Methods
*/
var View = function(params) {
    // initialise defaults
    params = COG.extend({
        id: COG.objId('view'),
        container: "",
        fastDraw: false,
        inertia: true,
        pannable: true,
        scalable: true,
        interactive: true,
        panAnimationEasing: COG.easing('sine.out'),
        panAnimationDuration: 750,
        pinchZoomAnimateTrigger: 400,
        adjustScaleFactor: null,
        autoSize: true,
        tapExtent: 10,
        mask: true,
        guides: false,
        fps: 25
    }, params);
    
    // get the container context
    var layers = [],
        layerCount = 0,
        canvas = document.getElementById(params.container),
        mainContext = null,
        offsetX = 0,
        offsetY = 0,
        clipping = false,
        cycleRect = null,
        cycleWorker = null,
        drawRect,
        guides = params.guides,
        deviceScaling = 1,
        dimensions = Dimensions.init(),
        wakeTriggers = 0,
        halfWidth = 0,
        halfHeight = 0,
        interactOffset = null,
        interactCenter = null,
        idle = false,
        panimating = false,
        paintTimeout = 0,
        idleTimeout = 0,
        panEndTimeout = 0,
        rescaleTimeout = 0,
        layerMinXY = null,
        layerMaxXY = null,
        rotation = 0,
        tickCount = 0,
        stateOverride = null,
        redrawView = false,
        redrawEvery = 40,
        resizeCanvasTimeout = 0,
        scaleTouchesStart = null,
        scaleFactor = 1,
        lastScaleFactor = 0,
        tweenStart = null,
        eventMonitor = null,
        isFlash = typeof FlashCanvas !== 'undefined',
        cycleDelay = ~~(1000 / params.fps),
        zoomCenter,
        zoomX, zoomY,
        
        /* state shortcuts */
        
        stateActive = viewState('ACTIVE'),
        statePan = viewState('PAN'),
        stateZoom = viewState('ZOOM'),
        stateAnimating = viewState('ANIMATING'),
        
        state = stateActive;
        
    // some function references for speed
    var vectorRect = XY.getRect,
        rectDiagonal = XYRect.diagonalSize,
        rectCenter = XYRect.center;
        
    /* event handlers */
    
    function handlePan(evt, x, y, inertia) {
        state = statePan;
        invalidate();
        
        if (inertia && params.inertia) {
            updateOffset(
                offsetX - x, 
                offsetY - y, 
                params.panAnimationEasing, 
                params.panAnimationDuration);
        }
        else if (! inertia) {
            updateOffset(
                offsetX - x, 
                offsetY - y);
        } // if..else
        
        clearTimeout(panEndTimeout);
        panEndTimeout = setTimeout(panEnd, 100);
    } // pan
    
    /* scaling functions */
    
    function panEnd() {
        state = stateActive;
        panimating = false;
        invalidate();
    } // panEnd
    
    function handleZoom(evt, absXY, relXY, scaleChange) {
        // TODO: the xy position should be between the relXY and the center of the view
        self.zoom(relXY, scaleChange);
    } // handleWheelZoom
    
    function scaleView(fullInvalidate) {
        calcZoomRect();
        
        var scaledHalfWidth = (cycleRect.width / (scaleFactor * 2)) >> 0,
            scaledHalfHeight = (cycleRect.height / (scaleFactor * 2)) >> 0,
            scaleEndXY = XY.init(zoomX - scaledHalfWidth, zoomY - scaledHalfHeight),
            scaleFactorExp = (Math.log(scaleFactor) / Math.LN2) >> 0;
            
        if (scaleFactor !== 1) {
            state = stateZoom;
        } // if

        // COG.info('scale factor = ' + scaleFactor + ', exp = ' + scaleFactorExp);
        if (scaleFactorExp !== 0) {
            scaleFactor = Math.pow(2, scaleFactorExp);

            // trigger the scale
            if (! self.trigger('scale', scaleFactor, scaleEndXY).cancel) {
                // COG.info('ok to scale');
                
                // flag to the layers that we are scaling
                for (var ii = layers.length; ii--; ) {
                    layers[ii].trigger('scale', scaleFactor, scaleEndXY);
                } // for

                // flag scaling as false
                scaleFactor = 1;
                scaleTouchesStart = null;
                state = stateActive;
                fullInvalidate = true;
            } // if
        } // if

        // invalidate the view
        invalidate(fullInvalidate);
    } // scaleView
    
    function setZoomCenter(xy) {
        xy.x = (xy.x + halfWidth) >> 1;
        xy.y = (xy.y + halfHeight) >> 1;
        
        zoomCenter = XY.copy(xy);
        
        interactOffset = XY.init(drawRect.x1, drawRect.y1);
        interactCenter = XY.offset(xy, drawRect.x1, drawRect.y1);
    } // setZoomCenter
    
    function handleContainerUpdate(name, value) {
        canvas = document.getElementById(value);
        
        // attach to the new canvas
        attachToCanvas();
    } // handleContainerUpdate
    
    function handleResize(evt) {
        clearTimeout(resizeCanvasTimeout);
        resizeCanvasTimeout = setTimeout(attachToCanvas, 50);
    } // handleResize
    
    function handleResync(evt, view) {
        // clear the layer min xy and max xy as we have changed zoom levels (or something similar)
        layerMinXY = null;
        layerMaxXY = null;
    } // handleResync
    
    function handleRotationUpdate(name, value) {
        rotation = value;
    } // handlePrepCanvasCallback
    
    function handlePointerTap(evt, absXY, relXY) {
        triggerAll(
            'tap', 
            absXY,
            relXY,
            XY.offset(relXY, offsetX, offsetY)
        );
    } // handlePointerTap
    
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
        var tweensComplete = 0,
            minXYOffset = layerMinXY ? XY.offset(layerMinXY, -halfWidth, -halfHeight) : null,
            maxXYOffset = layerMaxXY ? XY.offset(layerMaxXY, -halfWidth, -halfHeight) : null;
        
        function updateOffsetAnimationEnd() {
            tweensComplete += 1;
            
            if (tweensComplete >= 2) {
                panEnd();
                if (callback) {
                    callback();
                } // if
            } // if
        } // updateOffsetAnimationEnd
        
        // check that the x and y values are within acceptable bounds
        if (minXYOffset) {
            x = x < minXYOffset.x ? minXYOffset.x : x;
            y = y < minXYOffset.y ? minXYOffset.y : y;
        } // if
        
        if (maxXYOffset) {
            x = x > maxXYOffset.x ? maxXYOffset.x : x;
            y = y > maxXYOffset.y ? maxXYOffset.y : y;
        } // if
        
        if (tweenFn) {
            // if the interface is already being move about, then don't set up additional
            // tweens, that will just ruin it for everybody
            if (panimating) {
                return;
            } // if
            
            var tweenX = COG.tweenValue(offsetX, x, tweenFn, 
                    updateOffsetAnimationEnd, tweenDuration),
                    
                tweenY = COG.tweenValue(offsetY, y, tweenFn, 
                    updateOffsetAnimationEnd, tweenDuration);
                    
            // attach update listeners
            tweenX.cancelOnInteract = true;
            tweenX.requestUpdates(function(updatedVal) {
                offsetX = updatedVal >> 0;
                panimating = true;
                invalidate();
            });
            
            tweenY.cancelOnInteract = true;
            tweenY.requestUpdates(function(updatedVal) {
                offsetY = updatedVal >> 0;
                panimating = true;
                invalidate();
            });
        }
        else {
            offsetX = x >> 0;
            offsetY = y >> 0;
        } // if..else
    } // updateOffset
    
    /**
    ### zoom(targetXY, scaleChange)
    */
    function zoom(targetXY, scaleChange) {
        setZoomCenter(targetXY);

        panimating = false;
        scaleFactor = Math.max(scaleFactor + Math.pow(2, scaleChange) - 1, 0.25);
        
        // COG.info('zooming, scale change = ' + scaleChange + ', targetXY = ', targetXY);
        scaleView();
    } // zoom
    
    
    /* private functions */
    
    function attachToCanvas() {
        var ii;
        
        if (canvas) {
            if (eventMonitor) {
                eventMonitor.unbind();
            } // if
            
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
            } 
            catch (e) {
                COG.exception(e);
                throw new Error("Could not initialise canvas on specified view element");
            }
            
            // initialise the dimensions
            if (dimensions.height !== canvas.height || dimensions.width !== canvas.width) {
                dimensions = Dimensions.init(canvas.width, canvas.height);
                halfWidth = dimensions.width >> 1;
                halfHeight = dimensions.height >> 1;
                
                // trigger the resize event for the view
                self.trigger('resize', canvas.width, canvas.height);
                
                // and then tell all the layers
                for (ii = layerCount; ii--; ) {
                    layers[ii].trigger('resize', canvas.width, canvas.height);
                } // for
            } // if
            
            // create the event monitor
            // TODO: pass through detected device configuration details
            if (params.interactive) {
                eventMonitor = INTERACT.watch(canvas, {
                    observable: self
                }).pannable();
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
        value.added = ticks();
        
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
    
    /* draw code */
    
    function triggerIdle() {
        // COG.info('idle');
        triggerAll('idle', self);
        
        idle = true;
        idleTimeout = 0;
    } // idle
    
    // TODO: investigate whether to go back to floating point math for improved display or not
    function calcZoomRect(drawRect) {
        var invScaleFactor = 1 / scaleFactor,
            invScaleFactorNorm = (invScaleFactor - 0.5) * 2;
            
        // update the zoomX and y calculations
        zoomX = interactCenter.x + (offsetX - interactOffset.x);
        zoomY = interactCenter.y + (offsetY - interactOffset.y);
        
        /*
        COG.info(
            'scale factor = ' + scaleFactor + 
            ', inv scale factor = ' + invScaleFactor + 
            ', inv scale factor norm = ' + invScaleFactorNorm);
            
        COG.info('zoom x = ' + zoomX + ', y = ' + zoomY);
        COG.info('offset x = ' + offsetX + ', y = ' + offsetY);
        COG.info('interact offset x = ' + interactOffset.x + ', y = ' + interactOffset.y);
        */

        if (drawRect) {
            return XYRect.fromCenter(
                zoomX >> 0, 
                zoomY >> 0, 
                (drawRect.width * invScaleFactor) >> 0, 
                (drawRect.height * invScaleFactor) >> 0);
        } // if
    } // calcZoomRect
    
    function drawView(drawState, rect, redraw, tickCount) {
        var drawLayer,
            ii = 0;
            
        // update the draw rect
        drawRect = XYRect.copy(rect);
            
        // fill the mask context with black
        if (redraw) {
            mainContext.clearRect(0, 0, canvas.width, canvas.height);
        } // if

        // save the context states
        mainContext.save();
        // COG.info('offsetX = ' + offsetX + ', offsetY = ', offsetY + ', drawing rect = ', rect);
        
        try {
            // initialise the composite operation
            mainContext.globalCompositeOperation = 'source-over';
            
            if (scaleFactor !== 1) {
                drawRect = calcZoomRect(drawRect);
                mainContext.scale(scaleFactor, scaleFactor);
            } // if
            
            // translate the display appropriately
            mainContext.translate(-drawRect.x1, -drawRect.y1);
            
            // reset the layer bounds
            layerMinXY = null;
            layerMaxXY = null;
            
            /* first pass - clip */
            
            mainContext.beginPath();
            
            clipping = false;
            for (ii = layerCount; ii--; ) {
                if (layers[ii].clip) {
                    layers[ii].clip(mainContext, drawRect, drawState, self, redraw, tickCount);
                    clipping = true;
                } // if
            } // for
            
            mainContext.closePath();
            if (clipping) {
                mainContext.clip();
            } // if
            
            /* second pass - draw */
            
            for (ii = layerCount; ii--; ) {
                drawLayer = layers[ii];
                
                // if the layer has style, then apply it and save the current style
                var layerStyle = drawLayer.style,
                    previousStyle = layerStyle ? Style.apply(mainContext, layerStyle) : null;

                // if the layer has bounds, then update the layer bounds
                if (drawLayer.minXY) {
                    layerMinXY = layerMinXY ? 
                        XY.min(layerMinXY, drawLayer.minXY) : 
                        XY.copy(drawLayer.minXY);
                } // if

                if (drawLayer.maxXY) {
                    layerMaxXY = layerMaxXY ? 
                        XY.max(layerMaxXY, drawLayer.maxXY) :
                        XY.copy(drawLayer.maxXY);
                } // if

                // draw the layer
                drawLayer.draw(
                    mainContext, 
                    drawRect, 
                    drawState, 
                    self,
                    redraw,
                    tickCount);

                // if we applied a style, then restore the previous style if supplied
                if (previousStyle) {
                    Style.apply(mainContext, previousStyle);
                } // if
            } // for
            
            if (zoomCenter) {
                mainContext.fillStyle = '#00f';
                mainContext.beginPath();
                mainContext.arc(zoomX, zoomY, 5, 0, Math.PI * 2, false);
                mainContext.fill();
            } // if
        }
        finally {
            mainContext.restore();
        } // try..finally
        
        
        if (guides) {
            mainContext.globalCompositeOperation = 'source-over';
            mainContext.strokeStyle = '#f00';
            mainContext.beginPath();
            mainContext.moveTo(canvas.width >> 1, 0);
            mainContext.lineTo(canvas.width >> 1, canvas.height);
            mainContext.moveTo(0, canvas.height >> 1);
            mainContext.lineTo(canvas.width, canvas.height >> 1);
            mainContext.stroke();
        } // if
        
        if (zoomCenter) {
            mainContext.fillStyle = '#f00';
            mainContext.beginPath();
            mainContext.arc(zoomCenter.x, zoomCenter.y, 5, 0, Math.PI * 2, false);
            mainContext.fill();
        } // if

        // trigger the draw complete for the view
        triggerAll('drawComplete', rect, tickCount);
        COG.trace("draw complete", tickCount);
    } // drawView
    
    function cycle(tickCount, worker) {
        // check to see if we are panning
        var draw = false, 
            currentState = stateOverride ? stateOverride : (panimating ? statePan : state),
            interacting = (! panimating) && 
                ((currentState === stateZoom) || (currentState === statePan)),
            // if any of the following are true, then we need to draw the whole canvas so just
            requireRedraw = redrawView || 
                        currentState === statePan || 
                        // currentState === stateZoom || 
                        (COG.getTweens().length > 0);

        // calculate the cycle rect
        cycleRect = getViewRect();
        
        if (interacting) {
            COG.endTweens(function(tweenInstance) {
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
            
            layers[ii].cycle(tickCount, cycleRect, state, requireRedraw);
            draw = layers[ii].shouldDraw(state, cycleRect, requireRedraw) || draw;
        } // for
        
        // update the require redraw state based on whether we are now in an animating state
        requireRedraw = requireRedraw || ((state & stateAnimating) !== 0);
        
        // if we are scaling and at the same scale factor, don't redraw as its a waste of time
        draw = draw || requireRedraw || ((scaleFactor !== 1) && (scaleFactor !== lastScaleFactor));
        if (draw) {
            drawView(currentState, cycleRect, requireRedraw, tickCount);
            lastScaleFactor = scaleFactor;
            
            // reset draw monitoring variables
            redrawView = false;
        } // if
        
        // include wake triggers in the change count
        if ((! draw) && (wakeTriggers === 0) && (! isFlash)) {
            if ((! idle) && (idleTimeout === 0)) {
                idleTimeout = setTimeout(triggerIdle, 500);
            } // if

            worker.trigger('complete');
        } // if
        
        wakeTriggers = 0;
        COG.trace("Completed draw cycle", tickCount);
    } // cycle
    
    function invalidate(redraw) {
        redrawView = redraw ? true : false;

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
    } // invalidate
    
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
        return XYRect.init(
            offsetX, 
            offsetY, 
            offsetX + dimensions.width,
            offsetY + dimensions.height);
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

        // invalidate the view
        invalidate();
        
        // return the layer so we can chain if we want
        return value;
    } // setLayer
    
    /**
    ### scale(targetScaling, targetXY, tweenFn, callback)
    */
    function scale(targetScaling, targetXY, tweenFn, callback) {
        
        function finishAnimation() {
            var scaleFactorExp = Math.round(Math.log(scaleFactor) / Math.LN2);
            
            // round the scale factor to the nearest power of 2
            scaleFactor = Math.pow(2, scaleFactorExp);
            
            // if we have a callback to complete, then call it
            if (callback) {
                callback();
            } // if

            // scale the view
            scaleView(true);
        } // finishAnimation
        
        var scaleFactorFrom = scaleFactor;

        // if the target xy is not defined, then use the canvas center
        if (! targetXY) {
            targetXY = Dimensions.getCenter(dimensions);
        } // if
        
        setZoomCenter(targetXY);

        // if tweening then update the targetXY
        if (tweenFn) {
            var tween = COG.tweenValue(
                            0, 
                            targetScaling - scaleFactorFrom, 
                            tweenFn, 
                            finishAnimation, 
                            1000);
                            
            tween.requestUpdates(function(updatedValue, completed) {
                // update the scale factor
                scaleFactor = scaleFactorFrom + updatedValue;

                // trigger the on animate handler
                scaleView();
            });
        }
        // otherwise, update the scale factor and fire the callback
        else {
            scaleFactor = targetScaling;
            finishAnimation();
        }  // if..else        

        return self;
    } // scale
    
    /**
    ### triggerAll(eventName, args*)
    Trigger an event on the view and all layers currently contained in the view
    */
    function triggerAll() {
        var cancel = self.trigger.apply(null, arguments).cancel;
        for (var ii = layers.length; ii--; ) {
            cancel = layers[ii].trigger.apply(null, arguments).cancel || cancel;
        } // for
        
        return (! cancel);
    } // triggerAll
    
    function triggerAllUntilCancelled() {
        var cancel = self.trigger.apply(null, arguments).cancel;
        for (var ii = layers.length; ii--; ) {
            cancel = layers[ii].trigger.apply(null, arguments).cancel || cancel;
        } // for
        
        return (! cancel);
    } // triggerAllUntilCancelled
    
    /* object definition */
    
    // initialise self
    var self = {
        id: params.id,
        deviceScaling: deviceScaling,
        fastDraw: params.fastDraw || getConfig().requireFastDraw,
        
        /**
        ### getDimensions()
        Return the Dimensions of the View
        */
        getDimensions: function() {
            return dimensions;
        },
        
        getLayer: getLayer,
        setLayer: setLayer,
        eachLayer: eachLayer,
        
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

        scale: scale,
        triggerAll: triggerAll,
        
        /**
        ### removeLayer(id: String)
        Remove the T5.ViewLayer specified by the id
        */
        removeLayer: function(id) {
            var layerIndex = getLayerIndex(id);
            if ((layerIndex >= 0) && (layerIndex < layerCount)) {
                self.trigger('layerRemoved', layers[layerIndex]);

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
            return XY.init(offsetX, offsetY);
        },
        
        getViewRect: getViewRect,
        updateOffset: updateOffset,
        pan: pan,
        zoom: zoom
    };

    deviceScaling = getConfig().getScaling();
    
    // add the markers layer
    self.markers = addLayer('markers', new MarkerLayer());
    
    // make the view observable
    COG.observable(self);
    
    // listen for being woken up
    self.bind('invalidate', function(evt, redraw) {
        invalidate(redraw);
    });
    
    // if this is pannable, then attach event handlers
    if (params.pannable) {
        self.bind('pan', handlePan);

        // handle intertia events
        self.bind("inertiaCancel", function(evt) {
            panimating = false;
            invalidate();
        });
    } // if

    // if this view is scalable, attach zooming event handlers
    if (params.scalable) {
        self.bind('zoom', handleZoom);
    } // if
    
    // handle tap events
    self.bind('pointerTap', handlePointerTap);
    
    // handle the view being resynced
    self.bind('resync', handleResync);
    
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

