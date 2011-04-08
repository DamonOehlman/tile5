/**
# T5.Geo.OSM
*/
T5.Geo.OSM = (function() {

    var DEGREES_TO_RADIANS = Math.PI / 180,
        RADIANS_TO_DEGREES = 180 / Math.PI;

    /* define generators */

    /**
    # T5.Geo.OSM.Generator

    ## Functions
    */
    var OSMGenerator = function(params) {
        params = COG.extend({
            flipY: false,
            tileSize: 256,
            tilePath: '{0}/{1}/{2}.png',
            osmDataAck: true
        }, params);

        var serverDetails = null,
            subDomains = [],
            tilePath = params.tilePath;

        /* internal functions */

        /*
        Function:  calculateTileOffset
        This function calculates the tile offset for a mapping tile in the cloudmade API.  Code is adapted
        from the pseudocode that can be found on the cloudemade site at the following location:

        http://developers.cloudmade.com/projects/tiles/examples/convert-coordinates-to-tile-numbers
        */
        function calculateTileOffset(lat, lon, numTiles) {
            var tileX, tileY;

            tileX = Math.floor((lon+180) / 360 * numTiles);
            tileY = Math.floor((1-Math.log(Math.tan(lat*DEGREES_TO_RADIANS) + 1/Math.cos(lat*DEGREES_TO_RADIANS))/Math.PI)/2 * numTiles) % numTiles;

            return T5.XY.init(tileX, tileY);
        } // calculateTileOffset

        function calculatePosition(x, y, numTiles) {
            var n = Math.PI - 2*Math.PI * y / numTiles,
                lon = x / numTiles * 360 - 180,
                lat = RADIANS_TO_DEGREES * Math.atan(0.5*(Math.exp(n)-Math.exp(-n)));

            return new T5.Pos(lat, lon);
        } // calculatePosition

        function getTileXY(x, y, numTiles, radsPerPixel) {
            var tilePos = calculatePosition(x, y, numTiles);

            return T5.GeoXY.init(tilePos, radsPerPixel);
        } // getTileXY

        /* exports */

        function buildTileUrl(tileX, tileY, zoomLevel, numTiles, flipY) {
            if (tileY >= 0 && tileY < numTiles) {
                tileX = (tileX % numTiles + numTiles) % numTiles;

                var tileUrl = COG.formatStr(tilePath,
                    zoomLevel,
                    tileX,
                    flipY ? Math.abs(tileY - numTiles + 1) : tileY);

                if (serverDetails) {
                    tileUrl = (subDomains.length ?
                        COG.formatStr(serverDetails.baseUrl, subDomains[tileX % subDomains.length]) :
                        serverDetails.baseUrl) + tileUrl;
                } // if

                return tileUrl;
            } // if
        } // buildTileUrl

        function run(view, viewport, store, callback) {
            var zoomLevel = view.getZoomLevel ? view.getZoomLevel() : 0;

            if (zoomLevel) {
                var numTiles = 2 << (zoomLevel - 1),
                    tileSize = params.tileSize,
                    radsPerPixel = (Math.PI * 2) / (tileSize << zoomLevel),
                    minX = viewport.x,
                    minY = viewport.y,
                    xTiles = (viewport.w  / tileSize | 0) + 1,
                    yTiles = (viewport.h / tileSize | 0) + 1,
                    position = T5.GeoXY.toPos(T5.XY.init(minX, minY), radsPerPixel),
                    tileOffset = calculateTileOffset(position.lat, position.lon, numTiles),
                    tilePixels = getTileXY(tileOffset.x, tileOffset.y, numTiles, radsPerPixel),
                    flipY = params.flipY,
                    tiles = store.search({
                        x: tilePixels.x,
                        y: tilePixels.y,
                        w: xTiles * tileSize,
                        h: yTiles * tileSize
                    }),
                    tileIds = {},
                    ii;

                for (ii = tiles.length; ii--; ) {
                    tileIds[tiles[ii].id] = true;
                } // for


                serverDetails = _self.getServerDetails ? _self.getServerDetails() : null;
                subDomains = serverDetails && serverDetails.subDomains ?
                    serverDetails.subDomains : [];

                for (var xx = 0; xx <= xTiles; xx++) {
                    for (var yy = 0; yy <= yTiles; yy++) {
                        var tileX = tileOffset.x + xx,
                            tileY = tileOffset.y + yy,
                            tileId = tileX + '_' + tileY,
                            tile;

                        if (! tileIds[tileId]) {
                            tileUrl = _self.buildTileUrl(
                                tileOffset.x + xx,
                                tileOffset.y + yy,
                                zoomLevel,
                                numTiles,
                                flipY);

                            tile = new T5.Tile(
                                tilePixels.x + xx * tileSize,
                                tilePixels.y + yy * tileSize,
                                tileUrl,
                                tileSize,
                                tileSize,
                                tileId);

                            store.insert(tile, tile);
                        } // if
                    } // for
                } // for

                if (callback) {
                    callback();
                } // if
            } // if
        } // callback

        /* define the generator */

        var _self = {
            buildTileUrl: buildTileUrl,
            run: run
        };

        if (params.osmDataAck) {
            T5.userMessage('ack', 'osm', 'Map data (c) <a href="http://openstreetmap.org/" target="_blank">OpenStreetMap</a> (and) contributors, CC-BY-SA');
        } // if


        return _self;
    }; // OSMGenerator

    T5.Generator.register('osm.cloudmade', function(params) {
        params = COG.extend({
            apikey: null,
            styleid: 1
        }, params);

        T5.userMessage('ack', 'osm.cloudmade', 'This product uses the <a href="http://cloudmade.com/" target="_blank">CloudMade</a> APIs, but is not endorsed or certified by CloudMade.');

        return COG.extend(new OSMGenerator(params), {
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

    T5.Generator.register('osm.mapbox', function(params) {
        params = COG.extend({
            style: 'world-light',
            version: '1.0.0',
            flipY: true
        }, params);

        T5.userMessage('ack', 'osm.mapbox', 'Tiles Courtesy of <a href="http://mapbox.com/" target="_blank">MapBox</a>');

        return COG.extend(new OSMGenerator(params), {
            getServerDetails: function() {
                return {
                    baseUrl: COG.formatStr("http://{2}.tile.mapbox.com/{0}/{1}/", params.version, params.style, "{0}"),
                    subDomains: ['a', 'b', 'c', 'd']
                };
            }
        });
    });

    T5.Generator.register('osm.mapquest', function(params) {
        T5.userMessage('ack', 'osm.mapquest', 'Tiles Courtesy of <a href="http://open.mapquest.co.uk/" target="_blank">MapQuest</a>');

        return COG.extend(new OSMGenerator(params), {
            getServerDetails: function() {
                return {
                    baseUrl: 'http://otile{0}.mqcdn.com/tiles/1.0.0/osm/',
                    subDomains: ['1', '2', '3', '4']
                };
            }
        });
    });

    T5.Generator.register('osm.local', OSMGenerator);

    /* define module */

    var module = {
        Generator: OSMGenerator
    };

    return module;
})();
