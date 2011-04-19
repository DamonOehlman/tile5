/**
# Tile5 Plugin: Zoombar
The tile5 zoombar provides a zoom control for a Tile5 map. The zoombar is implemented
as a series of DOM elements which draw images from a sprite sheet supplied in the 
`images` parameter.

## Using the Zoombar
TO BE COMPLETED

## Customizing the Zoombar
TO BE COMPLETED
*/
T5.registerRenderer('zoombar', function(view, panFrame, container, params, baseRenderer) {
    params = COG.extend({
        width: 24,
        height: 200,
        images: '/img/zoom.png',
        align: 'right',
        marginTop: 10,
        spacing: 10,
        thumbHeight: 16,
        buttonHeight: 16
    }, params.zoombar);
    
    /* internals */
    
    var STATE_STATIC = 0,
        STATE_HOVER = 1,
        STATE_DOWN = 2,
        buttonHeight = params.buttonHeight,
        eventMonitor,
        spriteStart = params.height,
        thumb,
        thumbHeight = params.thumbHeight,
        thumbMin = params.spacing + buttonHeight - (thumbHeight >> 1),
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
        if (container.childNodes[0]) {
            container.insertBefore(zoomBar, container.childNodes[0]);
        }
        else {
            container.appendChild(zoomBar);
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
        var marginLeft = params.spacing;

        if (params.align === 'right') {
            marginLeft = container.offsetWidth - params.width - params.spacing;
        } // if
        
        return COG.formatStr('{0}px 0 0 {1}px',
            params.marginTop,
            marginLeft);
    } // getMargin
    
    function getThumbBackground(state) {
        var spriteOffset = spriteStart + (state || 0) * thumbHeight;
        
        return 'url(' + params.images + ') 0 -' + spriteOffset + 'px'; 
    } // getThumbBackground
    
    function handleDetach() {
        // unbind the event monitor
        eventMonitor.unbind();
        
        // remove the image div from the panFrame
        container.removeChild(zoomBar);
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
            T5.DOM.move(thumb, 0, thumbPos - thumbMin);
            
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