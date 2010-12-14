(function() {
    var viewStates = {
        NONE: 0,
        ACTIVE: 1,
        ANIMATING: 4,
        PAN: 8,
        ZOOM: 16,
        FREEZE: 128
    };
    
    /**
    # T5.viewState
    The T5.viewState function is used to return the value of the view state requested of the function.  The
    function supports a request for multiple different states and in those cases, returns a bitwise-or of the 
    states.
    
    ## View State Bitwise Values
    
    - NONE = 0
    - ACTIVE = 1
    - _UNUSED_ = 2
    - ANIMATING = 4
    - PAN = 8
    - ZOOM = 16
    - _UNUSED_ = 32
    - _UNUSED_ = 64
    - FREEZE = 128
    
    
    ## Example Usage
    ~ // get the active state
    ~ var stateActive = T5.viewState('active');
    ~ 
    ~ // get the bitmask for a view state of active or panning
    ~ var stateActivePan = T5.viewState('active', 'pan');
    ~
    ~ // add the animating state to the stateActivePan variable
    ~ stateActivePan = stateActivePan | T5.viewState('animating');
    
    ~ // now test whether the updated state is still considered activate
    ~ if ((stateActive & stateActivePan) !== 0) {
    ~     // yep, we are active
    ~ } // if 
    */
    T5.viewState = function() {
        var result = 0;
        
        for (var ii = arguments.length; ii--; ) {
            var value = viewStates[arguments[ii].toUpperCase()];
            if (value) {
                result = result | value;
            } // if
        } // for
        
        return result;
    }; // T5.viewState
})();
