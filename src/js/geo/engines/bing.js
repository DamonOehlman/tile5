/**
# T5.Geo.Bing
*/
T5.Geo.Bing = (function() {
    var imageUrls = {},
        logoUrl, 
        copyrightText,
        subDomains = [];
        
    /* internal functions */
    
    function authenticate(apikey, style, callback) {
        COG.info('attempting authentication, apikey = ' + apikey + ', style = ' + style);
        
        // if we already have the image urls for that style, then just fire the callback
        if (imageUrls[style]) {
            if (callback) {
                callback();
            } // if
        }
        // otherwise, authenticate for that style
        else {
            var serverUrl = COG.formatStr(
                'http://dev.virtualearth.net/REST/V1/Imagery/Metadata/{0}?key={1}', 
                style, apikey);
                
            COG.jsonp(serverUrl, function(data) {
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
        params = COG.extend({
            apikey: null,
            style: 'Road'
        }, params);
        
        var currentImageUrl = '',
            subDomainIdx = 0;

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
        function buildTileUrl(tileX, tileY, numTiles, zoomLevel) {
            // initialise the image url
            var quadKey = quad(tileX, tileY, zoomLevel);
                tileUrl = 
                
            // if the subdomain index, has extended beyond the bounds of the available subdomains, reset to 0
            subDomainIdx = subDomainIdx ? (subDomainIdx % subDomains.length) + 1 : 0;
            
            // return the image url
            return currentImageUrl
                .replace("{quadkey}", quadKey)
                .replace('{culture}', '')
                .replace("{subdomain}", subDomains[subDomainIdx]);
        } // buildTileUrl
        
        function prepTileCreator(tileWidth, tileHeight, creatorArgs, callback) {
            if (! imageUrls[params.style]) {
                // authenticate with bing
                authenticate(params.apikey, params.style, function() {
                    currentImageUrl = imageUrls[params.style];

                    if (callback) {
                        callback();
                    } // if
                });
            }
            else if (callback) {
                callback();
            } // if..else
        } // if

        // initialise the generator
        var _self = COG.extend(new T5.Geo.OSM.Generator(params), {
            buildTileUrl: buildTileUrl,
            prepTileCreator: prepTileCreator
        });
            
        return _self;        
    };
    
    // register the generator
    T5.Generator.register('bing', BingGenerator);
})();