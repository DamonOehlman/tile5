function Tile(x, y, url, width, height) {
    this.x = x;
    this.y = y;
    this.w = width || 256;
    this.h = width || 256;
    
    // calculate the max x and y
    this.x2 = this.x + this.w;
    this.y2 = this.y + this.h;

    // initialise the url
    this.url = url;
    
    // initialise the tile id
    this.id = this.x + '_' + this.y;
    
    // derived properties
    this.loaded = false;
    this.image = null;
};

Tile.prototype = {
    constructor: Tile,
    
    load: function(callback) {
        // take a reference to the tile
        var tile = this;
        
        // get the image
        getImage(this.url, function(image, loaded) {
            // flag the tile as loaded and save the image to a member var
            tile.loaded = true;
            tile.image = image;
            
            if (callback) {
                callback();
            } // if
        });
    }
};