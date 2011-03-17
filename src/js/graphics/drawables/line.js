/**
### T5.Line(points, params)
*/
function Line(points, params) {
    params.fill = false;
    
    Poly.call(this, points, params);
};

Line.prototype = COG.extend({}, Poly.prototype);