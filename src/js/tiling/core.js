/**
# T5.Tiling
*/
T5.Tiling = (function() {
    
    /* internal functions */
    
    /* exports */
    
    function init(x, y, width, height, data) {
        return T5.ex({
            x: x,
            y: y,
            width: width,
            height: height
        }, data);
    } // init
    
    /* module definition */
    
    var module = {
        tileSize: 256,
        
        init: init
    };
    
    return module;
})();