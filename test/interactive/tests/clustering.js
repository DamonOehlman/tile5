TESTRUNNER.Test = (function() {
    
    var clusterer;
    
    function dropMarker() {
        // get the map viewport
        var map = TESTRUNNER.getMap(),
            viewport = map.getViewport(),
            marker = new T5.Marker({
                xy: T5.XY.init(
                    viewport.x + (Math.random() * viewport.w | 0),
                    viewport.y + (Math.random() * viewport.h | 0)
                ),
                size: 10
            });
            
        // add the marker to the map
        map.markers.add(marker);
        marker.animate('translate', [0, -200], [0, 0]);
            
        setTimeout(dropMarker, 50);
    } // dropMarker
    
    function run() {
        // create the clusterer
        clusterer = new T5.Clusterer(TESTRUNNER.getMap(), {
            
        });
        
        COG.info('created marker clusterer');
        dropMarker();
    } // run
    
    // include the clustering plugin
    $LAB.script('../../dist/plugins/clusterer.js').wait(function() {
        setTimeout(run, 0);
    });
})();