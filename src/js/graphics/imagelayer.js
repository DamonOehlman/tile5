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
        lastGenerateRect = T5.XYRect.init();
    
    /* private internal functions */
    
    function drawImage(context, generatorImage, viewState) {
        var image = T5.Images.get(generatorImage.url, handleImageLoad);
        if (image) {
            context.drawImage(
                image, 
                generatorImage.x, 
                generatorImage.y,
                image.width,
                image.height);
        }
        else {
            context.fillStyle = '#777';
            context.fillRect(generatorImage.x, generatorImage.y, generatorImage.width, generatorImage.height);
        } // if..else
        
        /*
        context.beginPath();
        context.rect(
            generatorImage.x, 
            generatorImage.y, 
            generatorImage.width,
            generatorImage.height);
        context.stroke();
        */
    } // drawImage
    
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
        
        draw: function(context, rect, state, view) {
            // COG.Log.info('drawing image layer layer @ ', rect);
            
            context.save();
            try {
                context.strokeStyle = '#555';

                if (generatedImages) {
                    for (var ii = generatedImages.length; ii--; ) {
                        drawImage(context, generatedImages[ii], state);
                    } // for
                } // if
            }
            finally {
                context.restore();
            } // try..finally
            
            context.strokeStyle = '#f00';
            context.beginPath();
            context.moveTo(rect.x1 + rect.width/2, rect.y1);
            context.lineTo(rect.x1 + rect.width/2, rect.y2);
            context.moveTo(rect.x1, rect.y1 + rect.height / 2);
            context.lineTo(rect.x2, rect.y1 + rect.height / 2);
            context.stroke();
            
            lastViewRect = T5.XYRect.copy(rect);
        }
    });
    
    self.bind('parentChange', handleParentChange);
    
    return self;
};