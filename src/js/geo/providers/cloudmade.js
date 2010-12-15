/**
@namespace
*/
T5.Geo.Cloudmade = (function() {
    // define the module
    var module = {
        /** @lends T5.Geo.Cloudmade */
        
        MapProvider: function(params) {
            params = T5.ex({
                apikey: "",
                styleid: 1
            }, params);
            
            var base = new T5.Geo.OpenStreetMap.MapProvider(T5.ex({
                getServerDetails: function() {
                    return {
                        baseUrl: COG.formatStr("http://{3}.tile.cloudmade.com/{0}/{1}/{2}/", params.apikey, params.styleid, T5.Tiling.tileSize, "{0}"),
                        subDomains: ['a', 'b', 'c']
                    };
                }
            }, params));
            
            return T5.ex(base, {
                getCopyright: function() {
                    return "This product uses the CloudMade APIs, but is not endorsed or certified by CloudMade.";
                }
            });
        }
    };
    
    return module;
})();