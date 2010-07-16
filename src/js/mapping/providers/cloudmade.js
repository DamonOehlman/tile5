/**
@namespace
*/
SLICK.Geo.Cloudmade = (function() {
    // define some constants
    var ZOOMLEVEL_MIN = 3;
    var ZOOMLEVEL_MAX = 17;
    
    // check the tile size, if not valid then correct to a valid tilesize
    if ((SLICK.Tiling.Config.TILESIZE !== 64) || (SLICK.Tiling.Config.TILESIZE !== 256)) {
        SLICK.Tiling.Config.TILESIZE = 256;
    } // if    
    
    // define the module
    var module = {
        /** @lends SLICK.Geo.Cloudmade */
        
        MapProvider: function(params) {
            params = GRUNT.extend({
                apikey: "",
                styleid: 1
            }, params);
            
            return new SLICK.Geo.OpenStreetMap.MapProvider(GRUNT.extend({
                getServerDetails: function() {
                    return {
                        baseUrl: String.format("tile.cloudmade.com/{0}/{1}/{2}/", params.apikey, params.styleid, SLICK.Tiling.Config.TILESIZE),
                        subDomains: ['a', 'b', 'c']
                    };
                }
            }, params));
        }
    };
    
    return module;
})();