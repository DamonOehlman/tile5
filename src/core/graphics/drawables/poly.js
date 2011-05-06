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
        allowCull: false,
        simplify: false,
        fill: true,
        points: [],
        typeName: 'Poly'
    }, params);
    
    /* internals */

    // initialise variables
    var SYNC_PARSE_THRESHOLD = 500,
        _points = new Line(params.allowCull),
        _drawPoints;
        
    function updateDrawPoints() {
        var ii, x, y, maxX, maxY, minX, minY, drawPoints;
        
        // simplify the vectors for drawing (if required)
        // TODO: move simplification to the runner as well
        _drawPoints = params.simplify ? _points.simplify() : _points;

        // determine the bounds of the shape
        for (ii = _drawPoints.length; ii--; ) {
            x = _drawPoints[ii].x;
            y = _drawPoints[ii].y;
                
            // update the min and max values
            minX = _is(minX, typeUndefined) || x < minX ? x : minX;
            minY = _is(minY, typeUndefined) || y < minY ? y : minY;
            maxX = _is(maxX, typeUndefined) || x > maxX ? x : maxX;
            maxY = _is(maxY, typeUndefined) || y > maxY ? y : maxY;
        } // for
        
        // update the width
        _self.updateBounds(new Rect(minX, minY, maxX - minX, maxY - minY), true);        
    } // updateDrawPoints
        
    /* exported functions */
    
    function points(value) {
        if (_is(value, typeArray)) {
            _points = new Line(params.allowCull);
            
            Runner.process(value, function(slice, sliceLen) {
                for (var ii = 0; ii < sliceLen; ii++) {
                    _points.push(new view.XY(slice[ii]));
                } // for
            }, resync, SYNC_PARSE_THRESHOLD);
            
            return _self;
        }
        else {
            return _drawPoints;
        }
    } // points
    
    /**
    ### resync(view)
    Used to synchronize the points of the poly to the grid.
    */
    function resync() {
        if (_points.length) {
            Runner.process(_points, function(slice, sliceLen) {
                for (var ii = sliceLen; ii--; ) {
                    slice[ii].sync(view);
                } // for
            }, updateDrawPoints, SYNC_PARSE_THRESHOLD);
        } // if
    } // resync
    
    // extend this
    var _self = _extend(new Drawable(view, layer, params), {
        points: points,
        resync: resync
    });
    
    // if we have points to parse
    points(params.points);
    
    // initialise the first item to the first element in the array
    return _self;
});