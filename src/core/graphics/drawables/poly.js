/**
# DRAWABLE: poly

## Settings

- `fill` (default = true) - whether or not the poly should be filled.
- `style` (default = null) - the style override for this poly.  If none
is specified then the style of the T5.PolyLayer is used.


## Methods
*/
reg(typeDrawable, 'poly', function(view, layer, params) {
    params = _extend({
        simplify: false,
        fill: true,
        points: [],
        typeName: 'Poly'
    }, params);
    
    /* internals */

    // initialise variables
    var points = [],
        pointsToParse;
        
    function updateDrawPoints() {
        var ii, x, y, maxX, maxY, minX, minY, drawPoints;
        
        // simplify the vectors for drawing (if required)
        // TODO: move simplification to the runner as well
        drawPoints = _self.points = params.simplify ? simplify(points) : points;

        // determine the bounds of the shape
        for (ii = drawPoints.length; ii--; ) {
            x = drawPoints[ii].x;
            y = drawPoints[ii].y;
                
            // update the min and max values
            minX = _is(minX, typeUndefined) || x < minX ? x : minX;
            minY = _is(minY, typeUndefined) || y < minY ? y : minY;
            maxX = _is(maxX, typeUndefined) || x > maxX ? x : maxX;
            maxY = _is(maxY, typeUndefined) || y > maxY ? y : maxY;
        } // for
        
        // update the width
        _self.updateBounds(new Rect(minX, minY, maxX - minX, maxY - minY), true);        
    } // updateDrawPoints
        
    function updatePoints(input) {
        if (_is(input, typeArray)) {
            Runner.process(input, function(slice, sliceLen) {
                for (var ii = 0; ii < sliceLen; ii++) {
                    points[ii] = new view.XY(slice[ii]);
                } // for
            }, resync);
        } // if
    } // updatePoints
    
    /* exported functions */
    
    /**
    ### resync(view)
    Used to synchronize the points of the poly to the grid.
    */
    function resync() {
        if (points.length) {
            Runner.process(points, function(slice, sliceLen) {
                for (var ii = sliceLen; ii--; ) {
                    slice[ii].sync(view);
                } // for
            }, updateDrawPoints);
        } // if
    } // resync
    
    // extend this
    var _self = _extend(new Drawable(view, layer, params), {
        points: [],
        
        getPoints: function() {
            return [].concat(points);
        },
        
        resync: resync
    });
    
    // route auto configuration methods
    _configurable(_self, params, {
        points: updatePoints
    });

    // if we have points to parse
    updatePoints(params.points);
    
    // initialise the first item to the first element in the array
    return _self;
});