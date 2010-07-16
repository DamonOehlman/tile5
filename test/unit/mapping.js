(function() {
    var testSuite = new GRUNT.Testing.Suite({
        id: "slick.mapping",
        title: "Suite of tests to test mapping in SLICK",
        setup: function() {
        },
        
        teardown: function() {
        },
        
        testData: {
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
                "Brisbane Airport", 
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
        },
        
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
