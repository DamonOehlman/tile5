/**
# T5.ImageLayer
*/
T5.ImageLayer = function(genId, params) {
    params = T5.ex({
        
    }, params);
    
    // initialise variables
    var generator = T5.Generator.init(genId, params),
        generatedImages = null,
        lastViewRect = T5.XYRect.init(),
        lastGenerateRect = T5.XYRect.init(),
        stateZoom = T5.viewState('ZOOM');
    
    /* private internal functions */
    
    /* every library should have a regenerate function - here's mine ;) */
    function regenerate(viewRect) {
        generator.run(viewRect, function(images) {
            generatedImages = images;

            var parent = self.getParent();
            if (parent) {
                parent.trigger('invalidate');
            } // if
        });

        // update the last generate rect
        lastGenerateRect = T5.XYRect.copy(viewRect);
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
        parent.bind('idle', handleViewIdle);
    } // handleParent
    
    function handleViewIdle(evt, view) {
        regenerate(lastViewRect);
    } // handleViewIdle
    
    /* exports */
    
    function drawImage(context, viewRect, x, y, imageData, viewState) {
        var callback, image;
        
        // determine the callback to pass to the image get method
        // no callback is supplied on the zoom view state which prevents 
        // loading images that would just been thrown away
        callback = (viewState & stateZoom) === 0 ? handleImageLoad : null;
        
        // get and possibly load the image
        image = T5.Images.get(imageData.url, callback);
            
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
            var generateRequired = 
                Math.abs(rect.x1 - lastGenerateRect.x1) > rect.width || 
                Math.abs(rect.y1 - lastGenerateRect.y1) > rect.height;
                
            if (generateRequired) {
                regenerate(rect);
            } // if
        },
        
        draw: function(context, viewRect, state, view) {
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
            
            context.strokeStyle = '#f00';
            context.beginPath();
            context.moveTo(viewRect.x1 + viewRect.width/2, viewRect.y1);
            context.lineTo(viewRect.x1 + viewRect.width/2, viewRect.y2);
            context.moveTo(viewRect.x1, viewRect.y1 + viewRect.height / 2);
            context.lineTo(viewRect.x2, viewRect.y1 + viewRect.height / 2);
            context.stroke();
            
            lastViewRect = T5.XYRect.copy(viewRect);
        },
        
        drawImage: drawImage
    });
    
    self.bind('parentChange', handleParentChange);
    
    return self;
};