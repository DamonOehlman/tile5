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

    // initialise variables
    var points = params.points,
        simplify = params.simplify;
        
    /* exported functions */
    
    /**
    ### resync(view)
    Used to synchronize the points of the poly to the grid.
    */
    function resync() {
        var ii, x, y, maxX, maxY, minX, minY, drawPoints;
        
        for (ii = points.length; ii--; ) {
            points[ii].sync(view);
        } // for

        // simplify the vectors for drawing (if required)
        drawPoints = this.points = simplify ? simplify(points) : points;

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
        this.updateBounds(new Rect(minX, minY, maxX - minX, maxY - minY), true);
    } // resync
    
    // call the inherited constructor
    Drawable.call(this, params);
    
    // extend this
    _extend(this, {
        getPoints: function() {
            return [].concat(points);
        },
        
        resync: resync
    });
    
    // initialise the first item to the first element in the array
    this.haveData = points && (points.length >= 2);
});