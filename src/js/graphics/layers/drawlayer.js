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
    var drawables = [];
        
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
    
    function draw(renderer, state, view, tickCount, hitData) {
        var emptyProps = {
            };
            
        // iterate through the drawabless and draw the layers
        for (var ii = drawables.length; ii--; ) {
            var drawable = drawables[ii],
                overrideStyle = drawable.style || _self.style, 
                styleType,
                previousStyle,
                transform = renderer.applyTransform(drawable),
                drawProps = drawable.getProps ? drawable.getProps(renderer, state) : emptyProps,
                
                prepFn = renderer['prep' + drawable.typeName],
                drawFn,
                
                drawData = prepFn ? prepFn.call(renderer, 
                    drawable,
                    hitData,
                    state,
                    drawProps) : null;
                    
            // prep the path for the child
            if (drawData) {
                // if the element has been hit then update
                if (drawData.hit) {
                    hitData.elements.push(Hits.initHit(
                        drawable.type, 
                        drawable, 
                        drawable.draggable ? drawable.drag : null)
                    );

                    // init the style type to match the type of event
                    styleType = hitData.type + 'Style';

                    // now update the override style to use the specified style if it exists
                    overrideStyle = drawable[styleType] || _self[styleType] || overrideStyle;
                } // if

                // save the previous style
                previousStyle = overrideStyle ? renderer.applyStyle(overrideStyle) : null;
                
                // get the draw function (using the drawable override if defined)
                drawFn = drawable.draw || drawData.draw;
                
                // if we have a draw function then run it
                if (drawFn) {
                    drawFn.call(drawable, drawData);
                } // if
                
                // if we have a previous style, then restore that style
                if (previousStyle) {
                    renderer.applyStyle(previousStyle);
                } // if
            } // if
            
            // if a transform was applied, then restore the canvas
            if (transform && transform.undo) {
                transform.undo();
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