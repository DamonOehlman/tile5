/**
# T5.newCanvas(width, height)
*/
var newCanvas = T5.newCanvas = function(width, height) {
    var tmpCanvas = document.createElement('canvas');

    // set the size of the canvas if specified
    tmpCanvas.width = width ? width : 0;
    tmpCanvas.height = height ? height : 0;

    // flash canvas initialization
    if (typeof FlashCanvas != 'undefined') {
        document.body.appendChild(tmpCanvas);
        FlashCanvas.initElement(tmpCanvas);
    } // if
    
    // if we are working with explorer canvas, then initialise the canvas
    if (typeof G_vmlCanvasManager != 'undefined') {
        G_vmlCanvasManager.initElement(tmpCanvas);
    } // if    

    return tmpCanvas;
};