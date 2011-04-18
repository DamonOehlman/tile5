registerRenderer('dom', function(view, panFrame, container, params, baseRenderer) {
    
    /* internals */
    
    var ID_PREFIX = 'tile_',
        PREFIX_LENGTH = ID_PREFIX.length,
        imageDiv = null,
        activeTiles = {},
        currentTiles = {};
    
    function createImageContainer() {
        imageDiv = createEl(
            'div',
            COG.objId('domImages'),
            COG.formatStr(
                '-webkit-user-select: none; position: absolute; width: {0}px; height: {1}px;',
                panFrame.offsetWidth,
                panFrame.offsetHeight)
        );
        
        // append the panFrame to the same element as the canvas
        if (panFrame.childNodes.length > 0) {
            panFrame.insertBefore(imageDiv, panFrame.childNodes[0]);
        }
        else {
            panFrame.appendChild(imageDiv);
        } // if..else
        
        view.attachFrame(imageDiv);
    } // createImageContainer
    
    function createTileImage(tile) {
        // create the image
        var image = tile.image = new Image();
        
        // save to the tile cache so we can remove it once no longer needed
        activeTiles[tile.id] = tile;

        image.src = tile.url;
        image.onload = function() {
            if (currentTiles[tile.id]) {
                // check that this image is still valid (it will be in the tile cache)
                imageDiv.appendChild(this);
            }
            // otherwise, reset the image
            else {
                tile.image = null;
            } // if..else
        };

        // initialise the image style
        image.style.cssText = '-webkit-user-select: none; -webkit-box-shadow: none; -moz-box-shadow: none; box-shadow: none; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-style: initial; border-color: initial; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; position: absolute;';
     
        // return the image
        return image;
    }
    
    function handleDetach() {
        // remove the image div from the panFrame
        panFrame.removeChild(imageDiv);
    } // handleDetach
    
    function handlePredraw(evt, viewport) {
        // moveEl(imageDiv, viewport.x, viewport.y);
        
        // remove old tiles
        removeOldObjects(activeTiles, currentTiles);
        currentTiles = {};
    } // handlePredraw
    
    function handleReset(evt) {
        removeOldObjects(activeTiles, currentTiles = {});
        
        // remove all the children of the image div (just to be sure)
        while (imageDiv.childNodes.length > 0) {
            imageDiv.removeChild(imageDiv.childNodes[0]);
        } // while
    } // handleReset
    
    function removeOldObjects(activeObj, currentObj, flagField) {
        var deletedKeys = [];
        
        // iterate through the active objects 
        // TODO: use something other than a for in loop please...
        for (var objId in activeObj) {
            var item = activeObj[objId],
                inactive = flagField ? item[flagField] : (! currentObj[objId]);
                
            // if the object is not in the current objects, remove from the scene
            if (inactive) {
                if (item.image && item.image.parentNode) {
                    // remove the object from the raphael paper
                    imageDiv.removeChild(item.image);

                    // reset to null
                    item.image = null;
                } // if
                
                // add to the deleted keys
                deletedKeys[deletedKeys.length] = objId;
            } // if
        } // for
        
        // remove the deleted keys from the active objects
        for (var ii = deletedKeys.length; ii--; ) {
            delete activeObj[deletedKeys[ii]];
        } // for
    } // removeOldObjects    
    
    /* exports */
    
    function drawTiles(viewport, tiles) {
        var tile,
            image,
            offsetX = viewport.x, 
            offsetY = viewport.y;

        // draw the tiles
        for (var ii = tiles.length; ii--; ) {
            tile = tiles[ii];
            
            if (tile.url) {
                image = tile.image || createTileImage(tile);
                moveEl(image, tile.x - offsetX, tile.y - offsetY);

                // flag the tile as current
                currentTiles[tile.id] = tile;
            } // if
        } // for
    } // drawTiles
    
    /* initialization */
    
    // attach the background image display
    createImageContainer();
    
    var _this = COG.extend(baseRenderer, {
        drawTiles: drawTiles
    });
    
    // handle the predraw
    _this.bind('predraw', handlePredraw);
    _this.bind('detach', handleDetach);
    _this.bind('reset', handleReset);
    
    return _this;
});