/**
# DRAWABLE: poly

## Settings

- `fill` (default = true) - whether or not the poly should be filled.
- `style` (default = null) - the style override for this poly.  If none
is specified then the style of the T5.PolyLayer is used.

## Events

### updatedPoints 

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
        _poly = new Line(params.allowCull),
        _drawPoly = new Line(params.allowCull);
        
    function updateDrawPoints() {
        var ii, x, y, maxX, maxY, minX, minY, drawPoints;
        
        // simplify the vectors for drawing (if required)
        // TODO: move simplification to the runner as well
        _drawPoly = params.simplify ? _poly.simplify() : _poly;
        drawPoints = _drawPoly.points;

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

        // trigger the points recalc event
        _self.trigger('pointsUpdate', _self, drawPoints);
        
        // invalidate the view
        view.invalidate();
    } // updateDrawPoints
        
    /* exported functions */
    
    function line(value) {
        if (_is(value, 'array')) {
            var polyPoints;

            _poly = new Line(params.allowCull);
            polyPoints = _poly.points;

            Runner.process(value, function(slice, sliceLen) {
                for (var ii = 0; ii < sliceLen; ii++) {
                    polyPoints.push(new view.XY(slice[ii]));
                } // for
            }, _self.initialized ? resync : null, SYNC_PARSE_THRESHOLD);

            return _self;
        }
        else {
            return _drawPoly;
        } // if..else
    } // points
    
    /**
    ### resync(view)
    Used to synchronize the points of the poly to the grid.
    */
    function resync() {
        if (_poly.points.length) {
            Runner.process(_poly.points, function(slice, sliceLen) {
                for (var ii = sliceLen; ii--; ) {
                    slice[ii].sync(view);
                } // for
            }, updateDrawPoints, SYNC_PARSE_THRESHOLD);
        } // if
    } // resync
    
    // extend this
    var _self = _extend(new Drawable(view, layer, params), {
        line: line,
        resync: resync
    });
    
    // if we have points to parse
    line(params.points);
    
    // initialise the first item to the first element in the array
    return _self;
});