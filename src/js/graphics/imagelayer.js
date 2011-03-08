/**
# T5.ImageLayer
*/
var ImageLayer = function(genId, params) {
    params = COG.extend({
        imageLoadArgs: {}
    }, params);
    
    // initialise variables
    var generator = genId ? Generator.init(genId, params) : null,
        generateCount = 0,
        images = [],
        loadArgs = params.imageLoadArgs;
    
    /* private internal functions */
    
    function eachImage(viewRect, viewState, callback) {
        for (var ii = images.length; ii--; ) {
            var imageData = images[ii],
                xx = imageData.x,
                yy = imageData.y,
                // TODO: more efficient please...
                imageRect = XYRect.init(
                    imageData.x,
                    imageData.y,
                    imageData.x + imageData.width,
                    imageData.y + imageData.height);

            // draw the image
            if (callback && XYRect.intersect(viewRect, imageRect)) {
                // determine the callback to pass to the image get method
                // no callback is supplied on the zoom view state which prevents 
                // loading images that would just been thrown away
                var image = Images.get(imageData.url, function(loadedImage) {
                    self.changed();
                }, loadArgs);

                // trigger the eachImage callback
                if (image) {
                    callback(image, xx, yy, imageData.width, imageData.height);
                } // if
            } // if
        } // for
    } // eachImage
    
    /* every library should have a regenerate function - here's mine ;) */
    function regenerate(viewRect) {
        var sequenceId = ++generateCount,
            view = self.getParent();

        if (generator) {
            // COG.info('generating: ' + XYRect.toString(viewRect) + ', sequence = ' + sequenceId);

            generator.run(view, viewRect, function(newImages) {
                if (sequenceId == generateCount) {
                    images = [].concat(newImages);
                    view.invalidate();
                } // if
            });
        } // if
    } // regenerate
    
    /* event handlers */
    
    function handleRefresh(evt, view, viewRect) {
        regenerate(viewRect);
    } // handleViewIdle
    
    function handleTap(evt, absXY, relXY, offsetXY) {
        var tappedImages = [],
            offsetX = offsetXY.x,
            offsetY = offsetXY.y,
            genImage,
            tapped;
        
        if (images) {
            for (var ii = images.length; ii--; ) {
                genImage = images[ii];
               
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
        generator = Generator.init(generatorId, COG.extend({}, params, args));

        // clear the generated images and regenerate
        images = null;
        regenerate(self.getParent().getViewRect());
    } // changeGenerator
    
    function clip(context, viewRect, state, view) {
        var offsetX = viewRect.x1,
            offsetY = viewRect.y1;
        
        eachImage(viewRect, state, function(image, x, y, width, height) {
            context.rect(x - offsetX, y - offsetY, width, height);
        });
    } // clip
    
    function draw(context, viewRect, state, view) {
        var offsetX = viewRect.x1,
            offsetY = viewRect.y1;
        
        eachImage(viewRect, state, function(image, x, y, width, height) {
            context.drawImage(
                image, 
                x - offsetX, 
                y - offsetY,
                image.width,
                image.height);
        });
    } // draw
    
    function mask(context, viewRect, state, view) {
        eachImage(viewRect, state, function(image, x, y, width, height) {
            COG.info('clearing rect @ x = ' + x + ', y = ' + y + ', width = ' + width + ', height = ' + height);
            context.clearRect(x, y, width, height);
        });
    } // mask
    
    /* definition */
    
    var self = COG.extend(new ViewLayer(params), {
        changeGenerator: changeGenerator,
        clip: clip,
        draw: draw,
        mask: mask
    });
    
    self.bind('refresh', handleRefresh);
    self.bind('tap', handleTap);
    
    return self;
};