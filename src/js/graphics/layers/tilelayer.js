/**
# T5.ImageLayer
*/
var TileLayer = function(genId, params) {
    params = COG.extend({
        imageLoadArgs: {}
    }, params);
    
    // initialise variables
    var genFn = genId ? Generator.init(genId, params).run : null,
        generating = false,
        rt = null,
        loadArgs = params.imageLoadArgs;
    
    /* event handlers */

    function handleRefresh(evt, view, viewRect) {
        var tickCount = new Date().getTime();
        
        if (rt) {
            // fire the generator
            genFn(view, viewRect, rt, function() {
                view.invalidate();
                COG.info('GEN COMPLETED IN ' + (new Date().getTime() - tickCount) + ' ms');
            });
        } // if
    } // handleViewIdle
    
    function handleResync(evt, view) {
        // create a new rtree
        rt = new RTree();
    } // handleParentChange    
    
    /* exports */
    
    /**
    ### draw(renderer)
    */
    function draw(renderer, viewport) {
        var tiles = rt ? rt.search(viewport) : [];
        
        // COG.info('looking for tiles in viewport: x: ' + viewport.x + ', y: ' + viewport.y + ', width: ' + viewport.w + ', height: ' + viewport.h + ', found = ' + tiles.length);
        renderer.drawTiles(viewport, tiles);
    } // draw    
    
    /* definition */
    
    var _self = COG.extend(new ViewLayer(params), {
        draw: draw
    });
    
    _self.bind('refresh', handleRefresh);
    _self.bind('parentChange', handleResync);
    _self.bind('resync', handleResync);
    
    return _self;
};