/**
# T5.ImageLayer
*/
T5.ImageLayer = function(genId, params) {
    params = T5.ex({
        imageLoadArgs: {}
    }, params);
    
    // initialise variables
    var generator = genId ? T5.Generator.init(genId, params) : null,
        generatedImages = [],
        lastViewRect = T5.XYRect.init(),
        loadArgs = params.imageLoadArgs;
    
    /* private internal functions */
    
    function eachImage(viewRect, viewState, callback) {
        for (var ii = generatedImages.length; ii--; ) {
            var imageData = generatedImages[ii],
                xx = imageData.x,
                yy = imageData.y,
                // TODO: more efficient please...
                imageRect = T5.XYRect.init(
                    imageData.x,
                    imageData.y,
                    imageData.x + imageData.width,
                    imageData.y + imageData.height);

            // draw the image
            if (callback && T5.XYRect.intersect(viewRect, imageRect)) {
                // determine the callback to pass to the image get method
                // no callback is supplied on the zoom view state which prevents 
                // loading images that would just been thrown away
                var image = T5.Images.get(imageData.url, function(loadedImage) {
                    self.changed();
                }, loadArgs);

                // trigger the eachImage callback
                callback(image, xx, yy, imageData.width, imageData.height);
            } // if
        } // for
    } // eachImage
    
    /* every library should have a regenerate function - here's mine ;) */
    function regenerate(viewRect) {
        var removeIndexes = [],
            ii;
            
        if (! generator) {
            return;
        } // if

        generator.run(viewRect, function(images) {
            generatedImages = [].concat(images);
            self.changed();
        });
    } // regenerate
    
    /* event handlers */
    
    function handleParentChange(evt, parent) {
        if (generator) {
            generator.bindToView(parent);
        } // if
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
    
    /**
    ### changeGenerator(generatorId, args)
    */
    function changeGenerator(generatorId, args) {
        // update the generator
        generator = T5.Generator.init(generatorId, T5.ex({}, params, args));
        generator.bindToView(self.getParent());

        // clear the generated images and regenerate
        generatedImages = null;
        regenerate(lastViewRect);
    } // changeGenerator
    
    function clip(context, viewRect, state, view) {
        eachImage(viewRect, state, function(image, x, y, width, height) {
            if (image) {
                context.rect(x, y, width, height);
            } // if
        });
    } // clip
    
    function draw(context, viewRect, state, view) {
        // COG.Log.info('drawing image layer layer @ ', viewRect);
        
        eachImage(viewRect, state, function(image, x, y, width, height) {
            self.drawImage(context, image, x, y, width, height, viewRect, state);
        });
        
        lastViewRect = T5.XYRect.copy(viewRect);
    } // draw
    
    function drawImage(context, image, x, y, width, height, viewRect, state) {
        if (image) {
            context.drawImage(
                image, 
                x, 
                y,
                image.width,
                image.height);
        }
    } // drawImage
    
    /* definition */
    
    var self = T5.ex(new T5.ViewLayer(params), {
        changeGenerator: changeGenerator,
        clip: clip,
        
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