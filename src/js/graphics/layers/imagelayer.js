/**
# T5.ImageLayer
*/
var ImageLayer = function(genId, params) {
    params = COG.extend({
        imageLoadArgs: {}
    }, params);
    
    // initialise variables
    var genFn = genId ? Generator.init(genId, params).run : null,
        generating = false,
        lastGenX = 0,
        lastGenY = 0,
        loadArgs = params.imageLoadArgs,
        regenTimeout = 0,
        regenViewRect = null,
        tiles = [];
    
    /* private internal functions */
    
    function regenerate(view, viewRect) {
        var xyDiff = max(abs(viewRect.x1 - lastGenX), abs(viewRect.y1 - lastGenY)),
            regen = xyDiff >= 128 && genFn && (! generating);

        if (regen) {
            // flag as generating
            generating = true;
            
            var tickCount = new Date().getTime();
            
            // fire the generator
            genFn(view, viewRect, function(newTiles) {
                // update the last generated positions
                lastGenX = viewRect.x1;
                lastGenY = viewRect.y1;

                // update the tiles
                tiles = [].concat(newTiles);
                
                // clear the generating flag
                generating = false;
                view.redraw = true;
                COG.info('GEN COMPLETED IN ' + (new Date().getTime() - tickCount) + ' ms');
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