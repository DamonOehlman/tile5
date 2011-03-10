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
