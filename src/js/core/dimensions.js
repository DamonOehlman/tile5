/** 
# T5.Dimensions
A module of utility functions for working with dimensions composites

## Dimension Object Literal Properties
- `width`
- `height`


## Functions
*/
var Dimensions = (function() {
    
    /* exports */
    
    /**
    ### getAspectRatio(dimensions)
    Return the aspect ratio for the `dimensions` (width / height)
    */
    function getAspectRatio(dimensions) {
        return dimensions.height !== 0 ? 
            dimensions.width / dimensions.height : 1;
    } // getAspectRatio

    /**
    ### getCenter(dimensions)
    Get the a XY composite for the center of the `dimensions` (width / 2, height  / 2)
    */
    function getCenter(dimensions) {
        return XY.init(dimensions.width >> 1, dimensions.height >> 1);
    } // getCenter

    /**
    ### getSize(dimensions)
    Get the size for the diagonal for the `dimensions`
    */
    function getSize(dimensions) {
        return sqrt(pow(dimensions.width, 2) + pow(dimensions.height, 2));
    } // getSize
    
    /** 
    ### init(width, height)
    Create a new dimensions composite (width, height)
    */
    function init(width, height) {
        // initialise the width
        width = width ? width : 0;
        
        return {
            width: width,
            height: height ? height : width
        };
    } // init

    /* module definition */
    
    return {
        getAspectRatio: getAspectRatio,
        getCenter: getCenter,
        getSize: getSize,
        init: init
    };
})(); // dimensionTools