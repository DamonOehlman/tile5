(function() {
    var r1 = T5.XYRect.init(10, 10, 110, 110),
        r2 = T5.XYRect.init(20, 20, 100, 100),
        r3 = T5.XYRect.init(200, 200, 300, 300);
    
    new COG.Testing.Suite({
        id: "t5.xyrect",
        title: "Suite of tests to check operation of XYRect composites",
        
        tests: [
        {
            title: 'Intersect Valid',
            runner: function(test, testData) {
                var r = T5.XYRect.intersect(r1, r2);
                COG.info('intersection = ', r);
            }
        }, 
        {
            title: 'Intersect Miss',
            runner: function(test, testData) {
                var r = T5.XYRect.intersect(r1, r3);
                COG.info('intersection = ', r);
            }
        }
        ]
    });
})();

