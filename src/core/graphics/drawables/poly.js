/**
# T5.Poly
__extends__: T5.Shape

## Constructor

`new T5.Poly(points, params)`

The constructor requires an array of vectors that represent the poly and 
also accepts optional initialization parameters (see below).


#### Initialization Parameters

- `fill` (default = true) - whether or not the poly should be filled.
- `style` (default = null) - the style override for this poly.  If none
is specified then the style of the T5.PolyLayer is used.


## Methods
*/
function Poly(points, params) {
    params = _extend({
        simplify: false,
        fill: true,
        typeName: 'Poly'
    }, params);

    // initialise variables
    var simplify = params.simplify;
        
    /* exported functions */
    
    /**
    ### resync(view)
    Used to synchronize the points of the poly to the grid.
    */
    function resync(view) {
        var x, y, maxX, maxY, minX, minY, drawPoints;
        
        view.syncXY(points);
        
        // simplify the vectors for drawing (if required)
        drawPoints = this.points = XYFns.floor(simplify ? XYFns.simplify(points) : points);

        // determine the bounds of the shape
        for (var ii = drawPoints.length; ii--; ) {
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
};

Poly.prototype = _extend({}, Drawable.prototype, {
    constructor: Poly
});