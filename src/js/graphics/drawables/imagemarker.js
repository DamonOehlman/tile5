/**
### T5.ImageMarker(params)
*/
function ImageMarker(params) {
    params = COG.extend({
        imageAnchor: null
    }, params);
    
    if (params.imageAnchor) {
        params.imageOffset = XY.invert(params.imageAnchor);
    } // if
    
    ImageDrawable.call(this, params);
};

ImageMarker.prototype = COG.extend({}, ImageDrawable.prototype, {
    constructor: ImageMarker
});