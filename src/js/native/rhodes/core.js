TILE5.Rhodes = (function() {
    // initialise the module
    var module = {
        
    };
    
    // ATTACH a logging listener to send logging messages back to base
    GRUNT.Log.requestUpdates(function(logentry) {
        GRUNT.XHR.ajax({
            url: "/app/TILE5Bridge/logProxy",
            method: "POST",
            data: logentry
        });
    });
    
    // register the module with the native modules
    if (typeof TILE5.Native !== 'undefined') {
        TILE5.Native.registerPlatformModule("rhodes", module);
    } // if    
    
    return module;
})();

