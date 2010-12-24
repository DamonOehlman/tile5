(function() {
    var MINZOOM = 2;
    var MAXZOOM = 19;
    
    function createZoomTest(zoomLevel) {
        testSuite.add(new COG.Testing.Test({
            description: "Test Zoom Level " + zoomLevel,
            runner: function(test, testData) {
                map.gotoPosition(testData.positions.rocky, zoomLevel, function() {
                    test.ready();
                });
            }
        }));
    } // createZoomLevel
    
    var testSuite = new COG.Testing.Suite({
        id: "tile5.mapping.cloudmade",
        description: "Suite of tests to test cloudmade mapping in Tile5",
        setup: function() {
        },
        
        teardown: function() {
            
        },
        
        testData: {
            zoomLevel: 7,
            positions: {
                brisbane: new T5.Geo.Position("-27.469321 153.02489"),
                rocky: new T5.Geo.Position("-23.391737 150.503082"),
                goldcoast: new T5.Geo.Position("-28.032099 153.434587")
            }
        },
        
        tests: [{
            title: "Display Map",
            runner: function(test, testData) {
                map.gotoPosition(testData.positions.brisbane, testData.zoomLevel, function() {
                    test.ready();
                });
            }
        }, {
            title: "Add Some Pins",
            runner: function(test, testData) {
                COG.Log.info("adding some pins");
                
                // pin the gold coast
                map.addPOI(new T5.Geo.PointOfInterest({
                    id: 1,
                    title: "Brisbane City",
                    pos: testData.positions.brisbane,
                    type: "accommodation"
                }));
                
                test.ready();
            }
        }]
    });
    
    /*
    // add the zoom tests to the test suite
    for (var zoomLevel = MINZOOM; zoomLevel <= MAXZOOM; zoomLevel++) {
        createZoomTest(zoomLevel);
    } // for
    */
})();


