/**
# T5.DrawLayer
_extends:_ T5.ViewLayer


The DrawLayer is a generic layer that handles drawing, hit testing and syncing a list
of drawables.  A T5.DrawLayer itself is never meant to be implemented as it has no
internal `T5.Drawable` storage, but rather relies on descendants to implement storage and
provide the drawables by the `loadDrawables` method.

## Methods
*/
var DrawLayer = function(params) {
    params = COG.extend({
        zindex: 10
    }, params);
    
    // initialise variables
    var drawables = [],
        pipTransformed = CANI.canvas.pipTransformed,
        isFlashCanvas = typeof FlashCanvas != 'undefined';
        
    /* private functions */
    
    function quickHitCheck(drawable, hitX, hitY) {
        var bounds = drawable.bounds;
        
        return (bounds && 
            hitX >= bounds.x1 && hitX <= bounds.x2 &&
            hitY >= bounds.y1 && hitY <= bounds.y2);
    } // quickHitCheck
    
    /* event handlers */
    
    function handleRefresh(evt, view, viewRect) {
        drawables = _self.getDrawables(view, viewRect);
    } // handleViewIdle
    
    /* exports */
    
    function draw(context, viewRect, state, view, tickCount, hitData) {
        var viewX = viewRect.x1,
            viewY = viewRect.y1,
            hitX = hitData ? (pipTransformed ? hitData.x - viewX : hitData.relXY.x) : 0,
            hitY = hitData ? (pipTransformed ? hitData.y - viewY : hitData.relXY.y) : 0,
            viewWidth = viewRect.width,
            viewHeight = viewRect.height;
            
        // iterate through the drawabless and draw the layers
        for (var ii = drawables.length; ii--; ) {
            var drawable = drawables[ii],
                overrideStyle = drawable.style || _self.style, 
                styleType,
                previousStyle,
                prepped,
                isHit = false,
                transformed = drawable.transformed && (! isFlashCanvas);
                
            if (transformed) {
                drawable.transform(context, viewX, viewY);
                
                // if point in path is transformed, then adjust the hit x and y accordingly
                if (pipTransformed) {
                    hitX -= drawable.xy.x;
                    hitY -= drawable.xy.y;
                } // if
            } // if
                
            // prep the path
            prepped = drawable.prepPath(
                context, 
                transformed ? drawable.xy.x : viewX, 
                transformed ? drawable.xy.y : viewY, 
                viewWidth, 
                viewHeight, 
                state);
            
            // prep the path for the child
            if (prepped) {
                // check for a hit in the path that has just been drawn
                if (hitData && context.isPointInPath(hitX, hitY)) {
                    hitData.elements.push(Hits.initHit(drawable.type, drawable, {
                        drag: drawable.draggable ? drawable.drag : null
                    }));

                    // init the style type to match the type of event
                    styleType = hitData.type + 'Style';

                    // now update the override style to use the specified style if it exists
                    overrideStyle = drawable[styleType] || _self[styleType] || overrideStyle;
                } // if

                // save the previous style
                previousStyle = overrideStyle ? Style.apply(context, overrideStyle) : null;
                
                // draw the layer
                drawable.draw(context, viewX, viewY, viewWidth, viewHeight, state);
                
                // if we have a previous style, then restore that style
                if (previousStyle) {
                    Style.apply(context, previousStyle);
                } // if
            } // if
            
            // if a transform was applied, then restore the canvas
            if (transformed) {
                context.restore();
            } // if
        } // for
    } // draw
    
    /**
    ### getDrawables(view, viewRect)
    */
    function getDrawables(view, viewRect) {
        return [];
    } // getDrawables
    
    /**
    ### hitGuess(hitX, hitY, state, view)
    Return true if any of the markers are hit, additionally, store the hit elements
    so we don't have to do the work again when drawing
    */
    function hitGuess(hitX, hitY, state, view) {
        var hit = false;
        
        // iterate through the drawables and check for hits on the bounds
        for (var ii = drawables.length; (! hit) && ii--; ) {
            var drawable = drawables[ii],
                bounds = drawable.bounds;
            
            // update the the drawables hit state
            hit = hit || quickHitCheck(drawable, hitX, hitY);
        } // for
        
        return hit;
    } // hitGuess
    
    /* initialise _self */
    
    var _self = COG.extend(new ViewLayer(params), {
        draw: draw,
        getDrawables: getDrawables,
        hitGuess: hitGuess
    });
    
    // bind to refresh events as we will use those to populate the items to be drawn
    _self.bind('refresh', handleRefresh);
    
    return _self;
};