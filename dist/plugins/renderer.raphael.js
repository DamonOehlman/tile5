T5.Registry.register('renderer', 'raphael', function(view, panFrame, container, params, baseRenderer) {
    params = _extend({
    }, params);

    /* internals */

    var RADIANS_TO_DEGREES = 180 / Math.PI,
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

    function handleDetach() {
        panFrame.removeChild(paper.canvas);
    } // handleDetach

    function handlePredraw(evt, viewport) {
        removeOldObjects(activeObjects, currentObjects);
        currentObjects = {};
    } // handlePredraw

    function handleStyleDefined(evt, styleId, styleData) {
        styles[styleId] = styleData;
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
        for (var styleId in T5.styles) {
            handleStyleDefined(null, styleId, T5.styles[styleId]);
        } // for

        T5.Style.bind('defined', handleStyleDefined);
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
            var updates = _extend({}, styles[currentStyle] || styles.basic),
                offsetX = drawOffsetX - this.translateX,
                offsetY = drawOffsetY - this.translateY;

            switch (this.rObject.type) {
                case 'circle':
                    updates.cx = this.xy.x - offsetX;
                    updates.cy = this.xy.y - offsetY;

                    break;

                case 'path':
                    updates.path = this.path(offsetX, offsetY);

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

        return previousStyle || 'basic';
    } // applyStyle

    function applyTransform(drawable) {
        if (drawable.rObject) {
            drawable.rObject.scale(drawable.scaling, drawable.scaling);

            drawable.rObject.rotate(drawable.rotation * RADIANS_TO_DEGREES, true);
        }
    } // applyTransform

    function prepare(layers, viewport, tickCount, hitData) {
        drawOffsetX = viewport.x;
        drawOffsetY = viewport.y;

        return paper;
    } // prepare

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

            switch (drawable.markerStyle.toLowerCase()) {
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
                        size
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
                points = opts.points || drawable.points;

            drawable.path = function(x, y) {
                var pathString = '';

                for (var ii = points.length; ii--; ) {
                    pathString = (ii > 0 ? 'L' : 'M') +
                        (points[ii].x - x) + ' ' + (points[ii].y - y) +
                        pathString;
                } // for

                return pathString;
            };

            drawable.removeOnReset = true;
            objInit(drawable.rObject = paper.path('M0 0L0 0'), drawable);
        } // if

        return initDrawData(drawable, viewport, hitData);
    } // prepPoly

    /* initialization */

    createPaper();

    var _this = _extend(baseRenderer, {
        applyStyle: applyStyle,
        applyTransform: applyTransform,

        prepare: prepare,

        prepArc: prepArc,
        prepMarker: prepMarker,
        prepPoly: prepPoly
    });

    _this.bind('predraw', handlePredraw);
    _this.bind('detach', handleDetach);
    _this.bind('reset', handleReset);

    loadStyles();

    return _this;
});
