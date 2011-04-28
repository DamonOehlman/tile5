describe('types.pos', function() {
    var TEST_LAT = -27.4695,
        TEST_LON = 153.0201,
        TEST_MERCX = 2.6707045667309752,
        TEST_MERCY = -0.4958420051599975;
    
    it('can be initialized with two float values', function() {
        var pos = new T5.Pos(TEST_LAT, TEST_LON);
        
        expect(pos.lat).toEqual(TEST_LAT);
        expect(pos.lon).toEqual(TEST_LON);
    });
    
    it('can be initialized with a parsable string', function() {
        var pos = new T5.Pos(TEST_LAT + ', ' + TEST_LON);
        
        expect(pos.lat).toEqual(TEST_LAT);
        expect(pos.lon).toEqual(TEST_LON);
    });
    
    it('can be converted to mercator pixels', function() {
        var pos = new T5.Pos(TEST_LAT, TEST_LON),
            xy = pos.toPixels();

        expect(xy.mercX).toEqual(TEST_MERCX);
        expect(xy.mercY).toEqual(TEST_MERCY);
    });
});