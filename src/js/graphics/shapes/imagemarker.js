/**
# T5.ImageMarker
_extends:_ T5.Marker


An image annotation is simply a T5.Annotation that has been extended to 
display an image rather than a simple circle.  Probably the most common type
of annotation used.  Supports using either the `image` or `imageUrl` parameters
to use preloaded or an imageurl for displaying the annotation.

## TODO

- currently hits on animated markers not working as well as they should, need to 
tweak touch handling to get this better...


## Constructor
`new T5.ImageMarker(params);`

### Initialization Parameters

- `image` (HTMLImage, default = null) - one of either this or the `imageUrl` parameter
is required and the specified image is used to display the annotation.

- `imageUrl` (String, default = null) - one of either this of the `image` parameter is
required.  If specified, the image is obtained using T5.Images module and then drawn
to the canvas.

- `animatingImage` (HTMLImage, default = null) - an optional image that can be supplied, 
and if so, the specified image will be used when the annotation is animating rather than
the standard `image`.  If no `animatingImage` (or `animatingImageUrl`) is specified then
the standard image is used as a fallback when the marker is animating.

- `animatingImageUrl` (String, default = null) - as per the `animatingImage` but a url 
for an image that will be loaded via T5.Images

- `imageAnchor` (T5.Vector, default = null) - a T5.Vector that optionally specifies the 
anchor position for an annotation.  Consider that your annotation is "pin-like" then you
would want to provide an anchor vector that specified the pixel position in the image 
around the center and base of the image.  If not `imageAnchor` parameter is provided, then 
the center of the image is assumed for the anchor position.

- `rotation` (float, default = 0) - the value of the rotation for the image marker 
(in radians).  Be aware that applying rotation to a marker does add an extra processing
overhead as the canvas context needs to be saved and restored as part of the operation.

- `scale` (float, default = 1)

- `opacity` (float, default = 1)


## Methods
*/
var ImageMarker = function(params) {
    params = COG.extend({
        image: null,
        imageUrl: null,
        animatingImage: null,
        animatingImageUrl: null,
        imageAnchor: null
    }, params);
    
    var dragOffset = null,
        drawX,
        drawY,
        imageOffset = params.imageAnchor ?
            T5.XY.invert(params.imageAnchor) : 
            null;
    
    /* exports */
    
    function changeImage(imageUrl) {
        self.image = Images.get(imageUrl, function(loadedImage) {
            self.image = loadedImage;
        });
    } // changeImage
    
    /**
    ### drag(dragData, dragX, dragY, drop)
    */
    function drag(dragData, dragX, dragY, drop) {
        // if the drag offset is unknown then calculate
        if (! dragOffset) {
            dragOffset = XY.init(
                dragData.startX - self.xy.x, 
                dragData.startY - self.xy.y
            );

            // TODO: increase scale? to highlight dragging
        }

        // update the xy and accounting for a drag offset
        self.xy.x = dragX - dragOffset.x;
        self.xy.y = dragY - dragOffset.y;
        
        if (drop) {
            var view = self.parent ? self.parent.getParent() : null;
            
            dragOffset = null;
            
            // TODO: reset scale
            
            if (view) {
                view.syncXY([self.xy], true);
            } // if
            
            self.trigger('dragDrop');
        } // if
        
        return true;
    } // drag    
    
    /**
    ### draw(context, x, y, width, height, state)
    */
    function draw(context, offsetX, offsetY, width, height, state) {
        context.drawImage(self.image, drawX, drawY);
    } // draw
    
    /**
    ### prepPath(context, offsetX, offsetY, width, height, state, hitData)
    Prepare the path that will draw the polygon to the canvas
    */
    function prepPath(context, offsetX, offsetY, width, height, state) {
        // get the image
        var image = self.image,
            draw = image && image.width > 0;
            
        if (draw) {
            if (! imageOffset) {
                imageOffset = XY.init(
                    -image.width >> 1, 
                    -image.height >> 1
                );
            } // if
            
            // update the draw x and y
            drawX = self.xy.x + imageOffset.x - offsetX;
            drawY = self.xy.y + imageOffset.y - offsetY;
            
            // update the bounds
            self.bounds = XYRect.init(drawX, drawY, drawX + image.width, drawY + image.height);
            
            // open the path for hit tests
            context.beginPath();
            context.rect(drawX, drawY, image.width, image.height);
            
        } // if
        
        return draw;
    } // prepPath 
    
    var self = COG.extend(new Marker(params), {
        changeImage: changeImage,
        drag: drag,
        draw: draw,
        prepPath: prepPath
    });
    
    if (! self.image) {
        self.image = Images.get(params.imageUrl, function(loadedImage) {
            self.image = loadedImage;
        });
    } // if
    
    if (! self.animatingImage) {
        self.animatingImage = Images.get(params.animatingImageUrl, function(loadedImage) {
            self.animatingImage = loadedImage;
        });
    } // if    
    
    return self;
};
