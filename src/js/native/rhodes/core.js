SLICK.Rhodes = (function() {
    // initialise the module
    var module = {
        
    };
    
    // ATTACH a logging listener to send logging messages back to base
    GRUNT.Log.requestUpdates(function(logentry) {
        GRUNT.XHR.ajax({
            url: "/app/SlickBridge/logProxy",
            method: "POST",
            data: logentry
        });
    });
    
    // register the module with the native modules
    if (typeof SLICK.Native !== 'undefined') {
        SLICK.Native.registerPlatformModule("rhodes", module);
    } // if    
    
    return module;
})();

