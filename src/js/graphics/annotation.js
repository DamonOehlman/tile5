/**
# T5.Annotation

*/
T5.Annotation = function(params) {
    params = T5.ex({
        xy: null,
        tweenIn: T5.easing('sine.out'),
        animationSpeed: null
    }, params);
    
    var animating = false;
    
    var self = T5.ex(params, {
        xy: params.xy,
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
                4,
                0,
                Math.PI * 2,
                false);                    
            context.fill();
        }
    }); // self
    
    return self;
};

/**
# T5.ImageAnnotation

*/
T5.ImageAnnotation = function(params) {
    params = T5.ex({
        imageUrl: null,
        animatingImageUrl: null,
        imageAnchor: null
    }, params);
    
    var imageOffset = params.imageAnchor ?
            T5.V.invert(params.imageAnchor) : 
            null;
    
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
        var imageUrl = getImageUrl(),
            image = T5.Images.get(imageUrl);
            
        if (! image) {
            T5.Images.load(
                imageUrl, 
                function(loadedImage, fromCache) {
                    overlay.wakeParent();
                }
            );
        }
        else if (image.complete && (image.width > 0)) {
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
    
    var self = T5.ex(new T5.Annotation(params), {
        drawMarker: drawImage
    });
    
    return self;
};
