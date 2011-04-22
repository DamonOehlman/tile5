/**
# T5.newCanvas(width, height)
*/
var newCanvas = T5.newCanvas = function(width, height) {
    var tmpCanvas = document.createElement('canvas');

    // set the size of the canvas if specified
    tmpCanvas.width = width ? width : 0;
    tmpCanvas.height = height ? height : 0;

    // trigger the create canvas event which will allow polyfills such
    // as flash canvas and explorer canvas initialize the display
    T5.trigger('createCanvas', tmpCanvas);

    return tmpCanvas;
};