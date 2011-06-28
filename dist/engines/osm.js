/**
# GENERATOR: osm
*/
reg('generator', 'osm', function(view, params) {
    params = _extend({
        flipY: false,
        tileSize: 256,
        tilePath: '{0}/{1}/{2}.png',
        osmDataAck: true
    }, params);

    var DEGREES_TO_RADIANS = Math.PI / 180,
        RADIANS_TO_DEGREES = 180 / Math.PI,
        serverDetails = null,
        subDomains = [],
        subdomainFormatter,
        pathFormatter = _formatter(params.tilePath);

    /* internal functions */

    /*
    Function:  calculateTileOffset
    This function calculates the tile offset for a mapping tile in the cloudmade API.  Code is adapted
    from the pseudocode that can be found on the cloudemade site at the following location:

    http://developers.cloudmade.com/projects/tiles/examples/convert-coordinates-to-tile-numbers
    */
    function calculateTileOffset(lat, lon, numTiles) {
        var tileX, tileY;

        tileX = (lon+180) / 360 * numTiles;
        tileY = ((1-Math.log(Math.tan(lat*DEGREES_TO_RADIANS) + 1/Math.cos(lat*DEGREES_TO_RADIANS))/Math.PI)/2 * numTiles) % numTiles;

        return new GeoXY(tileX | 0, tileY | 0);
    } // calculateTileOffset

    function calculatePosition(x, y, numTiles) {
        var n = Math.PI - 2*Math.PI * y / numTiles,
            lon = x / numTiles * 360 - 180,
            lat = RADIANS_TO_DEGREES * Math.atan(0.5*(Math.exp(n)-Math.exp(-n)));

        return new GeoJS.Pos(lat, lon);
    } // calculatePosition

    function getTileXY(x, y, numTiles, view) {
        var xy = new GeoXY(calculatePosition(x, y, numTiles));

        xy.sync(view);
        return xy;
    } // getTileXY

    /* exports */

    function buildTileUrl(tileX, tileY, zoomLevel, numTiles, flipY) {
        if (tileY >= 0 && tileY < numTiles) {
            tileX = (tileX % numTiles + numTiles) % numTiles;

            var tileUrl = pathFormatter(
                zoomLevel,
                tileX,
                flipY ? Math.abs(tileY - numTiles + 1) : tileY);

            if (serverDetails) {
                tileUrl = subdomainFormatter(subDomains[tileX % (subDomains.length || 1)]) + tileUrl;
            } // if

            return tileUrl;
        } // if
    } // buildTileUrl

    function run(store, callback) {
        var zoomLevel = view.zoom ? view.zoom() : 0,
            viewport = view.viewport();

        if (zoomLevel) {
            var numTiles = 2 << (zoomLevel - 1),
                tileSize = params.tileSize,
                radsPerPixel = (Math.PI * 2) / (tileSize << zoomLevel),
                minX = viewport.x,
                minY = viewport.y,
                xTiles = (viewport.w  / tileSize | 0) + 1,
                yTiles = (viewport.h / tileSize | 0) + 1,
                position = new GeoXY(minX, minY).sync(view, true).pos(),
                tileOffset = calculateTileOffset(position.lat, position.lon, numTiles),
                tilePixels = getTileXY(tileOffset.x, tileOffset.y, numTiles, view),
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
            subdomainFormatter = _formatter(serverDetails ? serverDetails.baseUrl : '');

            for (var xx = 0; xx <= xTiles; xx++) {
                for (var yy = 0; yy <= yTiles; yy++) {
                    var tileX = tileOffset.x + xx,
                        tileY = tileOffset.y + yy,
                        tileId = tileX + '_' + tileY,
                        tile;

                    if (! tileIds[tileId]) {
                        tileUrl = _self.buildTileUrl(
                            tileX,
                            tileY,
                            zoomLevel,
                            numTiles,
                            flipY);

                        tile = new Tile(
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
        view.addCopy('Map data &copy; <a href="http://openstreetmap.org/" target="_blank">OpenStreetMap</a> (and) contributors, CC-BY-SA');
    } // if


    return _self;
});
