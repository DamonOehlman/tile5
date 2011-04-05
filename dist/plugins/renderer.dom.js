T5.registerRenderer('dom', function(view, container, params, baseRenderer) {

    /* internals */

    var PROP_WK_TRANSFORM = '-webkit-transform',
        ID_PREFIX = 'tile_',
        PREFIX_LENGTH = ID_PREFIX.length,
        supportTransforms = typeof container.style[PROP_WK_TRANSFORM] != 'undefined',
        imageDiv = null,
        activeTiles = {},
        currentTiles = {};

    function createImageContainer() {
        imageDiv = document.createElement('div');
        imageDiv.id = COG.objId('domImages');
        imageDiv.style.cssText = COG.formatStr(
            'position: absolute; overflow: hidden; width: {0}px; height: {1}px;',
            container.offsetWidth,
            container.offsetHeight);

        if (container.childNodes.length > 0) {
            container.insertBefore(imageDiv, container.childNodes[0]);
        }
        else {
            container.appendChild(imageDiv);
        } // if..else
    } // createImageContainer

    function createTileImage(tile) {
        var image = tile.image = new Image();

        activeTiles[tile.id] = tile;

        image.src = tile.url;
        image.onload = function() {
            if (currentTiles[tile.id]) {
                imageDiv.appendChild(this);
                tile.indom = true;
            }
            else {
                tile.image = null;
            } // if..else
        };

        image.style.cssText = '-webkit-user-select: none; -webkit-box-shadow: none; -moz-box-shadow: none; box-shadow: none; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-style: initial; border-color: initial; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; position: absolute;';

        return image;
    }

    function handleDetach() {
        container.removeChild(imageDiv);
    } // handleDetach

    function handlePredraw(evt, viewport, state) {

        removeOldObjects(activeTiles, currentTiles);
        currentTiles = {};
    } // handlePredraw

    function removeOldObjects(activeObj, currentObj, flagField) {
        var deletedKeys = [];

        for (var objId in activeObj) {
            var item = activeObj[objId],
                inactive = flagField ? item[flagField] : (! currentObj[objId]);

            if (inactive) {
                if (item.indom) {
                    COG.info('attemping to remove tile ' + item.id + ' from the dom');
                    try {
                        imageDiv.removeChild(item.image);
                    }
                    catch (e) {
                        COG.warn('could not remove tile ' + item.id + ' from the DOM');
                    }

                    item.image = null;
                } // if

                deletedKeys[deletedKeys.length] = objId;
            } // if
        } // for

        for (var ii = deletedKeys.length; ii--; ) {
            delete activeObj[deletedKeys[ii]];
        } // for
    } // removeOldObjects

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
            diffWidth, diffHeight,
            scaleOffsetX = 0,
            scaleOffsetY = 0,
            relX, relY, ii,
            xIndex, yIndex,
            scaledWidth,
            scaledHeight,
            tileIds = [];

        for (ii = tiles.length; ii--; ) {
            tile = tiles[ii];

            tileWidth = tileWidth || tile.w;
            tileHeight = tileHeight || tile.h;

            minX = minX ? Math.min(tile.x, minX) : tile.x;
            minY = minY ? Math.min(tile.y, minY) : tile.y;
            maxX = maxX ? Math.max(tile.x, maxX) : tile.x;
            maxY = maxY ? Math.max(tile.y, maxY) : tile.y;
        } // for

        gridWidth = ((maxX - minX) / tileWidth + 1) * tileWidth;
        gridHeight = ((maxY - minY) / tileHeight + 1) * tileHeight;
        diffWidth = gridWidth * scaleFactor - viewport.w;
        diffHeight = gridHeight * scaleFactor - viewport.h;

        scaleOffsetX = diffWidth * scaleFactor - diffWidth;
        scaleOffsetY = diffHeight * scaleFactor - diffHeight;

        offsetX = minX - viewport.x;
        offsetY = minY - viewport.y;

        for (ii = tiles.length; ii--; ) {
            tile = tiles[ii];

            if (tile.url) {
                image = tile.image;

                if (! image) {
                    image = createTileImage(tile);
                } // if

                xIndex = (tile.x - minX) / tile.w;
                yIndex = (tile.y - minY) / tile.h;

                scaledWidth = tile.w * scaleFactor | 0;
                scaledHeight = tile.h * scaleFactor | 0;

                relX = offsetX + (xIndex * scaledWidth);
                relY = offsetY + (yIndex * scaledWidth);

                if (supportTransforms) {
                    image.style[PROP_WK_TRANSFORM] = 'translate3d(' + relX +'px, ' + relY + 'px, 0px)';
                }
                else {
                    image.style.left = relX + 'px';
                    image.style.top = relY + 'px';
                } // if..else

                image.style.width = scaledWidth + 'px';
                image.style.height = scaledHeight + 'px';

                currentTiles[tile.id] = tile;
            } // if
        } // for
    } // drawTiles

    function reset() {
        removeOldObjects(activeTiles, currentTiles = {});

        while (imageDiv.childNodes.length > 0) {
            imageDiv.removeChild(imageDiv.childNodes[0]);
        } // while
    } // reset

    /* initialization */

    createImageContainer();

    var _this = COG.extend(baseRenderer, {
        preventPartialScale: true,

        drawTiles: drawTiles,
        reset: reset
    });

    _this.bind('predraw', handlePredraw);
    _this.bind('detach', handleDetach);

    return _this;
});
