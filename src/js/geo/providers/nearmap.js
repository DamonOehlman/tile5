T5.Geo.NearMap = (function() {
    // define the module
    var module = {
        /** @lends T5.Geo.Cloudmade */
        
        MapProvider: function(params) {
            params = GRUNT.extend({
                dataset: 20091031
            }, params);
            
            var base = new T5.Geo.OpenStreetMap.MapProvider(GRUNT.extend({
                urlFiller: function(z, x, y) {
                    return String.format("http://www.nearmap.com/maps/nml=Vert&zxy={0},{1},{2}&nmd={3}", z, x, y, params.dataset);
                }
            }, params));
            
            return GRUNT.extend(base, {
                getCopyright: function() {
                    return "&copy; <a href='http://nearmap.com/' target='_blank'>nearmap</a> 2010";
                }
            });
        }
    };
    
    return module;
})();