// define the map global for simplicities sake
var map;

DEMO = (function() {
    
    /* internals */
    
    // define the demos
    var demos = [{
            title: 'GeoJSON World',
            script: 'js/geojson-world.js',
            deps: [
                '../dist/plugins/parser.geojson.js',
                '../dist/style/map-overlays.js',
                'data/world.js'
            ]
        }, {
            title: 'Simple',
            script: 'js/simple.js' 
        }, {
            title: 'Animated Panning',
            script: 'js/animated-map-panning.js'
        }, {
            title: 'Drag and Drop GeoJSON',
            script: 'js/dnd-geojson.js'
        }],
        startLat = -27.469592089206213,
        startLon = 153.0201530456543;
        
    /* internals */
    
    function addScript(scriptUrl) {
        var scriptEl = document.createElement('script');
        scriptEl.src = scriptUrl;
        
        document.body.appendChild(scriptEl);
    } // addScript
        
    /* exports */
    
    function getHomePosition() {
        return new T5.Pos(startLat, startLon);
    } // getHomePosition
    
    function load(demoTitle) {
        var demo;
        
        if (map) {
            map.detach();
            $('#mapContainer').html('');
        } // if
        
        // iterate through the demos, look for the requested demo
        for (var ii = 0; ii < demos.length; ii++) {
            if (demos[ii].title.toLowerCase() === demoTitle.toLowerCase()) {
                demo = demos[ii];
                break;
            }
        } // for
        
        if (demo) {
            status('loading demo: ' + demo.title);
            
            // add the scripts to the body
            for (var depIdx = 0; demo.deps && depIdx < demo.deps.length; depIdx++) {
                addScript(demo.deps[depIdx]);
            } // for
            
            setTimeout(function() {
                addScript(demo.script);
            }, 500);
        } // if
    }
    
    function rotate() {
        map.rotate(360, { 
            duration: 30000,
            complete: function() {
                setTimeout(DEMO.rotate, 10000);
            }
        });
    }
    
    function status(message) {
        T5.log(message);
    } // status
        
    return {
        getHomePosition: getHomePosition,
        load: load,
        rotate: rotate,
        status: status
    };
})();