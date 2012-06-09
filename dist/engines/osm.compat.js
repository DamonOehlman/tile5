/**
# GENERATOR: osm.mapbox
__plugin:__ `engines/osm.compat.js`
*/
T5.Registry.register('generator', 'osm.mapbox', function(view, params) {
    params = T5.ex({
        style: 'world-light',
        version: '1.0.0',
        flipY: true
    }, params);
    
    var urlFormatter = T5.formatter('http://{2}.tile.mapbox.com/{0}/{1}/');
    view.addCopy('Tiles Courtesy of <a href="http://mapbox.com/" target="_blank">MapBox</a>');
    
    return T5.ex(T5.Registry.create('generator', 'osm', view, params), {
        getServerDetails: function() {
            return {
                baseUrl: urlFormatter(params.version, params.style, "{0}"),
                subDomains: ['a', 'b', 'c', 'd']
            };
        }
    });
});

/**
# GENERATOR: osm.mapquest
__plugin:__ `engines/osm.mapquest.js`
*/
T5.Generator.register('osm.mapquest', function(view, params) {
    view.addCopy('Tiles Courtesy of <a href="http://open.mapquest.co.uk/" target="_blank">MapQuest</a>');
    
    return T5.ex(T5.Registry.create('generator', 'osm', view, params), {
        getServerDetails: function() {
            return {
                baseUrl: 'http://otile{0}.mqcdn.com/tiles/1.0.0/osm/',
                subDomains: ['1', '2', '3', '4']
            };
        }
    });
});