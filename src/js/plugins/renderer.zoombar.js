T5.registerRenderer('zoombar', function(view, container, params, baseRenderer) {
    params = COG.extend({
        width: 24,
        height: 200,
        images: '/img/zoom.png',
        margin: 10,
        thumbHeight: 16
    }, params.zoombar);
    
    /* internals */
    
    var PROP_WK_TRANSFORM = '-webkit-transform',
        eventMonitor,
        supportTransforms = typeof container.style[PROP_WK_TRANSFORM] != 'undefined',
        thumb,
        thumbHeight = params.thumbHeight,
        thumbMin = params.margin,
        thumbMax = params.height - thumbHeight - params.margin,
        thumbPos = thumbMin,
        thumbVal = -1,
        zoomMin = view.minZoom(),
        zoomMax = view.maxZoom(),
        zoomSteps = zoomMax - zoomMin,
        zoomStepSpacing = (thumbMax - thumbMin) / zoomSteps | 0,
        zoomBar,
        zoomTimeout = 0;
        
    function createThumb() {
        thumb = document.createElement('div');
        thumb.className = 't5-zoombar-thumb';
        thumb.style.cssText = COG.formatStr(
            'position: absolute; background: {0}; z-index: 51; width: {1}px; height: {2}px; margin-top: {3}px;',
            getThumbBackground(),
            params.width,
            params.thumbHeight,
            thumbPos);
            
        // add the thumb
        zoomBar.appendChild(thumb);
    } // createThumb
    
    function createZoomBar() {
        zoomBar = document.createElement('div');
        zoomBar.className = 't5-zoombar';
        zoomBar.style.cssText = COG.formatStr(
            'position: absolute; background: {3}; z-index: 50; overflow: hidden; width: {0}px; height: {1}px; margin: {2};',
            params.width,
            params.height,
            getMargin(),
            getBackground());
            
        // add the zoom bar
        if (container.childNodes[0]) {
            container.insertBefore(zoomBar, container.childNodes[0]);
        }
        else {
            container.appendChild(zoomBar);
        } // if..else
        
        // create the thumb elements
        createThumb();
        
        // attach the event monitor
        eventMonitor = INTERACT.watch(zoomBar, {
            bindTarget: zoomBar
        });

        // handle pointer move events
        eventMonitor.bind('pointerMove', handlePointerMove);
        
        COG.info('creating the zoombar');
    } // createImageContainer
    
    function getBackground() {
        return COG.formatStr('url({0});', 
            params.images);
    } // getBackground
    
    function getMargin() {
        return COG.formatStr('{0} {1} {2} {3}',
            params.margin + 'px',
            0,
            '0',
            (container.offsetWidth - params.width - params.margin) + 'px');
    } // getMargin
    
    function getThumbBackground() {
        return COG.formatStr('url({0}) 0 -{1}px no-repeat',
            params.images,
            params.height);
    } // getThumbBackground
    
    function handleDetach() {
        // unbind the event monitor
        eventMonitor.unbind();
        
        // remove the image div from the container
        container.removeChild(zoomBar);
    } // handleDetach
    
    function handlePointerMove(evt, absXY, relXY) {
        // update the thumb pos
        thumbPos = Math.min(Math.max(thumbMin, relXY.y - (thumbHeight >> 1)), thumbMax);
        
        setThumbVal(zoomSteps - ((thumbPos - thumbMin) / thumbMax) * zoomSteps | 0);
    } // handlePointerMove
    
    function handleZoomLevelChange(evt, zoomLevel) {
        setThumbVal(zoomLevel);
    } // handleZoomLevelChange
    
    /* exports */
    
    function reset() {
    } // reset

    function setThumbVal(value) {
        if (value !== thumbVal) {
            // calculate the thumb value
            thumbVal = value;

            // if we are snapping then calculate the snapped thumbpos
            thumbPos = thumbMax - (thumbMin + 
                (thumbVal / zoomSteps * (thumbMax - thumbMin)) | 0);

            // update the thumb style
            if (supportTransforms) {
                thumb.style[PROP_WK_TRANSFORM] = 'translate3d(0px, ' + (thumbPos - thumbMin) + 'px, 0px)';
            }
            else {
                thumb.style.margin = thumbPos + 'px 0 0 0';
            } // if..else
            
            clearTimeout(zoomTimeout);
            zoomTimeout = setTimeout(function() {
                // set the zoom level for the map
                view.setZoomLevel(thumbVal);
            }, 500);
        } // if
    } // if

    /* initialization */
    
    // attach the background image display
    createZoomBar();
    
    var _this = COG.extend(baseRenderer, {
        reset: reset
    });
    
    // handle the predraw
    _this.bind('detach', handleDetach);
    
    // bind to the view zoom level change event
    view.bind('zoomLevelChange', handleZoomLevelChange);
    
    // set the zoom level to the current zoom level of the view
    setThumbVal(view.getZoomLevel());
    
    return _this;
});