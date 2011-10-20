/**
# CONTROL: Zoombar
*/
reg('control', 'zoombar', function(view, panFrame, container, params) {
    params = _extend({
        width: 24,
        height: 200,
        images: 'img/zoom.png',
        align: 'right',
        marginTop: 10,
        spacing: 10,
        thumbHeight: 16,
        buttonHeight: 16
    }, params);
    
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
                view.zoom(view.zoom() + 1);
            },
            
            button1: function() {
                view.zoom(view.zoom() - 1);
            }
        };
        
    function bindEvents() {
        // attach the event monitor
        INTERACT.watch(zoomBar, {
            bindTarget: zoomBar
        });
        
        eve.on('interact.pointer.down.' + zoomBar.id, handlePointerDown);
        eve.on('interact.pointer.move.' + zoomBar.id, handlePointerMove);
        eve.on('interact.pointer.up.' + zoomBar.id, handlePointerUp);
        eve.on('interact.tap.' + zoomBar.id, handlePointerTap);
    } // bindEvents
    
    function createButton(btnIndex, marginTop) {
        // create the zoom in button
        var button = buttons[btnIndex] = DOM.create('div', 't5-zoombar-button', {
            position: 'absolute',
            background: getButtonBackground(btnIndex),
            'z-index': 51,
            width: params.width + 'px',
            height: params.buttonHeight + 'px',
            'margin-top': (marginTop || 0) + 'px'
        });

        // add the button to the zoomBar
        zoomBar.appendChild(button);
    } // createButton
        
    function createThumb() {
        zoomBar.appendChild(thumb = DOM.create('div', 't5-zoombar-thumb', {
            position: 'absolute',
            background: getThumbBackground(),
            'z-index': 51,
            width: params.width + 'px',
            height: params.thumbHeight + 'px',
            margin: '10px 0 0 0',
            top: (thumbPos - thumbMin) + 'px'
        }));
    } // createThumb
    
    function createZoomBar() {
        zoomBar = DOM.create('div', 't5-zoombar', {
            id: 'zoombar_' + (new Date().getTime()),
            position: 'absolute',
            background: getBackground(),
            'z-index': 50,
            overflow: 'hidden',
            width: params.width + 'px',
            height: params.height + 'px',
            margin: getMargin()
        });
            
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
        var marginLeft = params.spacing,
            formatter = _formatter('{0}px 0 0 {1}px');

        if (params.align === 'right') {
            marginLeft = container.offsetWidth - params.width - params.spacing;
        } // if
        
        return formatter(params.marginTop, marginLeft);
    } // getMargin
    
    function getThumbBackground(state) {
        var spriteOffset = spriteStart + (state || 0) * thumbHeight;
        
        return 'url(' + params.images + ') 0 -' + spriteOffset + 'px'; 
    } // getThumbBackground
    
    function handleDetach() {
        // unbind event handlers
        eve.unbind('interact.pointer.down.' + zoomBar.id, handlePointerDown);
        eve.unbind('interact.pointer.move.' + zoomBar.id, handlePointerMove);
        eve.unbind('interact.pointer.up.' + zoomBar.id, handlePointerUp);
        eve.unbind('interact.tap.' + zoomBar.id, handlePointerTap);
        
        // remove the image div from the panFrame
        container.removeChild(zoomBar);
    } // handleDetach
    
    function handlePointerDown(evt, absXY, relXY) {
        if (this !== zoomBar) { return; }

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
            DOM.move(thumb, 0, thumbPos - thumbMin);
            
            clearTimeout(zoomTimeout);
            zoomTimeout = setTimeout(function() {
                // set the zoom level for the map
                view.zoom(thumbVal);
            }, 500);
        } // if
    } // if

    /* initialization */
    
    // attach the background image display
    createZoomBar();
    
    var _this = new Control(view);
    
    // handle the predraw
    _this.bind('detach', handleDetach);
    
    // bind to the view zoom level change event
    view.bind('zoom', handleZoomLevelChange);
    
    // set the zoom level to the current zoom level of the view
    setThumbVal(view.zoom());
    
    return _this;
});