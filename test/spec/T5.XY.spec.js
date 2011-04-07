describe("T5.XY", function() {
    it("should be able to initialize with empty values", function() {
        var xy = T5.XY.init();
        
        expect(xy.x).toEqual(0);
        expect(xy.y).toEqual(0);
    });

    it("should be able to initialize with x,y values", function() {
        var xy = T5.XY.init(10, 20);
        
        expect(xy.x).toEqual(10);
        expect(xy.y).toEqual(20);
    });
    
    it("should be able check that two composite xy values are equal", function() {
        var xy1 = T5.XY.init(10, 20);
            xy2 = T5.XY.init(10, 20);
            
        expect(xy1.equals(xy2)).toBeTruthy();
    });
    
    it("should be able to add two xy values together", function() {
        var xy = T5.XY.init(10, 20).add(T5.XY.init(10, 20));
            
        expect(xy.x).toEqual(20);
        expect(xy.y).toEqual(40);
    });
});