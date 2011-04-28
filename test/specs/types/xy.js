describe('types.xy', function() {
    it('should be able to initialize an x and y value with two integer values', function() {
        var test = new T5.XY(20, 10);
        
        expect(test.x).toEqual(20);
        expect(test.y).toEqual(10);
    });
    
    it('should be able to parse a delimited string', function() {
        var test = new T5.XY('20, 10');
        
        expect(test.x).toEqual(20);
        expect(test.y).toEqual(10);
    });
    
    it('should be able to accept floating point values', function() {
        var test = new T5.XY(20.5, 10.5);
        
        expect(test.x).toEqual(20.5);
        expect(test.y).toEqual(10.5);
    });
    
    it('should be able to parse floating point values', function() {
        var test = new T5.XY('20.5, 10.5');
        
        expect(test.x).toEqual(20.5);
        expect(test.y).toEqual(10.5);
    });
    
    it('should be able to copy an XY value', function() {
        var test = new T5.XY(20, 10);
            testCopy = test.copy();
        
        expect(testCopy.x).toEqual(20);
        expect(testCopy.y).toEqual(10);
        expect(testCopy).not.toBe(test);
    });
    
    it('should be able to override values created in a copy', function() {
        var testCopy = new T5.XY(20, 10).copy(30, 20);
        
        expect(testCopy.x).toEqual(30);
        expect(testCopy.y).toEqual(20);
    });
    
    it('should be able to add xy values together', function() {
        var test = new T5.XY(20, 10),
            testAdded = test.add(new T5.XY(20, 10), new T5.XY(20, 10));
            
        expect(testAdded.x).toEqual(60);
        expect(testAdded.y).toEqual(30);
        expect(testAdded).not.toBe(test);
    });
    
    it('should be able to offset an xy value', function() {
        var test = new T5.XY(20, 10),
            testOffset = test.offset(20, 10);
            
        expect(testOffset.x).toEqual(40);
        expect(testOffset.y).toEqual(20);
        expect(testOffset).not.toBe(test);
    });
});