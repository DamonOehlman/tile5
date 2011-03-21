/**
# T5.ImageLayer
*/
var ImageLayer = function(genId, params) {
    params = COG.extend({
        renderer: 'canvas', // 'dom',
        imageLoadArgs: {}
    }, params);
    
    // initialise variables
    var genFn = genId ? Generator.init(genId, params).run : null,
        imageRenderers = {
            canvas: CanvasImageRenderer,
            dom: DOMImageRenderer
        },
        lastViewRect = null,
        loadArgs = params.imageLoadArgs,
        renderer = getImageRenderer(params.renderer),
        regenTimeout = 0,
        regenViewRect = null;
    
    /* private internal functions */
    
    function getImageRenderer(type) {
        return new imageRenderers[type]();
    } // getImageRenderer
    
    function regenerate(viewRect) {
        var xyDiff = lastViewRect ? 
                Math.abs(lastViewRect.x1 - viewRect.x1) + Math.abs(lastViewRect.y1 - viewRect.y1) :
                0;

        if (genFn && ((! lastViewRect) || (xyDiff > 256))) {
            var view = _self.view,
                imageData,
                images,
                url,
                ii;
            
            // COG.info('generating: ' + XYRect.toString(viewRect) + ', sequence = ' + sequenceId);

            genFn(view, viewRect, function(newImages) {
                lastViewRect = XYRect.copy(viewRect);

                // TODO: check request still valid
                renderer.updateImages(newImages);
            });
        } // if    
    } // regenerate
    
    /* event handlers */
    
    function handleParentChange(evt, view, canvas, context) {
        if (renderer) {
            renderer.attach(view, canvas, context);
        } // if
    } // handleParentChange
    
    function handleRefresh(evt, view, viewRect) {
        regenerate(viewRect);
    } // handleViewIdle
    
    /* exports */
    
    /* definition */
    
    var _self = COG.extend(new ViewLayer(params), {
        clip: renderer.clip,
        draw: renderer.draw
    });
    
    _self.bind('parentChange', handleParentChange);
    _self.bind('refresh', handleRefresh);
    
    return _self;
};