/**
# T5.ViewLayer

In and of itself, a View does nothing.  Not without a 
ViewLayer at least.  A view is made up of one or more of these 
layers and they are drawn in order of *zindex*.

## Constructor
`T5.ViewLayer(params)`

### Initialization Parameters

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
T5.ViewLayer = function(params) {
    params = T5.ex({
        id: "",
        zindex: 0,
        supportFastDraw: false,
        animated: false,
        validStates: T5.viewState('ACTIVE', 'ANIMATING', 'PAN', 'ZOOM'),
        style: null,
        minXY: null,
        maxXY: null
    }, params);
    
    var parent = null,
        parentFastDraw = false,
        changed = false,
        supportFastDraw = params.supportFastDraw,
        id = params.id,
        activeState = T5.viewState("ACTIVE"),
        validStates = params.validStates,
        lastOffsetX = 0,
        lastOffsetY = 0;
    
    var self = T5.ex({
        /**
        ### addToView(view)
        Used to add the layer to a view.  This simply calls T5.View.setLayer
        */
        addToView: function(view) {
            view.setLayer(id, self);
        },
        
        /**
        ### shouldDraw(displayState)
        
        Called by a View that contains the layer to determine 
        whether or not the layer should be drawn for the current display state.  
        The default implementation of this method first checks the fastDraw status, 
        and then continues to do a bitmask operation against the validStates property 
        to see if the current display state is acceptable.
        */
        shouldDraw: function(displayState, offset, redraw) {
            var drawOK = ((displayState & validStates) !== 0) && 
                (parentFastDraw ? supportFastDraw: true);
                
            // perform the check
            drawOK = changed || redraw || (lastOffsetX !== offset.x) || (lastOffsetY !== offset.y);

            return drawOK;
        },
        
        /**
        ### cycle(tickCount, offset, state, redraw)
        
        Called in the View method of the same name, each layer has an opportunity 
        to update itself in the current animation cycle before it is drawn.
        */
        cycle: function(tickCount, offset, state, redraw) {
        },
        
        /**
        ### draw(context, offset, dimensions, state, view)
        
        The business end of layer drawing.  This method is called when a layer needs to be 
        drawn and the following parameters are passed to the method:

            - context - the canvas context that we are drawing to
            - viewRect - the current view rect
            - state - the current DisplayState of the view
            - view - a reference to the View
            - redraw - whether a redraw is required
            - tickCount - the current tick count
        */
        draw: function(context, viewRect, state, view, redraw, tickCount) {
        },
        
        /**
        ### remove()
        
        The remove method enables a view to flag that it is ready or should be removed
        from any views that it is contained in.  This was introduced specifically for
        animation layers that should only exist as long as an animation is active.
        */
        remove: function() {
            self.trigger('remove', self);
        },
        
        /**
        ### changed()
        
        The changed method is used to flag the layer has been modified and will require 
        a redraw
        
        */
        changed: function() {
            // flag as changed
            changed = true;
            self.trigger('changed', self);
            
            // invalidate the parent
            if (parent) {
                parent.trigger('invalidate');
            } // if
        },
        
        /**
        ### getId()
        
        */
        getId: function() {
            return id;
        },
        
        /**
        ### setId(string)
        
        */
        setId: function(value) {
            id = value;
        },

        /**
        ### getParent()
        
        */
        getParent: function() {
            return parent;
        },
        
        /**
        ### setParent(view: View)
        
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
    
    // handle the draw complete
    self.bind('drawComplete', function(evt, offset) {
        changed = false;

        // update the last offset
        lastOffsetX = offset.x;
        lastOffsetY = offset.y;
    });
    
    self.bind('resync', function(evt, view) {
       if (view.syncXY) {
           if (self.minXY) {
               view.syncXY(self.minXY);
               COG.Log.info('resyncing min', self.minXY);
           } // if
           
           if (self.maxXY) {
               view.syncXY(self.maxXY);
               COG.Log.info('resyncing max', self.maxXY);
           } // if
       } // if
    });

    return self;
}; // T5.ViewLayer
