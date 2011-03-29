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
        
        // append the container to the same element as the canvas
        container.insertBefore(imageDiv, baseRenderer.interactTarget);
    } // createImageContainer
    
    function removeOldTiles(tileIds) {
        tileIds = tileIds || [];
        
        // iterate through the child nodes of the image div and 
        // remove any orphaned images
        var ii = 0;
        while (ii < imageDiv.childNodes.length) {
            // get the image
            var image = imageDiv.childNodes[ii],
                tileId = image.id.slice(PREFIX_LENGTH);
                
            if (T5.indexOf.call(tileIds, tileId) < 0) {
                tile = tileCache[tileId];
                
                if (tile) {
                    tile.image = null;
                } // if
                
                // remove the tilecache entry
                delete tileCache[tileId];
                
                // remove the image from the dom
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
            
        // first iterate through the tiles and determine minx and miny
        for (ii = tiles.length; ii--; ) {
            tile = tiles[ii];
            tileIds[tileIds.length] = tile.id;
            
            // get the tile width and height and store
            tileWidth = tileWidth || tile.w;
            tileHeight = tileHeight || tile.h;
            
            // calculate the min and max x & y
            minX = minX ? Math.min(tile.x, minX) : tile.x;
            minY = minY ? Math.min(tile.y, minY) : tile.y;
            maxX = maxX ? Math.min(tile.x, maxX) : tile.x;
            maxY = maxY ? Math.min(tile.y, maxY) : tile.y;
        } // for
        
        removeOldTiles(tileIds);
        
        // determine the width of the tile grid
        gridWidth = ((maxX - minX) / tileWidth + 1) * tileWidth;
        gridHeight = ((maxY - minY) / tileHeight + 1) * tileHeight;
        
        // calculate the scale x and y offset
        scaleOffsetX = gridWidth * scaleFactor - gridWidth;
        scaleOffsetY = gridHeight * scaleFactor - gridHeight;
        
        // calculate the offset
        offsetX = minX - viewport.x - scaleOffsetX;
        offsetY = minY - viewport.y - scaleOffsetY;
            
        // draw the tiles
        for (ii = tiles.length; ii--; ) {
            tile = tiles[ii];
            
            if (tile.url) {
                image = tile.image;

                // calculate the x and y index of the tile
                xIndex = (tile.x - minX) / tile.w;
                yIndex = (tile.y - minY) / tile.h;

                // calculate the scaled width and height
                scaledWidth = tile.w * scaleFactor | 0;
                scaledHeight = tile.h * scaleFactor | 0;

                // calculate the x and y position for the tile
                relX = offsetX + (xIndex * scaledWidth);
                relY = offsetY + (yIndex * scaledWidth);

                if (! image) {
                    // save to the tile cache so we can remove it once no longer needed
                    tileCache[tile.id] = tile;
                    
                    // create the image
                    image = tile.image = new Image();
                    image.id = ID_PREFIX + tile.id;
                    image.src = tile.url;
                    image.onload = function() {
                        // check that this image is still valid (it will be in the tile cache)
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
    
    // attach the background image display
    createImageContainer();
    
    var _this = COG.extend(baseRenderer, {
        preventPartialScale: true,
        
        drawTiles: drawTiles,
        reset: reset
    });
    
    return _this;
});