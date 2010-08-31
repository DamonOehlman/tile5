/**
@namespace
*/
TILE5.Geo.Cloudmade = (function() {
    // define the module
    var module = {
        /** @lends TILE5.Geo.Cloudmade */
        
        MapProvider: function(params) {
            params = GRUNT.extend({
                apikey: "",
                styleid: 1
            }, params);
            
            var base = new TILE5.Geo.OpenStreetMap.MapProvider(GRUNT.extend({
                getServerDetails: function() {
                    return {
                        baseUrl: String.format("http://{3}.tile.cloudmade.com/{0}/{1}/{2}/", params.apikey, params.styleid, TILE5.Tiling.Config.TILESIZE, "{0}"),
                        subDomains: ['a', 'b', 'c']
                    };
                }
            }, params));
            
            return GRUNT.extend(base, {
                getCopyright: function() {
                    return "This product uses the CloudMade APIs, but is not endorsed or certified by CloudMade.";
                }
            });
        }
    };
    
    return module;
})();