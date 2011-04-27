describe('map.movement', function() {
    // get the current map offset
    var offsetXY;
    
    beforeEach(function() {
        offsetXY = map.offset();
    });
    
    it('should be able to pan a map', function() {
        map.pan(500, 500);
        
        expect(map.offset().x).toEqual(offsetXY.x + 500);
        expect(map.offset().y).toEqual(offsetXY.y + 500);
    });
    
    it('should be able to pan a map with easing', function() {
        runs(function() {
            map.pan(-500, -500, {
                callback: function() {
                    expect(map.offset().x).toEqual(offsetXY.x - 500);
                    expect(map.offset().y).toEqual(offsetXY.y - 500);
                }
            });
        });
        
        waits(1200);
    });
    
    it('should be able to scale a map', function() {
        runs(function() {
            map.scale(0.75, {
                callback: function() {
                    expect(map.scale()).toEqual(0.75);
                }
            });
        });
        
        waits(1200);
        map.scale(1);
    });
    
    it('should be able to rotate a map', function() {
        runs(function() {
            map.rotate(360, {
                callback: function() {
                    expect(map.rotate()).toEqual(0);
                }
            });
        });
        
        waits(1200);
    });
});