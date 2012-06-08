/**
# RENDERER: dom
*/
reg('renderer', 'dom', function(view, panFrame, container, params, baseRenderer) {
    
    /* internals */
    
    var ID_PREFIX = 'tile_',
        DATA_X = 'data-x',
        DATA_Y = 'data-y',
        DATA_DISPOSE = 'data-dispose',
        PREFIX_LENGTH = ID_PREFIX.length,
        imageDiv = null,
        currentTiles = {},
        offsetX = 0, offsetY = 0,
        reTile = /^tile\/(.*)$/;
    
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
        imageDiv = null;
    } // handleDetach
    
    function handleDrawComplete(evt, layers, viewport, tickcount, hits) {
        // remove old tiles
        removeOldObjects();
    } // handlePredraw
    
    function handleTileLoad(tile) {
        var image = tile.image;

        // initialise the image style
        image.style.cssText = '-webkit-user-select: none; -webkit-box-shadow: none; -moz-box-shadow: none; box-shadow: none; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-style: initial; border-color: initial; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; position: absolute;';

        // add to the images div
        DOM.move(image, tile.x - offsetX, tile.y - offsetY);
        image.className = 'tile/' + tile.id;
        image[DATA_X] = tile.x;
        image[DATA_Y] = tile.y;
        
        imageDiv.appendChild(image);
    } // handleTileLoad
    
    function handleReset(evt) {
        currentTiles = {};
        
        // remove all the children of the image div (just to be sure)
        while (imageDiv.childNodes.length > 0) {
            imageDiv.removeChild(imageDiv.childNodes[0]);
        } // while
    } // handleReset
    
    function removeOldObjects() {
        var elements = [].concat(imageDiv.childNodes),
            ii, tileId;

        // iterate through the elements and if the image is not a current tile, then remove it
        for (ii = elements.length; ii--; ) {
            tileId = elements[ii].className.replace(reTile, '$1');

            // if the tile is not current, then remove it
            if ((! currentTiles[tileId]) && (! elements[ii][DATA_DISPOSE])) {
                removeTile(elements[ii]);
            } // if
        } // for
    } // removeOldObjects
    
    function removeTile(image) {
        // mark as disposed
        image[DATA_DISPOSE] = true;
        
        // TODO: remove the tile after a delay
        imageDiv.removeChild(image);
    } // removeTile
    
    /* exports */
    
    function drawTiles(viewport, tiles, okToLoad) {
        var image, ii;
            
        // reset the current tiles
        currentTiles = {};
        
        // save the x and y offset
        offsetX = viewport.x;
        offsetY = viewport.y;
        
        // move existing tiles
        for (ii = imageDiv.childNodes.length; ii--; ) {
            image = imageDiv.childNodes[ii];

            // move the image
            DOM.move(
                image,
                image[DATA_X] - offsetX,
                image[DATA_Y] - offsetY
            );
        } // for

        // load new tiles
        for (ii = tiles.length; ii--; ) {
            if (okToLoad && (! (tiles[ii].loaded || tiles[ii].loading))) {
                tiles[ii].load(handleTileLoad);
            } // if
            
            // flag as current
            currentTiles[tiles[ii].id] = true;
        } // for
    } // drawTiles
    
    /* initialization */
    
    // attach the background image display
    createImageContainer();
    
    var _this = cog.extend(baseRenderer, {
        drawTiles: drawTiles
    });
    
    _this.bind('drawComplete', handleDrawComplete);
    _this.bind('detach', handleDetach);
    view.bind('reset', handleReset);
    
    return _this;
});