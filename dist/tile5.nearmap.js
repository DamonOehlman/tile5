T5.Geo.NearMap = (function() {
    // define the module
    var module = {
        /** @lends T5.Geo.Cloudmade */
        
        MapProvider: function(params) {
            params = T5.ex({
                dataset: 20091031
            }, params);
            
            var base = new T5.Geo.OpenStreetMap.MapProvider(T5.ex({
                urlFiller: function(z, x, y) {
                    return COG.formatStr("http://www.nearmap.com/maps/nml=Vert&zxy={0},{1},{2}&nmd={3}", z, x, y, params.dataset);
                }
            }, params));
            
            return T5.ex(base, {
                getCopyright: function() {
                    return "&copy; <a href='http://nearmap.com/' target='_blank'>nearmap</a> 2010";
                }
            });
        }
    };
    
    return module;
})();