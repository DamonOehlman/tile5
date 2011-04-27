/**
# GENERATOR: static
*/
T5.Registry.register('generator', 'static', function(params) {
    params = T5.ex({
        tiles: [],
        loadTimeout: 10000
    }, params);

    /* internals */

    function loadTileImage(tileData, callback) {
        T5.getImage(tileData.url, function(image) {
            callback(new T5.Tile(
                tileData.x,
                tileData.y,
                tileData.url,
                image.width,
                image.height
            ));
        });
    } // loadTileImage

    /* exports */

    function run(view, viewport, storage, callback) {
        var loaded = 0,
            callbackTriggered = false,
            loaderTimeout;

        for (var ii = params.tiles.length; ii--; ) {
            loadTileImage(params.tiles[ii], function(tile) {
                storage.insert(tile, tile);

                loaded++;
                if (loaded >= params.tiles.length && callback && (! callbackTriggered)) {
                    clearTimeout(loaderTimeout);
                    callback();
                } // if
            });
        } // for

        loaderTimeout = setTimeout(function() {
            callback();
        }, params.loadTimeout);
    } // run

    /* define the generator */

    var _self = {
        run: run
    };

    return _self;
});
