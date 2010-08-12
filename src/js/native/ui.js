TILE5.Native.UI = (function() {
    // initialise module
    var module = {
        getToolbarButton: function(params) {
            // get the native module handler
            TILE5.Native.platformExec("UI.getToolbarButton", params);
        }
    };
    
    return module;
})();