/**
# RENDERER: dom
*/
reg('renderer', 'dom', function(view, panFrame, container, params, baseRenderer) {
    
    /* internals */
    
    var ID_PREFIX = 'tile_',
        PREFIX_LENGTH = ID_PREFIX.length,
        imageDiv = null,
        activeTiles = {},
        currentTiles = {},
        offsetX = 0, offsetY = 0;
    
    function createImageContainer() {
        imageDiv = DOM.create('div', 't5-tiles', DOM.styles({
            width: panFrame.offsetWidth + 'px',
            height: panFrame.offsetHeight + 'px'
        }));
        
        // append the panFrame to the same element as the canvas
        if (panFrame.childNodes.length > 0) {
            panFrame.insertBefore(imageDiv, panFrame.childNodes[0]);
        }
        else {
            panFrame.appendChild(imageDiv);
        } // if..else
        
        view.attachFrame(imageDiv);
    } // createImageContainer
    
    function handleDetach() {
        // remove the image div from the panFrame
        panFrame.removeChild(imageDiv);
    } // handleDetach
    
    function handlePredraw(evt, layers, viewport, tickcount, hits) {
        // remove old tiles
        removeOldObjects(activeTiles, currentTiles);
        currentTiles = {};
    } // handlePredraw
    
    function handleTileLoad(tile) {
        var image = activeTiles[tile.id] = tile.image;
            
        // initialise the image style
        image.style.cssText = '-webkit-user-select: none; -webkit-box-shadow: none; -moz-box-shadow: none; box-shadow: none; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-style: initial; border-color: initial; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; position: absolute;';
        
        // add to the images div
        DOM.move(image, tile.x - offsetX, tile.y - offsetY);
        imageDiv.appendChild(image);
        
        // invalidate the view
        view.invalidate();
    } // handleTileLoad
    
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
                if (item && item.parentNode) {
                    // TODO: investigate releasing image effectively 
                    // other mapping libraries have implemented techniques, but then removed them
                    // based on unpredicatable behaviour in some mobile browsers

                    // remove the image from the dom
                    imageDiv.removeChild(item);
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
    
    function drawTiles(viewport, tiles, okToLoad) {
        var tile,
            image;
        
        // save the x and y offset
        offsetX = viewport.x;
        offsetY = viewport.y;

        // draw the tiles
        for (var ii = tiles.length; ii--; ) {
            tile = tiles[ii];
            image = activeTiles[tile.id];
            
            if (image) {
                DOM.move(image, tile.x - offsetX, tile.y - offsetY);
            }
            else if (okToLoad && (! (tile.loaded || tile.loading))) {
                tile.load(handleTileLoad);
            } // if
            
            // flag the tile as current
            currentTiles[tile.id] = tile;
        } // for
    } // drawTiles
    
    /* initialization */
    
    // attach the background image display
    createImageContainer();
    
    var _this = _extend(baseRenderer, {
        drawTiles: drawTiles
    });
    
    // handle the predraw
    _this.bind('predraw', handlePredraw);
    _this.bind('detach', handleDetach);
    view.bind('reset', handleReset);
    
    return _this;
});