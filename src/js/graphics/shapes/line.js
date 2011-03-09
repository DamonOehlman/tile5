var Line = function(points, params) {
    return new T5.Poly(points, COG.extend({
        fill: false
    }, params));
};