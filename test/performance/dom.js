(function() {
    function createCanvas() {
        return document.createElement('canvas');
    }
    
    function createImage() {
        return new Image();
    }
    
    JSLitmus.test("DOM - create canvas", createCanvas);
    JSLitmus.test("DOM - create image", createImage);
})();