/**
# T5.Annotation

*/
T5.Annotation = function(params) {
    params = T5.ex({
        xy: null,
        tweenIn: null,
        animationSpeed: null
    }, params);
    
    // initialise defaults
    var MARKER_SIZE = 4;
    
    var animating = false;
    
    var self = T5.ex(params, {
        isNew: true,
        
        isAnimating: function() {
            return animating;
        },
        
        draw: function(context, offset, state, overlay, view) {
            if (! self.xy) { return; }
            
            if (self.isNew && (params.tweenIn)) {
                // get the end value and update the y value
                var endValue = self.xy.y;

                // set the y to offscreen
                self.xy.y = offset.y - 20;
                
                // animate the annotation
                animating = true;
                
                T5.tween(
                    self.xy, 
                    'y',
                    endValue, 
                    params.tweenIn, 
                    function() {
                        self.xy.y = endValue;
                        animating = false;
                    }, 
                    params.animationSpeed ? 
                        params.animationSpeed : 
                        250 + (Math.random() * 500)
                );
            } // if
            
            self.drawMarker(
                context, 
                offset, 
                new T5.Vector(
                    self.xy.x - offset.x, 
                    self.xy.y - offset.y
                ), 
                state, 
                overlay, 
                view);
            
            self.isNew = false;
        },
        
        drawMarker: function(context, offset, xy, state, overlay, view) {
            context.beginPath();
            context.arc(
                xy.x, 
                xy.y,
                MARKER_SIZE,
                0,
                Math.PI * 2,
                false);                    
            context.fill();
        },
        
        hitTest: function(gridXY) {
            return Math.abs(gridXY.x - self.xy.x) <= MARKER_SIZE && 
                Math.abs(gridXY.y - self.xy.y) <= MARKER_SIZE;
        }
    }); // self
    
    return self;
};

/**
# T5.ImageAnnotation

*/
T5.ImageAnnotation = function(params) {
    params = T5.ex({
        image: null,
        imageUrl: null,
        animatingImage: null,
        animatingImageUrl: null,
        imageAnchor: null
    }, params);
    
    var imageOffset = params.imageAnchor ?
            T5.V.invert(params.imageAnchor) : 
            null,
        staticImage = params.image,
        animatingImage = params.animatingImage;
    
    function getImageUrl() {
        if (params.animatingImageUrl && self.isAnimating()) {
            // we want a smooth transition, so make 
            // sure the end image is loaded
            T5.Images.load(params.imageUrl);
            
            // return the animating image url
            return params.animatingImageUrl;
        }
        else {
            return params.imageUrl;
        } // if..else
    } // getImageUrl
    
    function drawImage(context, offset, xy, state, overlay, view) {
        // get the image
        var image = self.isAnimating() && animatingImage ? animatingImage : staticImage;
        if (image && image.complete && (image.width > 0)) {
            if (! imageOffset) {
                imageOffset = new T5.Vector(
                    -image.width >> 1, 
                    -image.height >> 1
                );
            } // if
            
            // determine the position to draw the image
            var imageXY = T5.V.offset(
                                xy,
                                imageOffset.x,
                                imageOffset.y);

            // draw the image
            context.drawImage(
                image,
                imageXY.x,
                imageXY.y,
                image.width,
                image.height);
        } // if
    } // drawImage
    
    if (! staticImage) {
        staticImage = T5.Images.get(params.imageUrl);
        if (! staticImage) {
            T5.Images.load(params.imageUrl, function(image) {
                staticImage = image;
            });
        } // if
    } // if
    
    if (! animatingImage) {
        animatingImage = T5.Images.get(params.imageUrl);
        if (! animatingImage) {
            T5.Images.load(params.animatingImageUrl, function(image) {
                animatingImage = image;
            });
        } // if
    } // if    
    
    var self = T5.ex(new T5.Annotation(params), {
        drawMarker: drawImage,
        
        hitTest: function(gridXY) {
            var markerX = self.xy.x,
                markerY = self.xy.y;
                
            // check for a hit test (image offsets are negative numbers)
            return (gridXY.x >= markerX + imageOffset.x) && 
                (gridXY.x <= markerX + (staticImage.width + imageOffset.x)) && 
                (gridXY.y >= markerY + imageOffset.y) && 
                (gridXY.y <= markerY + (staticImage.height + imageOffset.y));
        }
    });
    
    return self;
};
