(function() {
    function getTime() {
        return new Date().getTime();
    }
    
    function floatParsing() {
        return parseFloat('23.3423423423');
    }
    
    JSLitmus.test("Baseline - getTime", getTime);
    JSLitmus.test("Baseline - parseFloat", floatParsing);
})();