SLICK.Titanium = (function() {
    // initialise the module
    var module = {
        platformExec: function(fnCall, params) {
            Ti.App.fireEvent("platformExec", jQuery.extend({
                call: fnCall
            }, params));
        }
    };
    
    // if we are running within titanium, call the logging inside titanium
    if (typeof Ti !== 'undefined') {
        // ATTACH a logging listener to send logging messages back to base
        SLICK.Logger.requestUpdates(function(logEntry) {
            Ti.API[logEntry.clsName](logEntry.msg);
        });    
    } // if
    
    // register the module with the native modules
    if (typeof SLICK.Native !== 'undefined') {
        SLICK.Native.registerPlatformModule("titanium", module);
    } // if    
    
    return module;
})();

