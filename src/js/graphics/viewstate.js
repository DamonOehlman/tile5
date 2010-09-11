(function() {
    var viewStates = {
        NONE: 0,
        ACTIVE: 1,
        ANIMATING: 4,
        PAN: 8,
        PINCH: 16,
        FREEZE: 128
    };
    
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
