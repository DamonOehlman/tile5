/**
# T5.Tiling
*/
var Tiling = (function() {
    
    /* internal functions */
    
    /* exports */
    
    function init(x, y, width, height, data) {
        return COG.extend({
            x: x,
            y: y,
            width: width,
            height: height
        }, data);
    } // init
    
    /* module definition */
    
    return {
        tileSize: 256,
        init: init
    };
})();