var ImageMarker = function(params) {
    params = COG.extend({
        imageAnchor: null
    }, params);
    
    if (params.imageAnchor) {
        params.imageOffset = XY.invert(params.imageAnchor);
    } // if
    
    ImageDrawable.call(this, params);
};

ImageMarker.prototype = new ImageDrawable();
ImageMarker.prototype.constructor = ImageMarker;