describe('map.basic', function() {
    var startLat = -27.469592089206213,
        startLon = 153.0201530456543,
        testPrecision = Math.pow(10, 3);
    
    it('should be able to move to a particular position', function() {
        var centerPos;
        
        // move the map to the specified start position
        map.zoom(13).center(startLat + ', ' + startLon);
        
        // get the center position for the map
        centerPos = map.center().pos();
        
        expect(centerPos.lat * testPrecision | 0).toEqual(startLat * testPrecision | 0);
        expect(centerPos.lon * testPrecision | 0).toEqual(startLon * testPrecision | 0);
    });
    
    it('should not have a center value and offset value equal', function() {
        expect(map.center().equals(map.offset())).toBeFalsy();
    });
});