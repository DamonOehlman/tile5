/**
# LAYER: cluster (plugin)
*/
T5.Registry.register('layer', 'sensor', function(view, params) {
    params = T5.ex({
        once: false,
        follow: true,
        lock: false,
        zoomToLocation: true,
        compass: false,
        maxZoom: 15
    }, params);

    /* internals */

    var LOCATOR_IMAGE =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAA' +
        'BHNCSVQICAgIfAhkiAAAAAlwSFlzAAACIQAAAiEBPhEQkwAAABl0RVh0U29mdHdhcmUAd3' +
        'd3Lmlua3NjYXBlLm9yZ5vuPBoAAAG+SURBVCiRlZHNahNRAIW/O7mTTJPahLZBA1YUyriI' +
        'NRAE3bQIKm40m8K8gLj0CRQkO32ELHUlKbgoIu4EqeJPgtCaoBuNtjXt5LeTMZk0mbmuWi' +
        'uuPLsD3+HAOUIpxf9IHjWmaUbEyWv5ROrsVULhcHP761rUfnN3Y2Otc8CIg4YT85lzuVsP' +
        'P+Qupw1vpPjRCvhS9ymvV0e77x7nNj+uvADQAIQQ+uLyvdfLV9JGZi7EdEwQlqBpEJ019f' +
        '0z1mo2u5Q8DMydv25lshemmj1FueZTawbs7inarqLbV7Qjab1upB9YlhWSAHLavLHZCvg1' +
        'VEhN0PMU9W7At4bPVidg7CtkLLXkut+lBPD6/Ub155jJiADAHSpaLmx3ApyBQoYEUd0PBo' +
        'OBkAC6+3llvda/YxgGgYL+UNHf/zN3KiExGlsvTdP0NYDkhPdWrz35ZDsBzV5wCMuQwEyF' +
        'mXFeeadjzfuFQmGkAZRKpdGC/n7x+M6jqvA9Zo6FWDhlcHE+wqT93J1tP7vpOE7rrx8ALM' +
        'uasPf8S12St4WmJ6bYWTUC52k8Hm8Vi0X/nwBAPp/XKpWKdF1X2LYdlMvlsToC/QYTls7D' +
        'LFr/PAAAAABJRU5ErkJggg%3D%3D',
        ACCURACY_TOLERANCE = 500,
        overlays = [],
        lastAccuracy = Infinity,
        sensorRingStyle = T5.Style.define('sensor-ring', {
            opacity: 0.1
        }),
        watchId,
        compassAvailable = false,
        viewPannable = view.pannable(),
        initialUpdate = true,
        compassWatchId;

    function compassUpdate(heading) {
        view.rotate(heading | 0, {
            duration: 750,
            easing: 'sine.out'
        }, true);
    } // compassUpdate

    function compassError() {
        T5.log('error reading compass heading', 'warn');
    } // compassError

    function trackingUpdate(position) {
        var pos = new T5.Pos(position.coords.latitude, position.coords.longitude),
            posXY = new view.XY(pos),
            accuracy = new T5.Distance(position.coords.accuracy);

        if (accuracy.meters <= lastAccuracy + ACCURACY_TOLERANCE) {
            posXY.sync(view);
            _self.trigger('locationUpdate', position, accuracy, posXY);

            T5.log('captured tracking up to pos: ' + pos + ', accuracy: ' + accuracy);

            if (initialUpdate) {
                overlays[overlays.length] = _self.create('arc', {
                    xy: posXY,
                    fill: true,
                    style: sensorRingStyle,
                    size: accuracy.radians() / view.rpp | 0
                });

                overlays[overlays.length] = _self.create('marker', {
                    xy: posXY,
                    markerType: 'image',
                    imageUrl: LOCATOR_IMAGE,
                    size: 10
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

            if (params.once) {
                navigator.geolocation.clearWatch(watchId);
            } // if

            lastAccuracy = accuracy.meters;
        } // if
    } // trackingUpdate

    function trackingError(error) {
        T5.log('TRACKING ERROR: ' + error, 'warn');
    } // trackingError

    function updateCompassTracking(value) {
        if (value) {
            if (compassAvailable) {
                var compassOpts = {
                    frequency: 1000
                };

                compassWatchId = navigator.compass.watchHeading(
                    compassUpdate,
                    compassError,
                    compassOpts);
            }
            else {
                T5.log('Compass tracking requested, but compass not available', 'warn');
            } // if..else
        }
        else if (compassAvailable && compassWatchId) {
            navigator.compass.clearWatch(compassWatchId);
            compassWatchId = null;

            view.rotate(0, {
                duration: 300
            }, true);
        } // if..else
    } // updateHeadingTracking

    function updateLock(value) {
        view.pannable(value && viewPannable);
    } // updateLock

    /* exports */

    var _self = T5.ex(T5.Registry.create('layer', 'draw', view, params), {
    });

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

    T5.configurable(_self, params, {
        lock: updateLock,
        compass: updateCompassTracking
    });

    document.addEventListener('deviceready', function() {
        compassAvailable = typeof navigator.compass !== 'undefined';
        updateCompassTracking(params.compass);
    }, false);

    updateLock(params.lock);
    updateCompassTracking(params.compass);

    return _self;
});
