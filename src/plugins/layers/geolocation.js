/**
# LAYER: cluster (plugin)
*/
T5.Registry.register('layer', 'geolocation', function(view, params) {
    params = T5.ex({
        once: false,
        follow: true,
        zoomToLocation: true,
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
        ACCURACY_TOLERANCE = 0.5,
        overlays = [],
        lastAccuracy = Infinity,
        watchId,
        initialUpdate = true;
    
    function trackingUpdate(position) {
        var pos = new T5.Pos(position.coords.latitude, position.coords.longitude),
            posXY = new view.XY(pos),
            // convert the accuracy to meters
            accuracy = position.coords.accuracy / 1000;
            
        // if the accuracy is better than the last reading then update
        if (accuracy <= lastAccuracy + ACCURACY_TOLERANCE) {
            // sync the xy position
            posXY.sync(view);
            _self.trigger('locationUpdate', position, accuracy, posXY);

            T5.log('captured tracking up to pos: ' + pos + ', accuracy: ' + accuracy);

            // if this is the initial update, then create the overlayes
            if (initialUpdate) {
                overlays[overlays.length] = _self.create('arc', {
                    xy: posXY,
                    fill: true,
                    size: 100 // TODO: calculate this based on accuracy
                });

                overlays[overlays.length] = _self.create('marker', {
                    xy: posXY,
                    markerType: 'image',
                    imageUrl: LOCATOR_IMAGE,
                    size: 10
                });

                // if we should zoom to location, then do that now
                if (params.zoomToLocation) {
                    view.bounds(pos.toBounds(accuracy), params.maxZoom);
                } // if
            } // if

            // iterate through the overlays and update their position
            for (var ii = overlays.length; ii--; ) {
                overlays[ii].xy = posXY;
            } // for

            // invalidate the view
            view.invalidate();

            // pan to the position
            if (params.follow) {
                view.center(pos, null, true);
            } // if

            // flag the initial update as false
            initialUpdate = false;
            
            // if we are only doing the one update then clear the watch
            if (params.once) {
                navigator.geolocation.clearWatch(watchId);
            } // if
            
            // update the last accuracy
            lastAccuracy = accuracy;
        } // if
    } // trackingUpdate
    
    function trackingError(error) {
        T5.log('TRACKING ERROR: ' + error, 'warn');
    } // trackingError
    
    /* exports */
    
    var _self = T5.Registry.create('layer', 'draw', view, params);

    // if geolocation detection supported, then initialize
    if (navigator.geolocation) {
        // create the geolocation watch
        watchId = navigator.geolocation.watchPosition(
            trackingUpdate, 
            trackingError, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000
            }
        );
    
        // handle removal of the layer
        view.bind('layerRemove', function(evt, layer) {
            if (layer === _self) {
                navigator.geolocation.clearWatch(watchId);
            } // if
        });
    }
    // otherwise, warn
    else {
        T5.log('No W3C geolocation support', 'warn');
    } // if..else
    
    return _self;
});