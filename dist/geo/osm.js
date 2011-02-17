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
        params = COG.extend({
            flipY: false
        }, params);
        
        // initialise variables
        var serverDetails = null,
            subDomains = [];
        
        /* internal functions */
        
        /*
        Function:  calculateTileOffset
        This function calculates the tile offset for a mapping tile in the cloudmade API.  Code is adapted 
        from the pseudocode that can be found on the cloudemade site at the following location:

        http://developers.cloudmade.com/projects/tiles/examples/convert-coordinates-to-tile-numbers
        */
        function calculateTileOffset(position, zoomLevel) {
            var lon = position.lon % 360,
                lat = position.lat,
                numTiles = 2 << (zoomLevel - 1),
                tileX, tileY;
                
            tileX = Math.floor((lon+180) / 360 * numTiles) % numTiles;
            tileY = Math.floor((1-Math.log(Math.tan(lat*DEGREES_TO_RADIANS) + 1/Math.cos(lat*DEGREES_TO_RADIANS))/Math.PI)/2 * numTiles) % numTiles;
            
            while (tileX < 0) {
                tileX += numTiles;
            } // while
            
            while (tileY < 0) {
                tileY += numTiles;
            } // while
                
            return T5.XY.init(tileX, tileY);
        } // calculateTileOffset
        
        function calculatePosition(x, y, zoomLevel) {
            var zoomFactor = 2 << (zoomLevel - 1),
                n = Math.PI - 2*Math.PI * y / zoomFactor,
                lon = x / zoomFactor * 360 - 180,
                lat = RADIANS_TO_DEGREES * Math.atan(0.5*(Math.exp(n)-Math.exp(-n)));
            
            return T5.Geo.Position.init(lat, lon);
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
        
        function buildTileUrl(tileX, tileY, maxTileX, maxTileY, zoomLevel, flipY) {
            // determine the tile url
            var tileUrl = COG.formatStr("{0}/{1}/{2}.png",
                    zoomLevel,
                    tileX,
                    flipY ? Math.abs(tileY - maxTileY + 1) : tileY);

            // COG.info('getting url for tile x = ' + tileX + ', y = ' + tileY);
            if (serverDetails) {
                tileUrl = (subDomains.length ? 
                    COG.formatStr(serverDetails.baseUrl, subDomains[tileX % subDomains.length]) :
                    serverDetails.baseUrl) + tileUrl;
            } // if
            
            return tileUrl;
        } // buildTileUrl
        
        function initTileCreator(tileWidth, tileHeight, args, callback) {
            var zoomLevel = args.zoomLevel,
                position = args.position,
                tileOffset = calculateTileOffset(position, zoomLevel),
                baseXY = getBaseXY(position, zoomLevel, tileOffset),
                baseX = baseXY.x,
                baseY = baseXY.y,
                
                maxTileX = 2 << (zoomLevel - 1),
                maxTileY = Math.pow(2, zoomLevel),
                
                flipY = params.flipY,
                
                // initialise the tile creator
                creator = function(tileX, tileY) {
                    if (! tileOffset.x) {
                        return null;
                    } // if
                    
                    var realTileX = tileOffset.x + tileX,
                        realTileY = tileOffset.y + tileY,
                        tileUrl;
                        
                    // bring the real tile x into the appropriate range
                    realTileX = (realTileX % maxTileX);
                    realTileX = realTileX + (realTileX < 0 ? maxTileX : 0);

                    // build the tile url 
                    tileUrl = self.buildTileUrl(realTileX, realTileY, maxTileX, maxTileY, zoomLevel, flipY);
                    if (tileUrl) {
                        return T5.Tiling.init(
                            baseX + (tileX * tileWidth), 
                            baseY + (tileY * tileHeight),
                            tileWidth,
                            tileHeight, {
                                url: tileUrl
                            });
                    } // if
                }; // loader
                
            // initialise the server details
            serverDetails = self.getServerDetails ? self.getServerDetails() : null;
            subDomains = serverDetails ? serverDetails.subDomains : [];

            // if the callback is assigned, then pass back the creator
            if (callback) {
                callback(creator);
            } // if
        } // initTileLoader
        
        /* define the generator */

        // initialise the generator
        var self = COG.extend(new T5.MapTileGenerator(params), {
            buildTileUrl: buildTileUrl,
            getServerDetails: null,
            initTileCreator: initTileCreator
        });
        
        // trigger an attribution requirement
        T5.userMessage('ack', 'osm', 'Map data (c) <a href="http://openstreetmap.org/" target="_blank">OpenStreetMap</a> (and) contributors, CC-BY-SA');
        
        // bind to generator events
        
        return self;
    }; // OSMGenerator
    
    T5.Generator.register('osm.cloudmade', function(params) {
        params = COG.extend({
            apikey: null,
            styleid: 1
        }, params);
        
        T5.userMessage('ack', 'osm.mapquest', 'This product uses the <a href="http://cloudmade.com/" target="_blank">CloudMade</a> APIs, but is not endorsed or certified by CloudMade.');
        
        return COG.extend(new OSMGenerator(params), {
            getServerDetails: function() {
                return {
                    baseUrl: COG.formatStr(
                        'http://{3}.tile.cloudmade.com/{0}/{1}/{2}/',
                        params.apikey,
                        params.styleid,
                        T5.Tiling.tileSize, 
                        '{0}'),
                    subDomains: ['a', 'b', 'c']
                };
            }
        });
    });
    
    T5.Generator.register('osm.mapbox', function(params) {
        params = COG.extend({
            style: 'world-light',
            version: '1.0.0',
            flipY: true
        }, params);
        
        T5.userMessage('ack', 'osm.mapquest', 'Tiles Courtesy of <a href="http://mapbox.com/" target="_blank">MapBox</a>');
        
        return COG.extend(new OSMGenerator(params), {
            getServerDetails: function() {
                return {
                    baseUrl: COG.formatStr("http://{2}.tile.mapbox.com/{0}/{1}/", params.version, params.style, "{0}"),
                    subDomains: ['a', 'b', 'c', 'd']
                };
            }
        });
    });
    
    T5.Generator.register('osm.mapquest', function(params) {
        T5.userMessage('ack', 'osm.mapquest', 'Tiles Courtesy of <a href="http://open.mapquest.co.uk/" target="_blank">MapQuest</a>');
        
        return COG.extend(new OSMGenerator(params), {
            getServerDetails: function() {
                return {
                    baseUrl: 'http://otile{0}.mqcdn.com/tiles/1.0.0/osm/',
                    subDomains: ['1', '2', '3', '4']
                };
            }
        });
    });
    
    // register the open street map style generators
    T5.Generator.register('osm.local', OSMGenerator);
    
    /* define module */
    
    var module = {
        Generator: OSMGenerator
    };

    return module;
})();