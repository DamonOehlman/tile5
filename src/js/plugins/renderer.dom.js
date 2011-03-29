T5.registerRenderer('dom', function(view, container, params, baseRenderer) {
    
    /* internals */
    
    var PROP_WK_TRANSFORM = '-webkit-transform',
        supportTransforms = typeof container.style[PROP_WK_TRANSFORM] != 'undefined',
        imageDiv = null,
        lastTiles = null;
    
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
        
        /* 
        TODO: get this code working so we can support partial scaling in the DOM
        // determine the width of the tile grid
        gridWidth = ((maxX - minX) / tileWidth + 1) * tileWidth;
        gridHeight = ((maxY - minY) / tileHeight + 1) * tileHeight;
        
        // calculate the scale x and y offset
        scaleOffsetX = gridWidth * scaleFactor - gridWidth;
        scaleOffsetY = gridHeight * scaleFactor - gridHeight;
        */
        
        // calculate the offset
        offsetX = minX - viewport.x - scaleOffsetX;
        offsetY = minY - viewport.y - scaleOffsetY;
            
        // draw the tiles
        for (ii = tiles.length; ii--; ) {
            tile = tiles[ii];
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
                image = tile.image = new Image();
                image.src = tile.url;
                image.onload = function() { 
                    imageDiv.appendChild(this);
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
        } // for
        
        // if we have last tiles, then check for any old ones and remove
        if (lastTiles) {
            for (ii = lastTiles.length; ii--; ) {
                tile = lastTiles[ii];
                
                // if the tile is not current, then remove from the image div
                if (tile.image && T5.indexOf.call(tileIds, lastTiles[ii].id) < 0) {
                    try {
                        imageDiv.removeChild(tile.image);
                    }
                    catch (e) {
                        // TODO: remove this - test for presence properly...
                    } // try..catch
                    
                    tile.image = null;
                } // if
            } // for
        } // if
        
        // save the last tiles
        lastTiles = [].concat(tiles);
    } // drawTiles
    
    function reset() {
        // remove the images from the dom
        imageDiv.innerHTML = '';
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