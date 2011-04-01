/**
# T5.ImageMarker
The T5.ImageMarker is a class that provides a mechanism for displaying an image
marker as an annotation for a T5.Map or T5.View


_extends_: T5.ImageDrawable
*/
function ImageMarker(params) {
    params = COG.extend({
        imageAnchor: null
    }, params);
    
    if (params.imageAnchor) {
        params.centerOffset = XYFns.invert(params.imageAnchor);
    } // if
    
    ImageDrawable.call(this, params);
};

ImageMarker.prototype = COG.extend({}, ImageDrawable.prototype, {
    constructor: ImageMarker
});