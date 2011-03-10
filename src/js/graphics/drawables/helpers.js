function checkOffsetAndBounds(drawable, image) {
    var x, y;
    
    if (image && image.width > 0) {
        if (! drawable.imageOffset) {
            drawable.imageOffset = XY.init(
                -image.width >> 1, 
                -image.height >> 1
            );
        } // if
        
        if (! drawable.bounds) {
            x = drawable.xy.x + drawable.imageOffset.x;
            y = drawable.xy.y + drawable.imageOffset.y;
            
            drawable.bounds = XYRect.init(x, y, x + image.width, y + image.height);
        } // if            
    } // if
} // checkOffsetAndBounds

function transformable(target) {
    
    /* internals */
    var rotation = 0,
        scale = 1,
        transX = 0,
        transY = 0;
    
    /* exports */
    
    COG.extend(target, {
        rotate: function(value) {
            rotation = value;
        },
        
        scale: function(value) {
            scale = value;
        },
        
        translate: function(x, y) {
            transX = x;
            transY = y;
        },
        
        transform: function(context, offsetX, offsetY) {
            context.save();
            context.translate(target.xy.x - offsetX + transX, target.xy.y - offsetY + transY);
            
            if (rotation !== 0) {
                context.rotate(rotation);
            } // if
            
            if (scale !== 1) {
                context.scale(scale, scale);
            } // if
        }
    });
}
