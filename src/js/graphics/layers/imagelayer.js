/**
# T5.ImageLayer
*/
var ImageLayer = function(genId, params) {
    params = COG.extend({
        imageLoadArgs: {}
    }, params);
    
    // initialise variables
    var genFn = genId ? Generator.init(genId, params).run : null,
        lastViewRect = null,
        loadArgs = params.imageLoadArgs,
        regenTimeout = 0,
        regenViewRect = null,
        tiles = [];
    
    /* private internal functions */
    
    function regenerate(view, viewRect) {
        var xyDiff = lastViewRect ? 
                Math.abs(lastViewRect.x1 - viewRect.x1) + Math.abs(lastViewRect.y1 - viewRect.y1) :
                0;

        if (genFn && ((! lastViewRect) || (xyDiff > 256))) {
            genFn(view, viewRect, function(newTiles) {
                lastViewRect = XYRect.copy(viewRect);
                
                tiles = [].concat(newTiles);
            });
        } // if    
    } // regenerate
    
    /* event handlers */

    function handleRefresh(evt, view, viewRect) {
        regenerate(view, viewRect);
    } // handleViewIdle
    
    /* exports */
    
    /**
    ### draw(renderer)
    */
    function draw(renderer) {
        renderer.drawTiles(tiles);
    } // draw    
    
    /* definition */
    
    var _self = COG.extend(new ViewLayer(params), {
        draw: draw
    });
    
    _self.bind('refresh', handleRefresh);
    
    return _self;
};