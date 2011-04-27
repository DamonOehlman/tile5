/**
# VIEW: simple
*/
reg('view', 'map', function(params) {
    // initialise defaults
    params = _extend({
        container: "",
        captureHover: true,
        controls: ['zoombar'],
        drawOnScale: true,
        // TODO: automatically calculate padding to allow map rotation with no "whitespace"
        padding: 50, 
        inertia: true,
        refreshDistance: 256,
        pannable: true,
        scalable: true,
        
        // zoom parameters
        minZoom: 1,
        maxZoom: 18,
        renderer: 'canvas/dom',
        zoom: 1,
        
        zoombar: {}
    }, params);
    
    // initialise constants
    var PANSPEED_THRESHOLD_REFRESH = 2,
        PANSPEED_THRESHOLD_FASTPAN = 5,
    
        // get the container context
        caps = {},
        controls = [],
        layers = [],
        layerCount = 0,
        viewpane = null,
        panContainer = null,
        outer,
        dragObject = null,
        mainContext = null,
        isIE = !_is(window.attachEvent, typeUndefined),
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
        offsetTween = null,
        padding = params.padding,
        panFrames = [],
        hitData = null,
        lastHitData = null,
        resizeCanvasTimeout = 0,
        rotation = 0,
        rotateTween = null,
        scaleFactor = 1,
        scaleTween = null,
        lastScaleFactor = 1,
        lastBoundsChangeOffset = new GeoXY(),
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
        zoomLevel = params.zoom || params.zoomLevel;
        
    /* event handlers */
    
    /* scaling functions */
    
    function handleZoom(evt, absXY, relXY, scaleChange, source) {
        scale(min(max(scaleFactor + pow(2, scaleChange) - 1, 0.5), 2), false, true);
    } // handleWheelZoom
    
    function getProjectedXY(srcX, srcY) {
        // first see if the renderer will determine the projected xy
        var projectedXY = renderer && renderer.projectXY ? renderer.projectXY(srcX, srcY) : null;
        
        // if not, then calculate here
        if (! projectedXY) {
            var viewport = _self.getViewport(),
                invScaleFactor = 1 / scaleFactor,
                scaledX = viewport ? (viewport.x + srcX * invScaleFactor) : srcX,
                scaledY = viewport ? (viewport.y + srcY * invScaleFactor) : srcY;

            projectedXY = new GeoXY(scaledX, scaledY);
        } // if
        
        return projectedXY.sync(_self, true);
    } // getProjectedXY
    
    function handleDoubleTap(evt, absXY, relXY) {
        triggerAll(
            'doubleTap', 
            absXY,
            relXY,
            getProjectedXY(relXY.x, relXY.y));
            
        if (params.scalable) {
            // animate the scaling
            scale(2, {
                easing: 'quad.out',
                duration: 300
            }, true);
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
    
    function handleRemoveLayer(evt, layer) {
        var layerIndex = _indexOf(layers, layer.id);
        if ((layerIndex >= 0) && (layerIndex < layerCount)) {
            layers.splice(layerIndex, 1);
            invalidate();
        } // if
        
        // update the layer count
        layerCount = layers.length;
    } // handleRemoveLayer
    
    function handleResize(evt) {
        clearTimeout(resizeCanvasTimeout);
        resizeCanvasTimeout = setTimeout(function() {
            renderer.checkSize();
        }, 250);
    } // handleResize
    
    function handlePointerTap(evt, absXY, relXY) {
        // initialise the hit data
        initHitData('tap', absXY, relXY);

        // trigger the tap on all layers
        triggerAll('tap', absXY, relXY, getProjectedXY(relXY.x, relXY.y, true));
    } // handlePointerTap
    
    /* private functions */
    
    function checkScaling() {
        // calculate the scale factor exponent
        var scaleFactorExp = log(scaleFactor) / Math.LN2 | 0;

        // _log('scale factor = ' + scaleFactor + ', exp = ' + scaleFactorExp);
        if (scaleFactorExp !== 0) {
            scaleFactor = pow(2, scaleFactorExp);
            zoom(zoomLevel + scaleFactorExp, zoomX, zoomY);
        } // ifg
    } // checkScaling
    
    function createRenderer(typeName) {
        renderer = attachRenderer(typeName || params.renderer, _self, viewpane, outer, params);
        
        // determine whether partial scaling is supporter
        fastpan = renderer.fastpan && DOM.transforms;
        
        // attach interaction handlers
        captureInteractionEvents();
    } // createRenderer
    
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
    
    function changeRenderer(value) {
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
    
    function createControls(controlTypes) {
        // clear the controls array
        // TODO: detach controls
        controls = [];
        
        // iterate through the specified control types and create the controls
        for (var ii = 0; ii < controlTypes.length; ii++) {
            controls[controls.length] = regCreate(
                'control', 
                controlTypes[ii],
                _self,
                panContainer,
                outer,
                params[controlTypes[ii]]
            );
        } // for
    } // createControls
    
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
    
    function initContainer() {
        outer.appendChild(panContainer = DOM.create('div', '', DOM.styles({
            overflow: 'hidden',
            width: outer.offsetWidth + 'px',
            height: outer.offsetHeight + 'px'
        })));
        
        // initialise the view width and height
        width = panContainer.offsetWidth + padding * 2;
        height = panContainer.offsetHeight + padding * 2;
        halfWidth = width / 2;
        halfHeight = height / 2;
        halfOuterWidth = outer.offsetWidth / 2;
        halfOuterHeight = outer.offsetHeight / 2;

        // create the view div and append to the pan container
        panContainer.appendChild(viewpane = DOM.create('div', '', DOM.styles({
            width: width + 'px',
            height: height + 'px',
            'z-index': 2,
            margin: (-padding) + 'px 0 0 ' + (-padding) + 'px'
        })));
    } // initContainer
    
    function updateContainer(value) {
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
        lastHitData = elements.length > 0 ? _extend({}, hitData) : null;
    } // checkHits
    
    function cycle(tickCount) {
        // check to see if we are panning
        var extraTransforms = [],
            panning,
            scaleChanged,
            rerender,
            viewpaneX,
            viewpaneY,
            viewport;
            
        // calculate the current pan speed
        self.panSpeed = panSpeed = abs(dx) + abs(dy);
        
        // update the panning flag
        scaleChanged = scaleFactor !== lastScaleFactor;
        
        if (panSpeed > 0 || scaleChanged || offsetTween || scaleTween || rotateTween) {
            viewChanges++;
            
            // if we have an offset tween and a pan speed, then cancel the tween
            if (offsetTween && panSpeed > 0) {
                offsetTween(true);
                offsetTween = null;
            } // if
        } // if
            
        // determine whether a refresh is required
        if (panSpeed < PANSPEED_THRESHOLD_REFRESH && 
                (abs(offsetX - refreshX) >= refreshDist ||
                abs(offsetY - refreshY) >= refreshDist)) {
            refresh();
        } // if
        
        // initialise the frame data
        frameData.index++;
        frameData.draw = viewChanges || panSpeed || totalDX || totalDY;

        // trigger the enter frame event
        // TODO: investigate whether this can be removed...
        // _self.trigger('enterFrame', tickCount, frameData);
        
        // if we a due for a redraw then do on
        if (renderer && frameData.draw) {
            // if we have a scale tween, then get the updated scale factor
            if (scaleTween) {
                scaleFactor = scaleTween()[0];
            } // if

            // if we have a rotation twee, then get the updated rotation
            if (rotateTween) {
                rotation = rotateTween()[0];
            } // if

            // update the pan x and y
            panX += dx;
            panY += dy;
            
            if (dx || dy) {
                _self.trigger('pan');
            } // if
            
            // if transforms are supported, then scale and rotate as approprate
            if (DOM.transforms) {
                if (scaleFactor !== 1) {
                    extraTransforms[extraTransforms.length] = 'scale(' + scaleFactor + ')';
                } // if
                
                if (rotation !== 0) {
                    extraTransforms[extraTransforms.length] = 'rotate(' + rotation + 'deg)';
                } // if
            } // if
            
            // determine whether we should rerender or not
            rerender = (! fastpan) || (
                (params.drawOnScale || scaleFactor === 1) && 
                panSpeed < PANSPEED_THRESHOLD_FASTPAN
            );
            
            // otherwise, reset the view pane position and refire the renderer
            if (rerender) {
                if (offsetTween) {
                    var values = offsetTween();

                    // get the current offset values from the tween
                    offsetX = values[0] | 0;
                    offsetY = values[1] | 0;
                }
                else {
                    offsetX = (offsetX - panX / scaleFactor) | 0;
                    offsetY = (offsetY - panY / scaleFactor) | 0;
                } // if..else

                // initialise the viewport
                viewport = getViewport();

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
                    
                    // reset the view pan position
                    DOM.move(viewpane, viewpaneX, viewpaneY, extraTransforms);
                } // if
            }
            else {
                // move the view pane
                DOM.move(viewpane, panX, panY, extraTransforms);
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
            
            // check the scale factor
            checkScaling();
        } // if
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
    
    function bounds(newBounds) {
        var viewport = getViewport();
        
        if (newBounds) {
            return zoom(newBounds.bestZoomLevel(viewport)).center(newBounds.center());
        }
        else {
            return new BBox(
                new GeoXY(viewport.x, viewport.y2).sync(_self, true).pos(),
                new GeoXY(viewport.x2, viewport.y).sync(_self, true).pos()
            );
        } // if..else
    } // bounds
    
    function center(p1, p2, tween) {
        var centerXY;
        
        // if we have been passed a string argument, then parse
        if (_is(p1, typeString)) {
            centerXY = Parser.parseXY(p1).sync(_self);
            
            p1 = centerXY.x;
            p2 = centerXY.y;
        } // if
        
        // update if appropriate
        if (_is(p1, typeNumber)) {
            offset(p1 - halfOuterWidth - padding, p2 - halfOuterHeight - padding, tween);
            
            // return the view so we can chain methods
            return _self;
        }
        // otherwise, return the center 
        else {
            return offset().offset(
                halfOuterWidth + padding | 0, 
                halfOuterHeight + padding | 0
            ).sync(_self, true);
        } // if..else
    } // center
    
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
            outer.removeChild(panContainer);
            
            // reset the pan container and container variables
            panContainer = null;
            viewpane = null;
        } // if
        
        // reset the pan frames
        panFrames = [];
    } // detach
    
    /**
    ### zoom(int): int
    Either update or simply return the current zoomlevel.
    */
    function zoom(value, zoomX, zoomY) {
        if (_is(value, typeNumber)) {
            value = max(params.minZoom, min(params.maxZoom, value | 0));
            if (value !== zoomLevel) {
                var scaling = pow(2, value - zoomLevel),
                    scaledHalfWidth = halfWidth / scaling | 0,
                    scaledHalfHeight = halfHeight / scaling | 0;

                // update the zoom level
                zoomLevel = value;

                // update the offset
                offset(
                    ((zoomX || offsetX + halfWidth) - scaledHalfWidth) * scaling,
                    ((zoomY || offsetY + halfHeight) - scaledHalfHeight) * scaling
                );

                // reset the last offset
                refreshX = 0;
                refreshY = 0;

                // trigger the change
                triggerAll('zoom', value);
                
                var gridSize;

                // update the rads per pixel to reflect the zoom level change
                rpp = _self.rpp = radsPerPixel(zoomLevel);

                // calculate the grid size
                setMaxOffset(TWO_PI / rpp | 0, TWO_PI / rpp | 0, true, false);

                // reset the scale factor
                scaleFactor = 1;

                // reset scaling and resync the map
                triggerAll('resync');

                // reset the renderer
                renderer.trigger('reset');

                // refresh the display
                refresh();
            } // if
            
            // return the view so we can chain
            return _self; 
        }
        else {
            return zoomLevel;
        } // if..else
    } // zoom
    
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
    ### layer()
    
    The `layer` method of a view is a very poweful function and can be 
    used in a number of ways:
    
    __To retrieve an existing layer:__
    When called with a single string argument, the method will aim to 
    return the layer that has that id:
    
    ```
    var layer = view.layer('markers');
    ```
    
    __To create a layer:__
    Supply three arguments to the method and a new layer will be created
    of the specified type and using the settings passed through in the 3rd
    argument:
    
    ```
    var layer = view.layer('markers', 'draw', { ... });
    ```
    
    __To retrieve all view layers:__
    Omit all arguments, and the method will return all the layers in the view:
    
    ```
    var layers = view.layer();
    ```
    */
    function layer(id, layerType, settings) {
        // if the layer type is undefined, then assume we are doing a get
        if (_is(layerType, typeUndefined)) {
            // look for the matching layer, and return when found
            for (var ii = 0; ii < layerCount; ii++) {
                if (layers[ii].id === id) {
                    return layers[ii];
                } // if
            } // for
            
            return undefined;
        }
        // otherwise, let's create the layer and add it to the view
        // TODO: handle when an existing view is passed via the second arg
        else if (_is(id, typeString)) {
            // create the layer using the registry
            var layer = regCreate('layer', layerType, _self, settings);
            
            // initialise the layer attributes
            layer.added = ticks();
            layer.id = id;
            layers[layers.length] = layer;
            
            // resort the layers
            // sort the layers
            layers.sort(function(itemA, itemB) {
                return itemB.zindex - itemA.zindex || itemB.added - itemA.added;
            });
            
            // update the layer count
            layerCount = layers.length;                

            // trigger a refresh on the layer
            layer.trigger('resync');
            layer.trigger('refresh', _self, getViewport());

            // trigger a layer changed event
            _self.trigger('layerChange', _self, layer);

            // invalidate the map
            invalidate();

            // return the layer so we can chain if we want
            return layer;
        }
        // otherwise, return the view layers
        else {
            return [].concat(layers);
        } // if..else
    } // layer

    /**
    ### pan(x, y, tween)
    */
    function pan(x, y, tween) {
        offset(offsetX + x, offsetY + y, tween);
    } // pan
    
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
            
            // check the offset has changed (refreshes can happen for other reasons)
            if (lastBoundsChangeOffset.x != viewport.x || lastBoundsChangeOffset.y != viewport.y) {
                // trigger the event
                _self.trigger('boundsChange', bounds());

                // update the last bounds change offset
                lastBoundsChangeOffset.x = viewport.x;
                lastBoundsChangeOffset.y = viewport.y;
            } // if
            
            // trigger the refresh event
            triggerAll('refresh', _self, viewport);

            // invalidate
            viewChanges++;
        } // if
    } // refresh
    
    /**
    ### rotate(value, tween, isAbsolute)
    */
    function rotate(value, tween, isAbsolute) {
        if (_is(value, typeNumber)) {
            var targetVal = isAbsolute ? value : rotation + value;

            if (tween) {
                rotateTween = Tweener.tween([rotation], [targetVal], tween, function() {
                    rotation = targetVal % 360;
                    rotateTween = null;
                    viewChanges++;
                });
            }
            else {
                rotation = targetVal % 360;
                viewChanges++;
            } // if..else
            
            return _self;
        }
        else {
            return rotation;
        } // if..else
    } // rotate
    
    /**
    ### scale(value, tween, isAbsolute)
    */
    function scale(value, tween, isAbsolute) {
        // if we are setting the scale,
        if (_is(value, typeNumber)) {
            var scaleFactorExp,
                targetVal = isAbsolute ? value : scaleFactor * value;

            // if partial scrolling is disabled handle it
            if (! partialScaling) {
                tween = null;

                scaleFactorExp = round(log(targetVal) / Math.LN2);

                // round the scale factor to the nearest power of 2
                targetVal = pow(2, scaleFactorExp);
            } // if

            if (tween) {
                scaleTween = Tweener.tween([scaleFactor], [targetVal], tween, function() {
                    scaleFactor = targetVal;
                    scaleTween = null;
                    viewChanges++;
                });
            }
            else {
                scaleFactor = targetVal;
                viewChanges++;
            }
            
            return _self;
        } // if
        else {
            return scaleFactor;
        }
    } // scale
    
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
    ### offset(x: int, y: int, tween: TweenOpts)

    This function allows you to specified the absolute x and y offset that should 
    become the top-left corner of the view.  As per the `pan` function documentation, tween and
    callback arguments can be supplied to animate the transition.
    */
    function offset(x, y, tween) {
        // if we have arguments update the offset
        if (_is(x, typeNumber)) {
            if (tween) {
                offsetTween = Tweener.tween(
                    [offsetX, offsetY],
                    [x, y], 
                    tween,
                    function() {
                        offsetTween = null;
                    }
                );
            }
            else {
                offsetX = x | 0;
                offsetY = y | 0;
            } // if..else
            
            return _self;
        }
        // otherwise, simply return it
        else {
            // return the last calculated cycle offset
            return new GeoXY(offsetX, offsetY).sync(_self, true);
        } // if..else
    } // offset
    
    /* object definition */
    
    // initialise _self
    var _self = {
        XY: GeoXY, // TODO: abstract back down for to a view
        
        id: params.id,
        padding: padding,
        panSpeed: 0,
        
        attachFrame: attachFrame,
        bounds: bounds,
        center: center,
        detach: detach,
        layer: layer,
        invalidate: invalidate,
        pan: pan,
        refresh: refresh,
        rotate: rotate,
        scale: scale,
        triggerAll: triggerAll,
        
        /* offset methods */
        
        setMaxOffset: setMaxOffset,
        getViewport: getViewport,
        offset: offset,
        zoom: zoom
    };

    // make the view observable
    _observable(_self);
    
    // handle the view being resynced
    _self.bind('resize', function() {
        renderer.checkSize();
    });
    
    _self.bind(EVT_REMOVELAYER, handleRemoveLayer);
    
    // route auto configuration methods
    _configurable(_self, params, {
        container: updateContainer,
        captureHover: captureInteractionEvents,
        scalable: captureInteractionEvents,
        pannable: captureInteractionEvents,
        renderer: changeRenderer
    });
    
    CANI.init(function(testResults) {
        // add the markers layer
        layer('markers', 'draw', { zindex: 20 });
        
        // create the renderer
        caps = testResults;
        updateContainer(params.container);

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
    Animator.attach(cycle);
    
    // create the controls
    createControls(params.controls);
    
    return _self;
});