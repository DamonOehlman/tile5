T5.Generator.register('osm.cloudmade', function(params) {
    params = COG.extend({
        apikey: null,
        styleid: 1
    }, params);
    
    T5.userMessage('ack', 'osm.cloudmade', 'This product uses the <a href="http://cloudmade.com/" target="_blank">CloudMade</a> APIs, but is not endorsed or certified by CloudMade.');
    
    return COG.extend(new T5.OSM.Generator(params), {
        getServerDetails: function() {
            return {
                baseUrl: COG.formatStr(
                    'http://{3}.tile.cloudmade.com/{0}/{1}/{2}/',
                    params.apikey,
                    params.styleid,
                    256, 
                    '{0}'),
                subDomains: ['a', 'b', 'c']
            };
        }
    });
});