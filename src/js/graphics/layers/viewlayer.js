/**
# T5.ViewLayer

In and of it_self, a View does nothing.  Not without a 
ViewLayer at least.  A view is made up of one or more of these 
layers and they are drawn in order of *zindex*.

## Constructor
`T5.ViewLayer(params)`

### Initialization Parameters

- `id` - the id that has been assigned to the layer, this value
can be used when later accessing the layer from a View.

- `zindex` (default: 0) - a zindex in Tile5 means the same thing it does in CSS

- `validStates` - the a bitmask of DisplayState that the layer will be drawn for


## Events

### changed
This event is fired in response to the `changed` method being called.  This method is
called primarily when you have made modifications to the layer in code and need to 
flag to the containing T5.View that an redraw is required.  Any objects that need to 
perform updates in response to this layer changing (including overriden implementations)
can do this by binding to the change method

~ layer.bind('change', function(evt, layer) {
~   // do your updates here...
~ });

### parentChange
This event is fired with the parent of the layer has been changed

<pre>
layer.bind('parentChange', function(evt, parent) {
);
</pre>

## Methods

*/
function ViewLayer(params) {
    params = COG.extend({
        id: COG.objId('layer'),
        zindex: 0,
        animated: false,
        validStates: viewState('ACTIVE', 'ANIMATING', 'PAN', 'ZOOM'),
        style: null,
        minXY: null,
        maxXY: null
    }, params);
    
    // initialise members
    this.view = null;
    this.visible = true;

    // make view layers observable
    COG.observable(COG.extend(this, params));
}; // ViewLayer constructor

ViewLayer.prototype = {
    constructor: ViewLayer,

    /**
    ### clip(context, offset, dimensions, state)
    */
    clip: null,
    
    /**
    ### cycle(tickCount, offset, state)
    
    Called in the View method of the same name, each layer has an opportunity 
    to update it_self in the current animation cycle before it is drawn.
    */
    cycle: function(tickCount, offset, state) {
    },
    
    /**
    ### draw(context, offset, dimensions, state, view)
    
    The business end of layer drawing.  This method is called when a layer needs to be 
    drawn and the following parameters are passed to the method:

        - renderer - the renderer that will be drawing the viewlayer
        - viewport - the current viewport
        - state - the current DisplayState of the view
        - view - a reference to the View
        - tickCount - the current tick count
        - hitData - an object that contains information regarding the current hit data
    */
    draw: function(renderer, viewport, state, view, tickCount, hitData) {
    },
    
    /**
    ### hitGuess(hitX, hitY, state, view)
    The hitGuess function is used to determine if a layer would return elements for
    a more granular hitTest.  Essentially, hitGuess calls are used when events such 
    as hover and tap events occur on a view and then if a positive result is detected
    the canvas is invalidated and checked in detail during the view layer `draw` operation.
    By doing this we can just do simple geometry operations in the hitGuess function
    and then make use of canvas functions such as `isPointInPath` to do most of the heavy
    lifting for us
    */
    hitGuess: null
}; // ViewLayer.prototype