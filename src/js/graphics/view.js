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

<pre>
var view = new T5.View(params);
</pre>

#### Initialization Parameters

- `container` (required)

- `id`

- `captureHover` - whether or not hover events should be intercepted by the View.  
If you are building an application for mobile devices then you may want to set this to 
false, but it's overheads are minimals given no events will be generated.

- `inertia`

- `pannable`

- `scalable`

- `fps` - (int, default = 25) - the frame rate of the view, by default this is set to 
25 frames per second but can be increased or decreased to compensate for device 
performance.  In reality though on slower devices, the framerate will scale back 
automatically, but it can be prudent to set a lower framerate to leave some cpu for 
other processes :)

## Events

### tapHit
This event is fired when the view has been tapped (or the left
mouse button has been pressed)
<pre>
view.bind('tapHit', function(evt, elements, absXY, relXY, offsetXY) {
});
</pre>

- elements ([]) - an array of elements that were "hit"
- absXY (T5.Vector) - the absolute position of the tap
- relXY (T5.Vector) - the position of the tap relative to the top left position of the view.
- gridXY (T5.Vector) - the xy coordinates of the tap relative to the scrolling grid offset.


### hoverHit
As per the tapHit event, but triggered through a mouse-over event.

### refresh
<pre>
view.bind('refresh', function(evt) {
});
</pre>

### drawComplete
Triggered when drawing the view has been completed (who would have thought).
<pre>
view.bind('drawComplete', function(evt, viewport, tickCount) {
});
</pre>

- viewport - the current viewport of the view
- tickCount - the tick count at the start of the draw operation.


### enterFrame
Triggered on the view cycling.
<pre>
view.bind('enterFrame', function(evt, tickCount, frameData) {
});
</pre>

### zoomLevelChange
Triggered when the zoom level of the view has changed.  Given that Tile5 was primarily
built to serve as a mapping platform zoom levels are critical to the design so a view
has this functionality.

<pre>
view.bind('zoomLevelChange', function(evt, zoomLevel) {
});
</pre>

- zoomLevel (int) - the new zoom level


## Methods
*/
var View = function(params) {
    // initialise defaults
    params = COG.extend({
        id: COG.objId('view'),
        container: "",
        captureHover: true,
        fastpan: false,
        fastpanPadding: 128,
        inertia: true,
        refreshDistance: 256,
        pannable: false,
        scalable: false,
        fps: 60,
        
        // zoom parameters
        minZoom: 1,
        maxZoom: 1,
        renderer: 'canvas',
        zoomLevel: 1
    }, params);
    
    // initialise constants
    var TURBO_CLEAR_INTERVAL = 500,
        PANSPEED_THRESHOLD_REFRESH = 2,
        PANSPEED_THRESHOLD_FASTPAN = 5,
    
        // get the container context
        caps = {},
        layers = [],
        layerCount = 0,
        viewpane = null,
        panContainer = null,
        outer,
        dragObject = null,
        mainContext = null,
        isIE = !isType(window.attachEvent, typeUndefined),
        hitFlagged = false,
        fastpan = true,
        pointerDown = false,
        dx = 0, dy = 0,
        totalDX = 0,
        totalDY = 0,
        refreshDist = params.refreshDistance,
        offsetX = 0,
        offsetY = 0,
        panX = 0,
        panY = 0,
        refreshX = 0,
        refreshY = 0,
        offsetMaxX = null,
        offsetMaxY = null,
        offsetWrapX = false,
        offsetWrapY = false,
        padding = params.fastpan ? params.fastpanPadding : 0,
        panFrames = [],
        hitData = null,
        lastHitData = null,
        resizeCanvasTimeout = 0,
        scaleFactor = 1,
        lastScaleFactor = 1,
        lastCycleTicks = 0,
        eventMonitor = null,
        frameData = {
            index: 0,
            draw: false
        },
        partialScaling = true,
        tweeningOffset = false, // TODO: find a better way to determine this than with a flag
        cycleDelay = 1000 / params.fps | 0,
        viewChanges = 0,
        width, height,
        halfWidth, halfHeight,
        halfOuterWidth, halfOuterHeight,
        zoomX, zoomY,
        zoomLevel = params.zoomLevel,
        zoomEasing = COG.easing('quad.out'),
        zoomDuration = 300;
        
    /* event handlers */
    
    /* scaling functions */
    
    function handleZoom(evt, absXY, relXY, scaleChange, source) {
        scale(min(max(scaleFactor + pow(2, scaleChange) - 1, 0.5), 2));
    } // handleWheelZoom
    
    function scaleView() {
        var scaleFactorExp = log(scaleFactor) / Math.LN2 | 0;
        
        // COG.info('scale factor = ' + scaleFactor + ', exp = ' + scaleFactorExp);
        if (scaleFactorExp !== 0) {
            scaleFactor = pow(2, scaleFactorExp);
            setZoomLevel(zoomLevel + scaleFactorExp, zoomX, zoomY);
        }

        // invalidate the view
        redraw = true;
    } // scaleView
    
    function setZoomCenter(xy) {
    } // setZoomCenter
    
    function getProjectedXY(srcX, srcY) {
        // first see if the renderer will determine the projected xy
        var projectedXY = renderer && renderer.projectXY ? renderer.projectXY(srcX, srcY) : null;
        
        // if not, then calculate here
        if (! projectedXY) {
            var viewport = _self.getViewport(),
                invScaleFactor = 1 / scaleFactor,
                scaledX = viewport ? (viewport.x + srcX * invScaleFactor) : srcX,
                scaledY = viewport ? (viewport.y + srcY * invScaleFactor) : srcY;

            projectedXY = new XY(scaledX, scaledY);
        } // if
        
        return projectedXY;
    } // getProjectedXY
    
    function handleDoubleTap(evt, absXY, relXY) {
        triggerAll(
            'doubleTap', 
            absXY,
            relXY,
            getProjectedXY(relXY.x, relXY.y));
            
        if (params.scalable) {
            // animate the scaling
            scale(
                2, 
                getProjectedXY(relXY.x, relXY.y), 
                zoomEasing, 
                null, 
                zoomDuration);
        } // if
    } // handleDoubleTap
    
    function handlePointerDown(evt, absXY, relXY) {
        // reset the hover offset and the drag element
        dragObject = null;
        pointerDown = true;
        
        // initialise the hit data
        initHitData('down', absXY, relXY);
    } // handlePointerDown
    
    function handlePointerHover(evt, absXY, relXY) {
        // initialise the hit data
        initHitData('hover', absXY, relXY);
    } // handlePointerHover
    
    function handlePointerMove(evt, absXY, relXY, deltaXY) {
        // drag the selected if we 
        dragSelected(absXY, relXY, false);
        
        if (! dragObject) {
            dx = deltaXY.x;
            dy = deltaXY.y;
        } // if
    } // handlePointerMove
    
    function handlePointerUp(evt, absXY, relXY) {
        dragSelected(absXY, relXY, true);
        pointerDown = false;
    } // handlePointerUp
    
    function handleResize(evt) {
        clearTimeout(resizeCanvasTimeout);
        resizeCanvasTimeout = setTimeout(function() {
            renderer.checkSize();
        }, 250);
    } // handleResize
    
    function handleResync(evt, view) {
    } // handleResync
    
    function handlePointerTap(evt, absXY, relXY) {
        // initialise the hit data
        initHitData('tap', absXY, relXY);

        // trigger the tap on all layers
        triggerAll('tap', absXY, relXY, getProjectedXY(relXY.x, relXY.y, true));
    } // handlePointerTap
    
    /* private functions */
    
    function createRenderer(typeName) {
        renderer = attachRenderer(typeName || params.renderer, _self, viewpane, outer, params);
        
        // determine whether partial scaling is supporter
        fastpan = params.fastpan && renderer.fastpan;
        
        // attach interaction handlers
        captureInteractionEvents();
    } // createRenderer
    
    function addLayer(id, value) {
        // make sure the layer has the correct id
        value.id = id;
        value.added = ticks();
        
        // tell the layer that I'm going to take care of it
        value.view = _self;
        value.trigger('parentChange', _self, viewpane, mainContext);
        
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
    
    function captureInteractionEvents() {
        if (eventMonitor) {
            eventMonitor.unbind();
        } // if

        if (renderer) {
            // recreate the event monitor
            eventMonitor = INTERACT.watch(renderer.interactTarget || outer);

            // if this view is scalable, attach zooming event handlers
            if (params.scalable) {
                eventMonitor.bind('zoom', handleZoom);
                eventMonitor.bind('doubleTap', handleDoubleTap);
            } // if
            
            // handle pointer down tests
            eventMonitor.bind('pointerDown', handlePointerDown);
            eventMonitor.bind('pointerMove', handlePointerMove);
            eventMonitor.bind('pointerUp', handlePointerUp);

            if (params.captureHover) {
                eventMonitor.bind('pointerHover', handlePointerHover);
            } // if

            // handle tap events
            eventMonitor.bind('tap', handlePointerTap);
        } // if
    } // captureInteractionEvents
    
    function changeRenderer(name, value) {
        // if we have a renderer, then detach it
        if (renderer) {
            renderer.trigger('detach');
            renderer = null;
        } // if
        
        // now create the new renderer
        createRenderer(value);
        
        // invalidate the view
        invalidate();
    } // changeRenderer
    
    /*
    The constrain offset function is used to keep the view offset within a specified
    offset using wrapping if allowed.  The function is much more 'if / then / elsey' 
    than I would like, and might be optimized at some stage, but it does what it needs to
    */
    function constrainOffset(viewport, allowWrap) {
        if (! viewport) {
            return;
        } // if
        
        var testX = offsetWrapX ? offsetX + (viewport.w >> 1) : offsetX,
            testY = offsetWrapY ? offsetY + (viewport.h >> 1) : offsetY,
            viewWidth = viewport.w,
            viewHeight = viewport.h;
        
        // check the x
        if (offsetMaxX && offsetMaxX > viewWidth) {
            if (testX + viewWidth > offsetMaxX) {
                if (offsetWrapX) {
                    offsetX = allowWrap && (testX - offsetMaxX > 0) ? offsetX - offsetMaxX : offsetX;
                }
                else {
                    offsetX = offsetMaxX - viewWidth;
                } // if..else
            }
            else if (testX < 0) {
                offsetX = offsetWrapX ? (allowWrap ? offsetX + offsetMaxX : offsetX) : 0;
            } // if..else
        } // if
        
        // check the y
        if (offsetMaxY && offsetMaxY > viewHeight) {
            if (testY + viewHeight > offsetMaxY) {
                if (offsetWrapY) {
                    offsetY = allowWrap && (testY - offsetMaxY > 0) ? offsetY - offsetMaxY : offsetY;
                }
                else {
                    offsetY = offsetMaxY - viewHeight;
                } // if..else
            }
            else if (testY < 0) {
                offsetY = offsetWrapY ? (allowWrap ? offsetY + offsetMaxY : offsetY) : 0;
            } // if..else
        } // if
    } // constrainOffset
    
    function dragSelected(absXY, relXY, drop) {
        if (dragObject) {
            var scaledOffset = getProjectedXY(relXY.x, relXY.y),
                dragOk = dragObject.drag.call(
                    dragObject.target, 
                    dragObject, 
                    scaledOffset.x, 
                    scaledOffset.y, 
                    drop);
                
            if (dragOk) {
                invalidate();
            } // if
            
            if (drop) {
                dragObject = null;
            } // if
        }
    } // dragSelected
    
    function dragStart(hitElement, x, y) {
        var canDrag = hitElement && hitElement.drag && 
                ((! hitElement.canDrag) || hitElement.canDrag(hitElement, x, y));
                
        if (canDrag) {
            dragObject = hitElement;

            // initialise the
            dragObject.startX = x;
            dragObject.startY = y;
        } // if

        return canDrag;
    } // dragStart
    
    function getLayerIndex(id) {
        for (var ii = layerCount; ii--; ) {
            if (layers[ii].id === id) {
                return ii;
            } // if
        } // for
        
        return -1;
    } // getLayerIndex
    
    function initContainer() {
        outer.appendChild(panContainer = createEl(
            'div', 
            COG.objId('t5_container'), 
            COG.formatStr(
                '-webkit-user-select: none; position: absolute; overflow: hidden; width: {0}px; height: {1}px;',
                outer.offsetWidth,
                outer.offsetHeight
            )
        ));
        
        // initialise the view width and height
        width = panContainer.offsetWidth + padding * 2;
        height = panContainer.offsetHeight + padding * 2;
        halfWidth = width / 2;
        halfHeight = height / 2;
        halfOuterWidth = outer.offsetWidth / 2;
        halfOuterHeight = outer.offsetHeight / 2;

        // create the view div and append to the pan container
        panContainer.appendChild(viewpane = createEl(
            'div',
            COG.objId('t5_view'),
            COG.formatStr(
                '-webkit-user-select: none; position: absolute; width: {0}px; height: {1}px; margin: {2}px 0 0 {2}px;',
                width,
                height,
                -padding)
            )
        );
    } // initContainer
    
    function updateContainer(name, value) {
        initContainer(outer = document.getElementById(value));
        createRenderer();
    } // updateContainer
    
    /* draw code */
    
    /*
    ### checkHits
    */
    function checkHits() {
        var elements = hitData ? hitData.elements : [],
            ii;
        
        // if we have last hits, then check for elements
        if (lastHitData && lastHitData.type === 'hover') {
            var diffElements = Hits.diffHits(lastHitData.elements, elements);
            
            // if we have diff elements then trigger an out event
            if (diffElements.length > 0) {
                Hits.triggerEvent(lastHitData, _self, 'Out', diffElements);
            } // if
        } // if
        
        // check the hit data
        if (elements.length > 0) {
            var downX = hitData.x,
                downY = hitData.y;
            
            // iterate through objects from last to first (first get drawn last so sit underneath)
            for (ii = elements.length; ii--; ) {
                if (dragStart(elements[ii], downX, downY)) {
                    break;
                } // if
            } // for
            
            Hits.triggerEvent(hitData, _self);
        } // if
        
        // save the last hit elements
        lastHitData = elements.length > 0 ? COG.extend({}, hitData) : null;
    } // checkHits
    
    function cycle(tickCount) {
        // check to see if we are panning
        var extraTransforms = '',
            panning,
            scaleChanged,
            newFrame = false,
            refreshValid,
            viewpaneX,
            viewpaneY,
            viewport;
            
        // initialise the tick count if it isn't already defined
        // not all browsers pass through the ticks with the requestAnimationFrame :/
        tickCount = tickCount || new Date().getTime();
        
        // set the new frame flag
        newFrame = tickCount - lastCycleTicks > cycleDelay;
        
        // if we have a new frame, then fire the enterFrame event
        if (newFrame) {
            // calculate the current pan speed
            panSpeed = abs(dx) + abs(dy);
            
            refreshValid = abs(offsetX - refreshX) >= refreshDist ||
                abs(offsetY - refreshY) >= refreshDist;
                
            // update the panning flag
            scaleChanged = scaleFactor !== lastScaleFactor;
            
            if (panSpeed > 0 || scaleChanged) {
                viewChanges++;
            } // if
                
            // determine whether a refresh is required
            if (refreshValid && panSpeed < PANSPEED_THRESHOLD_REFRESH) {
                refresh();
            } // if
            
            // initialise the frame data
            frameData.index++;
            frameData.draw = viewChanges || panSpeed || totalDX || totalDY;

            // trigger the enter frame event
            _self.trigger('enterFrame', tickCount, frameData);
            
            // update the last cycle ticks
            lastCycleTicks = tickCount;
        }
        
        // if we a due for a redraw then do on
        if (renderer && newFrame && frameData.draw) {
            // update the pan x and y
            panX += dx;
            panY += dy;
            
            // otherwise, reset the view pane position and refire the renderer
            if ((! fastpan) || panSpeed < PANSPEED_THRESHOLD_FASTPAN) {
                offsetX = (offsetX - panX) | 0;
                offsetY = (offsetY - panY) | 0;

                // initialise the viewport
                viewport = getViewport();
                viewport.panSpeed = panSpeed;

                /*
                // check that the offset is within bounds
                if (offsetMaxX || offsetMaxY) {
                    constrainOffset();
                } // if
                */

                // TODO: if we have a hover offset, check that no elements have moved under the cursor (maybe)

                // trigger the predraw event
                renderer.trigger('predraw', viewport);

                // prepare the renderer
                if (renderer.prepare(layers, viewport, tickCount, hitData)) {
                    // reset the view changes count
                    viewChanges = 0;
                    viewpaneX = panX = 0;
                    viewpaneY = panY = 0;

                    for (ii = layerCount; ii--; ) {
                        var drawLayer = layers[ii];

                        // determine whether we need to draw
                        if (drawLayer.visible) {
                            // if the layer has style, then apply it and save the current style
                            var previousStyle = drawLayer.style ? 
                                    renderer.applyStyle(drawLayer.style, true) : 
                                    null;

                            // draw the layer
                            drawLayer.draw(
                                renderer,
                                viewport,
                                _self,
                                tickCount,
                                hitData);

                            // if we applied a style, then restore the previous style if supplied
                            if (previousStyle) {
                                renderer.applyStyle(previousStyle);
                            } // if
                        } // if
                    } // for

                    // get the renderer to render the view
                    // NB: some renderers will do absolutely nothing here...
                    renderer.trigger('render', viewport);

                    // trigger the draw complete event
                    _self.trigger('drawComplete', viewport, tickCount);

                    // update the last cycle ticks
                    lastScaleFactor = scaleFactor;
                    
                    // if transforms are supported, then scale using transforms
                    if (supportTransforms) {
                        extraTransforms += 'scale(' + scaleFactor + ')';
                    }
                    // otherwise, use the css zoom property
                    else {
                        // set the viewpan zoom
                        viewpane.style.zoom = scaleFactor;

                        // if the scale factor is not equal to 1, then calculate the view pane x and y
                        if (scaleFactor > 1) {
                            viewpaneX = -(halfOuterWidth - halfWidth / scaleFactor);
                            viewpaneY = -(halfOuterHeight - halfHeight / scaleFactor);
                        }
                        else if (scaleFactor < 1) {
                            viewpaneX = (halfOuterWidth / scaleFactor - halfWidth);
                            viewpaneY = (halfOuterHeight / scaleFactor -  halfHeight);
                        } // if..else
                    } // if..else

                    // reset the view pan position
                    moveEl(viewpane, viewpaneX, viewpaneY, extraTransforms);
                } // if
            }
            else {
                // move the view pane
                moveEl(viewpane, panX, panY);
            } // if..else
            
            // apply the inertial dampeners 
            // really just wanted to say that...
            if (pointerDown || (! params.inertia)) {
                dx = 0;
                dy = 0;
            }
            else if (dx != 0 || dy != 0) {
                dx *= 0.8;
                dy *= 0.8;
                
                if (abs(dx) < 0.5) {
                    dx = 0;
                } // if
                
                if (abs(dy) < 0.5) {
                    dy = 0;
                } // if
            } // if..else            
            
            // check for hits 
            if (hitData) {
                checkHits();
                hitData = null;
            } // if
        } // if
        
        animFrame(cycle);
    } // cycle
    
    function initHitData(hitType, absXY, relXY) {
        // initialise the hit data
        hitData = Hits.init(hitType, absXY, relXY, getProjectedXY(relXY.x, relXY.y, true));
        
        // iterate through the layers and check to see if we have hit potential
        // iterate through all layers as some layers may use the hit guess operation
        // to initialise hit data rather than doing it in the draw loop 
        // (T5.MarkerLayer for instance)
        for (var ii = layerCount; ii--; ) {
            hitFlagged = hitFlagged || (layers[ii].hitGuess ? 
                layers[ii].hitGuess(hitData.x, hitData.y, _self) :
                false);
        } // for

        // if we have a potential hit then invalidate the view so a more detailed
        // test can be run
        if (hitFlagged) {
            viewChanges++;
        } // if
    } // initHitData
    
    /* exports */
    
    /**
    ### attachFrame(element)
    The attachFrame method is used to attach a dom element that will be panned around along with
    the view.
    */
    function attachFrame(element, append) {
        // initialise the css of the element
        // element.style.position = 'absolute';
        // element.style['z-index'] = panFrames.length + 1;
        
        // add to the pan frames array
        panFrames[panFrames.length] = element;
        
        // append to the dom
        if (append) {
            viewpane.appendChild(element);
        } // if
    } // attachFrame
    
    /**
    ### detach
    If you plan on reusing a single canvas element to display different views then you 
    will definitely want to call the detach method between usages.
    */
    function detach() {
        // if we have a renderer, then detach 
        if (renderer) {
            renderer.trigger('detach');
        } // if
        
        if (eventMonitor) {
            eventMonitor.unbind();
        } // if
        
        // remove the pan container
        if (panContainer) {
            document.getElementById(panContainer).removeChild(panContainer);
            
            // reset the pan container and container variables
            panContainer = null;
            viewpane = null;
        } // if
        
        // reset the pan frames
        panFrames = [];
    } // detach
    
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
    ### getLayer(id: String): T5.ViewLayer
    Get the ViewLayer with the specified id, return null if not found
    */
    function getLayer(id) {
        // look for the matching layer, and return when found
        for (var ii = 0; ii < layerCount; ii++) {
            if (layers[ii].id === id) {
                return layers[ii];
            } // if
        } // for
        
        return null;
    } // getLayer
    
    /**
    ### getOffset(): T5.XY
    Return a T5.XY containing the current view offset
    */
    function getOffset() {
        // return the last calculated cycle offset
        return new XY(offsetX, offsetY);
    } // getOffset
    
    /**
    ### getRenderer(): T5.Renderer
    */
    function getRenderer() {
        return renderer;
    } // getRenderer
    
    /**
    ### getScaleFactor(): float
    Return the current scaling factor
    */
    function getScaleFactor() {
        return scaleFactor;
    } // getScaleFactor
    
    /**
    ### getZoomLevel(): int
    Return the current zoom level of the view, for views that do not support
    zooming, this will always return a value of 1
    */
    function getZoomLevel() {
        return zoomLevel;
    }
    
    function invalidate() {
        viewChanges++;
    }
    
    /**
    ### setMaxOffset(maxX: int, maxY: int, wrapX: bool, wrapY: bool)
    Set the bounds of the display to the specified area, if wrapX or wrapY parameters
    are set, then the bounds will be wrapped automatically.
    */
    function setMaxOffset(maxX, maxY, wrapX, wrapY) {
        // update the offset bounds
        offsetMaxX = maxX;
        offsetMaxY = maxY;
        
        // update the wrapping flags
        offsetWrapX = wrapX;
        offsetWrapY = wrapY;
    } // setMaxOffset
    
    /**
    ### getViewport(): T5.XYRect
    Return a T5.XYRect for the last drawn view rect
    */
    function getViewport() {
        var viewport = new Rect(offsetX, offsetY, width, height);
        
        // add the scale factor information
        viewport.scaleFactor = scaleFactor;
            
        return viewport;
    } // getViewport
    
    /**
    ### pan(x: int, y: int)
    
    Used to pan the view by the specified x and y
    */
    function pan(x, y) {
        dx = x;
        dy = y;
        
        viewChanges++;
    } // pan
    
    /**
    ### setLayer(id: String, value: T5.ViewLayer)
    Either add or update the specified view layer
    */
    function setLayer(id, value) {
        // if the layer already exists, then remove it
        for (var ii = 0; ii < layerCount; ii++) {
            if (layers[ii].id === id) {
                layers.splice(ii, 1);
                break;
            } // if
        } // for
        
        if (value) {
            addLayer(id, value);
            
            // trigger a refresh on the layer
            value.trigger('refresh', _self, getViewport());
            
            // trigger a layer changed event
            _self.trigger('layerChange', _self, value);
        } // if

        // invalidate the map
        invalidate();
        
        // return the layer so we can chain if we want
        return value;
    } // setLayer

    /**
    ### refresh()
    Manually trigger a refresh on the view.  Child view layers will likely be listening for `refresh`
    events and will do some of their recalculations when this is called.
    */
    function refresh() {
        var viewport = getViewport();
        if (viewport) {
            // check that the offset is within bounds
            if (offsetMaxX || offsetMaxY) {
                constrainOffset(viewport);
            } // if

            // update the last refresh x and y
            refreshX = offsetX;
            refreshY = offsetY;
            
            // trigger the refresh event
            triggerAll('refresh', _self, viewport);

            // invalidate
            viewChanges++;
        } // if
    } // refresh
    
    /**
    ### removeLayer(id: String)
    Remove the T5.ViewLayer specified by the id
    */
    function removeLayer(id) {
        var layerIndex = getLayerIndex(id);
        if ((layerIndex >= 0) && (layerIndex < layerCount)) {
            _self.trigger('layerRemove', _self, layers[layerIndex]);

            layers.splice(layerIndex, 1);
            invalidate();
        } // if
        
        // update the layer count
        layerCount = layers.length;
    } // removeLayer
    
    function resetScale() {
        scaleFactor = 1;
    } // resetScale
    
    /**
    ### scale(targetScaling: float, targetXY: T5.XY, tweenFn: EasingFn, callback: fn)
    Scale the view to the specified `targetScaling` (1 = normal, 2 = double-size and 0.5 = half-size).
    */
    function scale(targetScaling, targetXY, tweenFn, callback, duration) {
        var scaleFactorExp;
        
        // if partial scrolling is disabled handle it
        if (! partialScaling) {
            tweenFn = false;

            scaleFactorExp = round(log(targetScaling) / Math.LN2);

            // round the scale factor to the nearest power of 2
            targetScaling = pow(2, scaleFactorExp);
        } // if
        
        // if tweening then update the targetXY
        if (tweenFn) {
            COG.tweenValue(scaleFactor, targetScaling, tweenFn, duration, function(val, completed) {
                // update the scale factor
                scaleFactor = val;
                
                if (completed) {
                    scaleFactorExp = round(log(scaleFactor) / Math.LN2);

                    // round the scale factor to the nearest power of 2
                    scaleFactor = pow(2, scaleFactorExp);

                    // if we have a callback to complete, then call it
                    if (callback) {
                        callback();
                    } // if
                } // if

                // trigger the on animate handler
                setZoomCenter(targetXY);
                scaleView();
            });
        }
        // otherwise, update the scale factor and fire the callback
        else {
            scaleFactor = targetScaling;
            
            // update the zoom center
            setZoomCenter(targetXY);
            scaleView();
        }  // if..else        

        return _self;
    } // scale
    
    /**
    ### setZoomLevel(value: int, zoomXY: T5.XY): boolean
    This function is used to update the zoom level of the view.  The zoom level 
    is checked to ensure that it falls within the `minZoom` and `maxZoom` values.  Then
    if the requested zoom level is different from the current the zoom level is updated
    and a `zoomLevelChange` event is triggered
    */
    function setZoomLevel(value, zoomX, zoomY) {
        value = max(params.minZoom, min(params.maxZoom, value));
        if (value !== zoomLevel) {
            var scaling = pow(2, value - zoomLevel),
                scaledHalfWidth = halfWidth / scaling | 0,
                scaledHalfHeight = halfHeight / scaling | 0;
            
            // update the zoom level
            zoomLevel = value;
            
            // update the offset
            updateOffset(
                ((zoomX ? zoomX : offsetX + halfWidth) - scaledHalfWidth) * scaling,
                ((zoomY ? zoomY : offsetY + halfHeight) - scaledHalfHeight) * scaling
            );
            
            // reset the last offset
            refreshX = 0;
            refreshY = 0;

            // trigger the change
            triggerAll('zoomLevelChange', value);
            
            // reset the scale factor
            scaleFactor = 1;
            
            // reset the renderer
            renderer.trigger('reset');
            
            // refresh the display
            refresh();
        } // if
    } // setZoomLevel
    
    /**
    ### syncXY(points, reverse)
    This function is used to keep a T5.XY derivative x and y position in sync
    with it's real world location (if it has one).  T5.GeoXY are a good example 
    of this.
    
    If the `reverse` argument is specified and true, then the virtual world 
    coordinate will be updated to match the current x and y offsets.
    */
    function syncXY(points, reverse) {
    } // syncXY
    
    /**
    ### triggerAll(eventName: string, args*)
    Trigger an event on the view and all layers currently contained in the view
    */
    function triggerAll() {
        var cancel = _self.trigger.apply(null, arguments).cancel;
        for (var ii = layers.length; ii--; ) {
            cancel = layers[ii].trigger.apply(null, arguments).cancel || cancel;
        } // for
        
        return (! cancel);
    } // triggerAll
    
    
    /**
    ### updateOffset(x: int, y: int, tweenFn: EasingFn, tweenDuration: int, callback: fn)

    This function allows you to specified the absolute x and y offset that should 
    become the top-left corner of the view.  As per the `pan` function documentation, tween and
    callback arguments can be supplied to animate the transition.
    */
    function updateOffset(x, y, tweenFn, tweenDuration, callback) {
        
        // initialise variables
        var tweensComplete = 0;
        
        function endTween() {
            tweensComplete += 1;
            
            if (tweensComplete >= 2) {
                tweeningOffset = false;
                
                if (callback) {
                    callback();
                } // if
            } // if
        } // endOffsetUpdate
        
        if (tweenFn && (panSpeed === 0)) {
            COG.tweenValue(offsetX, x, tweenFn, tweenDuration, function(val, complete){
                offsetX = val | 0;
                
                (complete ? endTween : invalidate)();
                return panSpeed === 0;
            });
            
            COG.tweenValue(offsetY, y, tweenFn, tweenDuration, function(val, complete) {
                offsetY = val | 0;

                (complete ? endTween : invalidate)();
                return panSpeed === 0;
            });
            
            tweeningOffset = true;
        }
        else {
            offsetX = x | 0;
            offsetY = y | 0;
            
            // trigger the callback
            if (callback) {
                callback();
            } // if
        } // if..else
    } // updateOffset
    
    /* object definition */
    
    // initialise _self
    var _self = {
        id: params.id,
        padding: padding,
        
        attachFrame: attachFrame,
        detach: detach,
        eachLayer: eachLayer,
        getLayer: getLayer,
        getZoomLevel: getZoomLevel,
        setLayer: setLayer,
        invalidate: invalidate,
        refresh: refresh,
        resetScale: resetScale,
        scale: scale,
        setZoomLevel: setZoomLevel,
        syncXY: syncXY,
        triggerAll: triggerAll,
        removeLayer: removeLayer,
        
        /* offset methods */
        
        getOffset: getOffset,
        
        getRenderer: getRenderer,
        getScaleFactor: getScaleFactor,
        setMaxOffset: setMaxOffset,
        getViewport: getViewport,
        updateOffset: updateOffset,
        pan: pan
    };

    // make the view observable
    COG.observable(_self);
    
    // handle the view being resynced
    _self.bind('resync', handleResync);
    
    // make the view configurable
    COG.configurable(
        _self, [
            'container',
            'captureHover',
            'scalable', 
            'pannable', 
            'inertia',
            'minZoom', 
            'maxZoom',
            'renderer',
            'zoom'
        ], 
        COG.paramTweaker(params, null, {
            'container': updateContainer,
            'captureHover': captureInteractionEvents,
            'scalable': captureInteractionEvents,
            'pannable': captureInteractionEvents,
            'renderer': changeRenderer
        }),
        true);

    CANI.init(function(testResults) {
        // add the markers layer
        _self.markers = addLayer('markers', new ShapeLayer({
            zindex: 20
        }));
        
        // create the renderer
        caps = testResults;
        updateContainer(null, params.container);

        // if autosized, then listen for resize events
        if (isIE) {
            window.attachEvent('onresize', handleResize);
        }
        else {
            window.addEventListener('resize', handleResize, false);
        }
    });
    
    // start the animation frame
    // setInterval(cycle, 1000 / 60);
    animFrame(cycle);

    return _self;
}; // T5.View