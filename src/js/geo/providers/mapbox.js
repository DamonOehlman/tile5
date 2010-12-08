/**
@namespace
*/
T5.Geo.MapBox = (function() {
    // define the module
    var module = {
        /** @lends T5.Geo.Cloudmade */
        
        MapProvider: function(params) {
            params = T5.ex({
                dataset: 'world-glass',
                version: '1.0.0',
                tileBackgroundColor: '#333'
            }, params);
            
            var base = new T5.Geo.OpenStreetMap.MapProvider(T5.ex({
                flipY: true,
                
                getServerDetails: function() {
                    return {
                        baseUrl: COG.formatStr("http://{2}.tile.mapbox.com/{0}/{1}/", params.version, params.dataset, "{0}"),
                        subDomains: ['a', 'b', 'c', 'd']
                    };
                }
            }, params));
            
            var self = T5.ex(base, {
                getCopyright: function() {
                    return '<a href="http://mapbox.com/">MapBox</a> | Data CCBYSA OSM';
                }
            });
            
            // TODO: this needs to be set according to the tile dataset
            // self.setZoomRange(0, 11);
            
            return self;
        }
    };
    
    return module;
})();