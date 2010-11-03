(function() {
    var canvases = [];
    
    function createTile() {
        var newCanvas = document.createElement("canvas");
        newCanvas.width = 256;
        newCanvas.height = 256;
        
        canvases[canvases.length] = newCanvas;
    }
    
    JSLitmus.test("T5 - create canvas", createTile);
})();