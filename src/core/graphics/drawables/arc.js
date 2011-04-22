/**
### T5.Arc(params)
*/
function Arc(params) {
    params = _extend({
        startAngle: 0,
        endAngle: Math.PI * 2,
        typeName: 'Arc'
    }, params);
    
    Drawable.call(this, params);
};

Arc.prototype = _extend(Drawable.prototype, {
    constructor: Arc
});