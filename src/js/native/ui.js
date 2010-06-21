SLICK.Native.UI = (function() {
    // initialise module
    var module = {
        getToolbarButton: function(params) {
            // get the native module handler
            SLICK.Native.platformExec("UI.getToolbarButton", params);
        }
    };
    
    return module;
})();