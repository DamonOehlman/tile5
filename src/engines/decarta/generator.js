T5.Registry.register('generator', 'decarta', function(params) {
    params = T5.ex({
        tileSize: 256
    }, params);
    
    // initialise constants
    var DEGREES_TO_RADIANS = Math.PI / 180,
        RADIANS_TO_DEGREES = 180 / Math.PI;

    // Taken from deCarta's new mobile JS library
    // check it out at: http://developer.decarta.com/docs/read/Mobile_JS
    var _ll_LUT = [
        "89.787438015348100000,360.00000000000000000",
        "85.084059050110410000,180.00000000000000000",
        "66.653475896509040000,90.00000000000000000",
        "41.170427238429790000,45.000000000000000000",
        "22.076741328793200000,22.500000000000000000",
        "11.251819676168665000,11.250000000000000000",
        "5.653589942659626000,5.625000000000000000",
        "2.830287664051185000,2.812500000000000000",
        "1.415581451872543800,1.406250000000000000",
        "0.707845460801532700,0.703125000000000000",
        "0.353929573271679340,0.351562500000000000",
        "0.176965641673330230,0.175781250000000000",
        "0.088482927761462040,0.087890625000000000",
        "0.044241477246363230,0.043945312500000000",
        "0.022120740293895182,0.021972656250000000",
        "0.011060370355776452,0.010986328125000000",
        "0.005530185203987857,0.005493164062500000",
        "0.002765092605263539,0.002746582031250000",
        "0.001382546303032519,0.001373291015625000",
        "0.000691272945568983,0.000686645507812500",
        "0.000345636472797214,0.000343322753906250"
    ],
    hosts = null;
    
    /* internals */
    
    function createTiles(view, viewRect, store, callback) {
        var zoomLevel = view.zoom ? view.zoom() : 0;
        
        if (zoomLevel) {
            var numTiles = 2 << (zoomLevel - 1),
                numTilesHalf = numTiles >> 1,
                tileSize = params.tileSize,
                xTiles = (viewRect.w / tileSize | 0) + 1,
                yTiles = (viewRect.h / tileSize | 0) + 1,
                xTile = (viewRect.x / tileSize | 0) - numTilesHalf,
                yTile = numTiles - (viewRect.y / tileSize | 0) - numTilesHalf - yTiles,
                tiles = store.search({
                    x: (numTilesHalf + xTile) * tileSize,
                    y: (numTilesHalf + yTile*-1 - yTiles) * tileSize,
                    w: xTiles * tileSize,
                    h: yTiles * tileSize
                }),
                tileIds = {},
                ii;

            // iterate through the tiles and create the tile id index
            for (ii = tiles.length; ii--; ) {
                tileIds[tiles[ii].id] = true;
            } // for
                
            for (var xx = 0; xx <= xTiles; xx++) {
                for (var yy = 0; yy <= yTiles; yy++) {
                    var tileX = xTile + xx,
                        tileY = yTile + yy - 1,
                        tileId = tileX + '_' + tileY;
                        
                    // if the tile is not in the index, then create
                    if (! tileIds[tileId]) {
                        var tileUrl = hosts[xx % hosts.length] + '/openls/image-cache/TILE?'+
                               'LLMIN=0.0,0.0' +
                               '&LLMAX=' + _ll_LUT[zoomLevel] +
                               '&CACHEABLE=true' + 
                               '&DS=navteq-world' +
                               '&WIDTH=' + (256 /* * dpr*/) +
                               '&HEIGHT=' + (256 /* * dpr*/) +
                               '&CLIENTNAME=' + currentConfig.clientName +
                               '&SESSIONID=' + currentConfig.sessionID +
                               '&FORMAT=PNG' +
                               '&CONFIG=' + currentConfig.configuration +
                               '&N=' + tileY +
                               '&E=' + tileX,
                            tile = new T5.Tile(
                                (numTilesHalf + xTile + xx) * tileSize,
                                (numTilesHalf + yTile*-1 - yy) * tileSize,
                                tileUrl,
                                tileSize, 
                                tileSize,
                                tileId);
                                
                        // add the new tile to the store
                        store.insert(tile, tile);
                    } // if
                } // for
            } // for
                
            // if the callback is assigned, then pass back the creator
            if (callback) {
                callback();
            } // if                
        } // if
    } // createTiles
    
    
    /* exports */
    
    function run(view, viewRect, store, callback) {
        if (hosts) {
            createTiles(view, viewRect, store, callback);
        }
        else {
            // make an RUOK request to retrieve configuration information
            makeServerRequest(new RUOKRequest(), function(tileConfig) {
                // reset the tile hosts
                hosts = [];

                // initialise the hosts
                if (tileConfig.aliasCount) {
                    for (var ii = 0; ii < tileConfig.aliasCount; ii++) {
                        hosts[ii] = 'http://' + tileConfig.host.replace('^(.*?)\.(.*)$', '\1-0' + (ii + 1) + '.\2');
                    } // for
                }
                else {
                    hosts = ['http://' + tileConfig.host];
                } // if..else

                // create the tiles
                createTiles(view, viewRect, store, callback);
            });
        }
    } // run
    
    /* define the generator */
    
    T5.userMessage('ack', 'decarta', '&copy; deCarta, Inc. Map and Imagery Data &copy; NAVTEQ or Tele Atlas or DigitalGlobe');
    
    return {
        run: run
    };
});