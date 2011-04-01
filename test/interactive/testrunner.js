TESTRUNNER = (function() {
    
    /* internals */
    
    var map,
        currentRenderer = 'canvas',
        rendererDeps = {
            'three:webgl': [
                '../lib/Three.js',
                '../../dist/plugins/renderer.three.js'
            ]
        };
    
    function initMap() {
        $('#mapContainer *').remove();
        
        map = new T5.Map({
            // Point to which canvas element to draw in
            container: 'mapContainer',
            renderer: currentRenderer
        });

        map.setLayer('tiles', new T5.ImageLayer('osm.cloudmade', {
                // demo api key, register for an API key
                // at http://dev.cloudmade.com/
                apikey: '7960daaf55f84bfdb166014d0b9f8d41'
        }));

        // start in london for something difference
        map.gotoPosition(T5.Geo.Position.init(51.52, -0.13), 4);
    } // initMap
    
    function handleSelectRenderer() {
        currentRenderer = $('#renderer').val();
        loadRenderer(initMap);
    } // handleSelectRenderer
    
    function handleSelectTest(evt) {
        // if the target is a test
        var isTest = $(evt.target).hasClass('test');
        
        // if it is a tests, then run the test
        if (isTest) {
            var scriptName = evt.target.href.replace(/.*#(.*)$/, '$1');
            
            // include the script using labjs
            $LAB.script('tests/' + scriptName + '.js');
        } // if
    } // handleSelectTest
    
    function loadRenderer(callback) {
        var deps = rendererDeps[currentRenderer] || [],
            chain = $LAB;
        
        for (var ii = 0; ii < deps.length; ii++) {
            chain = chain.script(deps[ii]);
        } // for
        
        chain.wait(function() {
            setTimeout(callback, 0);
        });
    } // loadRenderer
    
    /* initialization */

    // initialise the map
    initMap();
    
    // handle test selection
    $('ul#tests').click(handleSelectTest);
    $('#renderer').change(handleSelectRenderer);
    
    return {
        getMap: function() {
            return map;
        }
    };
})();