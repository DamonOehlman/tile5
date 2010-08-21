/**
@namespace
*/
TILE5.Geo.Cloudmade = (function() {
    // define some constants
    var ZOOMLEVEL_MIN = 3;
    var ZOOMLEVEL_MAX = 17;
    
    // check the tile size, if not valid then correct to a valid tilesize
    if ((TILE5.Tiling.Config.TILESIZE !== 64) || (TILE5.Tiling.Config.TILESIZE !== 256)) {
        TILE5.Tiling.Config.TILESIZE = 256;
    } // if    
    
    // define the module
    var module = {
        /** @lends TILE5.Geo.Cloudmade */
        
        MapProvider: function(params) {
            params = GRUNT.extend({
                apikey: "",
                styleid: 1
            }, params);
            
            return new TILE5.Geo.OpenStreetMap.MapProvider(GRUNT.extend({
                getServerDetails: function() {
                    return {
                        baseUrl: String.format("http://{3}.tile.cloudmade.com/{0}/{1}/{2}/", params.apikey, params.styleid, TILE5.Tiling.Config.TILESIZE, "{0}"),
                        subDomains: ['a', 'b', 'c']
                    };
                }
            }, params));
        }
    };
    
    return module;
})();