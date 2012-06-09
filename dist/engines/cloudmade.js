T5.Registry.register('generator', 'osm.cloudmade', function(view, params) {
    var urlFormatter;
    
    // ensure we have parameters
    params = params || {};
    
    // initialise the apikey and style
    params.apikey = params.apikey || null;
    params.styleid = params.styleid || 1;
    
    urlFormatter = formatter('http://{{3}}.tile.cloudmade.com/{{0}}/{{1}}/{{2}}/');
    view.addCopy('This product uses the <a href="http://cloudmade.com/" target="_blank">CloudMade</a> APIs, but is not endorsed or certified by CloudMade.');
    
    return cog.extend(T5.Registry.create('generator', 'osm', view, params), {
        getServerDetails: function() {
            return {
                baseUrl: urlFormatter(params.apikey, params.styleid, 256, '{{0}}'),
                subDomains: ['a', 'b', 'c']
            };
        }
    });
});