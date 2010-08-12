TILE5.Device = (function() {
    var deviceConfigs = null,
        deviceCheckOrder = [],
        detectedConfig = null;
    
    function loadDeviceConfigs() {
        deviceConfigs = {
            base: {
                name: "Unknown",
                eventTarget: document,
                supportsTouch: "createTouch" in document,
                // TODO: remove this (it's just for testing)
                imageCacheMaxSize: 4 * 1024,
                getScaling: function() {
                    return 1;
                },
                // TODO: reset this back to null after testing
                maxImageLoads: 4,
                requireFastDraw: false
            },
            
            ipod: {
                name: "iPod Touch",
                regex: /ipod/i,
                imageCacheMaxSize: 6 * 1024,
                maxImageLoads: 4,
                requireFastDraw: true
            },

            iphone: {
                name: "iPhone",
                regex: /iphone/i,
                imageCacheMaxSize: 6 * 1024,
                maxImageLoads: 4
            },

            ipad: {
                name: "iPad",
                regex: /ipad/i,
                imageCacheMaxSize: 6 * 1024
            },

            android: {
                name: "Android OS <= 2.1",
                regex: /android/i,
                eventTarget: document.body,
                supportsTouch: true,
                getScaling: function() {
                    // TODO: need to detect what device dpi we have instructed the browser to use in the viewport tag
                    return 1 / window.devicePixelRatio;
                }
            },
            
            froyo: {
                name: "Android OS >= 2.2",
                regex: /froyo/i,
                eventTarget: document.body,
                supportsTouch: true
            }
        };
        
        // initilaise the order in which we will check configurations
        deviceCheckOrder = [
            deviceConfigs.froyo,
            deviceConfigs.android,
            deviceConfigs.ipod,
            deviceConfigs.iphone,
            deviceConfigs.ipad
        ];
    } // loadDeviceConfigs
    
    var module = {
        getConfig: function() {
            if (! deviceConfigs) {
                loadDeviceConfigs();
            } // if
            
            // if the device configuration hasn't already been detected do that now
            if (! detectedConfig) {
                GRUNT.Log.info("ATTEMPTING TO DETECT PLATFORM: UserAgent = " + navigator.userAgent);

                // iterate through the platforms and run detection on the platform
                for (var ii = 0; ii < deviceCheckOrder.length; ii++) {
                    var testPlatform = deviceCheckOrder[ii];

                    if (testPlatform.regex && testPlatform.regex.test(navigator.userAgent)) {
                        detectedConfig = GRUNT.extend({}, deviceConfigs.base, testPlatform);
                        GRUNT.Log.info("PLATFORM DETECTED AS: " + detectedConfig.name);
                        break;
                    } // if
                } // for

                if (! detectedConfig) {
                    GRUNT.Log.warn("UNABLE TO DETECT PLATFORM, REVERTING TO BASE CONFIGURATION");
                    detectedConfig = deviceConfigs.base;
                }
                
                GRUNT.Log.info("CURRENT DEVICE PIXEL RATIO = " + window.devicePixelRatio);
            } // if
            
            return detectedConfig;
        }
    };
    
    return module;
})();

