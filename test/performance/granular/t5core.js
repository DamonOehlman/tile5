(function() {
    var testVector = new T5.Vector(),
        offsetX = 0,
        offsetY = 0;
    
    function createVector() {
        return new T5.Vector();
    }
    
    function updateVector() {
        testVector.x = 50;
        testVector.y = 100;
    }
    
    function updateSepVars() {
        offsetX = 50;
        offsetY = 100;
    }
    
    JSLitmus.test("T5 - create vector", createVector);
    JSLitmus.test("T5 - update vector", updateVector);
    JSLitmus.test("T5 - update offset vars", updateSepVars);
})();