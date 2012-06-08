/**
# DRAWABLE: arc
*/
reg(typeDrawable, 'arc', function(view, layer, params) {
    params = cog.extend({
        startAngle: 0,
        endAngle: Math.PI * 2,
        typeName: 'Arc'
    }, params);

    return new Drawable(view, layer, params);
});