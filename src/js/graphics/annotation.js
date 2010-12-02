/** 
# T5.Annotation
__deprecated__


The T5.Annotation has been replaced by the T5.Marker, however, the T5.Annotation
has been maintained for backwards compatibility but will be removed before a 
stable 1.0 release of Tile5.
*/
T5.Annotation = function(params) {
    params = T5.ex({
        xy: null
    }, params);
    
    return new T5.Marker(params.xy, params);
};

/**
# T5.ImageAnnotation
__deprecated__


The T5.ImageAnnotation has been replaced by the T5.ImageMarker, however, the T5.ImageAnnotation
has been maintained for backwards compatibility but will be removed before a 
stable 1.0 release of Tile5.
*/
T5.ImageAnnotation = function(params) {
    params = T5.ex({
        xy: null
    }, params);
    
    return new T5.ImageMarker(params.xy, params);
};
