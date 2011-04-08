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

        if (imageUrls[style]) {
            if (callback) {
                callback();
            } // if
        }
        else {
            var serverUrl = COG.formatStr(
                'http://dev.virtualearth.net/REST/V1/Imagery/Metadata/{0}?key={1}',
                style, apikey);

            COG.jsonp(serverUrl, function(data) {
                var resourceData = data.resourceSets[0].resources[0];

                imageUrls[style] = resourceData.imageUrl;
                subDomains = resourceData.imageUrlSubdomains;

                logoUrl = data.brandLogoUri;

                T5.userMessage('ack', 'bing', data.copyright);



                if (callback) {
                    callback();
                } // if
            }, "jsonp");
        } // if..else
    } // authenticate

    var BingGenerator = function(params) {
        params = COG.extend({
            apikey: null,
            style: 'Road',
            osmDataAck: false
        }, params);

        var currentImageUrl = '',
            subDomainIdx = 0,
            osmGenerator = new T5.Geo.OSM.Generator(params),
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

        function run(view, viewport, store, callback) {
            if (! imageUrls[params.style]) {
                authenticate(params.apikey, params.style, function() {
                    currentImageUrl = imageUrls[params.style];

                    osmRun(view, viewport, store, callback);
                });
            }
            else {
                osmRun(view, viewport, store, callback);
            } // if..else
        } // run

        var _self = COG.extend(osmGenerator, {
            buildTileUrl: buildTileUrl,
            run: run
        });

        return _self;
    };

    T5.Generator.register('bing', BingGenerator);
})();
