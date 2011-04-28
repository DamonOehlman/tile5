describe('drawables.line', function() {
    var POS_COUNT = 10;
    
    it('should be able to create a line on the map', function() {
        var positions = [];
        
        for (var ii = POS_COUNT; ii--; ) {
            positions[ii] = new T5.Pos(startLat + Math.random() - 0.5, startLon + Math.random() - 0.5);
        } // for
        
        // create a line with the positions
        map.layer('markers').create('line', {
            points: positions
        });
    });
});