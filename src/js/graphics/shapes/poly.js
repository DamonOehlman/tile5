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
var Poly = function(points, params) {
    params = COG.extend({
        simplify: false
    }, params);

    // initialise variables
    var haveData = false,
        simplify = params.simplify,
        stateZoom = viewState('ZOOM'),
        drawPoints = [];
        
    // initialise the shape type based on the fill state (no fill = line)
    params.type = params.fill ? 'polygon' : 'line';
    
    /* exported functions */
    
    /**
    ### prepPath(context, offsetX, offsetY, width, height, state, hitData)
    Prepare the path that will draw the polygon to the canvas
    */
    function prepPath(context, offsetX, offsetY, width, height, state) {
        if (haveData) {
            var first = true,
                maxX, maxY, minX, minY;

            context.beginPath();
            
            // now draw the lines
            // COG.info('drawing poly: have ' + drawVectors.length + ' vectors');
            for (var ii = drawPoints.length; ii--; ) {
                var x = drawPoints[ii].x - offsetX,
                    y = drawPoints[ii].y - offsetY;
                    
                // update the min and max values
                minX = typeof minX != 'undefined' || x < minX ? x : minX;
                minY = typeof minY != 'undefined' || y < minY ? y : minY;
                maxX = typeof maxX != 'undefined' || x > maxX ? x : maxX;
                maxY = typeof maxY != 'undefined' || y > maxY ? y : maxY;
                    
                if (first) {
                    context.moveTo(x, y);
                    first = false;
                }
                else {
                    context.lineTo(x, y);
                } // if..else
            } // for
            
            // update the bounds
            self.bounds = XYRect.init(minX, minY, maxX, maxY);
        } // if
        
        return haveData;
    } // prepPath
    
    /**
    ### resync(view)
    Used to synchronize the points of the poly to the grid.
    */
    function resync(view) {
        self.xy = view.syncXY(points);
        
        // simplify the vectors for drawing (if required)
        drawPoints = XY.floor(simplify ? XY.simplify(points) : points);
        
        // TODO: determine the bounding rect of the shape
    } // resyncToGrid
    
    /* define self */
    
    var self = COG.extend(new Shape(params), {
        prepPath: prepPath,
        resync: resync
    });

    // initialise the first item to the first element in the array
    haveData = points && (points.length >= 2);
    
    return self;
};