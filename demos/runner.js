// define the map global for simplicities sake
var map;

DEMO = (function() {
    
    /* internals */
    
    // define the demos
    var demos = [{
            title: 'GeoJSON World',
            script: 'js/geojson-world.js'
        }],
        startLat = -27.469592089206213,
        startLon = 153.0201530456543;
        
    /* exports */
    
    function status(message) {
        T5.log(message);
    } // status
        
    return {
        status: status
    };
})();