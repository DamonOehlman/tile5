(function() {
    var TEST_X = 5, TEST_Y = 6,
        TEST_VECTOR = new T5.Vector(TEST_X, TEST_Y);
    
    new COG.Testing.Suite({
        id: "tile5.vector",
        title: "Suite of tests to check vector operations in Tile5",
        
        tests: [
        
        // create vector
        {
            title: "Create Vector",
            runner: function(test, testData) {
                var testVector = new T5.Vector(TEST_X, TEST_Y);
                if ((testVector.x !== TEST_X) || (testVector.y !== TEST_Y)) {
                    throw new Error("Vector initialization failed");
                } // if
            }
        },
        
        // create empty vector
        {
            title: "Create Empty Vector",
            runner: function(test, testData) {
                var testVector = new T5.Vector();
                if ((testVector.x !== 0) || (testVector.y !== 0)) {
                    throw new Error("Empty Vector initialization failed");
                } // if
            }
        },
        
        // offset vector test
        {
            title: "Offset Vector",
            runner: function(test, testData) {
                var testVector = new T5.Vector();
                testVector = T5.V.offset(testVector, TEST_X, TEST_Y);
                
                if ((testVector.x !== TEST_X) || (testVector.y !== TEST_Y)) {
                    throw new Error("Offsetting vector failed");
                } // if
            }
        },
        
        // vector size tests
        {
            title: "Get Vector Size (Positive Values)",
            runner: function(test) {
                var size = T5.V.absSize(TEST_VECTOR);
                if (size !== Math.max(TEST_X, TEST_Y)) {
                    throw new Error("Error finding correct vector size");
                } // if
            }
        },
        {
            title: "Get Vector Size (Negative Values)",
            runner: function(test) {
                var testVector = new T5.Vector(-TEST_X, -TEST_Y),
                    size = T5.V.absSize(testVector);
                    
                if (size !== Math.max(TEST_X, TEST_Y)) {
                    throw new Error("Error finding correct vector size with negative values");
                }
            }
        }
        ]
    });
})();

