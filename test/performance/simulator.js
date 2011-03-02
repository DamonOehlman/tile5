SIMULATOR = (function() {
    
    var map,
        tests = [];
        
    /* internals */
    
    function initMap() {
        map = new T5.Map({
            // Point to which canvas element to draw in
            container: 'mapCanvas'
        });

        map.setLayer('tiles', new T5.ImageLayer('osm.cloudmade', {
                // demo api key, register for an API key
                // at http://dev.cloudmade.com/
                apikey: '7960daaf55f84bfdb166014d0b9f8d41'
        }));

        // start in london for something difference
        map.gotoPosition(T5.Geo.Position.init(51.52, -0.13), 4);
    } // initMap
    
    function ticks() {
        return new Date().getTime();
    } // ticks
    
    /* performance tests */
    
    function testPan(count, callback) {
        var panAmount = count,
            startTicks = ticks();
        
        function pan() {
            panAmount -= 1;
            
            map.pan(1, 1, null, null, function() { 
                map.invalidate();
                if (panAmount > 0) {
                    setTimeout(pan, 0);
                }
                else {
                    callback('pans made', ticks() - startTicks);
                } // if..else
            });
        } // pan

        pan();
    } // testPan
    
    function testMarkers(count, callback) {
        var markerCount = count,
            startTicks = ticks();
            
        function addMarker() {
            map.markers.add(new T5.Marker({
                xy: T5.GeoXY.init(map.getCenterPosition()),
                tweenIn: COG.easing('sine.out')
            }));
            
            map.invalidate();
            
            markerCount -= 1;
            if (markerCount > 0) {
                setTimeout(addMarker, 0);
            }
            else {
                callback('markers added', ticks() - startTicks);
            } // if..else
        } // addMarker
        
        addMarker();
    } // testMarkers
    
    /* exports */
    
    function start(count) {
        var testIdx = 0;
        
        function runTest() {
            if (testIdx < tests.length) {
                tests[testIdx](count, function(testName, tickCount) {
                    $('#statusBox').html(count + ' ' + testName + ' in ' + tickCount + 'ms');
                    
                    testIdx += 1;
                    runTest();
                });
            }
            else {
                // take control away from the user
                map.pannable(true).scalable(true);
            } // if..else
        } // runTest
        
        // take control away from the user
        map.pannable(false).scalable(false);
        
        // run the test
        runTest();
    } // start
    
    /* initialization */
    
    tests.push(testPan);
    tests.push(testMarkers);
    
    initMap();
    
    return {
        start: start
    };
})();