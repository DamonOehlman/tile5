T5.ViewState = (function() {
    var self = {
        // define the view state constants
        NONE: 0,
        ACTIVE: 1,
        ANIMATING: 4,
        PAN: 8,
        PINCHZOOM: 16,
        FREEZE: 128,
        
        get: function() {
            var result = 0;
            
            for (var ii = arguments.length; ii--; ) {
                var value = self[arguments[ii]];
                if (value) {
                    result = result | value;
                } // if
            } // for
            
            return result;
        }
    };
    
    return self;
})();
