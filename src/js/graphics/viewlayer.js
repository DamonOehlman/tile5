T5.ViewLayer = function(params) {
    params = T5.ex({
        id: "",
        zindex: 0,
        supportFastDraw: false,
        validStates: T5.viewState("ACTIVE", "ANIMATING", "PAN", "PINCH")
    }, params);
    
    var parent = null,
        id = params.id,
        activeState = T5.viewState("ACTIVE");
    
    var self = T5.ex({
        addToView: function(view) {
            view.setLayer(id, self);
        },
        
        shouldDraw: function(displayState) {
            var stateValid = (displayState & params.validStates) !== 0,
                fastDraw = parent ? (parent.fastDraw && (displayState !== activeState)) : false;

            return stateValid && (fastDraw ? params.supportFastDraw : true);
        },
        
        cycle: function(tickCount, offset, state) {
            return 0;
        },
        
        draw: function(context, offset, dimensions, state, view) {
        },
        
        /**
        The remove method enables a view to flag that it is ready or should be removed
        from any views that it is contained in.  This was introduced specifically for
        animation layers that should only exist as long as an animation is active.
        */
        remove: function() {
            GT.say("layer.remove", { id: id });
        },
        
        wakeParent: function() {
            if (parent) {
                parent.trigger("wake");
            } // if
        },
        
        getId: function() {
            return id;
        },
        
        setId: function(value) {
            id = value;
        },

        getParent: function() {
            return parent;
        },
        
        setParent: function(view) {
            parent = view;
        }
    }, params); // self
    
    GT.observable(self);
    
    return self;
}; // T5.ViewLayer
