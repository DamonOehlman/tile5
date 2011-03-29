T5.registerRenderer('dom', function(view, container, params, baseRenderer) {

    /* internals */

    var PROP_WK_TRANSFORM = '-webkit-transform',
        ID_PREFIX = 'tile_',
        PREFIX_LENGTH = ID_PREFIX.length,
        supportTransforms = typeof container.style[PROP_WK_TRANSFORM] != 'undefined',
        imageDiv = null,
        tileCache = {};

    function createImageContainer() {
        imageDiv = document.createElement('div');
        imageDiv.id = COG.objId('domImages');
        imageDiv.style.cssText = COG.formatStr(
            'position: absolute; overflow: hidden; width: {0}px; height: {1}px;',
            container.offsetWidth,
            container.offsetHeight);

        container.insertBefore(imageDiv, baseRenderer.interactTarget);
    } // createImageContainer

    function removeOldTiles(tileIds) {
        tileIds = tileIds || [];

        var ii = 0;
        while (ii < imageDiv.childNodes.length) {
            var image = imageDiv.childNodes[ii],
                tileId = image.id.slice(PREFIX_LENGTH);

            if (T5.indexOf.call(tileIds, tileId) < 0) {
                tile = tileCache[tileId];

                if (tile) {
                    tile.image = null;
                } // if

                delete tileCache[tileId];

                imageDiv.removeChild(image);
            }
            else {
                ii++;
            } // if..else
        } // while
    } // removeOldTiles

    /* exports */

    function drawTiles(viewport, tiles) {
        var tile,
            image,
            scaleFactor = viewport.scaleFactor,
            inViewport,
            offsetX, offsetY,
            minX, minY, maxX, maxY,
            tileWidth, tileHeight,
            gridWidth, gridHeight,
            scaleOffsetX = 0,
            scaleOffsetY = 0,
            relX, relY, ii,
            xIndex, yIndex,
            scaledWidth,
            scaledHeight,
            tileIds = [];

        for (ii = tiles.length; ii--; ) {
            tile = tiles[ii];
            tileIds[tileIds.length] = tile.id;

            tileWidth = tileWidth || tile.w;
            tileHeight = tileHeight || tile.h;

            minX = minX ? Math.min(tile.x, minX) : tile.x;
            minY = minY ? Math.min(tile.y, minY) : tile.y;
            maxX = maxX ? Math.min(tile.x, maxX) : tile.x;
            maxY = maxY ? Math.min(tile.y, maxY) : tile.y;
        } // for

        removeOldTiles(tileIds);

        gridWidth = ((maxX - minX) / tileWidth + 1) * tileWidth;
        gridHeight = ((maxY - minY) / tileHeight + 1) * tileHeight;

        scaleOffsetX = gridWidth * scaleFactor - gridWidth;
        scaleOffsetY = gridHeight * scaleFactor - gridHeight;

        offsetX = minX - viewport.x - scaleOffsetX;
        offsetY = minY - viewport.y - scaleOffsetY;

        for (ii = tiles.length; ii--; ) {
            tile = tiles[ii];

            if (tile.url) {
                image = tile.image;

                xIndex = (tile.x - minX) / tile.w;
                yIndex = (tile.y - minY) / tile.h;

                scaledWidth = tile.w * scaleFactor | 0;
                scaledHeight = tile.h * scaleFactor | 0;

                relX = offsetX + (xIndex * scaledWidth);
                relY = offsetY + (yIndex * scaledWidth);

                if (! image) {
                    tileCache[tile.id] = tile;

                    image = tile.image = new Image();
                    image.id = ID_PREFIX + tile.id;
                    image.src = tile.url;
                    image.onload = function() {
                        var tileId = this.id.slice(PREFIX_LENGTH);
                        if (tileCache[tileId]) {
                            imageDiv.appendChild(this);
                        } // if
                    };

                    image.style.cssText = '-webkit-user-select: none; -webkit-box-shadow: none; -moz-box-shadow: none; box-shadow: none; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-style: initial; border-color: initial; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; position: absolute;';
                } // if

                if (supportTransforms) {
                    image.style[PROP_WK_TRANSFORM] = 'translate3d(' + relX +'px, ' + relY + 'px, 0px)';
                }
                else {
                    image.style.left = relX + 'px';
                    image.style.top = relY + 'px';
                } // if..else

                image.style.width = scaledWidth + 'px';
                image.style.height = scaledHeight + 'px';
            } // if
        } // for
    } // drawTiles

    function reset() {
        removeOldTiles();
    } // reset

    /* initialization */

    createImageContainer();

    var _this = COG.extend(baseRenderer, {
        preventPartialScale: true,

        drawTiles: drawTiles,
        reset: reset
    });

    return _this;
});
