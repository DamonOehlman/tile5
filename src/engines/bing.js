/**
# T5.Geo.Bing
*/
T5.Geo.Bing = (function() {
    var imageUrls = {},
        logoUrl, 
        copyrightText,
        subDomains = [],
        urlFormatter = _formatter('http://dev.virtualearth.net/REST/V1/Imagery/Metadata/{0}?key={1}');
        
    /* internal functions */
    
    function authenticate(apikey, style, callback) {
        _log('attempting authentication, apikey = ' + apikey + ', style = ' + style);
        
        // if we already have the image urls for that style, then just fire the callback
        if (imageUrls[style]) {
            if (callback) {
                callback();
            } // if
        }
        // otherwise, authenticate for that style
        else {
            _jsonp(urlFormatter(style, apikey), function(data) {
                // FIXME: very hacky...
                var resourceData = data.resourceSets[0].resources[0];

                imageUrls[style] = resourceData.imageUrl;
                subDomains = resourceData.imageUrlSubdomains;

                logoUrl = data.brandLogoUri;

                // display the copyright appropriately
                T5.userMessage('ack', 'bing', data.copyright);

                // _self.setZoomRange(resourceData.zoomMin + 1, resourceData.zoomMax);

                // T5.Tiling.tileSize = resourceData.imageHeight;

                if (callback) {
                    callback();
                } // if
            }, "jsonp");
        } // if..else
    } // authenticate    

    var BingGenerator = function(params) {
        params = _extend({
            apikey: null,
            style: 'Road',
            osmDataAck: false
        }, params);
        
        var currentImageUrl = '',
            subDomainIdx = 0,
            osmGenerator = new T5.Geo.OSM.Generator(params),
            osmRun = osmGenerator.run;

        /* internal functions */
        
        // quad function from example @ polymaps.org
        // http://polymaps.org/ex/bing.html
        function quad(column, row, zoom) {
          var key = "";
          for (var i = 1; i <= zoom; i++) {
            key += (((row >> zoom - i) & 1) << 1) | ((column >> zoom - i) & 1);
          }
          return key;
        } // quad
        
        /* exports */
        
        // initialise the url builder
        function buildTileUrl(tileX, tileY, zoomLevel, numTiles) {
            // initialise the image url
            var quadKey = quad(tileX, tileY, zoomLevel);
                
            // if the subdomain index, has extended beyond the bounds of the available subdomains, reset to 0
            subDomainIdx = subDomainIdx ? (subDomainIdx % subDomains.length) + 1 : 0;
            
            // return the image url
            return currentImageUrl
                .replace("{quadkey}", quadKey)
                .replace('{culture}', '')
                .replace("{subdomain}", subDomains[subDomainIdx]);
        } // buildTileUrl
        
        function run(view, viewport, store, callback) {
            if (! imageUrls[params.style]) {
                // authenticate with bing
                authenticate(params.apikey, params.style, function() {
                    currentImageUrl = imageUrls[params.style];

                    osmRun(view, viewport, store, callback);
                });
            }
            else {
                osmRun(view, viewport, store, callback);
            } // if..else            
        } // run

        // initialise the generator
        var _self = _extend(osmGenerator, {
            buildTileUrl: buildTileUrl,
            run: run
        });
            
        return _self;        
    };
    
    // register the generator
    T5.Registry.register('generator', 'bing', BingGenerator);
})();