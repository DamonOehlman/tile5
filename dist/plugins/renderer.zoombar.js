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
        eventMonitor = INTERACT.watch(zoomBar, {
            bindTarget: zoomBar
        });

        eventMonitor.bind('pointerMove', handlePointerMove);
        eventMonitor.bind('pointerDown', handlePointerDown);
        eventMonitor.bind('pointerUp', handlePointerUp);
        eventMonitor.bind('tap', handlePointerTap);
    } // bindEvents

    function createButton(btnIndex, marginTop) {
        var button = buttons[btnIndex] = T5.DOM.create('div', '', 't5-zoombar-button', {
            position: 'absolute',
            background: getButtonBackground(btnIndex),
            'z-index': 51,
            width: params.width + 'px',
            height: params.buttonHeight + 'px',
            'margin-top': (marginTop || 0) + 'px'
        });

        zoomBar.appendChild(button);
    } // createButton

    function createThumb() {
        zoomBar.appendChild(thumb = T5.DOM.create('div', '', 't5-zoombar-thumb', {
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
        zoomBar = T5.DOM.create('div', COG.objId('t5-zoombar'), 't5-zoombar', {
            position: 'absolute',
            background: getBackground(),
            'z-index': 50,
            overflow: 'hidden',
            width: params.width + 'px',
            height: params.height + 'px',
            margin: getMargin()
        });

        if (container.childNodes[0]) {
            container.insertBefore(zoomBar, container.childNodes[0]);
        }
        else {
            container.appendChild(zoomBar);
        } // if..else

        createThumb();

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
        eventMonitor.unbind();

        container.removeChild(zoomBar);
    } // handleDetach

    function handlePointerDown(evt, absXY, relXY) {
        updateSpriteState(evt.target, STATE_DOWN);
    } // handlePointerDown

    function handlePointerMove(evt, absXY, relXY) {
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
            thumbVal = value;

            thumbPos = thumbMax - (thumbVal / zoomSteps * (thumbMax - thumbMin)) | 0;
            T5.DOM.move(thumb, 0, thumbPos - thumbMin);

            clearTimeout(zoomTimeout);
            zoomTimeout = setTimeout(function() {
                view.setZoomLevel(thumbVal);
            }, 500);
        } // if
    } // if

    /* initialization */

    createZoomBar();

    var _this = COG.extend(baseRenderer, {
    });

    _this.bind('detach', handleDetach);

    view.bind('zoomLevelChange', handleZoomLevelChange);

    setThumbVal(view.getZoomLevel());

    return _this;
});
