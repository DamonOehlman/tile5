/**
# LAYER: cluster (plugin)
*/
T5.Registry.register('layer', 'geolocation', function(view, params) {
    params = T5.ex({
        follow: true,
        zoomToLocation: true,
        maxZoom: 15
    }, params);

    /* internals */

    var ACCURACY_TOLERANCE = 0.5,
        overlays = [],
        lastAccuracy = Infinity,
        watchId,
        initialUpdate = true;

    function trackingUpdate(position) {
        var pos = new T5.Pos(position.coords.latitude, position.coords.longitude),
            posXY = new view.XY(pos),
            accuracy = position.coords.accuracy / 1000;

        if (accuracy <= lastAccuracy + ACCURACY_TOLERANCE) {
            posXY.sync(view);
            _self.trigger('locationUpdate', position, accuracy, posXY);

            T5.log('captured tracking up to pos: ' + pos + ', accuracy: ' + accuracy);

            if (initialUpdate) {
                overlays[overlays.length] = _self.create('marker', {
                    xy: posXY
                });

                if (params.zoomToLocation) {
                    view.bounds(pos.toBounds(accuracy), params.maxZoom);
                } // if
            } // if

            for (var ii = overlays.length; ii--; ) {
                overlays[ii].xy = posXY;
            } // for

            view.invalidate();

            if (params.follow) {
                view.center(pos, null, true);
            } // if

            initialUpdate = false;

            lastAccuracy = accuracy;
        } // if
    } // trackingUpdate

    function trackingError(error) {
        T5.log('TRACKING ERROR: ' + error, 'warn');
    } // trackingError

    /* exports */

    var _self = T5.Registry.create('layer', 'draw', view, params);

    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            trackingUpdate,
            trackingError, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000
            }
        );

        view.bind('layerRemove', function(evt, layer) {
            if (layer === _self) {
                navigator.geolocation.clearWatch(watchId);
            } // if
        });
    }
    else {
        T5.log('No W3C geolocation support', 'warn');
    } // if..else

    return _self;
});
