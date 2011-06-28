T5.Registry.register('renderer', 'raphael', function(view, panFrame, container, params, baseRenderer) {
    params = T5.ex({
    }, params);

    /* internals */

    var RADIANS_TO_DEGREES = 180 / Math.PI,
        STYLE_CONVERSION_PROPS = {
            lineWidth: 'stroke-width'
        },
        drawOffsetX,
        drawOffsetY,
        activeObjects = {},
        currentObjects = {},
        currentStyle,
        hitObjects = {},
        styles = {},
        paper;

    function createPaper() {
        paper = Raphael(panFrame, panFrame.offsetWidth, panFrame.offsetHeight);

        paper.canvas.style.position = 'absolute';

        view.attachFrame(paper.canvas);
    } // createCanvas

    function convertStyleData(input) {
        output = T5.ex({}, input);

        for (var key in STYLE_CONVERSION_PROPS) {
            if (output[key]) {
                output[STYLE_CONVERSION_PROPS[key]] = output[key];
                delete output[key];
            } // if
        } // for

        return output;
    } // convertStyleData

    function handleDetach() {
        panFrame.removeChild(paper.canvas);
    } // handleDetach

    function handleLayerRemove(evt, layer) {
        if (layer.find) {
            var drawables = layer.find();

            for (var ii = drawables.length; ii--; ) {
                delete currentObjects[drawables[ii].id];
            } // for
        } // if
    } // handleLayerRemove

    function handlePredraw(evt, layers, viewport, tickcount, hits) {
        drawOffsetX = viewport.x;
        drawOffsetY = viewport.y;

        removeOldObjects(activeObjects, currentObjects);
        currentObjects = {};
    } // handlePredraw

    function handleStyleDefined(evt, styleId, styleData) {
        styles[styleId] = convertStyleData(styleData);
    } // handleStyleDefined

    function handleReset(evt) {
        removeOldObjects(activeObjects, currentObjects, 'removeOnReset');
    } // handleReset

    function initDrawData(drawable, viewport, hitData, drawFn) {
        var isHit = false;

        return {
            draw: drawFn || objDraw,
            viewport: viewport,
            hit: hitObjects[drawable.id],
            vpX: drawOffsetX,
            vpY: drawOffsetY
        };
    } // initDrawData

    function loadStyles() {
        T5.Style.each(function(id, data) {
            handleStyleDefined(null, id, data);
        });

        T5.bind('styleDefined', handleStyleDefined);
    } // loadStyles

    function objInit(rObject, drawable) {
        rObject.scale(drawable.scaling, drawable.scaling);

        rObject.rotate(drawable.rotation * RADIANS_TO_DEGREES, true);

        rObject.mouseover(function(evt) {
            hitObjects[drawable.id] = true;
        });

        rObject.mouseout(function(evt) {
            delete hitObjects[drawable.id];
        });

        activeObjects[drawable.id] = drawable;
    } // objInit

    function objDraw(drawData) {
        if (this.rObject) {
            var updates = {},
                offsetX = drawOffsetX - this.translateX,
                offsetY = drawOffsetY - this.translateY;

            if (this.rObject.type !== 'image') {
                T5.ex(updates, styles[currentStyle] || styles.basic);
            } // if

            switch (this.rObject.type) {
                case 'circle':
                    updates.cx = this.xy.x - offsetX;
                    updates.cy = this.xy.y - offsetY;

                    break;

                case 'path':
                    updates.path = this.path(offsetX, offsetY, drawData.viewport);
                    /*
                    this.rObject.remove();
                    this.rObject = paper.path();

                    this.rObject.toBack();
                    */

                    break;

                default:
                    updates.x = this.xy.x - (this.size >> 1) - offsetX;
                    updates.y = this.xy.y - (this.size >> 1) - offsetY;
            } // switch

            if (updates.fill && (! this.fill)) {
                delete updates.fill;
            } // if

            if (updates.stroke && (! this.stroke)) {
                delete updates.stroke;
            } // if

            this.rObject.attr(updates);

            currentObjects[this.id] = this;
        } // if
    } // objUpdate

    function removeOldObjects(activeObj, currentObj, flagField) {
        var deletedKeys = [];

        for (var objId in activeObj) {
            var item = activeObj[objId],
                inactive = flagField ? item[flagField] : (! currentObj[objId]);

            if (inactive) {
                item.rObject.remove();

                item.rObject = null;

                deletedKeys[deletedKeys.length] = objId;
            } // if
        } // for

        for (var ii = deletedKeys.length; ii--; ) {
            delete activeObj[deletedKeys[ii]];
        } // for
    } // removeOldObjects

    /* exports */

    function applyStyle(styleId) {
        var previousStyle;

        if (currentStyle !== styleId) {
            previousStyle = currentStyle;
            currentStyle = styleId;
        } // if

        return previousStyle || T5.Style.resetStyle;
    } // applyStyle

    function applyTransform(drawable) {
        if (drawable.rObject) {
            drawable.rObject.scale(drawable.scaling, drawable.scaling);

            drawable.rObject.rotate(drawable.rotation * RADIANS_TO_DEGREES, true);
        }
    } // applyTransform

    /**
    ### prepArc(drawable, viewport, hitData, opts)
    */
    function prepArc(drawable, viewport, hitData, opts) {
        if (! drawable.rObject) {
            objInit(drawable.rObject = paper.circle(
                drawable.xy.x - drawOffsetX,
                drawable.xy.y - drawOffsetY,
                drawable.size
            ), drawable);
        } // if

        return initDrawData(drawable, viewport, hitData);
    } // prepArc

    /**
    ### prepMarker(drawable, viewport, hitData, opts)
    */
    function prepMarker(drawable, viewport, hitData, opts) {
        if (drawable.reset && drawable.rObject) {
            drawable.rObject.remove();
            drawable.rObject = null;
            drawable.reset = false;
        } // if

        if (! drawable.rObject) {
            var markerX = drawable.xy.x - drawOffsetX,
                markerY = drawable.xy.y - drawOffsetY,
                size = drawable.size;

            switch (drawable.markerType.toLowerCase()) {
                case 'image':
                    objInit(drawable.rObject = paper.image(
                        drawable.imageUrl,
                        markerX - (size >> 1),
                        markerY - (size >> 1),
                        size,
                        size
                    ), drawable);

                    break;

                default:
                    objInit(drawable.rObject = paper.circle(
                        markerX,
                        markerY,
                        size >> 1
                    ), drawable);
            } // switch
        } // if

        return initDrawData(drawable, viewport, hitData);
    } // prepMarker

    /**
    ### prepPoly(drawable, viewport, hitData, opts)
    */
    function prepPoly(drawable, viewport, hitData, opts) {

        if (! drawable.rObject) {
            var rawPath = [],
                line = opts.points || drawable.line();

            drawable.path = function(x, y, vp) {
                var pathString = '',
                    drawPoints = line.cull(vp);

                for (var ii = drawPoints.length; ii--; ) {
                    pathString = (ii > 0 ? 'L' : 'M') +
                        (drawPoints[ii].x - x) + ' ' + (drawPoints[ii].y - y) +
                        pathString;
                } // for

                return pathString || 'M0 0L0 0';
            };

            drawable.removeOnReset = true;
            objInit(drawable.rObject = paper.path('M0 0L0 0'), drawable);
            drawable.rObject.toBack();
        } // if

        return initDrawData(drawable, viewport, hitData);
    } // prepPoly

    /* initialization */

    createPaper();

    var _this = T5.ex(baseRenderer, {
        applyStyle: applyStyle,
        applyTransform: applyTransform,

        prepArc: prepArc,
        prepMarker: prepMarker,
        prepPoly: prepPoly
    });

    _this.bind('predraw', handlePredraw);
    _this.bind('detach', handleDetach);
    view.bind('reset', handleReset);
    view.bind('layerRemove', handleLayerRemove);

    loadStyles();

    return _this;
});
