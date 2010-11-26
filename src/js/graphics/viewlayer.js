/**
# ViewLayer

In and of itself, a View does nothing.  Not without a 
ViewLayer at least.  A view is made up of one or more of these 
layers and they are drawn in order of *zindex*.

## Constructor Parameters

- `id` - the id that has been assigned to the layer, this value
can be used when later accessing the layer from a View.

- `zindex` (default: 0) - a zindex in Tile5 means the same thing it does in CSS

- `supportsFastDraw` (default: false) - The supportsFastDraw parameter specifies 
whether a layer will be drawn on in particular graphic states on devices that 
require fastDraw mode to perform at an optimal level.  For instance, if a layer does 
not support fastDraw and the View is panning or scaling, the layer will not be drawn 
so it's important when defining new layer classes to set this parameter to true if you 
want the layer visible during these operations.  Be aware though that layers that require 
some time to render will impact performance on slower devices.

- `validStates` - the a bitmask of DisplayState that the layer will be drawn
for

## Methods

*/
T5.ViewLayer = function(params) {
    params = T5.ex({
        id: "",
        zindex: 0,
        supportFastDraw: false,
        transparent: false,
        animated: false,
        validStates: T5.viewState("ACTIVE", "ANIMATING", "PAN", "PINCH")
    }, params);
    
    var parent = null,
        parentFastDraw = false,
        supportFastDraw = params.supportFastDraw,
        id = params.id,
        activeState = T5.viewState("ACTIVE"),
        validStates = params.validStates,
        lastOffsetX = 0,
        lastOffsetY = 0,
        transparent = params.transparent;
    
    var self = T5.ex({
        /**
        - `addToView(view)`
        
        */
        addToView: function(view) {
            view.setLayer(id, self);
        },
        
        /**
        - `shouldDraw(displayState)`
        
        Called by a View that contains the layer to determine 
        whether or not the layer should be drawn for the current display state.  
        The default implementation of this method first checks the fastDraw status, 
        and then continues to do a bitmask operation against the validStates property 
        to see if the current display state is acceptable.
        */
        shouldDraw: function(displayState, offset, redraw) {
            var drawOK = ((displayState & validStates) !== 0) && 
                (parentFastDraw ? supportFastDraw: true);
                
            // if prior checks have been ok and this is a transparent layer
            // check to see if a redraw is required
            if (drawOK && transparent) {
                // perform the check
                drawOK = redraw || (lastOffsetX !== offset.x) || (lastOffsetY !== offset.y);
                
                // and if ok, update the last offsetX and lastOffsetY
                if (drawOK) {
                    lastOffsetX = offset.x;
                    lastOffsetY = offset.y;
                } // if
            } // if
            
            return drawOK;
        },
        
        /**
        - `cycle(tickCount, offset, state, redraw)`
        
        Called in the View method of the same name, each layer has an opportunity 
        to update itself in the current animation cycle before it is drawn.
        */
        cycle: function(tickCount, offset, state, redraw) {
        },
        
        /**
        - `draw(context, offset, dimensions, state, view)`
        
        The business end of layer drawing.  This method is called when a layer needs to be 
        drawn and the following parameters are passed to the method:

            - context - the canvas context that we are drawing to
            - offset - a Vector object containing the current virtual canvas offset
            - dimensions - a Dimensions object specifying the actual size of the drawing surface
            - state - the current DisplayState of the view
            - view - a reference to the View
            - redraw - whether a redraw is required
            - tickCount - the current tick count
        */
        draw: function(context, offset, dimensions, state, view, redraw, tickCount) {
        },
        
        /**
        - `remove()`
        
        The remove method enables a view to flag that it is ready or should be removed
        from any views that it is contained in.  This was introduced specifically for
        animation layers that should only exist as long as an animation is active.
        */
        remove: function() {
            COG.say("layer.remove", { id: id });
        },
        
        /**
        - `wakeParent()`
        
        Another method that uses the WaterCooler event system to tell the containing view 
        that it needs to wake up and redraw itself.  This method is often called when a 
        ViewLayer knows it needs to redraw but it isn't able to communicate this another way.
        */
        wakeParent: function(invalidate) {
            if (parent) {
                parent.trigger(invalidate ? 'invalidate' : 'wake');
            } // if
        },
        
        /**
        - `getId()`
        
        */
        getId: function() {
            return id;
        },
        
        /**
        - `setId(string)`
        
        */
        setId: function(value) {
            id = value;
        },

        /**
        - `getParent()`
        
        */
        getParent: function() {
            return parent;
        },
        
        /**
        - `setParent(view: View)
        
        */
        setParent: function(view) {
            // update the parent
            parent = view;
            
            // update the parent fast draw state
            parentFastDraw = parent ? (parent.fastDraw && (displayState !== activeState)) : false;
            
            // trigger the parent change event
            self.trigger('parentChange', parent);
        }
    }, params); // self
    
    // make view layers observable
    COG.observable(self);

    return self;
}; // T5.ViewLayer
