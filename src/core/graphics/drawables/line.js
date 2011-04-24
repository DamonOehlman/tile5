/**
# DRAWABLE: line
*/
reg(typeDrawable, 'line', function(view, layer, params) {
    params.fill = false;
    return regCreate(typeDrawable, 'poly', view, layer, params);
});