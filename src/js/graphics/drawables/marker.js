/**
### T5.Marker(params)
*/
function Marker(params) {
    Drawable.call(this, params);
};

Marker.prototype = COG.extend(Drawable.prototype, {
    constructor: Marker,
    
    prep: function(renderer, offsetX, offsetY, state) {
        return renderer.arc(this.xy.x, this.xy.y, this.size >> 1, 0, Math.PI * 2);
    } // prep
});