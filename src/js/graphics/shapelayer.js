/**
# T5.ShapeLayer
_extends:_ T5.ViewLayer


The ShapeLayer is designed to facilitate the storage and display of multiple 
geometric shapes.  This is particularly useful for displaying [GeoJSON](http://geojson.org) 
data and the like.

## Methods
*/
var ShapeLayer = function(params) {
    params = COG.extend({
        zindex: 10
    }, params);
    
    // initialise variables
    var shapes = [],
        pipTransformed = CANI.canvas.pipTransformed;
        
    /* private functions */
    
    function performSync(view) {
        // iterate through the shapes and resync to the grid
        for (var ii = shapes.length; ii--; ) {
            shapes[ii].resync(view);
        } // for
        
        // sort the shapes so the topmost, leftmost is drawn first followed by other shapes
        shapes.sort(function(shapeA, shapeB) {
            var diff = shapeB.xy.y - shapeA.xy.y;
            return diff != 0 ? diff : shapeB.xy.x - shapeA.xy.y;
        });
        
        _self.changed();
    } // performSync
    
    /* event handlers */
    
    function handleResync(evt, parent) {
        performSync(parent);
    } // handleParentChange
    
    /* exports */
    
    function draw(context, viewRect, state, view, tickCount, hitData) {
        var viewX = viewRect.x1,
            viewY = viewRect.y1,
            hitX = hitData ? (pipTransformed ? hitData.x - viewX : hitData.relXY.x) : 0,
            hitY = hitData ? (pipTransformed ? hitData.y - viewY : hitData.relXY.y) : 0,
            viewWidth = viewRect.width,
            viewHeight = viewRect.height;
        
        // iterate through the shapes and draw the layers
        for (var ii = shapes.length; ii--; ) {
            var shape = shapes[ii],
                overrideStyle = shape.style, 
                styleType,
                previousStyle,
                prepped,
                transformed = shape.transformed;
                
            if (transformed) {
                shape.transform(context, viewX, viewY);
                
                // if point in path is transformed, then adjust the hit x and y accordingly
                if (pipTransformed) {
                    hitX -= shape.xy.x;
                    hitY -= shape.xy.y;
                } // if
            } // if
                
            // prep the path
            prepped = shape.prepPath(
                context, 
                transformed ? shape.xy.x : viewX, 
                transformed ? shape.xy.y : viewY, 
                viewWidth, 
                viewHeight, 
                state);
            
            // prep the path for the child
            if (prepped) {
                // check for a hit in the path that has just been drawn
                if (hitData && context.isPointInPath(hitX, hitY)) {
                    hitData.elements.push(Hits.initHit(shape.type, shape, {
                        drag: shape.draggable ? shape.drag : null
                    }));

                    // init the style type to match the type of event
                    styleType = hitData.type + 'Style';

                    // now update the override style to use the specified style if it exists
                    overrideStyle = shape[styleType] || _self[styleType] || overrideStyle;
                } // if

                // save the previous style
                previousStyle = overrideStyle ? Style.apply(context, overrideStyle) : null;
                
                // draw the layer
                shape.draw(context, viewX, viewY, viewWidth, viewHeight, state);
                
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
    ### find(selector: String)
    The find method will eventually support retrieving all the shapes from the shape
    layer that match the selector expression.  For now though, it just returns all shapes
    */
    function find(selector) {
        return [].concat(shapes);
    } // find
    
    /**
    ### hitGuess(hitX, hitY, state, view)
    Return true if any of the markers are hit, additionally, store the hit elements
    so we don't have to do the work again when drawing
    */
    function hitGuess(hitX, hitY, state, view) {
        var hit = false;
        
        // iterate through the shapes and check for hits on the bounds
        for (var ii = shapes.length; (! hit) && ii--; ) {
            var shape = shapes[ii],
                bounds = shape.bounds;
            
            // update the the shapes hit state
            hit = hit || (bounds && 
                hitX >= bounds.x1 && hitX <= bounds.x2 &&
                hitY >= bounds.y1 && hitY <= bounds.y2);
        } // for
        
        return hit;
    } // hitGuess
    
    /* initialise _self */
    
    var _self = COG.extend(new ViewLayer(params), {
        /**
        ### add(poly)
        Used to add a T5.Poly to the layer
        */
        add: function(shape) {
            if (shape) {
                shape.layer = _self;
                
                // sync this shape with the parent view
                var view = _self.getParent();
                if (view) {
                    shape.resync(_self.getParent());
                    
                    view.invalidate();
                } // if
            
                // add the the shapes array
                shapes[shapes.length] = shape;
            } // if
        },
        
        clear: function() {
            shapes = [];
        },
        
        draw: draw,
        find: find,
        hitGuess: hitGuess
    });
    
    // handle grid updates
    _self.bind('parentChange', handleResync);
    _self.bind('resync', handleResync);
    
    return _self;
};