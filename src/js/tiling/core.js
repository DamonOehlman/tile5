(function() {
    // set the default tile size to 256 pixels
    T5.tileSize = 256;
    
    T5.Tile = function(params) {
        params = T5.ex({
            x: 0,
            y: 0,
            gridX: 0,
            gridY: 0,
            dirty: true
        }, params);
        
        return params;
    }; // T5.Tile
    
    T5.ImageTile = function(params) {
        // initialise parameters with defaults
        params = T5.ex({
            url: "",
            sessionParamRegex: null,
            loading: false,
            loaded: false
        }, params);
        
        return new T5.Tile(params);
    }; // T5.ImageTile
})();