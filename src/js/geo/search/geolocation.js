var LocationSearch = function(params) {
    params = COG.extend({
        name: "Geolocation Search",
        requiredAccuracy: null,
        searchTimeout: 5000,
        watch: false
    }, params);
    
    var geoWatchId = 0,
        locationTimeout = 0,
        lastPosition = null;
    
    /* tracking functions */
    
    function parsePosition(position) {
        var currentPos = Position.init(
                position.coords.latitude, 
                position.coords.longitude);

        return new GeoSearchResult({
            id: 1,
            caption: 'Current Location',
            pos: currentPos,
            accuracy: position.coords.accuracy / 1000,
            matchWeight: 100
        });
    } // trackingUpdate
    
    function sendPosition(searchResult, callback) {
        navigator.geolocation.clearWatch(geoWatchId);
        geoWatchId = 0;
        
        // if we have a location timeout reset that
        if (locationTimeout) {
            clearTimeout(locationTimeout);
            locationTimeout = 0;
        } // if

        if (callback) {
            callback([searchResult], params);
        } // if
    } // sendPosition
    
    function trackingError(error) {
        COG.Log.info('caught location tracking error:', error);
    } // trackingError
    
    // initialise the geosearch agent
    var self = new T5.Geo.GeoSearchAgent(COG.extend({
        execute: function(searchParams, callback) {
            if (navigator.geolocation && (! geoWatchId)) {
                // watch for position updates
                geoWatchId = navigator.geolocation.watchPosition(
                    function(position) {
                        var newPosition = parsePosition(position);
                        
                        // if the new position is better than the last
                        // then update the last position
                        if ((! lastPosition) || (newPosition.accuracy < lastPosition.accuracy)) {
                            lastPosition = newPosition;
                        } // if
                        
                        // if we don't have a required accuracy or the last
                        // position is at a sufficient accuracy, then fire the 
                        // callback
                        if ((! params.requiredAccuracy) || 
                            (lastPosition.accuracy < params.requiredAccuracy)) {
                            sendPosition(lastPosition, callback);
                        } // if
                    }, 
                    trackingError, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 5000
                    });

                // implement the search timeout
                if (params.searchTimeout) {
                    locationTimeout = setTimeout(function() {
                        if (lastPosition) {
                            sendPosition(lastPosition, callback);
                        } // if
                    }, params.searchTimeout);
                } // if
            } // if
        }
    }, params));
    
    return self;
};
