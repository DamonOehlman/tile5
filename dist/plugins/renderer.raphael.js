T5.registerRenderer('raphael', function(view, container, params, baseRenderer) {
    params = COG.extend({
    }, params);

    /* internals */

    var RADIANS_TO_DEGREES = 180 / Math.PI,
        vpWidth,
        vpHeight,
        drawOffsetX,
        drawOffsetY,
        activeObjects = {},
        activeTiles = {},
        currentObjects = {},
        currentTiles = {},
        currentStyle,
        hitObjects = {},
        styles = {},
        paper;

    function createPaper() {
        vpWidth = view.width = container.offsetWidth;
        vpHeight = view.height = container.offsetHeight;

        paper = Raphael(container, vpWidth, vpHeight);
    } // createCanvas

    function handlePredraw(evt, viewport, state) {
        removeOldObjects(activeObjects, currentObjects);
        currentObjects = {};

        removeOldObjects(activeTiles, currentTiles);
        currentTiles = {};
    } // handlePredraw

    function handleStyleDefined(evt, styleId, styleData) {
        styles[styleId] = styleData;
    } // handleStyleDefined

    function initDrawData(drawable, viewport, hitData, state, drawFn) {
        var isHit = false;

        return {
            draw: drawFn || objDraw,
            viewport: viewport,
            state: state,
            hit: hitObjects[drawable.id],
            vpX: drawOffsetX,
            vpY: drawOffsetY
        };
    } // initDrawData

    function loadStyles() {
        for (var styleId in T5.styles) {
            handleStyleDefined(null, styleId, T5.styles[styleId]);
        } // for

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
            var updates = COG.extend({}, styles[currentStyle] || styles.basic),
                offsetX = drawOffsetX - this.translateX,
                offsetY = drawOffsetY - this.translateY;

            switch (this.rObject.type) {
                case 'circle':
                    updates.cx = this.xy.x - offsetX;
                    updates.cy = this.xy.y - offsetY;

                    break;

                case 'path':
                    var rawPoints = this.rawPath || [],
                        path = [];

                    for (var ii = rawPoints.length; ii--; ) {
                        path[ii] = [
                            rawPoints[ii][0],
                            rawPoints[ii][1] - offsetX,
                            rawPoints[ii][2] - offsetY
                        ];
                    } // for

                    updates.path = path;

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

    function drawTiles(viewport, tiles) {
        var tile;

        for (var ii = tiles.length; ii--; ) {
            tile = tiles[ii];

            if (tile.rObject) {
                tile.rObject.attr({
                    x: tile.x - drawOffsetX,
                    y: tile.y - drawOffsetY
                });
            }
            else {
                activeTiles[tile.id] = tile;

                tile.rObject = paper.image(
                    tile.url,
                    tile.x - drawOffsetX,
                    tile.y - drawOffsetY,
                    tile.w,
                    tile.h);

                tile.rObject.toBack();
            } // if..else

            currentTiles[tile.id] = tile;
        } // for
    } // drawTiles

    function prepare(layers, viewport, state, tickCount, hitData) {
        drawOffsetX = viewport.x;
        drawOffsetY = viewport.y;

        return paper;
    } // prepare

    /**
    ### prepArc(drawable, viewport, hitData, state, opts)
    */
    function prepArc(drawable, viewport, hitData, state, opts) {
        if (! drawable.rObject) {
            objInit(drawable.rObject = paper.circle(
                drawable.xy.x - drawOffsetX,
                drawable.xy.y - drawOffsetY,
                drawable.size
            ), drawable);
        } // if

        return initDrawData(drawable, viewport, hitData, state);
    } // prepArc

    /**
    ### prepMarker(drawable, viewport, hitData, state, opts)
    */
    function prepMarker(drawable, viewport, hitData, state, opts) {
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

        return initDrawData(drawable, viewport, hitData, state);
    } // prepMarker

    /**
    ### prepPoly(drawable, viewport, hitData, state, opts)
    */
    function prepPoly(drawable, viewport, hitData, state, opts) {

        if (! drawable.rObject) {
            var rawPath = [],
                points = opts.points || drawable.points;

            for (var ii = points.length; ii--; ) {
                rawPath[ii] = [
                    ii === 0 ? 'M' : 'L',
                    points[ii].x,
                    points[ii].y
                ];
            } // for

            drawable.rawPath = rawPath;
            drawable.removeOnReset = true;

            objInit(drawable.rObject = paper.path('M0 0L0 0'), drawable);
        } // if

        return initDrawData(drawable, viewport, hitData, state);
    } // prepPoly

    function reset() {
        currentTiles = {};
        removeOldObjects(activeTiles, currentTiles);

        removeOldObjects(activeObjects, currentObjects, 'removeOnReset');
    } // reset

    /* initialization */

    createPaper();

    var _this = COG.extend(baseRenderer, {
        interactTarget: container,
        preventPartialScale: true,

        applyStyle: applyStyle,
        applyTransform: applyTransform,
        drawTiles: drawTiles,

        prepare: prepare,

        prepArc: prepArc,
        prepMarker: prepMarker,
        prepPoly: prepPoly,

        reset: reset,

        getDimensions: function() {
            return {
                width: vpWidth,
                height: vpHeight
            };
        },

        getOffset: function() {
            return new XY(drawOffsetX, drawOffsetY);
        }
    });

    _this.bind('predraw', handlePredraw);

    loadStyles();

    return _this;
});
