/**
# T5.Points
__extends__: T5.Shape

## Constructor

`new T5.Points(points, params)`

The constructor requires an array of vectors that represent the poly and 
also accepts optional initialization parameters (see below).


#### Initialization Parameters

- `fill` (default = true) - whether or not the poly should be filled.
- `style` (default = null) - the style override for this poly.  If none
is specified then the style of the T5.PolyLayer is used.


## Methods
*/
var Points = function(points, params) {
    params = COG.extend({
        fill: true,
        radius: 10
    }, params);

    // initialise variables
    var haveData = false,
        fill = params.fill,
        drawPoints = [],
        radius = params.radius;
    
    /* exported functions */
    
    /**
    ### draw(context, offsetX, offsetY, state)
    This method is used to draw the poly to the specified `context`.  The 
    `offsetX` and `offsetY` arguments specify the panning offset of the T5.View
    which is taken into account when drawing the poly to the display.  The 
    `state` argument specifies the current T5.ViewState of the view.
    */
    function draw(context, offsetX, offsetY, width, height, state) {
        context.beginPath();

        // now draw the lines
        // COG.info('drawing poly: have ' + drawVectors.length + ' vectors');
        for (var ii = drawPoints.length; ii--; ) {
            context.arc(
                drawPoints[ii].x - offsetX, 
                drawPoints[ii].y - offsetY, 
                radius, 
                0, 
                Math.PI * 2, 
                false);
        } // for
        
        // if the polygon is even partially visible then draw it
        if (fill) {
            context.fill();
        } // if

        context.stroke();
    } // drawPoly
    
    /**
    ### resync(view)
    Used to synchronize the points of the poly to the grid.
    */
    function resync(view) {
        // simplify the vectors for drawing (if required)
        drawPoints = XY.floor(points);
    } // resyncToGrid
    
    /* define _self */
    
    var _self = COG.extend(new Shape(params), {
        draw: draw,
        resync: resync
    });

    return _self;
};