(function() {
    // initialise constants
    var TEST_EVENTS = [
        'tap',
        'geotap',
        'idle'
    ];
    
    // initialise variables
    var map,
        startPosition = T5.Geo.Position.init(-27.47, 153.03);
        
    /* internal functions */
    
    function debug(msg) {
        COG.info(msg);
        $("#mapConsole").append('<li>' + msg + '</li>');
    } // debug
    
    function handleEvent(evt) {
        debug("received " + evt.name + " event (" + Array.prototype.join.call(arguments, ',') + ')');
    } // handleEvent
    
    function handleGeoTap(evt, absXY, relXY, tapPos, tapBounds) {
        debug('received geotap @ ' + T5.Geo.Position.toString(tapPos) + ', bounds: ' + T5.Geo.BoundingBox.toString(tapBounds));
    } // handleGeoTap
    
    /* initialization */
    
    $(document).ready(function() {
        map = new T5.Map({
            container: 'mapContainer'
        });
        
        map.setLayer('tiles', new T5.ImageLayer('osm.cloudmade', {
            // demo api key, register for an API key
            // at http://dev.cloudmade.com/
            apikey: '7960daaf55f84bfdb166014d0b9f8d41',
            styleid: 999
        }));
        
        map.gotoPosition(startPosition, 12);
        
        /*
        // bind the test events
        for (var ii = 0; ii < TEST_EVENTS.length; ii++) {
            map.bind(TEST_EVENTS[ii], handleEvent);
        } // for
        */
        
        map.bind('geotap', handleGeoTap);
    });
})();