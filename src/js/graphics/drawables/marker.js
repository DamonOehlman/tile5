var Marker = function(params) {
    Drawable.call(this, params);
};

Marker.prototype = COG.extend(Drawable.prototype, {
    constructor: Marker,
    
    prepPath: function(context, offsetX, offsetY, width, height, state) {
        context.beginPath();
        context.arc(
            this.xy.x - offsetX,
            this.xy.y - offsetY,
            this.size >> 1,
            0,
            Math.PI * 2,
            false
        );

        return true;
    } // prepPath
});