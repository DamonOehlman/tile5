/**
### T5.Arc(params)
*/
function Arc(params) {
    params = COG.extend({
        startAngle: 0,
        endAngle: Math.PI * 2,
        typeName: 'Arc'
    }, params);
    
    Drawable.call(this, params);
};

Arc.prototype = COG.extend(Drawable.prototype, {
    constructor: Arc
});