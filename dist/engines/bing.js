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

        if (imageUrls[style]) {
            if (callback) {
                callback();
            } // if
        }
        else {
            _jsonp(urlFormatter(style, apikey), function(data) {
                var resourceData = data.resourceSets[0].resources[0];

                imageUrls[style] = resourceData.imageUrl;
                subDomains = resourceData.imageUrlSubdomains;

                logoUrl = data.brandLogoUri;
                copyrightText = data.copyright;

                if (callback) {
                    callback();
                } // if
            }, "jsonp");
        } // if..else
    } // authenticate

    var BingGenerator = function(view, params) {
        params = _extend({
            apikey: null,
            style: 'Road',
            osmDataAck: false
        }, params);

        var currentImageUrl = '',
            subDomainIdx = 0,
            osmGenerator = new T5.Geo.OSM.Generator(view, params),
            osmRun = osmGenerator.run;

        /* internal functions */

        function quad(column, row, zoom) {
          var key = "";
          for (var i = 1; i <= zoom; i++) {
            key += (((row >> zoom - i) & 1) << 1) | ((column >> zoom - i) & 1);
          }
          return key;
        } // quad

        /* exports */

        function buildTileUrl(tileX, tileY, zoomLevel, numTiles) {
            var quadKey = quad(tileX, tileY, zoomLevel);

            subDomainIdx = subDomainIdx ? (subDomainIdx % subDomains.length) + 1 : 0;

            return currentImageUrl
                .replace("{quadkey}", quadKey)
                .replace('{culture}', '')
                .replace("{subdomain}", subDomains[subDomainIdx]);
        } // buildTileUrl

        function run(store, callback) {
            if (! imageUrls[params.style]) {
                authenticate(params.apikey, params.style, function() {
                    currentImageUrl = imageUrls[params.style];
                    view.addCopy(copyrightText);

                    osmRun(view, viewport, store, callback);
                });
            }
            else {
                osmRun(view, viewport, store, callback);
            } // if..else
        } // run

        var _self = _extend(osmGenerator, {
            buildTileUrl: buildTileUrl,
            run: run
        });

        if (copyrightText) {
            view.addCopy(copyrightText);
        } // if

        return _self;
    };

    T5.Registry.register('generator', 'bing', BingGenerator);
})();
