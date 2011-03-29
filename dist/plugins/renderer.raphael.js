T5.registerRenderer('raphael', function(view, container, params, baseRenderer) {
    params = COG.extend({
    }, params);

    /* internals */

    var vpWidth,
        vpHeight,
        lastTiles = [],
        paper;

    function createPaper() {
        vpWidth = view.width = container.offsetWidth;
        vpHeight = view.height = container.offsetHeight;

        paper = Raphael(container, vpWidth, vpHeight);
    } // createCanvas

    function initDrawData(viewport, hitData, state, drawFn) {
        var isHit = false;

        return {
            draw: drawFn || defaultDrawFn,
            viewport: viewport,
            state: state,
            hit: isHit,
            vpX: viewport.x,
            vpY: viewport.y
        };
    } // initDrawData

    /* exports */

    function applyStyle(styleId) {
    } // applyStyle

    function applyTransform(drawable) {
        /*
        var translated = drawable.translateX !== 0 || drawable.translateY !== 0,
            transformed = translated || drawable.scaling !== 1 || drawable.rotation !== 0;

        if (transformed) {
            context.save();

            transform = {
                undo: function() {
                    context.restore();
                    transform = null;
                },

                x: drawable.xy.x,
                y: drawable.xy.y
            };

            context.translate(
                drawable.xy.x - drawOffsetX + drawable.translateX,
                drawable.xy.y - drawOffsetY + drawable.translateY
            );

            if (drawable.rotation !== 0) {
                context.rotate(drawable.rotation);
            } // if

            if (drawable.scaling !== 1) {
                context.scale(drawable.scaling, drawable.scaling);
            } // if
        } // if

        return transform;
        */
    } // applyTransform

    function drawTiles(viewport, tiles) {
        var tile,
            tileIds = [];

        for (var ii = tiles.length; ii--; ) {
            tile = tiles[ii];
            tileIds[tileIds.length] = tile.id;

            if (tile.image) {
                tile.image.attr({
                    x: tile.x - viewport.x,
                    y: tile.y - viewport.y
                });
            }
            else {
                tile.image = paper.image(
                    tile.url,
                    tile.x - viewport.x,
                    tile.y - viewport.y,
                    tile.w,
                    tile.h);
            } // if..else
        } // for

        for (ii = lastTiles.length; ii--; ) {
            tile = lastTiles[ii];

            if (tile.image && T5.indexOf.call(tileIds, lastTiles[ii].id) < 0) {
                tile.image.remove();
                tile.image = null;
            } // if
        } // for

        lastTiles = [].concat(tiles);
    } // drawTiles

    /**
    ### hitTest(drawData, hitX, hitY): boolean
    */
    function hitTest(drawData, hitX, hitY) {
        return context.isPointInPath(hitX, hitY);
    } // hitTest

    function prepare(layers, viewport, state, tickCount, hitData) {
        return paper;
    } // prepare

    /**
    ### prepArc(drawable, viewport, hitData, state, opts)
    */
    function prepArc(drawable, viewport, hitData, state, opts) {
        /*
        context.beginPath();
        context.arc(
            drawable.xy.x - (transform ? transform.x : drawOffsetX),
            drawable.xy.y - (transform ? transform.y : drawOffsetY),
            drawable.size >> 1,
            drawable.startAngle,
            drawable.endAngle,
            false
        );

        return initDrawData(viewport, hitData, state);
        */
    } // prepArc

    /**
    ### prepImage(drawable, viewport, hitData, state, opts)
    */
    function prepImage(drawable, viewport, hitData, state, opts) {
        return initDrawData(viewport, hitData, state, function(drawData) {
            paper.image(
                drawable.image ? drawable.image.src : drawable.imageSrc,
                opts.x || drawable.xy.x,
                opts.y || drawable.xy.y,
                drawable.bounds.w,
                drawable.bounds.h
            );
        });
    } // prepImage

    /**
    ### prepPoly(drawable, viewport, hitData, state, opts)
    */
    function prepPoly(drawable, viewport, hitData, state, opts) {
        /*
        var first = true,
            points = opts.points || drawable.points,
            offsetX = transform ? transform.x : drawOffsetX,
            offsetY = transform ? transform.y : drawOffsetY;

        context.beginPath();

        for (var ii = points.length; ii--; ) {
            var x = points[ii].x - offsetX,
                y = points[ii].y - offsetY;

            if (first) {
                context.moveTo(x, y);
                first = false;
            }
            else {
                context.lineTo(x, y);
            } // if..else
        } // for

        return initDrawData(viewport, hitData, state);
        */
    } // prepPoly

    function reset() {
        for (var ii = lastTiles.length; ii--; ) {
            if (lastTiles[ii].image) {
                lastTiles[ii].image.remove();
            } // if
        } // for

        lastTiles = [];
    } // reset


    /* initialization */

    createPaper();

    var _this = COG.extend(baseRenderer, {
        interactTarget: container,
        preventPartialScale: true,

        applyStyle: applyStyle,
        applyTransform: applyTransform,
        drawTiles: drawTiles,

        hitTest: hitTest,
        prepare: prepare,

        prepArc: prepArc,
        prepImage: prepImage,
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

        /*
        render: function(viewport) {
            context.strokeStyle = '#F00';
            context.moveTo(0, viewport.h >> 1);
            context.lineTo(viewport.w, viewport.h >> 1);
            context.moveTo(viewport.w >> 1, 0);
            context.lineTo(viewport.w >> 1, viewport.h);
            context.stroke();
        }
        */
    });

    return _this;
});
