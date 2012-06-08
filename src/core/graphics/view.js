/**
# T5.View
*/
var View = function(container, params) {
    // initialise defaults
    params = cog.extend({
        captureHover: true,
        controls: [],
        copyright: '',
        drawOnScale: true,
        padding: 128, // other values 'auto'
        inertia: true,
        refreshDistance: 128,
        drawOnMove: false,
        drawOnTween: false,
        pannable: true,
        scalable: true,
        renderer: 'canvas',
        useTransforms: true
    }, params);
    
    // initialise constants
    var PANSPEED_THRESHOLD_REFRESH = 0,
        PANSPEED_THRESHOLD_FASTPAN = 2,
        PADDING_AUTO = 'auto',
    
        // get the container context
        _allowTransforms = true,
        _frozen = false,
        controls = [],
        copyright = '',
        layers = [],
        layerCount = 0,
        viewpane = null,
        panContainer = null,
        outer,
        dragObject = null,
        mainContext = null,
        hitFlagged = false,
        fastpan,
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
        padding,
        panFrames = [],
        hits = [],
        lastHitData = null,
        renderer,
        resizeCanvasTimeout = 0,
        txCenter = new XY(),
        rotation = 0,
        rotateTween = null,
        scaleFactor = 1,
        origScaleFactor,
        scaleTween = null,
        lastScaleFactor = 1,
        lastCycleTicks = 0,
        eventMonitor = null,
        frameData = {
            index: 0,
            draw: false
        },
        scaleEasing = {
            easing: 'sine.out',
            duration: 500
        },
        tweeningOffset = false, // TODO: find a better way to determine this than with a flag
        cycleDelay = 1000 / params.fps | 0,
        viewChanges = 0,
        width, height,
        halfWidth, halfHeight,
        halfOuterWidth, halfOuterHeight,
        viewTapTimeout,
        wheelZoomTimeout = 0;
        
    /* event handlers */
    
    /* scaling functions */
    
    function handleZoom(evt, absXY, relXY, scaleChange, source) {
        // if there is a current scale tween active, then cancel it
        if (scaleTween) {
            scaleTween(true);
        } // if
        
        var scaleVal;

        if (_allowTransforms) {
            scaleVal = max(scaleFactor + pow(2, scaleChange) - 1, 0.125);
        }
        else {
            scaleVal = scaleChange > 0 ? 2 : 0.5;
        } // if..else

        scale(scaleVal, false, true); // , getProjectedXY(relXY.x, relXY.y));
    } // handleWheelZoom
    
    function getProjectedXY(srcX, srcY) {
        // first see if the renderer will determine the projected xy
        var projectedXY = renderer && renderer.projectXY ? renderer.projectXY(srcX, srcY) : null;
        
        // if not, then calculate here
        if (! projectedXY) {
            var vp = viewport(),
                scaledX = vp ? (vp.x + (srcX + vp.padding.x) / scaleFactor) : srcX,
                scaledY = vp ? (vp.y + (srcY + vp.padding.y) / scaleFactor) : srcY;

            projectedXY = new _this.XY(scaledX, scaledY);
        } // if
        
        return projectedXY.sync(_this, true);
    } // getProjectedXY
    
    function handleDoubleTap(evt, absXY, relXY) {
        var projXY = getProjectedXY(relXY.x, relXY.y);
        
        // clear the view tap timeout
        clearTimeout(viewTapTimeout);

        // trigger the double tap event
        _this.trigger('doubleTap', absXY, relXY, projXY);
            
        if (params.scalable) {
            var center = _this.center();
            
            // update the offset to the tapped position
            offset(
                offsetX + projXY.x - center.x, 
                offsetY + projXY.y - center.y, 
                _allowTransforms ? scaleEasing : null
            );
            
            // animate the scaling
            scale(2, scaleEasing, true);
        } // if
    } // handleDoubleTap
    
    function handlePointerDown(evt, absXY, relXY) {
        // reset the hover offset and the drag element
        dragObject = null;
        pointerDown = true;
        
        // initialise the hit data
        initHitData('down', absXY, relXY);
        
        // bubble the event up
        _this.trigger('pointerDown', absXY, relXY);
    } // handlePointerDown
    
    function handlePointerHover(evt, absXY, relXY) {
        // initialise the hit data
        initHitData('hover', absXY, relXY);
    } // handlePointerHover
    
    function handlePointerMove(evt, absXY, relXY, deltaXY) {
        // drag the selected if we 
        dragSelected(absXY, relXY, false);
        
        // bubble the event up
        _this.trigger('pointerMove', absXY, relXY, deltaXY);
    } // handlePointerMove
    
    function handlePan(evt, deltaX, deltaY) {
        if (! dragObject) {
            dx += deltaX;
            dy += deltaY;
        } // if
    } // handlePan
    
    function handlePointerUp(evt, absXY, relXY) {
        dragSelected(absXY, relXY, true);
        pointerDown = false;
        
        // bubble the event up
        _this.trigger('pointerUp', absXY, relXY);
    } // handlePointerUp
    
    function handleResize(evt) {
        clearTimeout(resizeCanvasTimeout);
        resizeCanvasTimeout = setTimeout(function() {
            if (outer) {
                var changed = outer.offsetWidth !== halfOuterWidth * 2 || 
                    outer.offsetHeight !== halfOuterHeight * 2;
                    
                if (changed) {
                    // get the current center position
                    var oldCenter = center();

                    // update the container
                    updateContainer(container);
                    
                    // restore the center position
                    center(oldCenter.x, oldCenter.y);
                } // if
            } // if
        }, 250);
    } // handleResize
    
    function handlePointerTap(evt, absXY, relXY) {
        // initialise the hit data
        initHitData('tap', absXY, relXY);
        
        // trigger a tap in 20ms unless an object has been tapped
        viewTapTimeout = setTimeout(function() {
            _this.trigger('tap', absXY, relXY, getProjectedXY(relXY.x, relXY.y, true));
        }, 20);
    } // handlePointerTap
    
    /* private functions */
    
    function captureInteractionEvents() {
        // TODO: unbind events

        if (DOM && renderer) {
            var targetId = (renderer.interactTarget || outer).id || '*';
            
            // recreate the event monitor
            eventMonitor = INTERACT.watch(renderer.interactTarget || outer);

            // if this view is scalable, attach zooming event handlers
            if (params.scalable) {
                eve.on('interact.zoom.*.' + targetId, handleZoom);
                eve.on('interact.doubletap.' + targetId, handleDoubleTap);
            } // if
            
            // handle pointer down tests
            eve.on('interact.pointer.down.' + targetId, handlePointerDown);
            eve.on('interact.pointer.move.' + targetId, handlePointerMove);
            eve.on('interact.pointer.up.' + targetId, handlePointerUp);
            eve.on('interact.pan.' + targetId, handlePan);

            if (params.captureHover) {
                eve.on('interact.pointer.hover.' + targetId, handlePointerHover);
            } // if

            // handle tap events
            eve.on('interact.tap.' + targetId, handlePointerTap);
        } // if
    } // captureInteractionEvents
    
    function changeRenderer(value) {
        // if we have a renderer, then detach it
        if (renderer) {
            renderer.trigger('detach');
            renderer = null;
        } // if
        
        // now create the new renderer
        renderer = attachRenderer(value, _this, viewpane, outer, params);
        
        // determine whether partial scaling is supporter
        fastpan = DOM && renderer.fastpan && DOM.transforms;
        _allowTransforms = DOM && DOM.transforms && params.useTransforms;
        
        // attach interaction handlers
        captureInteractionEvents();

        // reset the view (renderers will pick this up)
        _this.trigger('changeRenderer', renderer);
        _this.trigger('reset');

        // refresh the display
        refresh();
    } // changeRenderer
    
    /*
    The constrain offset function is used to keep the view offset within a specified
    offset using wrapping if allowed.  The function is much more 'if / then / elsey' 
    than I would like, and might be optimized at some stage, but it does what it needs to
    */
    function constrainOffset(vp, allowWrap) {
        if (! vp) {
            return;
        } // if
        
        var testX = offsetWrapX ? offsetX + (vp.w >> 1) : offsetX,
            testY = offsetWrapY ? offsetY + (vp.h >> 1) : offsetY,
            viewWidth = vp.w,
            viewHeight = vp.h;
        
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
        var ii;
        
        // if we have existing controls, then tell them to detach
        for (ii = 0; ii < controls.length; ii++) {
            controls[ii].trigger('detach');
        } // for
        
        // clear the controls array
        controls = [];
        
        // iterate through the specified control types and create the controls
        for (ii = 0; ii < controlTypes.length; ii++) {
            controls[controls.length] = regCreate(
                'control', 
                controlTypes[ii],
                _this,
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
                viewChanges++;
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
        // iterate through the layers
        for (var ii = layerCount; ii--; ) {
            if (layers[ii].id === id) {
                return ii;
            } // if
        } // for
        
        return layerCount;
    } // getLayerIndex
    
    function initContainer() {
        // calculate the width and height
        var outerRect = DOM.rect(outer);
        
        // if we have a pan container, then remove it from the dom
        if (panContainer) {
            outer.removeChild(panContainer);
        } // if
        
        outer.appendChild(panContainer = DOM.create('div', 't5-panframe', DOM.styles({
            overflow: 'hidden',
            width: outerRect.w + 'px',
            height: outerRect.h + 'px'
        })));
        
        // initialise the padding
        initPadding(params.padding);

        // initialise the view width and height
        width = panContainer.offsetWidth + padding.x * 2;
        height = panContainer.offsetHeight + padding.y * 2;
        halfWidth = width / 2;
        halfHeight = height / 2;
        halfOuterWidth = outerRect.w / 2;
        halfOuterHeight = outerRect.h / 2;
        
        // initialise the translation center
        txCenter = new XY(halfWidth, halfHeight);
        
        // create the view div and append to the pan container
        panContainer.appendChild(viewpane = DOM.create('div', 't5-view', DOM.styles({
            width: width + 'px',
            height: height + 'px',
            'z-index': 2,
            margin: (-padding.y) + 'px 0 0 ' + (-padding.x) + 'px'
        })));
    } // initContainer
    
    function updateContainer(value) {
        if (DOM) {
            // get the outer element
            outer = document.getElementById(value);
            
            if (outer) {
                initContainer(outer);

                // change the renderer
                changeRenderer(params.renderer);

                // create the controls
                createControls(params.controls);
            }
            else {
                throw new Error('Unable to find map container element with id: ' + value);
            } // if..else
        }
        else {
            changeRenderer('canvas');
        } // if..else
    } // updateContainer
    
    /* draw code */
    
    /*
    ### checkHits
    */
    function checkHits(hitSample) {
        var changed = true,
            elements = hitSample ? hitSample.elements : [],
            doubleHover = hitSample && lastHitData && hitSample.type === 'hover' &&
                lastHitData.type === 'hover',
            ii;
        
        // if we have last hits, then check for elements
        if (doubleHover) {
            diffElements = Hits.diffHits(lastHitData.elements, elements);
            
            // if we have diff elements then trigger an out event
            if (diffElements.length > 0) {
                Hits.triggerEvent(lastHitData, _this, 'Out', diffElements);
            }
            // otherwise, reset the changed state as we have nothing to do
            // (that we haven't already done before)
            else {
                changed = false;
            }
        } // if

        // if we have elements
        if (elements.length > 0) {
            var downX = hitSample.gridX,
                downY = hitSample.gridY;
            
            // iterate through objects from last to first (first get drawn last so sit underneath)
            for (ii = elements.length; pointerDown && ii--; ) {
                if (dragStart(elements[ii], downX, downY)) {
                    break;
                } // if
            } // for

            // if the event state has changed trigger the event
            if (changed) {
                Hits.triggerEvent(hitSample, _this);
                
                // if we have a tap, then clear the view tap timeout
                if (hitSample.type === 'tap') {
                    clearTimeout(viewTapTimeout);
                } // if
            } // if
        } // if
        
        // save the last hit elements
        lastHitData = elements.length > 0 ? cog.extend({}, hitSample) : null;
    } // checkHits
    
    function cycle(tickCount) {
        // check to see if we are panning
        var extraTransforms = [],
            panning,
            panSpeed,
            scaleChanged,
            rerender,
            viewpaneX,
            viewpaneY,
            vp;
            
        // if the view is frozen exit
        if (_frozen) {
            return;
        }
            
        // calculate the current pan speed
        _this.panSpeed = panSpeed = abs(dx) + abs(dy);
        
        // update the panning flag
        scaleChanged = scaleFactor !== lastScaleFactor;
        if (scaleChanged) {
            _this.trigger('scale');
        } // if
        
        if (panSpeed > 0 || scaleChanged || offsetTween || scaleTween || rotateTween) {
            viewChanges++;
            
            // if we have an offset tween and a pan speed, then cancel the tween
            if (offsetTween && panSpeed > 0) {
                offsetTween(true);
                offsetTween = null;
            } // if
        } // if
            
        // determine whether a refresh is required
        if ((! pointerDown) && panSpeed <= PANSPEED_THRESHOLD_REFRESH && 
                (abs(offsetX - refreshX) >= refreshDist ||
                abs(offsetY - refreshY) >= refreshDist)) {
            refresh();
        } // if
        
        // initialise the frame data
        frameData.index++;
        frameData.draw = viewChanges || panSpeed || totalDX || totalDY;

        // trigger the enter frame event
        // TODO: investigate whether this can be removed...
        // _this.trigger('enterFrame', tickCount, frameData);
        
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
                _this.trigger('pan');
            } // if
            
            // if transforms are supported, then scale and rotate as approprate
            if (_allowTransforms) {
                if (scaleFactor !== 1) {
                    extraTransforms[extraTransforms.length] = 'scale(' + scaleFactor + ')';
                } // if
                
                if (rotation !== 0) {
                    extraTransforms[extraTransforms.length] = 'rotate(' + rotation + 'deg)';
                } // if
            } // if
            
            // determine whether we should rerender or not
            rerender = hitFlagged || (! fastpan) || (
                (params.drawOnMove || (! pointerDown)) && 
                (params.drawOnTween || (! (offsetTween || scaleTween))) && 
                (params.drawOnScale || scaleFactor === 1) && 
                panSpeed <= PANSPEED_THRESHOLD_FASTPAN
            );
            
            // if an offset tween is active, then get the updated values
            if (offsetTween) {
                var values = offsetTween(),
                    scaleFactorDiff = 1;
                
                if (origScaleFactor) {
                    scaleFactorDiff = scaleFactor / origScaleFactor;
                } // if
                
                // get the current offset values from the tween
                panX = (offsetX - values[0] | 0) * scaleFactorDiff;
                panY = (offsetY - values[1] | 0) * scaleFactorDiff;
            } // if

            // otherwise, reset the view pane position and refire the renderer
            if (rerender) {
                var theta = -rotation * DEGREES_TO_RADIANS,
                    xChange = cos(theta) * panX + -sin(theta) * panY,
                    yChange = sin(theta) * panX +  cos(theta) * panY;
                
                offsetX = (offsetX - xChange / scaleFactor) | 0;
                offsetY = (offsetY - yChange / scaleFactor) | 0;

                // initialise the viewport
                vp = viewport();

                /*
                // check that the offset is within bounds
                if (offsetMaxX || offsetMaxY) {
                    constrainOffset();
                } // if
                */

                // TODO: if we have a hover offset, check that no elements have moved under the cursor (maybe)

                // trigger the predraw event
                renderer.trigger('predraw', layers, vp, tickCount, hits);

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
                            vp,
                            _this,
                            tickCount,
                            hits[0]);

                        // if we applied a style, then restore the previous style if supplied
                        if (previousStyle) {
                            renderer.applyStyle(previousStyle);
                        } // if
                    } // if
                } // for

                // get the renderer to render the view
                // NB: some renderers will do absolutely nothing here...
                renderer.trigger('render', vp);

                // trigger the draw complete event
                _this.trigger('drawComplete', vp, tickCount);

                // reset the view pan position
                DOM.move(viewpane, viewpaneX, viewpaneY, extraTransforms, txCenter);
            }
            else {
                // move the view pane
                DOM.move(viewpane, panX, panY, extraTransforms, txCenter);
            } // if..else
            
            // apply the inertial dampeners 
            // really just wanted to say that...
            if (pointerDown || (! params.inertia)) {
                dx = 0;
                dy = 0;
            }
            else if (dx !== 0 || dy !== 0) {
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
            if (hits.length) {
                // iterate through the hits and check 
                for (ii = 0; ii < hits.length; ii++) {
                    checkHits(hits[ii]);
                } // for
                
                // reset the hits
                hits = [];
            } // if

            // check for a scale factor change
            if (lastScaleFactor !== scaleFactor) {
                _this.trigger('scaleChanged', scaleFactor);
                lastScaleFactor = scaleFactor;
            }
        } // if
    } // cycle
    
    function initHitData(hitType, absXY, relXY) {
        var hitSample,
            txXY = new XY(
                relXY.x - halfOuterWidth + halfWidth,
                relXY.y - halfOuterHeight + halfHeight
            )
            .rotate(-rotation * DEGREES_TO_RADIANS, txCenter)
            .scale(1/scaleFactor, txCenter);
            
        if (hits.length === 0 || (! Hits.match(hits[hits.length - 1], hitType, absXY))) {
            // initialise the hit data
            hits[hits.length] = hitSample = Hits.init(
                hitType, 
                absXY, 
                relXY, 
                getProjectedXY(relXY.x, relXY.y, true),
                txXY
            );

            // reset the hit flagged state
            hitFlagged = false;

            // iterate through the layers and check to see if we have hit potential
            // iterate through all layers as some layers may use the hit guess operation
            // to initialise hit data rather than doing it in the draw loop 
            // (T5.MarkerLayer for instance)
            for (var ii = layerCount; ii--; ) {
                // if the layer is visible then check for hits
                if (layers[ii].visible) {
                    hitFlagged = hitFlagged || (layers[ii].hitGuess ? 
                        layers[ii].hitGuess(hitSample.gridX, hitSample.gridY, _this) :
                        false);
                } // if
            } // for

            // if we have a potential hit then invalidate the view so a more detailed
            // test can be run
            if (hitFlagged) {
                viewChanges++;
            } // if
        } // if
    } // initHitData
    
    function initPadding(input) {
        // if the padding is set to auto, make the view a rotatable square
        if (input === PADDING_AUTO) {
            // calculate the size of the diagonal
            var oWidth = outer.offsetWidth,
                oHeight = outer.offsetHeight,
                diagonal = sqrt(oWidth * oWidth + oHeight * oHeight);
            
            padding = new XY((diagonal - oWidth) >> 1, (diagonal - oHeight) >> 1);
        } 
        else {
            padding = new XY(input, input);
        } // if..else
    } // initPadding
    
    /* exports */
    
    function addCopy(text) {
        // update the copyright and trigger the event
        copyright = copyright ? copyright + ' ' + text : text;
        _this.trigger('copyright', copyright);
    } // addCopy
    
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
    
    function center(p1, p2, tween) {
        // if we have been passed a string argument, then parse
        if (typeof p1 == 'string' || (p1 instanceof String)) {
            var centerXY = new _this.XY(p1);
            
            // sync
            centerXY.sync(_this);

            // push the x and y parameters to the arguments
            p1 = centerXY.x;
            p2 = centerXY.y;
        } // if
        
        // update if appropriate
        if (sniff(p1) == 'number') {
            offset(p1 - halfOuterWidth - padding.x, p2 - halfOuterHeight - padding.y, tween);
            
            // return the view so we can chain methods
            return _this;
        }
        // otherwise, return the center 
        else {
            return offset().offset(
                halfOuterWidth + padding.x | 0, 
                halfOuterHeight + padding.y | 0
            ).sync(_this, true);
        } // if..else
    } // center
    
    /**
    ### detach
    If you plan on reusing a single canvas element to display different views then you 
    will definitely want to call the detach method between usages.
    */
    function detach() {
        // detach from the animator
        Animator.detach(cycle);
        
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
    ### frozen(value)
    */
    function frozen(value) {
        if (typeof value != 'undefined') {
            _frozen = value;
            return _this;
        }
        else {
            return _frozen;
        } // if..else
    } // frozen
    
    function getCopy() {
        return copyright;
    } // getCopy
    
    function getRenderer() {
        return renderer;
    } // getRenderer
    
    /**
    ### invalidate()
    */
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
    ### viewport()
    Return a T5.XYRect (annotated with scale factor and padding) for the 
    current offset rect of the view
    */
    function viewport() {
        var vp = new Rect(offsetX, offsetY, width, height);
        
        // add the scale factor information
        vp.scaleFactor = scaleFactor;
        
        // add the padding to the viewport
        vp.padding = padding ? padding.copy() : new XY();
            
        // return the viewport
        return vp;
    } // viewport
    
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
        var haveId = typeof id != 'undefined';
        
        // if the layer type is undefined, then assume we are doing a get
        if (haveId && typeof layerType == 'undefined') {
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
        else if (haveId) {
            // create the layer using the registry
            var newLayer = regCreate('layer', layerType, _this, panContainer, outer, settings),
                layerIndex = getLayerIndex(id);
                
            if (layerIndex !== layerCount) {
                // remove the layer
                removeLayer(layers[layerIndex]);
            } // if
            
            // initialise the layer attributes
            newLayer.added = ticks();
            newLayer.id = id;
            layers.push(newLayer);

            // resort the layers
            // sort the layers
            layers.sort(function(itemA, itemB) {
                return itemB.zindex - itemA.zindex || itemB.added - itemA.added;
            });

            // update the layer count
            layerCount = layers.length;                

            // trigger a refresh on the layer
            _this.trigger('resync');
            refresh();

            // trigger a layer changed event
            _this.trigger('layerChange', _this, newLayer);

            // invalidate the map
            viewChanges++;

            // return the layer so we can chain if we want
            return newLayer;
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
        return offset(offsetX + x, offsetY + y, tween);
    } // pan
    
    /**
    ### refresh()
    Manually trigger a refresh on the view.  Child view layers will likely be listening for `refresh`
    events and will do some of their recalculations when this is called.
    */
    function refresh() {
        var vp = viewport();
        if (vp) {
            // check that the offset is within bounds
            if (offsetMaxX || offsetMaxY) {
                constrainOffset(vp);
            } // if

            // update the last refresh x and y
            refreshX = offsetX;
            refreshY = offsetY;
            
            // trigger the refresh event
            _this.trigger('refresh', _this, vp);

            // invalidate
            viewChanges++;
        } // if
    } // refresh
    
    /**
    ### removeLayer()
    */
    function removeLayer(targetLayer) {
        // if we have been passed a layer id, then get the layer object
        if (sniff(targetLayer) == 'string') {
            targetLayer = layer(targetLayer);
        } // if
        
        // if we have a layer, then remove it
        if (targetLayer) {
            // trigger the beforeRemoveEvent
            _this.trigger('beforeRemoveLayer', targetLayer);
            
            var layerIndex = getLayerIndex(targetLayer.id);
            if ((layerIndex >= 0) && (layerIndex < layerCount)) {
                layers.splice(layerIndex, 1);
                viewChanges++;
            } // if

            // update the layer count
            layerCount = layers.length;

            // trigger the layer removal
            targetLayer.trigger('removed');
        } // if
    } // removeLayer
    
    /**
    ### rotate(value, tween, isAbsolute)
    */
    function rotate(value, tween, isAbsolute) {
        if (sniff(value) == 'number') {
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
            
            return _this;
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
        if (sniff(value) == 'number') {
            var scaleFactorExp,
                targetVal = isAbsolute ? value : scaleFactor * value;

            // if partial scrolling is disabled handle it
            if (! _allowTransforms) {
                tween = undefined;
                scaleFactorExp = round(log(targetVal) / Math.LN2);

                // round the scale factor to the nearest power of 2
                targetVal = pow(2, scaleFactorExp);
            } // if
            
            if (tween) {
                // save the original scale factor
                origScaleFactor = scaleFactor;
                
                // initiate the scale tween
                scaleTween = Tweener.tween([scaleFactor], [targetVal], tween, function() {
                    scaleFactor = targetVal;
                    scaleTween = null;
                    origScaleFactor = null;
                    viewChanges++;
                });
            }
            else {
                scaleFactor = targetVal;
                viewChanges++;
            }
            
            return _this;
        } // if
        else {
            return scaleFactor;
        }
    } // scale
    
    /**
    ### offset(x: int, y: int, tween: TweenOpts)

    This function allows you to specified the absolute x and y offset that should 
    become the top-left corner of the view.  As per the `pan` function documentation, tween and
    callback arguments can be supplied to animate the transition.
    */
    function offset(x, y, tween) {
        // if we have arguments update the offset
        if (sniff(x) == 'number') {
            if (tween) {
                offsetTween = Tweener.tween(
                    [offsetX, offsetY],
                    [x, y], 
                    tween,
                    function() {
                        offsetX = x | 0;
                        offsetY = y | 0;
                        panX = panY = 0;

                        offsetTween = null;
                        viewChanges++;
                    }
                );
            }
            else {
                offsetX = x | 0;
                offsetY = y | 0;
                
                viewChanges++;
            } // if..else
            
            return _this;
        }
        // otherwise, simply return it
        else {
            // return the last calculated cycle offset
            return new _this.XY(offsetX, offsetY).sync(_this, true);
        } // if..else
    } // offset
    
    /* object definition */
    
    // initialise _this
    var _this = {
        XY: XY, 
        
        id: params.id,
        panSpeed: 0,
        
        addCopy: addCopy,
        attachFrame: attachFrame,
        center: center,
        detach: detach,
        frozen: frozen,
        getCopy: getCopy,
        getRenderer: getRenderer,
        layer: layer,
        invalidate: invalidate,
        pan: pan,
        refresh: refresh,
        removeLayer: removeLayer,
        rotate: rotate,
        scale: scale,
        
        /* offset methods */
        
        setMaxOffset: setMaxOffset,
        offset: offset,
        viewport: viewport
    };
    
    // make the view observable
    cog.observable(_this);
    
    // handle the view being resynced
    _this.bind('resize', handleResize);

    // route auto configuration methods
    cog.configurable(_this, params, {
        container: updateContainer,
        captureHover: captureInteractionEvents,
        scalable: captureInteractionEvents,
        pannable: captureInteractionEvents,
        renderer: changeRenderer
    });
    
    // add the markers layer
    layer('markers', 'draw', { zindex: 20 });
    
    // create the renderer
    updateContainer(container);

    // if autosized, then listen for resize events
    if (DOM && typeof window.attachEvent != 'undefined') {
        window.attachEvent('onresize', handleResize);
    }
    else if (DOM) {
        window.addEventListener('resize', handleResize, false);
    } // if
    
    // if we have some copyright, then add it
    if (params.copyright) {
        addCopy(params.copyright);
    } // if
    
    // start the animation frame
    Animator.attach(cycle);
    
    return _this;
};