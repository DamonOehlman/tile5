T5.registerRenderer('zoombar', function(view, container, outer, params, baseRenderer) {
    params = COG.extend({
        width: 24,
        height: 200,
        images: '/img/zoom.png',
        margin: 10,
        thumbHeight: 16,
        buttonHeight: 16
    }, params.zoombar);
    
    /* internals */
    
    var STATE_STATIC = 0,
        STATE_HOVER = 1,
        STATE_DOWN = 2,
        PROP_WK_TRANSFORM = '-webkit-transform',
        buttonHeight = params.buttonHeight,
        eventMonitor,
        supportTransforms = typeof container.style[PROP_WK_TRANSFORM] != 'undefined',
        spriteStart = params.height,
        thumb,
        thumbHeight = params.thumbHeight,
        thumbMin = params.margin + buttonHeight - (thumbHeight >> 1),
        thumbMax = params.height - buttonHeight - (thumbHeight >> 1),
        thumbPos = thumbMin,
        thumbVal = -1,
        thumbResetTimeout = 0,
        zoomMin = view.minZoom(),
        zoomMax = view.maxZoom(),
        zoomSteps = zoomMax - zoomMin + 1,
        zoomStepSpacing = (thumbMax - thumbMin) / zoomSteps | 0,
        buttons = [],
        zoomBar,
        zoomTimeout = 0,
        tapHandlers = {
            button0: function() {
                view.setZoomLevel(view.getZoomLevel() + 1);
            },
            
            button1: function() {
                view.setZoomLevel(view.getZoomLevel() - 1);
            }
        };
        
    function bindEvents() {
        // attach the event monitor
        eventMonitor = INTERACT.watch(zoomBar, {
            bindTarget: zoomBar
        });
        
        // handle pointer move events
        eventMonitor.bind('pointerMove', handlePointerMove);
        eventMonitor.bind('pointerDown', handlePointerDown);
        eventMonitor.bind('pointerUp', handlePointerUp);
        eventMonitor.bind('tap', handlePointerTap);
    } // bindEvents
    
    function createButton(btnIndex, marginTop) {
        // create the zoom in button
        var button = buttons[btnIndex] = document.createElement('div');
        button.className = 't5-zoombar-button';
        button.style.cssText = COG.formatStr(
            'position: absolute; background: {0}; z-index: 51; width: {1}px; height: {2}px; margin-top: {3}px',
            getButtonBackground(btnIndex),
            params.width,
            params.buttonHeight,
            marginTop || 0);

        // add the button to the zoomBar
        zoomBar.appendChild(button);
    } // createButton
        
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
        if (outer.childNodes[0]) {
            outer.insertBefore(zoomBar, outer.childNodes[0]);
        }
        else {
            outer.appendChild(zoomBar);
        } // if..else
        
        // create the thumb elements
        createThumb();
        
        // create the buttons
        createButton(0);
        createButton(1, params.height - params.buttonHeight);
        
        bindEvents();
    } // createImageContainer
    
    function getBackground() {
        return 'url(' + params.images + ')';
    } // getBackground
    
    function getButtonBackground(buttonIndex, state) {
        var spriteOffset = spriteStart + thumbHeight * 3 +
                (buttonIndex || 0) * buttonHeight * 3 + 
                (state || 0) * buttonHeight;
        
        return 'url(' + params.images + ') 0 -' + spriteOffset + 'px'; 
    }
    
    function getMargin() {
        return COG.formatStr('{0} {1} {2} {3}',
            params.margin + 'px',
            0,
            '0',
            (outer.offsetWidth - params.width - params.margin) + 'px');
    } // getMargin
    
    function getThumbBackground(state) {
        var spriteOffset = spriteStart + (state || 0) * thumbHeight;
        
        return 'url(' + params.images + ') 0 -' + spriteOffset + 'px'; 
    } // getThumbBackground
    
    function handleDetach() {
        // unbind the event monitor
        eventMonitor.unbind();
        
        // remove the image div from the container
        outer.removeChild(zoomBar);
    } // handleDetach
    
    function handlePointerDown(evt, absXY, relXY) {
        updateSpriteState(evt.target, STATE_DOWN);
    } // handlePointerDown
    
    function handlePointerMove(evt, absXY, relXY) {
        // update the thumb pos
        thumbPos = Math.min(Math.max(thumbMin, relXY.y - (thumbHeight >> 1)), thumbMax);
        
        setThumbVal(zoomSteps - ((thumbPos - thumbMin) / thumbMax) * zoomSteps | 0);
    } // handlePointerMove
    
    function handlePointerTap(evt, absXY, relXY) {
        var handler = tapHandlers[updateSpriteState(evt.target, STATE_DOWN)];
        if (handler) {
            handler();
        } // if
    }
    
    function handlePointerUp(evt, absXY, relXY) {
        updateSpriteState(evt.target, STATE_STATIC);
    } // handlePointerUp
    
    function handleZoomLevelChange(evt, zoomLevel) {
        setThumbVal(zoomLevel);
    } // handleZoomLevelChange
    
    function updateSpriteState(target, state) {
        var targetCode;
        
        if (target === thumb) {
            thumb.style.background = getThumbBackground(state);
            targetCode = 'thumb';
        }
        else {
            for (var ii = 0; ii < buttons.length; ii++) {
                if (target === buttons[ii]) {
                    targetCode = 'button' + ii;
                    buttons[ii].style.background = getButtonBackground(ii, state);
                    break;
                } // if
            } // for
        } // if..else
        
        return targetCode;
    } // updateSpriteState
    
    /* exports */
    
    function setThumbVal(value) {
        if (value !== thumbVal) {
            // calculate the thumb value
            thumbVal = value;

            // if we are snapping then calculate the snapped thumbpos
            thumbPos = thumbMax - (thumbVal / zoomSteps * (thumbMax - thumbMin)) | 0;

            // update the thumb style
            if (supportTransforms) {
                thumb.style[PROP_WK_TRANSFORM] = 'translate3d(0px, ' + (thumbPos - thumbMin) + 'px, 0px)';
            }
            else {
                thumb.style.margin = thumbPos + 'px 0 0 0';
            } // if..else
            
            COG.info('thumb value = ' + thumbVal + ', pos = ' + thumbPos);
            
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
    });
    
    // handle the predraw
    _this.bind('detach', handleDetach);
    
    // bind to the view zoom level change event
    view.bind('zoomLevelChange', handleZoomLevelChange);
    
    // set the zoom level to the current zoom level of the view
    setThumbVal(view.getZoomLevel());
    
    return _this;
});