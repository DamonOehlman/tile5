/**
# DRAWABLE: marker
The T5.Marker class represents a generic marker for annotating an underlying view.
Originally the marker class did very little, and in most instances a T5.ImageMarker
was used instead to generate a marker that looked more visually appealing, however, 
with the introduction of different rendering backends the standard marker class is
the recommended option for annotating maps and views as it allows the renderer to 
implement suitable rendering behaviour which looks good regardless of the context.

## Initialization Parameters
In addition to the standard T5.Drawable initialization parameters, a Marker can
accept the following:


- `markerStyle` - (default = simple)

    The style of marker that will be displayed for the marker.  This is interpreted
    by each renderer individually.

*/
reg(typeDrawable, 'marker', function(view, layer, params) {
    params = _extend({
        fill: true,
        stroke: false,
        markerStyle: 'simple',
        hoverStyle: 'highlight',
        typeName: 'Marker'
    }, params);

    return new Drawable(view, layer, params);
});