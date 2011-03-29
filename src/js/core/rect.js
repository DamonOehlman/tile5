function Rect(x, y, width, height) {
    // initialise members
    this.x = x || 0;
    this.y = y || 0;
    this.w = width || 0;
    this.h = height || 0;
    
    // update the x2 and y2 coordinates
    this.x2 = this.x + this.w;
    this.y2 = this.y + this.h;
} // Rect

Rect.prototype = {
    constructor: Rect
};