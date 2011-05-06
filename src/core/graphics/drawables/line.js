/**
# DRAWABLE: line
*/
reg(typeDrawable, 'line', function(view, layer, params) {
    params.fill = false;
    params.allowCull = true;
    
    return regCreate(typeDrawable, 'poly', view, layer, params);
});