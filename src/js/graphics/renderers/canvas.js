function CanvasImageRenderer() {
    
    /* internals */
    
    var images = [];
    
    function drawImage(context, imageData, x, y, view) {
        if (imageData.image) {
            context.drawImage(imageData.image, x, y);
        }
        else if (! imageData.loading) {
            imageData.loading = true;
            
            getImage(imageData.url, function(image, loaded) {
                imageData.image = image;
                imageData.loading = false;

                // draw the image in the new location
                context.drawImage(image, imageData.screenX, imageData.screenY);
            });
        } // if..else
    } // drawImage
    
    /* exports */
    
    function clip(context, viewRect, state, view) {
        var offsetX = viewRect.x1,
            offsetY = viewRect.y1,
            imageData;
            
        for (var ii = images.length; ii--; ) {
            imageData = images[ii];
            if (imageData.image) {
                context.rect(
                    imageData.x - offsetX,
                    imageData.y - offsetY,
                    imageData.width,
                    imageData.height
                );
            }
        } // for
    } // clip
    
    /**
    ### draw(context, viewRect, state, view)
    */
    function draw(context, viewRect, state, view) {
        var image,
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
            
            // check whether the image is in the viewport or not
            inViewport = image.x >= minX && image.x <= maxX && 
                image.y >= minY && image.y <= maxY;
                
            // calculate the image relative position
            relX = image.screenX = image.x - offsetX;
            relY = image.screenY = image.y - offsetY;

            // show or hide the image depending on whether it is in the viewport
            if (inViewport) {
                drawImage(context, image, relX, relY, view);
            } // if
        } // for
    } // draw
    
    function updateImages(newImages) {
        images = [].concat(newImages);
    }
    
    return COG.extend(new ImageRenderer(), {
        clip: clip,
        draw: draw,
        updateImages: updateImages
    });
};