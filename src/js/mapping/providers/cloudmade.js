/*
File:  slick.mapping.cloudmade.js
This file is used to define a MapProvider for the cloudmade HTTP Tile API, documentation
about that API can be found @ http://developers.cloudmade.com/projects/show/tiles.

Section:  Version History
02/06/2010 (DJO) - Created File
*/

// define the cloudmade namespace
SLICK.Geo.Cloudmade = (function() {
    // define the module
    var module = {
        MapProvider: function(params) {
            // initialise constants
            var CLOUDMADE_SUBDOMAINS = ['a', 'b', 'c'];
            var CLOUDMADE_TILEURL = "tile.cloudmade.com/{0}/{1}/{2}/{3}/{4}/{5}.png";

            // initialise variables
            var config = GRUNT.extend({
                apikey: "",
                styleid: 1
            }, params);

            // initialise parent
            var parent = new SLICK.Geo.MapProvider();

            function buildTileGrid(tile_offset, container_dimensions, centerPos) {
                // initialise the first tile origin
                // TODO: think about whether to throw an error if not divisble
                var subdomain_idx = 0;

                tile_grid = new SLICK.Graphics.TileGrid({
                    tileSize: SLICK.TilerConfig.TILESIZE,
                    emptyTile: new SLICK.Graphics.EmptyGridTile({
                        tileSize: SLICK.TilerConfig.TILESIZE
                    }),
                    center: tile_offset
                });

                // set the tile grid origin
                tile_grid.populate(function(col, row, topLeftOffset, gridSize) {
                    // initialise the image url
                    var tile_url = String.format(CLOUDMADE_TILEURL,
                        config.apikey,
                        config.styleid,
                        SLICK.TilerConfig.TILESIZE,
                        self.zoomLevel,
                        topLeftOffset.x + col,
                        topLeftOffset.y + row);       

                    // if the subdomain index, has extended beyond the bounds of the available subdomains, reset to 0
                    if (subdomain_idx >= CLOUDMADE_SUBDOMAINS.length) {
                        subdomain_idx = 0;
                    } // if                     

                    return SLICK.Graphics.ImageTile({ 
                        url: String.format("http://{0}.{1}", CLOUDMADE_SUBDOMAINS[subdomain_idx++], tile_url),
                        sessionParamRegex: /(SESSIONID)/i 
                    });
                });

                // TODO: calculate the offset adjustment from the tile offset

                // wrap the tile grid in a geo tile grid
                tile_grid = new SLICK.Mapping.GeoTileGrid({
                    grid: tile_grid, 
                    centerXY:  tile_grid.getTileVirtualXY(
                                    tile_offset.x, 
                                    tile_offset.y,
                                    true),
                    centerPos: centerPos,
                    offsetAdjustment: new SLICK.Vector(0, SLICK.TilerConfig.TILESIZE),
                    // NOTE: zoom level is similar to decarta GX zoom level but 1 less...
                    // TODO: implement some kind of universal zoom level... there probably is one already... 
                    radsPerPixel: SLICK.Geo.Decarta.Utilities.radsPerPixelAtZoom(SLICK.TilerConfig.TILESIZE, self.zoomLevel - 1)
                });

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


            // initialise self
            var self = GRUNT.extend({}, parent, {
                getMapTiles: function(tiler, position, callback) {
                    // check and update the tiler tile size if required

                    // firstly determine the tile offset of the specified position
                    tile_offset = calculateTileOffset(position, self.zoomLevel);

                    // if the callback is defined, then build the tile grid
                    if (callback) {
                        callback(buildTileGrid(tile_offset, tiler.getDimensions(), position));
                    } // if
                }
            });

            return self;
        }
    }; 
    
    // check the tile size, if not valid then correct to a valid tilesize
    if ((SLICK.TilerConfig.TILESIZE !== 64) || (SLICK.TilerConfig.TILESIZE !== 256)) {
        SLICK.TilerConfig.TILESIZE = 256;
    } // if    
    
    return module;
})();