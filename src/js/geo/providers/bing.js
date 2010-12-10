// BING Tiles: http://msdn.microsoft.com/en-us/library/bb259689.aspx
T5.Geo.Bing = (function() {
    var DEFAULT_COPYRIGHT = 
        'Copyright © Microsoft and its suppliers. All rights reserved. This API ' +
        'cannot be accessed and the content and any results may not be used, ' + 
        'reproduced or transmitted in any manner without express written permission ' + 
        'from Microsoft Corporation.';
    
    var imageUrls = {},
        logoUrl, 
        copyrightText,
        subDomains = [];
    
    // define the module
    var module = {
        /** @lends T5.Geo.Cloudmade */
        
        MapProvider: function(params) {
            params = T5.ex({
                drawGrid: false,
                apikey: null,
                tileDrawArgs: {},
                style: "Road" // ValidStyles = Road, Aerial, AerialWithLabels (http://msdn.microsoft.com/en-us/library/ff701716.aspx)
            }, params);
            
            // initialise parent
            var parent = new T5.Geo.MapProvider();
            
            function authenticate(callback) {
                var serverUrl = COG.formatStr("http://dev.virtualearth.net/REST/V1/Imagery/Metadata/{0}?key={1}", params.style, params.apikey);
                
                COG.jsonp(serverUrl, function(data) {
                    // FIXME: very hacky...
                    var resourceData = data.resourceSets[0].resources[0];
                    
                    imageUrls[params.style] = resourceData.imageUrl;
                    subDomains = resourceData.imageUrlSubdomains;
                    
                    logoUrl = data.brandLogoUri;
                    copyrightText = data.copyright;
                    
                    self.setZoomRange(resourceData.zoomMin + 1, resourceData.zoomMax);

                    T5.tileSize = resourceData.imageHeight;
                    
                    if (callback) {
                        callback();
                    } // if
                }, "jsonp");
            } // authenticate
            
            function buildGrid(tiler, position, callback) {
                // check and update the tiler tile size if required

                // firstly determine the tile offset of the specified position
                var tileOffset = calculateTileOffset(position, self.zoomLevel);
                
                // if the callback is defined, then build the tile grid
                if (callback) {
                    callback(buildTileGrid(tileOffset, tiler.getDimensions(), position));
                } // if
            } // buildGrid

            function buildTileGrid(tileOffset, containerDimensions, centerPos) {
                
                // quad function from example @ polymaps.org
                // http://polymaps.org/ex/bing.html
                function quad(column, row, zoom) {
                  var key = "";
                  for (var i = 1; i <= zoom; i++) {
                    key += (((row >> zoom - i) & 1) << 1) | ((column >> zoom - i) & 1);
                  }
                  return key;
                } // quad
                
                // initialise the first tile origin
                // TODO: think about whether to throw an error if not divisble
                var subdomainIdx = 0,
                    tileGrid = new T5.ImageTileGrid(self.prepTileGridArgs(
                        containerDimensions.width, 
                        containerDimensions.height,
                        T5.tileSize, 
                        tileOffset, 
                        params));
                
                // set the tile grid origin
                tileGrid.populate(function(col, row, topLeftOffset, gridSize) {
                    // initialise the image url
                    var quadKey = quad(topLeftOffset.x + col, topLeftOffset.y + row, self.zoomLevel),
                        tileUrl = imageUrls[params.style].replace("{quadkey}", quadKey);
                        
                    // if the subdomain index, has extended beyond the bounds of the available subdomains, reset to 0
                    if (subdomainIdx >= subDomains.length) {
                        subdomainIdx = 0;
                    } // if                     

                    return new T5.ImageTile({ 
                        url: tileUrl.replace("{subdomain}", subDomains[subdomainIdx])
                    });
                });

                // TODO: calculate the offset adjustment from the tile offset

                // wrap the tile grid in a geo tile grid
                var geoGrid = new T5.Geo.UI.GeoTileGrid({
                    grid: tileGrid, 
                    centerXY:  tileGrid.getTileVirtualXY(
                                    tileOffset.x, 
                                    tileOffset.y,
                                    true),
                    centerPos: calculatePositionFromTileOffset(tileOffset.x + 0.5, tileOffset.y + 0.5, self.zoomLevel),
                    radsPerPixel: module.radsPerPixelAtZoom(T5.tileSize, self.zoomLevel)
                });

                return geoGrid;
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
                
                return T5.XY.init(long2tile(T5.Geo.normalizeLon(position.lon), zoomLevel), lat2tile(position.lat, zoomLevel));
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
                
                return new T5.Geo.Position(tile2lat(y, zoomLevel), tile2long(x, zoomLevel));
            } // calculatePositionFromTileOffset

            // initialise self
            var self = T5.ex({}, parent, {
                getMapTiles: function(tiler, position, callback) {
                    // if the image url is empty, then get it
                    if (! imageUrls[params.style]) {
                        authenticate(function() {
                            buildGrid(tiler, position, callback);
                        });
                    }
                    else {
                        buildGrid(tiler, position, callback);
                    } // if..else
                },
                
                getCopyright: function() {
                    return copyrightText ? copyrightText : DEFAULT_COPYRIGHT;
                },
                
                getLogoUrl: function() {
                    return logoUrl;
                }
            });

            return self;
        },
        
        radsPerPixelAtZoom: function(tileSize, zoomLevel) {
            return 2*Math.PI / (tileSize << zoomLevel);
        }
    }; 
    
    // check the tile size, if not valid then correct to a valid tilesize
    if ((T5.tileSize !== 64) || (T5.tileSize !== 256)) {
        T5.tileSize = 256;
    } // if    
    
    return module;
})();

