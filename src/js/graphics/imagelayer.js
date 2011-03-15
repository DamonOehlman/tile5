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
        lastViewRect = null,
        loadArgs = params.imageLoadArgs,
        regenTimeout = 0,
        regenViewRect = null;
    
    /* private internal functions */
    
    function drawImage(context, imageData, x, y) {
        if (imageData.image) {
            context.drawImage(imageData.image, x, y);
        }
        else {
            getImage(imageData.url, function(image) {
                imageData.image = image;
                _self.changed();
            });
        } // if..else
    } // drawImage
    
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
                getImage(imageData.url, function(image, loaded) {
                    callback(image, xx, yy, imageData.width, imageData.height);
                    
                    if (loaded) {
                        _self.changed();
                    } // if
                }, loadArgs);
            } // if
        } // for
    } // eachImage
    
    /* every library should have a regenerate function - here's mine ;) */
    function regenerate(viewRect) {
        var xyDiff = lastViewRect ? 
                Math.abs(lastViewRect.x1 - viewRect.x1) + Math.abs(lastViewRect.y1 - viewRect.y1) :
                0;

        if (generator && ((! lastViewRect) || (xyDiff > 256))) {
            var sequenceId = ++generateCount,
                view = _self.getParent();
            
            // COG.info('generating: ' + XYRect.toString(viewRect) + ', sequence = ' + sequenceId);

            generator.run(view, viewRect, function(newImages) {
                lastViewRect = XYRect.copy(viewRect);
                
                if (sequenceId == generateCount) {
                    // load the new images
                    for (var ii = newImages.length; ii--; ) {
                        var imageData = newImages[ii];
                        
                        images[images.length] = {
                            image: null,
                            sequence: sequenceId,
                            url: imageData.url,
                            rect: XYRect.init(
                                imageData.x,
                                imageData.y,
                                imageData.x + imageData.width,
                                imageData.y + imageData.height
                            )
                        };
                    } // for
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
            _self.trigger('tapImage', tappedImages, absXY, relXY, offsetXY);
        } // if
    } // handleTap
    
    /* exports */
    
    /**
    ### changeGenerator(generatorId, args)
    */
    function changeGenerator(generatorId, args) {
        // update the generator
        generator = Generator.init(generatorId, COG.extend({}, params, args));
        regenerate(_self.getParent().getViewRect());
    } // changeGenerator
    
    function clip(context, viewRect, state, view) {
        var offsetX = viewRect.x1,
            offsetY = viewRect.y1;
            
        for (var ii = images.length; ii--; ) {
            var drawImage = images[ii],
                rect = drawImage.rect;
                
            if (XYRect.intersect(viewRect, rect)) {
                context.rect(
                    rect.x1 - offsetX,
                    rect.y1 - offsetY,
                    rect.width,
                    rect.height
                );
            } // if
        } // for
    } // clip
    
    function draw(context, viewRect, state, view) {
        var offsetX = viewRect.x1,
            offsetY = viewRect.y1,
            ii = 0;
            
        while (ii < images.length) {
            var currentImage = images[ii],
                rect = currentImage.rect;
                
            if (XYRect.intersect(viewRect, rect)) {
                drawImage(context, currentImage, rect.x1 - offsetX, rect.y1 - offsetY);
            } // if
            
            // if the image is not the current sequence, then slice it out of the array
            if (currentImage.sequence !== generateCount) {
                images.splice(ii, 1);
            }
            else {
                ii++;
            } // if..else
        } // while
    } // draw
    
    function mask(context, viewRect, state, view) {
        eachImage(viewRect, state, function(image, x, y, width, height) {
            COG.info('clearing rect @ x = ' + x + ', y = ' + y + ', width = ' + width + ', height = ' + height);
            context.clearRect(x, y, width, height);
        });
    } // mask
    
    /* definition */
    
    var _self = COG.extend(new ViewLayer(params), {
        changeGenerator: changeGenerator,
        clip: clip,
        draw: draw,
        mask: mask
    });
    
    _self.bind('refresh', handleRefresh);
    _self.bind('tap', handleTap);
    
    return _self;
};