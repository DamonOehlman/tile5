TILE5.Geo.Location = (function() {
    // initialise some defaults
    var DEFAULT_GEOLOCATION_TIMEOUT = 3000,
        HIGH_ACCURACY_CUTOFF = 10;
    
    
    /* not supported handlers */
    
    function notSupported(args) {
        throw new Error("No geolocation APIs supported.");
    } // getPositionNotSupported
    
    /* geolocation api implementation */
    
    /**
    This function is used to get the current location using the geolocation API.  The default values for
    args are configured to run through the default position acquision phased process as described in the 
    documentation (to be completed).   In essence the phases are:
    
    0 - look for a cached location of high accuracy, if found, call callback and finish
    1 - look for a non-cached position of any accuracy, if found, invoke callback and move to phase 2
    2 - look for a non-cached position of high accuracy, if found, invoke callback and finish
    */
    function geolocationAPI(args) {
        args = GRUNT.extend({
            autoPhasing: true,
            maximumAge: 300000,
            timeout: 0,
            highAccuracyCutoff: 10,
            watch: false,
            enableHighAccuracy: true,
            successCallback: null,
            errorCallback: null
        }, args);
        
        var phase = 0,
            lastPosition = null,
            lastAccuracy = 1000000;
            
        function fireErrorCallback(error) {
            if (args.errorCallback) {
                args.errorCallback(error);
            } // if
        } // fireErrorCallback
        
        function getAccuracy(coords) {
            if (GRUNT.isPlainObject(coords.accuracy) && coords.accuracy.horizontal) {
                return coords.accuracy.horizontal;
            }
            else {
                return coords.accuracy;
            } // if..else
        }
        
        function positionSuccess(position) {
            try {
                var pos = new TILE5.Geo.Position(position.coords.latitude, position.coords.longitude),
                    accuracy = getAccuracy(position.coords);

                GRUNT.Log.info("position success, accuracy = " + accuracy);
                if (args.successCallback && ((! lastPosition) || (accuracy < lastAccuracy))) {
                    args.successCallback(pos, accuracy, phase, position);
                } // if

                // if the accuracy is greater than the high accuracy cutoff, and we haven't hit phase 2, then 
                // update
                if ((accuracy > args.highAccuracyCutoff) && (phase < 2)) {
                    // update parameters
                    phase = 2;
                    args.enableHighAccuracy = true;

                    // relocate
                    GRUNT.Log.info("Position not at required accuracy, trying again with high accuracy");
                    if (! args.watch) { 
                        locate();
                    } // if
                } // if

                // save the last position
                lastPosition = position;
                lastAccuracy = accuracy;
            }
            catch (e) {
                GRUNT.Log.exception(e); 
            } // try..catch
        } // positionSuccess
        
        function positionError(error) {
            if (error.code === error.PERMISSION_DENIED) {
                fireErrorCallback(error);
            }
            else if (error.code === error.POSITION_UNAVAILABLE) {
                fireErrorCallback(error);
            }
            else if (error.code === error.TIMEOUT) {
                GRUNT.Log.info("had a timeout on cached position, moving to phase 1");
                
                // if our arguments specified a 0 timeout, then we were at phase 0 - looking for a cached position
                // and one doesn't exist, time to move onto phase 1
                if ((args.timeout === 0) && args.autoPhasing) {
                    // update args
                    phase = 1;
                    args.timeout = DEFAULT_GEOLOCATION_TIMEOUT;
                    args.enableHighAccuracy = false;
                    
                    // locate
                    locate();
                } // if
            }
        } // positionError
        
        function locate() {
            // first call is to get the rough position
            navigator.geolocation.getCurrentPosition(
                positionSuccess, 
                positionError, 
                GRUNT.extend({}, args, {
                    enableHighAccuracy: false
                }));
        } // locate
        
        function watch() {
            navigator.geolocation.watchPosition(positionSuccess, positionError, args);
        } // watch
        
        // if watching then watch, otherwise locate, um, self-explanatory really...
        return args.watch ? watch() : locate();
    } // getPosition

    var module = {
        get: notSupported
    };
    
    // check for a suitable geolocation api
    if (navigator.geolocation) {
        module.get = geolocationAPI;
    } // if
    
    return module;
})();


