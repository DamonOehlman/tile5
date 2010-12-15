/**
@namespace
*/
T5.Geo.OpenStreetMap = (function() {
    // define some constants
    var ZOOMLEVEL_MIN = 1,
        ZOOMLEVEL_MAX = 17,
        DEGREES_TO_RADIANS = Math.PI / 180,
        RADIANS_TO_DEGREES = 180 / Math.PI;
    
    // define the module
    var module = {
        /** @lends T5.Geo.Cloudmade */
        
        MapProvider: function(params) {
            params = T5.ex({
                drawGrid: false,
                flipY: false,
                urlFiller: null,
                getServerDetails: function() {
                    return {
                        baseUrl: T5.Resources.getPath("tiles/"),
                        subDomains: null
                    };
                }
            }, params);
            
            // initialise parent
            var parent = new T5.Geo.MapProvider(),
                flipY = params.flipY;

            function buildTileGrid(tileOffset, dimensions, centerPos) {
                // initialise the first tile origin
                // TODO: think about whether to throw an error if not divisble
                var subdomain_idx = 0,
                    serverDetails = params.getServerDetails ? params.getServerDetails() : null,
                    subDomains = serverDetails ? serverDetails.subDomains : null,
                    maxTileX = 2 << (self.zoomLevel - 1),
                    tileGrid;
                    
                // get the server details
                if (params.getServerDetails) {
                    
                } // if

                // create the tile grid
                tileGrid = new T5.ImageTileGrid(self.prepTileGridArgs(
                    dimensions.width, 
                    dimensions.height,
                    T5.Tiling.tileSize, 
                    tileOffset, 
                    params)); 

                // set the tile grid origin
                tileGrid.populate(function(col, row, topLeftOffset, gridSize) {
                    var tileUrl = "";
                    
                    // initialise the image url
                    if (! params.urlFiller) {
                        var tileX = topLeftOffset.x + col;
                        
                        /* get the x position in range if it isn't already */
                        
                        while (tileX < 0) {
                            tileX = tileX + maxTileX;
                        } // while
                        
                        while (tileX >= maxTileX) {
                            tileX = tileX - maxTileX;
                        } // while

                        /* determine the tile url */
                        
                        tileUrl = (serverDetails ? serverDetails.baseUrl : "") + 
                            COG.formatStr("{0}/{1}/{2}.png",
                                self.zoomLevel,
                                tileX,
                                flipY ? Math.abs(topLeftOffset.y + row - (Math.pow(2,self.zoomLevel) - 1)) : topLeftOffset.y + row);
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

                        return new T5.ImageTile({ 
                            url: COG.formatStr(tileUrl, subDomains[subdomain_idx++])
                        });
                    }
                    else {
                        return new T5.ImageTile({ 
                            url: tileUrl
                        });
                    } // if..else
                });

                // TODO: calculate the offset adjustment from the tile offset

                // wrap the tile grid in a geo tile grid
                tileGrid = new T5.Geo.UI.GeoTileGrid({
                    grid: tileGrid, 
                    centerXY:  tileGrid.getTileVirtualXY(
                                    tileOffset.x, 
                                    tileOffset.y,
                                    true),
                    centerPos: calculatePositionFromTileOffset(tileOffset.x + 0.5, tileOffset.y + 0.5, self.zoomLevel),
                    // NOTE: zoom level is similar to decarta GX zoom level but 1 less...
                    // TODO: implement some kind of universal zoom level... there probably is one already... 
                    radsPerPixel: module.radsPerPixelAtZoom(T5.Tiling.tileSize, self.zoomLevel)
                });

                return tileGrid;
            } // buildTileGrid

            /*
            Function:  calculateTileOffset
            This function calculates the tile offset for a mapping tile in the cloudmade API.  Code is adapted 
            from the pseudocode that can be found on the cloudemade site at the following location:

            http://developers.cloudmade.com/projects/tiles/examples/convert-coordinates-to-tile-numbers
            */
            function calculateTileOffset(position, zoomLevel) {
                var lon = T5.Geo.normalizeLon(position.lon),
                    lat = position.lat,
                    zoomFactor = 2 << (zoomLevel - 1),
                    tileX, tileY;
                    
                tileX = ~~((lon+180) / 360 * zoomFactor);
                tileY = ~~((1-Math.log(Math.tan(lat*DEGREES_TO_RADIANS) + 1/Math.cos(lat*DEGREES_TO_RADIANS))/Math.PI)/2 * zoomFactor);
                    
                COG.Log.info('getting tile offset for lon: ' + lon + ', x = ' + tileX);
                return T5.XY.init(tileX, tileY);
            } // calculateTileOffset
            
            function calculatePositionFromTileOffset(x, y, zoomLevel) {
                var zoomFactor = 2 << (zoomLevel - 1),
                    n = Math.PI - 2*Math.PI * y / zoomFactor,
                    lon = x / zoomFactor * 360 - 180,
                    lat = RADIANS_TO_DEGREES * Math.atan(0.5*(Math.exp(n)-Math.exp(-n)));
                
                return new T5.Geo.Position(lat, lon);
            } // calculatePositionFromTileOffset

            // initialise self
            var self = T5.ex({}, parent, {
                getMapTiles: function(tiler, position, callback) {
                    // check and update the tiler tile size if required

                    // firstly determine the tile offset of the specified position
                    var tileOffset = calculateTileOffset(position, self.zoomLevel);
                    
                    // if the callback is defined, then build the tile grid
                    if (callback) {
                        callback(buildTileGrid(tileOffset, tiler.getDimensions(), position));
                    } // if
                }
            });
            
            // set the default zoom range
            self.setZoomRange(ZOOMLEVEL_MIN, ZOOMLEVEL_MAX);
            
            // check the tile size, if not valid then correct to a valid tilesize
            if (T5.Tiling.tileSize !== 256) {
                T5.Tiling.tileSize = 256;
            } // if    

            return self;
        },
        
        radsPerPixelAtZoom: function(tileSize, zoomLevel) {
            return 2*Math.PI / (tileSize << zoomLevel);
        }
    }; 
    
    return module;
})();

