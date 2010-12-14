/**
# T5.Geo.OSM
*/
T5.Geo.OSM = (function() {
    
    // initialise constants
    var DEGREES_TO_RADIANS = Math.PI / 180,
        RADIANS_TO_DEGREES = 180 / Math.PI;
    
    /* define generators */
    
    /**
    # T5.Geo.OSM.Generator
    
    ## Functions
    */
    var OSMGenerator = function(params) {
        params = T5.ex({
            
        }, params);
        
        /* internal functions */
        
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
                
            return T5.XY.init(tileX, tileY);
        } // calculateTileOffset
        
        function calculatePosition(x, y, zoomLevel) {
            var zoomFactor = 2 << (zoomLevel - 1),
                n = Math.PI - 2*Math.PI * y / zoomFactor,
                lon = x / zoomFactor * 360 - 180,
                lat = RADIANS_TO_DEGREES * Math.atan(0.5*(Math.exp(n)-Math.exp(-n)));
            
            return new T5.Geo.Position(lat, lon);
        } // calculatePosition
        
        function getBaseXY(position, zoomLevel) {
            var radsPerPixel = T5.Geo.radsPerPixel(zoomLevel),
                tileOffset = calculateTileOffset(position, zoomLevel),
                tilePosition = calculatePosition(tileOffset.x, tileOffset.y, zoomLevel),
                baseXY = T5.GeoXY.init(position, radsPerPixel),
                tileXY = T5.GeoXY.init(tilePosition, radsPerPixel);
                
            return T5.XY.init(
                        baseXY.x + (tileXY.x - baseXY.x), 
                        baseXY.y + (tileXY.y - baseXY.y));
        } // getBaseXY
        
        /* exports */
        
        function initTileCreator(position, zoomLevel, tileWidth, tileHeight, callback) {
            var serverDetails = self.getServerDetails ? self.getServerDetails() : null,
                subDomains = serverDetails ? serverDetails.subDomains : [],
                tileOffset = calculateTileOffset(position, zoomLevel),
                baseXY = getBaseXY(position, zoomLevel, tileOffset),
                baseX = baseXY.x,
                baseY = baseXY.y,
                
                maxTileX = 2 << (zoomLevel - 1),
                
                flipY = false,
                
                // initialise the tile creator
                creator = function(tileX, tileY) {
                    if (! tileOffset.x) {
                        return null;
                    } // if
                    
                    var realTileX = tileOffset.x + tileX,
                        baseUrl = '', 
                        tileUrl;
                        
                    // keep the actual tile x above 0
                    while (realTileX < 0) {
                        realTileX = realTileX + maxTileX;
                    } // while

                    // keep the actual tile x within the range for this zoom level
                    while (realTileX >= maxTileX) {
                        realTileX = realTileX - maxTileX;
                    } // while

                    // determine the tile url
                    tileUrl = COG.formatStr("{0}/{1}/{2}.png",
                        zoomLevel,
                        realTileX,
                        flipY ? Math.abs(tileOffset.y + tileY - Math.pow(2,zoomLevel)) : tileOffset.y + tileY);
                    
                    // COG.Log.info('getting url for tile x = ' + tileX + ', y = ' + tileY);
                    if (serverDetails) {
                        baseUrl = subDomains.length ? 
                            COG.formatStr(serverDetails.baseUrl, subDomains[realTileX % subDomains.length]) :
                            serverDetails.baseUrl;
                    } // if
                    
                    return {
                        url: baseUrl + tileUrl,
                        x: baseX + (tileX * tileWidth),
                        y: baseY + (tileY * tileHeight),
                        width: tileWidth,
                        height: tileHeight
                    };
                }; // loader

            // if the callback is assigned, then pass back the creator
            if (callback) {
                callback(creator);
            } // if
        } // initTileLoader
        
        /* define the generator */

        // initialise the generator
        var self = T5.ex(new T5.MapTileGenerator(params), {
            getServerDetails: null,
            initTileCreator: initTileCreator
        });
        
        // bind to generator events
        
        return self;
    }; // OSMGenerator
    
    var CloudmadeGenerator = function(params) {
        params = T5.ex({
            apikey: null,
            styleid: 1
        }, params);
        
        return T5.ex(new OSMGenerator(params), {
            getServerDetails: function() {
                return {
                    baseUrl: COG.formatStr(
                        'http://{3}.tile.cloudmade.com/{0}/{1}/{2}/',
                        params.apikey,
                        params.styleid,
                        T5.tileSize, 
                        '{0}'),
                    subDomains: ['a', 'b', 'c']
                };
            }
        });
    }; // CloudmadeGenerator
    
    T5.Generator.register('osm.cloudmade', CloudmadeGenerator);
    
    /* define module */
    
    var module = {
        CloudmadeGenerator: CloudmadeGenerator
    };

    return module;
})();