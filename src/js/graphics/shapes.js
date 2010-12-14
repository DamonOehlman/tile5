/**
# T5.Shape
The T5.Shape class is simply a template class that provides placeholder methods
that need to be implemented for shapes that can be drawn in a T5.ShapeLayer.

## Constructor
`new T5.Shape(params);`

### Initialization Parameters

- 
*/
T5.Shape = function(params) {
    params = T5.ex({
        style: null,
        properties: {}
    }, params);
    
    return T5.ex(params, {
        rect: null,
        
        /**
        ### draw(context, offsetX, offsetY, width, height, state)
        */
        draw: function(context, offsetX, offsetY, width, height, state) {
        },
        
        /**
        ### resync(view)
        */
        resync: function(view) {
        }
    });
};

T5.Arc = function(origin, params) {
   params = T5.ex({
       size: 4
   }, params);
   
   // iniitialise variables
   var drawXY = T5.XY.init();
   
   // initialise self
   var self = T5.ex(params, {
       /**
       ### draw(context, offsetX, offsetY, width, height, state)
       */
       draw: function(context, offsetX, offsetY, width, height, state) {
           context.beginPath();
           context.arc(
               drawXY.x, 
               drawXY.y, 
               self.size,
               0,
               Math.PI * 2,
               false);
               
           context.fill();
           context.stroke();
       },
       
       /**
       ### resync(view)
       */
       resync: function(view) {
           var centerXY = view.syncXY([origin]).origin;
           drawXY = T5.XY.floor([origin])[0];
       }
   });
   
   COG.Log.info('created arc = ', origin);
   return self;
}; 

/**
# T5.Poly
This class is used to represent individual poly(gon/line)s that are drawn within
a T5.PolyLayer.  

## Constructor

`new T5.Poly(points, params)`

The constructor requires an array of vectors that represent the poly and 
also accepts optional initialization parameters (see below).


### Initialization Parameters

- `fill` (default = true) - whether or not the poly should be filled.
- `style` (default = null) - the style override for this poly.  If none
is specified then the style of the T5.PolyLayer is used.


## Methods
*/
T5.Poly = function(points, params) {
    params = T5.ex({
        fill: false,
        simplify: false
    }, params);

    // initialise variables
    var haveData = false,
        fill = params.fill,
        simplify = params.simplify,
        stateZoom = T5.viewState('ZOOM'),
        drawPoints = [];
    
    /* exported functions */
    
    /**
    ### draw(context, offsetX, offsetY, state)
    This method is used to draw the poly to the specified `context`.  The 
    `offsetX` and `offsetY` arguments specify the panning offset of the T5.View
    which is taken into account when drawing the poly to the display.  The 
    `state` argument specifies the current T5.ViewState of the view.
    */
    function draw(context, offsetX, offsetY, width, height, state) {
        if (haveData) {
            var first = true,
                draw = (state & stateZoom) !== 0;
            
            context.beginPath();
            
            // now draw the lines
            // COG.Log.info('drawing poly: have ' + drawVectors.length + ' vectors');
            for (var ii = drawPoints.length; ii--; ) {
                var x = drawPoints[ii].x,
                    y = drawPoints[ii].y;
                    
                if (first) {
                    context.moveTo(x, y);
                    first = false;
                }
                else {
                    context.lineTo(x, y);
                } // if..else
                
                // update the draw status
                // TODO: this fails on large polygons that surround the current view
                // fix and resinstate
                draw = true; // draw || ((x >= 0 && x <= width) && (y >= 0 && y <= height));
            } // for

            // if the polygon is even partially visible then draw it
            if (draw) {
                if (fill) {
                    context.fill();
                } // if

                context.stroke();
            } // if
        } // if
    } // drawPoly
    
    /**
    ### resync(view)
    Used to synchronize the points of the poly to the grid.
    */
    function resync(view) {
        self.xy = view.syncXY(points);
        
        // simplify the vectors for drawing (if required)
        drawPoints = T5.XY.floor(simplify ? T5.XY.simplify(points) : points);
    } // resyncToGrid
    
    /* define self */
    
    var self = T5.ex(new T5.Shape(params), {
        draw: draw,
        resync: resync
    });

    // initialise the first item to the first element in the array
    haveData = points && (points.length >= 2);
    
    return self;
};
