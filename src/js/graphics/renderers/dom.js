registerRenderer('dom', function(view, container, params, baseRenderer) {
    
    /* internals */
    
    var PROP_WK_TRANSFORM = '-webkit-transform',
        supportTransforms = typeof container.style[PROP_WK_TRANSFORM] != 'undefined',
        imageDiv = null;
    
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
            offsetX = viewport.x,
            offsetY = viewport.y,
            minX = offsetX - 256,
            minY = offsetY - 256,
            maxX = offsetX + viewport.w,
            maxY = offsetY + viewport.h,
            relX, relY;
            
        for (var ii = tiles.length; ii--; ) {
            tile = tiles[ii];
            image = tile.image;
            
            // check whether the image is in the viewport or not
            inViewport = tile.x >= minX && tile.x <= maxX && 
                tile.y >= minY && tile.y <= maxY;
                
            // calculate the image relative position
            relX = tile.x - offsetX;
            relY = tile.y - offsetY;
            
            if (! image) {
                image = tile.image = new Image();
                image.src = tile.url;

                imageDiv.appendChild(image);
                image.style.cssText = '-webkit-user-select: none; -webkit-box-shadow: none; -moz-box-shadow: none; box-shadow: none; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-style: initial; border-color: initial; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; position: absolute;';
            } // if
            
            if (supportTransforms) {
                image.style[PROP_WK_TRANSFORM] = 'translate3d(' + relX +'px, ' + relY + 'px, 0px)';
            }
            else {
                image.style.left = relX + 'px';
                image.style.top = relY + 'px';
            } // if..else

            // show or hide the image depending on whether it is in the viewport or not
            image.style.display = inViewport ? 'block' : 'none';
        } // for
    } // drawTiles
    
    function reset() {
        // remove the images from the dom
        imageDiv.innerHTML = '';
    } // reset

    /* initialization */
    
    // attach the background image display
    createImageContainer();
    
    var _this = COG.extend(baseRenderer, {
        drawTiles: drawTiles,
        reset: reset
    });
    
    return _this;
});