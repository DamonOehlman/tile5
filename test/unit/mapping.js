(function() {
    var mappingTestData = {
        zoomLevel: 7,
        positions: {
            rocky: new SLICK.Geo.Position("-23.391737 150.503082"),
            goldcoast: new SLICK.Geo.Position("-28.032099 153.434587"),
            brisbane: new SLICK.Geo.Position("-27.4688793718815 153.02282050252"),
            sydney: new SLICK.Geo.Position("-33.8696305453777 151.206959635019"),
            mudgee: new SLICK.Geo.Position("-32.5993604958057 149.587680548429"),
            toowoomba: new SLICK.Geo.Position("-27.5614504516125 151.953289657831")
        },
        addresses: [
            "2649 Logan Road, Eight Mile Plains, QLD",
            "49 Rose Lane, Gordon Park, QLD", 
            "Holland Park", 
            "Botanic Gardens", 
            "Central Station, Brisbane", 
            "Queens Park",
            "Brisbane Airport" 
            /*
            "diddillibah", 
            "Rockhampton",
            "Normanton, Qld",
            "Mt Warren Park",
            "Bald Hills",
            "Crow’s Nest",
            "Mansfield, QLD",
            "Belmont, QLD",
            "Perth, QLD",
            "Birdsville",
            "Victoria Point",
            "132 Buckinghamia Place, Stretton, QLD",
            "Mt Tamborine",
            "Sunrise Beach",
            "Hyatt Regency Coolum Beach",
            "BELLBIRD PARK"
            */
        ]
    };
    
    new GRUNT.Testing.Suite({
        id: "slick.mapping",
        title: "Suite of tests to test mapping in SLICK",
        testData: mappingTestData,
        
        tests: [{
            title: "Display Map",
            runner: function(test, testData) {
                map.gotoPosition(testData.positions.goldcoast, testData.zoomLevel, function() {
                    test.ready();
                });
            }
        }]
    });
    
    new GRUNT.Testing.Suite({
        id: "slick.mapping.routing",
        title: "SLICK Mapping > Route Tests",
        testData: mappingTestData,
        
        tests: [{
            title: "Route from Brisbane to Sydney",
            runner: function(test, testData) {
                GRUNT.Log.info("requesting the route from brisbane to sydney");
                
                // calculate the route between brisbane and sydney
                SLICK.Geo.Routing.calculate({
                    waypoints: [
                        testData.positions.brisbane, 
                        testData.positions.toowoomba, 
                        testData.positions.mudgee,
                        testData.positions.sydney
                    ],
                    map: map
                });
                
                // set the route overlay
                // map.setRoute();
                
                test.ready();
            }
        }]
    });
    
    new GRUNT.Testing.Suite({
        id: "slick.mapping.geocoding",
        title: "SLICK Mapping > Geocoding Tests",
        testData: mappingTestData,
        
        tests: [{
            title: "Geocoding Test",
            runner: function(test, testData) {
                // get a mapping engine for geocoding
                var engine = SLICK.Geo.getEngine("geocode");
                
                if (! engine) {
                    throw new Error("No geocoding capable GEO.Engine found");
                } // if
                
                engine.geocode({
                    addresses: testData.addresses, 
                    complete: function(requestAddress, possibleMatches) {
                        GRUNT.Log.info("REQUESTED ADDRESS: " + requestAddress);
                        GRUNT.Log.info("got address matches: ", possibleMatches);
                    }
                });
            }
        }]
    });
})();
