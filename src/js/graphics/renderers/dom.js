function DOMImageRenderer() {
    
    /* internals */
    
    var PROP_WK_TRANSFORM = '-webkit-transform',
        container = null,
        supportTransforms,
        images = [];
        
    function getOffset(obj) {
        var calcLeft = 0, 
            calcTop = 0;

        if (obj.offsetParent) {
            do {
                calcLeft += obj.offsetLeft;
                calcTop += obj.offsetTop;

                obj = obj.offsetParent;
            } while (obj);
        } // if

        return {
            left: calcLeft,
            top: calcTop
        };
    } // getOffset
    
    /* exports */
    
    function attach(view, canvas, context) {
        // initialise variables
        var offset = getOffset(canvas);
        
        // determine whether or not transforms are supported
        supportTransforms = typeof canvas.style[PROP_WK_TRANSFORM] != 'undefined';
        
        COG.info('attaching the dom renderer to the document');
        
        // TODO: cleanup the current container
        if (container) {
        } // if
        
        container = document.createElement('div');
        container.id = COG.objId('domImages');
        container.style.cssText = COG.formatStr(
            'position: absolute; overflow: hidden; width: {0}px; height: {1}px; background: #ddd; z-index: -1;',
            canvas.parentNode.offsetWidth,
            canvas.parentNode.offsetHeight);
        
        // append the container to the same element as the canvas
        canvas.parentNode.insertBefore(container, canvas);
    } // attach
    
    /**
    ### draw(context, viewRect, state, view)
    */
    function draw(context, viewRect, state, view) {
        var image,
            element,
            inViewport,
            offsetX = viewRect.x1,
            offsetY = viewRect.y1,
            minX = offsetX - 256,
            minY = offsetY - 256,
            maxX = viewRect.x2,
            maxY = viewRect.y2,
            relX, relY;
            
        for (var ii = images.length; ii--; ) {
            image = images[ii];
            element = image.element;
            
            // check whether the image is in the viewport or not
            inViewport = image.x >= minX && image.x <= maxX && 
                image.y >= minY && image.y <= maxY;
                
            // calculate the image relative position
            relX = image.x - offsetX;
            relY = image.y - offsetY;
            
            if (! element) {
                element = image.element = new Image();
                element.src = image.url;

                container.appendChild(element);
                element.style.cssText = '-webkit-user-select: none; -webkit-box-shadow: none; -moz-box-shadow: none; box-shadow: none; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-style: initial; border-color: initial; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; position: absolute;';
            } // if
            
            if (supportTransforms) {
                element.style[PROP_WK_TRANSFORM] = 'translate3d(' + relX +'px, ' + relY + 'px, 0px)';
            }
            else {
                element.style.left = relX + 'px';
                element.style.top = relY + 'px';
            } // if..else

            // show or hide the image depending on whether it is in the viewport or not
            element.style.display = inViewport ? 'block' : 'none';
        } // for
    } // draw
    
    function updateImages(newImages) {
        // iterate through all the old images and remove the dom elements
        // TODO: improve this!!!
        for (var ii = images.length; ii--; ) {
            if (container && images[ii].element) {
                container.removeChild(images[ii].element);
            } // if
        } // for
        
        // update the images
        images = [].concat(newImages);
    } // updateImages
    
    return COG.extend(new ImageRenderer(), {
        attach: attach,
        draw: draw,
        updateImages: updateImages
    });
};