/**
# T5.ImageLayer
*/
T5.ImageLayer = function(genId, params) {
    params = T5.ex({
        imageLoadArgs: {}
    }, params);
    
    // initialise variables
    var generator = T5.Generator.init(genId, params),
        generatedImages = null,
        lastViewRect = T5.XYRect.init(),
        loadArgs = params.imageLoadArgs,
        stateZoom = T5.viewState('ZOOM');
    
    /* private internal functions */
    
    /* every library should have a regenerate function - here's mine ;) */
    function regenerate(viewRect) {
        var removeIndexes = [],
            ii;
        
        generator.run(viewRect, function(images) {
            generatedImages = images;

            // find any null images in the array
            for (ii = generatedImages.length; ii--; ) {
                if (! generatedImages[ii]) {
                    removeIndexes[removeIndexes.length] = ii;
                } // for
            } // for
            
            // remove the null images that we just located
            for (var ii = 0; ii < removeIndexes.length; ii++) {
                generatedImages.splice(removeIndexes[ii], 1);
            } // for

            var parent = self.getParent();
            if (parent) {
                parent.trigger('invalidate');
            } // if
        });
    } // regenerate
    
    /* event handlers */
    
    function handleImageLoad() {
        var parent = self.getParent();
        if (parent) {
            parent.trigger('invalidate');
        } // if
    } // handleImageLoad
    
    function handleParentChange(evt, parent) {
        generator.bindToView(parent);
    } // handleParent
    
    function handleIdle(evt, view) {
        regenerate(lastViewRect);
    } // handleViewIdle
    
    function handleTap(evt, absXY, relXY, offsetXY) {
        var tappedImages = [],
            offsetX = offsetXY.x,
            offsetY = offsetXY.y,
            genImage,
            tapped;
        
        if (generatedImages) {
            for (var ii = generatedImages.length; ii--; ) {
                genImage = generatedImages[ii];
               
                // determine if the image is tapped
                tapped = offsetX >= genImage.x && 
                    offsetX <= genImage.x + genImage.width && 
                    offsetY >= genImage.y && 
                    offsetY <= genImage.y + genImage.height;
                    
                // if tapped then add to the list of tapped images
                if (tapped) {
                    tappedImages[tappedImages.length] = genImage;
                } // if
            } // for
        } // if
        
        // if we have some tapped images, then trigger the event
        if (tappedImages.length > 0) {
            self.trigger('tapImage', tappedImages, absXY, relXY, offsetXY);
        } // if
    } // handleTap
    
    /* exports */
    
    function draw(context, viewRect, state, view) {
        // COG.Log.info('drawing image layer layer @ ', rect);
        
        context.save();
        try {
            context.strokeStyle = '#555';

            context.beginPath();

            if (generatedImages) {
                for (var ii = generatedImages.length; ii--; ) {
                    var xx = generatedImages[ii].x,
                        yy = generatedImages[ii].y,
                        // TODO: more efficient please...
                        imageRect = T5.XYRect.init(
                            generatedImages[ii].x,
                            generatedImages[ii].y,
                            generatedImages[ii].x + generatedImages[ii].width,
                            generatedImages[ii].y + generatedImages[ii].height);

                    // draw the image
                    if (T5.XYRect.intersect(viewRect, imageRect)) {
                        self.drawImage(context, viewRect, xx, yy, generatedImages[ii], state);
                    } // if
                } // for
            } // if
            
            context.clip();
        }
        finally {
            context.restore();
        } // try..finally
        
        /*
        context.strokeStyle = '#f00';
        context.beginPath();
        context.moveTo(viewRect.x1 + viewRect.width/2, viewRect.y1);
        context.lineTo(viewRect.x1 + viewRect.width/2, viewRect.y2);
        context.moveTo(viewRect.x1, viewRect.y1 + viewRect.height / 2);
        context.lineTo(viewRect.x2, viewRect.y1 + viewRect.height / 2);
        context.stroke();
        */
        
        lastViewRect = T5.XYRect.copy(viewRect);
    } // draw
    
    function drawImage(context, viewRect, x, y, imageData, viewState) {
        var callback, image;
        
        // determine the callback to pass to the image get method
        // no callback is supplied on the zoom view state which prevents 
        // loading images that would just been thrown away
        callback = (viewState & stateZoom) === 0 ? handleImageLoad : null;
        
        // get and possibly load the image
        image = T5.Images.get(imageData.url, callback, loadArgs);
            
        if (image) {
            // draw a rect for the purposes of the clipping
            context.rect(
                x, 
                y, 
                imageData.width,
                imageData.height);
                
            context.drawImage(
                image, 
                x, 
                y,
                image.width,
                image.height);
        }
        else {
            // context.clearRect(x, y, imageData.width, imageData.height);
        } // if..else
    } // drawImage
    
    /* definition */
    
    var self = T5.ex(new T5.ViewLayer(params), {
        cycle: function(tickCount, rect, state, redraw) {
            regenerate(rect);
        },
        
        draw: draw,
        drawImage: drawImage
    });
    
    self.bind('idle', handleIdle);
    self.bind('parentChange', handleParentChange);
    self.bind('tap', handleTap);
    
    return self;
};