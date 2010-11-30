(function() {
    // set the default tile size to 256 pixels
    T5.tileSize = 256;
    
    /**
    # T5.Tile
    A very simple lightweight class that stores information relevant to a tile.
    
    ## Constructor 
    ` new T5.Tile(params);`
    
    ### Initialization Parameters
    
    - x (default: 0) - the current x screen coordinate of the tile
    - y (default: 0) - the current y screen coordinate of the tile
    - gridX (default: 0) - 
    - gridY (default: 0)
    - size (default: 256) - the size of the tile
    
    
    ## Properties
    Initialization parameters mapped directly to properties
    
    ## Usage
    A new tile is created using the following code:

    ~ var tile = new T5.Tile();

    or with specific initial property values:
    ~ var tile = new T5.Tile({
    ~     x: 10,
    ~     y: 10,
    ~     size: 128
    ~ });
    */    
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
    
    T5.EmptyTile = function(params) {
        var self = new T5.Tile(params);
        self.empty = true;
        
        return self;
    }; // T5.EmptyTile
    
    /**
    # T5.ImageTile
    _extends:_ T5.Tile
    
    
    The ImageTile adds some additional properties to the base so that a T5.ImageTileGrid knows where 
    to load the tile from.
    
    ## Constructor 
    `new T5.ImageTile(params);`
    
    ### Initialization Parameters
    
    - url (string) - the url of the image to load into the tile
    

    ## Example Usage
    ~ new T5.Tiling.ImageTile({
    ~     url: "http://testurl.com/exampleimage.png"
    ~ });
    */
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