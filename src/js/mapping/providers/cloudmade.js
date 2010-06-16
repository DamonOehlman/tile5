/*
File:  slick.mapping.cloudmade.js
This file is used to define a MapProvider for the cloudmade HTTP Tile API, documentation
about that API can be found @ http://developers.cloudmade.com/projects/show/tiles.

Section:  Version History
02/06/2010 (DJO) - Created File
*/

// define the cloudmade namespace
GEO.CLOUDMADE = {};

// tweak the geo position object to include a to tile coords parameter

GEO.CLOUDMADE.MapProvider = function(params) {
    // initialise constants
    var CLOUDMADE_SUBDOMAINS = ['a', 'b', 'c'];
    var CLOUDMADE_TILEURL = "tile.cloudmade.com/{0}/{1}/{2}/{3}/{4}/{5}.png";
    
    // initialise variables
    var config = jQuery.extend({
        apikey: "",
        styleid: 1
    }, params);
    
    var loaded_images = {};
    var current_zoom_level = 10;
    
    // initialise parent
    var parent = new GEO.MapProvider();
    
    function buildTileGrid(tile_offset, container_dimensions, zoom_level) {
        // initialise the first tile origin
        // TODO: think about whether to throw an error if not divisble
        var half_width = Math.round(SLICK.TilerConfig.TILESIZE * 0.5);
        var pos_first = {
            x: container_dimensions.center.x - half_width,
            y: container_dimensions.center.y - half_width
        }; 
        
        // update the current zoom level
        current_zoom_level = zoom_level;
        
        // create the tile grid
        tile_grid = new SLICK.MapTileGrid({
            width: container_dimensions.width, 
            height: container_dimensions.height, 
            tilesize: SLICK.TilerConfig.TILESIZE,
            onNeedTiles: function(offset_delta) {
                // if the tile grid is defined, then we know the base_n and e
                if (tile_grid) {
                    SLICK.Logger.info(String.format("offset delta = {0} rows, {1} cols", offset_delta.rows, offset_delta.cols));
                    SLICK.Logger.info(String.format("top tile was: x = {0}, y = {1}", tile_grid.customdata.top_x, tile_grid.customdata.top_y));
                    tile_grid.customdata.top_x -= offset_delta.cols;
                    tile_grid.customdata.top_y -= offset_delta.rows;
                    SLICK.Logger.info(String.format("top tile is:  x = {0}, y = {1}", tile_grid.customdata.top_x, tile_grid.customdata.top_y));
                } // if

                populateTiles(current_zoom_level);
            }
        });
        
        // associate some custom data with the tile grid (gotta love javascript)
        tile_grid.customdata = {
            top_x: tile_offset.x - tile_grid.centerTile.row,
            top_y: tile_offset.y - tile_grid.centerTile.col
        }; // customdata
        
        // write a whole pile of log messages
        SLICK.Logger.info(String.format("building a tile grid for container {0} x {1}", container_dimensions.width, container_dimensions.height));
        SLICK.Logger.info(String.format("center point = x: {0}, y: {1}", container_dimensions.center.x, container_dimensions.center.y));
        SLICK.Logger.info(String.format("tile size {0} x {0}", SLICK.TilerConfig.TILESIZE));
        SLICK.Logger.info(String.format("first tile x: {0}, y: {0}", pos_first.x, pos_first.y));
        SLICK.Logger.info(String.format("tile grid = {0} columns wide and {1} rows high", tile_grid.columns, tile_grid.rows));
        SLICK.Logger.info(String.format("center tile col = {0}, row = {1}", tile_grid.centerTile.col, tile_grid.centerTile.row));
        SLICK.Logger.info(String.format("top tile = X:{0} Y:{1}", tile_grid.customdata.top_x, tile_grid.customdata.top_y));
        
        populateTiles(current_zoom_level);
        
        return tile_grid;
    } // buildTileGrid
    
    /*
    Function:  calculateTileOffset
    This function calculates the tile offset for a mapping tile in the cloudmade API.  Code is adapted 
    from the pseudocode that can be found on the cloudemade site at the following location:
    
    http://developers.cloudmade.com/projects/tiles/examples/convert-coordinates-to-tile-numbers
    */
    function calculateTileOffset(position, zoom_level) {
        // determine the n factor (TODO: find out what n is)
        var n = Math.pow(2, zoom_level);
        var x_tile = ((position.lon + 180) / 360) * n;
        var y_tile = (1 - (Math.log(Math.tan(position.lat.toRad()) + position.lat.toRad().sec()) / Math.PI)) / 2 * n;
        
        return new SLICK.Vector(Math.floor(x_tile), Math.floor(y_tile));
    } // calculateTileOffset
    
    function populateTiles(zoom_level) {
        // initiliase variables
        var subdomain_idx = 0;
        
        if (! tile_grid) {
            SLICK.Logger.warn("No tile grid to populate");
            return;
        }
        
        // load the tiles
        for (var xx = 0; xx < tile_grid.columns; xx++) {
            for (var yy = 0; yy < tile_grid.rows; yy++) {
                // initialise the image url
                var tile_url = String.format(CLOUDMADE_TILEURL,
                    config.apikey,
                    config.styleid,
                    SLICK.TilerConfig.TILESIZE,
                    zoom_level,
                    tile_grid.customdata.top_x + xx,
                    tile_grid.customdata.top_y + yy);
                    
                // get the image for that tile
                var tile_image = loaded_images[tile_url];
                
                // if the tile is not available, then create it
                if (! tile_image) {
                    // initialise tile image 
                    tile_image = new Image();

                    // set the image source
                    tile_image.src = String.format("http://{0}.{1}", CLOUDMADE_SUBDOMAINS[subdomain_idx++], tile_url);
                    SLICK.Logger.info("requesting tile: " + tile_image.src);
                    
                    // add the tile to the loaded images array
                    loaded_images[tile_url] = tile_image;
                } // if
                
                // set the tile in the grid
                tile_grid.setTile(xx, yy, tile_image);
                
                // if the subdomain index, has extended beyond the bounds of the available subdomains, reset to 0
                if (subdomain_idx >= CLOUDMADE_SUBDOMAINS.length) {
                    subdomain_idx = 0;
                } // if
            } // for
        } // for
    } // populateTiles
    
    
    // initialise self
    var self = jQuery.extend({}, parent, {
        getMapTiles: function(tiler, position, zoom_level, callback) {
            // check and update the tiler tile size if required
            
            // firstly determine the tile offset of the specified position
            tile_offset = calculateTileOffset(position, zoom_level);
            
            // if the callback is defined, then build the tile grid
            if (callback) {
                callback(buildTileGrid(tile_offset, tiler.getDimensions(), zoom_level));
            } // if
        }
    });
    
    return self;
}; // DecartaDataProvider

// check the tile size, if not valid then correct to a valid tilesize
if ((SLICK.TilerConfig.TILESIZE !== 64) || (SLICK.TilerConfig.TILESIZE !== 256)) {
    SLICK.TilerConfig.TILESIZE = 256;
} // if
