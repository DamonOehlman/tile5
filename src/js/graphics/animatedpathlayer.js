/**
# T5.AnimatedPathLayer
_extends:_ T5.ViewLayer


The AnimatedPathLayer is way cool :)  This layer allows you to supply an array of 
screen / grid coordinates and have that animated using the functionality T5.Animation module. 
Any type of T5.PathLayer can generate an animation.

## Constructor
`new T5.AnimatedPathLayer(params);`

### Initialization Parameters

- path (T5.Vector[], default = []) - An array of screen / grid coordinates that will 
be used as anchor points in the animation.

- id (String, default = 'pathAni%autoinc') - The id of of the animation layer.  The id will start with 
pathAni1 and then automatically increment each time a new AnimatedPathLayer is created unless the id is 
manually specified in the constructor parameters.

- easing (easing function, default = T5.easing('sine.inout')) - the easing function to use for the animation

- drawIndicator (callback, default = defaultDraw) - A callback function that is called every time the indicator for 
the animation needs to be drawn.  If the parameter is not specified in the constructor the default callback 
is used, which simply draws a small circle at the current position of the animation.

- duration (int, default = 2000) - The animation duration.  See T5.Animation module information for more details.

- autoCenter (boolean, default = false) - Whether or not the T5.View should be panned with the animation.


## Draw Indicator Callback Function
`function(context, offset, xy, theta)`

The drawIndicator parameter in the constructor allows you to specify a particular callback function that is 
used when drawing the indicator.  The function takes the following arguments:

- context - the canvas context to draw to when drawing the indicator
- offset - the current tiling offset to take into account when drawing
- xy - the xy position where the indicator should be drawn (offset accounted for)
- theta - the current angle (in radians) given the path positioning.
*/
T5.AnimatedPathLayer = function(params) {
    params = T5.ex({
        path: [],
        id: COG.objId('pathAni'),
        easing: T5.easing('sine.inout'),
        validStates: T5.viewState("ACTIVE", "PAN", "PINCH"),
        drawIndicator: null,
        duration: 2000,
        autoCenter: false
    }, params);
    
    // generate the edge data for the specified path
    var edgeData = T5.V.edges(params.path), 
        tween,
        theta,
        indicatorXY = null,
        pathOffset = 0;
    
    function drawDefaultIndicator(context, offset, indicatorXY) {
        // draw an arc at the specified position
        context.fillStyle = "#FFFFFF";
        context.strokeStyle = "#222222";
        context.beginPath();
        context.arc(
            indicatorXY.x, 
            indicatorXY.y,
            4,
            0,
            Math.PI * 2,
            false);             
        context.stroke();
        context.fill();
    } // drawDefaultIndicator
    
    // calculate the tween
    tween = T5.tweenValue(
        0, 
        edgeData.total, 
        params.easing, 
        function() {
            self.remove();
        },
        params.duration);
        
    // if we are autocentering then we need to cancel on interaction
    // tween.cancelOnInteract = autoCenter;
        
    // request updates from the tween
    tween.requestUpdates(function(updatedValue, complete) {
        pathOffset = updatedValue;

        if (complete) {
            self.remove();
        } // if
    });
    
    // initialise self
    var self =  T5.ex(new T5.ViewLayer(params), {
        cycle: function(tickCount, offset, state, redraw) {
            var edgeIndex = 0;

            // iterate through the edge data and determine the current journey coordinate index
            while ((edgeIndex < edgeData.accrued.length) && (edgeData.accrued[edgeIndex] < pathOffset)) {
                edgeIndex++;
            } // while

            // reset offset xy
            indicatorXY = null;

            // if the edge index is valid, then let's determine the xy coordinate
            if (edgeIndex < params.path.length-1) {
                var extra = pathOffset - (edgeIndex > 0 ? edgeData.accrued[edgeIndex - 1] : 0),
                    v1 = params.path[edgeIndex],
                    v2 = params.path[edgeIndex + 1];

                theta = T5.V.theta(v1, v2, edgeData.edges[edgeIndex]);
                indicatorXY = T5.V.pointOnEdge(v1, v2, theta, extra);

                if (params.autoCenter) {
                    var parent = self.getParent();
                    if (parent) {
                        parent.centerOn(indicatorXY);
                    } // if
                } // if
            } // if
            
            return indicatorXY;
        },
        
        draw: function(context, offset, dimensions, state, view) {
            if (indicatorXY) {
                // if the draw indicator method is specified, then draw
                (params.drawIndicator ? params.drawIndicator : drawDefaultIndicator)(
                    context,
                    offset,
                    new T5.Vector(indicatorXY.x - offset.x, indicatorXY.y - offset.y),
                    theta
                );
            } // if
        }
    });

    return self;
}; // T5.AnimatedPathLayer
