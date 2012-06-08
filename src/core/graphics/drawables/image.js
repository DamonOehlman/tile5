/*
# DRAWABLE: image
*/
reg(typeDrawable, 'image', function(view, layer, params) {
    params = cog.extend({
        image: null,
        imageUrl: null,
        centerOffset: null,
        typeName: 'Image'
    }, params);
    
    var drawableResync = Drawable.prototype.resync,
        drawX,
        drawY,
        imgOffsetX = 0,
        imgOffsetY = 0,
        image = params.image;
        
    /* internal functions */
    
    function checkOffsetAndBounds() {
        if (image && image.width > 0) {
            if (! this.centerOffset) {
                this.centerOffset = new XY(
                    -image.width >> 1, 
                    -image.height >> 1
                );
            } // if

            this.updateBounds(new Rect(
                this.xy.x + this.centerOffset.x,
                this.xy.y + this.centerOffset.y,
                image.width, 
                image.height), 
            false);
        } // if
    } // checkOffsetAndBounds    
            
    /* exports */
    
    function changeImage(imageUrl) {
        // update the image url
        this.imageUrl = imageUrl;
        
        // load the new image
        if (this.imageUrl) {
            var marker = this;
            
            getImage(this.imageUrl, function(retrievedImage, loaded) {
                image = retrievedImage;
                
                if (loaded) {
                    var view = _self.layer ? _self.layer.view : null;

                    // invalidate the view
                    if (view) {
                        view.invalidate();
                    } // if
                } // if
                
                checkOffsetAndBounds.apply(marker);
            });
        } // if
    } // changeImage
    
    /**
    ### getProps(renderer)
    Get the drawable item properties that will be passed to the renderer during
    the prepare and draw phase
    */
    function getProps(renderer) {
        // check the offset and bounds
        if (! this.bounds) {
            checkOffsetAndBounds(this, image);
        } // if

        return {
            image: image,
            x: this.xy.x + imgOffsetX,
            y: this.xy.y + imgOffsetY
        };
    } // getProps
    
    function resync(view) {
        // call the inherited resync
        drawableResync.call(this, view);
        
        // now check the offset and bounds
        checkOffsetAndBounds.call(this);
    } // resync
    
    // call the inherited constructor
    var _self = cog.extend(new Drawable(view, layer, params), {
        changeImage: changeImage,
        getProps: getProps,
        resync: resync
    });

    // load the appropriate image
    if (! image) { 
        changeImage.call(this, this.imageUrl);
    } // if
    
    // if we have an image offset, then update the offsetX and Y
    if (this.centerOffset) {
        imgOffsetX = this.centerOffset.x;
        imgOffsetY = this.centerOffset.y;
    } // if
    
    return _self;
});