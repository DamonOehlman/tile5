/**
# T5.Marker
__extends__: T5.Shape

## Constructor

`new T5.Marker(params)`


#### Initialization Parameters


## Methods
*/
var Marker = function(params) {
    params = COG.extend({
        xy: XY.init(),
        draggable: false,
        size: 10,
        type: 'marker'
    }, params);
    
    // initialise variables
    var size = params.size;
    /* exported functions */
    
    /**
    ### drag(dragData, dragX, dragY, drop)
    */
    function drag(dragData, dragX, dragY, drop) {
        self.xy.x = dragX;
        self.xy.y = dragY;
        
        return true;
    } // drag
    
    /**
    ### prepPath(context, offsetX, offsetY, width, height, state, hitData)
    Prepare the path that will draw the polygon to the canvas
    */
    function prepPath(context, x, y, width, height, state) {
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2, false);
        
        // update the bounds
        self.bounds = XYRect.fromCenter(x, y, size, size);
        
        return true;
    } // prepPath
    
    /**
    ### resync(view)
    Used to synchronize the points of the poly to the grid.
    */
    function resync(view) {
        view.syncXY([self.xy]);
    } // resyncToGrid
    
    /* define self */
    
    var self = COG.extend(new Shape(params), {
        drag: drag,
        prepPath: prepPath,
        resync: resync
    });

    return self;
};