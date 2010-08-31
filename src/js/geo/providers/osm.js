/**
@namespace
*/
TILE5.Geo.OpenStreetMap = (function() {
    // define some constants
    var ZOOMLEVEL_MIN = 2;
    var ZOOMLEVEL_MAX = 17;
    
    // define the module
    var module = {
        /** @lends TILE5.Geo.Cloudmade */
        
        MapProvider: function(params) {
            params = GRUNT.extend({
                drawGrid: false,
                urlFiller: null,
                getServerDetails: function() {
                    return {
                        baseUrl: TILE5.Resources.getPath("tiles/"),
                        subDomains: null
                    };
                }
            }, params);
            
            // initialise parent
            var parent = new TILE5.Geo.MapProvider();

            function buildTileGrid(tile_offset, container_dimensions, centerPos) {
                // initialise the first tile origin
                // TODO: think about whether to throw an error if not divisble
                var subdomain_idx = 0,
                    serverDetails = params.getServerDetails ? params.getServerDetails() : null,
                    subDomains = serverDetails ? serverDetails.subDomains : null;
                    
                // get the server details
                if (params.getServerDetails) {
                    
                } // if

                tile_grid = new TILE5.Tiling.ImageTileGrid({
                    tileSize: TILE5.Tiling.Config.TILESIZE,
                    width: container_dimensions.width,
                    height: container_dimensions.height,
                    center: tile_offset,
                    drawGrid: params.drawGrid
                });

                // set the tile grid origin
                tile_grid.populate(function(col, row, topLeftOffset, gridSize) {
                    var tileUrl = "";
                    
                    // initialise the image url
                    if (! params.urlFiller) {
                        tileUrl = (serverDetails ? serverDetails.baseUrl : "") + 
                            String.format("{0}/{1}/{2}.png",
                                self.zoomLevel,
                                topLeftOffset.x + col,
                                topLeftOffset.y + row);
                    }
                    else {
                        tileUrl = params.urlFiller(self.zoomLevel, topLeftOffset.x + col, topLeftOffset.y + row);
                    } // if..else
                            
                    // check to see if the url scheme has been provided
                    var schemeProvided = /^.*?\:\/\//.test(tileUrl);
                        
                    if (subDomains) {
                        // if the subdomain index, has extended beyond the bounds of the available subdomains, reset to 0
                        if (subdomain_idx >= subDomains.length) {
                            subdomain_idx = 0;
                        } // if                     

                        return TILE5.Tiling.ImageTile({ 
                            url: String.format(tileUrl, subDomains[subdomain_idx++])
                        });
                    }
                    else {
                        return TILE5.Tiling.ImageTile({ 
                            url: tileUrl
                        });
                    } // if..else
                });

                // TODO: calculate the offset adjustment from the tile offset

                // wrap the tile grid in a geo tile grid
                tile_grid = new TILE5.Geo.UI.GeoTileGrid({
                    grid: tile_grid, 
                    centerXY:  tile_grid.getTileVirtualXY(
                                    tile_offset.x, 
                                    tile_offset.y,
                                    true),
                    centerPos: calculatePositionFromTileOffset(tile_offset.x + 0.5, tile_offset.y + 0.5, self.zoomLevel),
                    // NOTE: zoom level is similar to decarta GX zoom level but 1 less...
                    // TODO: implement some kind of universal zoom level... there probably is one already... 
                    radsPerPixel: module.radsPerPixelAtZoom(TILE5.Tiling.Config.TILESIZE, self.zoomLevel)
                });

                return tile_grid;
            } // buildTileGrid

            /*
            Function:  calculateTileOffset
            This function calculates the tile offset for a mapping tile in the cloudmade API.  Code is adapted 
            from the pseudocode that can be found on the cloudemade site at the following location:

            http://developers.cloudmade.com/projects/tiles/examples/convert-coordinates-to-tile-numbers
            */
            function calculateTileOffset(position, zoomLevel) {
                // functions from the open street map wiki
                // http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
                function long2tile(lon,zoom) { return (Math.floor((lon+180)/360*Math.pow(2,zoom))); }
                function lat2tile(lat,zoom)  { return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); }
                
                return new TILE5.Vector(long2tile(TILE5.Geo.Utilities.normalizeLon(position.lon), zoomLevel), lat2tile(position.lat, zoomLevel));
            } // calculateTileOffset
            
            function calculatePositionFromTileOffset(x, y, zoomLevel) {
                // functions from the open street map wiki
                // http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
                
                function tile2long(x,z) {
                  return (x/Math.pow(2,z)*360-180);
                }
                 
                function tile2lat(y,z) {
                  var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
                  return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
                }
                
                return new TILE5.Geo.Position(tile2lat(y, zoomLevel), tile2long(x, zoomLevel));
            } // calculatePositionFromTileOffset

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
            
            // set the default zoom range
            self.setZoomRange(ZOOMLEVEL_MIN, ZOOMLEVEL_MAX);
            
            // check the tile size, if not valid then correct to a valid tilesize
            if (TILE5.Tiling.Config.TILESIZE !== 256) {
                TILE5.Tiling.Config.TILESIZE = 256;
            } // if    

            return self;
        },
        
        radsPerPixelAtZoom: function(tileSize, zoomLevel) {
            return 2*Math.PI / (tileSize << zoomLevel);
        }
    }; 
    
    return module;
})();

