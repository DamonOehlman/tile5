SLICK.Native = (function() {
    // initialise variables
    var platformMods = {};
    
    // initialise module
    var module = {
        getPlatformModule: function(moduleId) {
            // if the module id is not specified, then just go with the first module
            if (! moduleId) {
                // FIXME: there must be a better constructor for doing this
                for (var keyname in platformMods) {
                    moduleId = keyname;
                    break;
                } // for
            }
            
            return platformMods[moduleId];
        },
        
        platformExec: function(fnCall, params) {
            GRUNT.Log.info("Attempting to call native platform fn: " + fnCall);
            
            // get the native platform module
            var searchTarget = module.getPlatformModule();
            
            // if we don't have a platform module, then throw an exception
            if (! searchTarget) {
                SLICK.throwError("No platform modules defined, unable to execute: " + fnCall);
            } // if

            try {
                searchTarget.platformExec(fnCall, params);
            }
            catch (e) {
                GRUNT.Log.error("Native platform does not support platform exec call: '" + fnCall + "'");
            }
        },
        
        registerPlatformModule: function(moduleId, module) {
            platformMods[moduleId] = module;
        }
    };
    
    return module;
})();