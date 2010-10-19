T5.Geo.LocationSearch = function(params) {
    params = T5.ex({
        name: "Geolocation Search",
        requiredAccuracy: null,
        watch: false
    }, params);
    
    var geoWatchId = 0;
    
    /* tracking functions */
    
    function parseSearchResults(position) {
        var results = [],
            currentPos = new T5.Geo.Position(
                    position.coords.latitude, 
                    position.coords.longitude),
            accuracy = position.coords.accuracy / 1000;

        if ((! params.requiredAccuracy) || (accuracy >= params.requiredAccuracy)) {
            results = [new T5.Geo.GeoSearchResult({
                id: 1,
                caption: 'Current Location',
                pos: currentPos,
                matchWeight: 100
            })];
        } // if
        
        return results;
    } // trackingUpdate
    
    function trackingError(error) {
        GT.Log.info('caught location tracking error:', error);
    } // trackingError
    
    // initialise the geosearch agent
    var self = new T5.Geo.GeoSearchAgent(T5.ex({
        execute: function(searchParams, callback) {
            if (navigator.geolocation && (! geoWatchId)) {
                geoWatchId = navigator.geolocation.watchPosition(
                    function(position) {
                        var results = parseSearchResults(position);
                        if (results.length > 0) {
                            navigator.geolocation.clearWatch(geoWatchId);
                            geoWatchId = 0;

                            if (callback) {
                                callback(results, params, searchParams);
                            } // if
                        }
                    }, 
                    trackingError, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 5000
                    });
            } // if
        }
    }, params));
    
    return self;
};
