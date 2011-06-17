// define the map global for simplicities sake
var map;

DEMO = (function() {
    
    /* internals */
    
    // define the demos
    var renderer = 'canvas',
        demos = [{
            title: 'Simple',
            script: 'js/simple.js'
        },{
            title: 'GeoJSON World',
            script: 'js/geojson-world.js',
            deps: [
                '../dist/plugins/parser.geojson.js',
                '../dist/style/map-overlays.js',
                'data/world.js'
            ]
        }, {
            title: 'Marker Hit Test',
            script: 'js/marker-hit-test.js',
            deps: [
                'data/heatmap-data.js'
            ]
        }, {
           title: 'PDXAPI',
           script: 'js/geojson-pdxapi.js' 
        }, {
            title: 'Animated Panning',
            script: 'js/animated-map-panning.js',
            disabled: true
        }, {
            title: 'heatcanvas',
            script: 'js/heatmap.js',
            deps: [
                'lib/heatcanvas.js',
                '../dist/plugins/layers/heatcanvas.js',
                'data/heatmap-data.js'
            ]
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
    
    function buildUI() {
        var options = '',
            ii;
        
        // iterate through the demos
        for (ii = 0; ii < demos.length; ii++) {
            if (! demos[ii].disabled) {
                options += '<option>' + demos[ii].title + '</option>';
            } // if
        } // for
        
        $('#demoSelector')
            .html(options)
            .change(function() {
                load(this.value);
            });
            
        $('#renderer').change(function() {
            map.renderer(renderer = this.value);
        });
    } // buildUI
        
    /* exports */
    
    function getHomePosition() {
        return new GeoJS.Pos(startLat, startLon);
    } // getHomePosition
    
    function load(demoTitle) {
        var demo;
        
        if (map) {
            map.detach();
            $('#mapContainer').html('');
        } // if
        
        // set the demo title to the first demo if not specified
        demoTitle = demoTitle || demos[0].title;
        
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
    
    $(document).ready(buildUI);
        
    return {
        getRenderer: function() {
            return renderer;
        },
        
        getHomePosition: getHomePosition,
        load: load,
        rotate: rotate,
        status: status
    };
})();