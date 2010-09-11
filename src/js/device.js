(function() {
    var deviceConfigs = null,
        deviceCheckOrder = [],
        detectedConfig = null,
        urlBridgeTimeout = 0,
        queuedBridgeUrls = [],
        bridgeIgnoreMessages = ['view.wake', 'tile.loaded'];
        
    function processUrlBridgeNotifications() {
        while (queuedBridgeUrls.length > 0) {
            var notificationUrl = queuedBridgeUrls.shift();
            document.location = notificationUrl;
        } // while
        
        urlBridgeTimeout = 0;
    } // processUrlBridgeNotifications
    
    function shouldBridgeMessage(message) {
        var shouldBridge = true;
        for (var ii = bridgeIgnoreMessages.length; ii--; ) {
            shouldBridge = shouldBridge && (message != bridgeIgnoreMessages[ii]);
        } // for
        
        return shouldBridge;
    } // shouldBridgeMessage
    
    function messageToUrl(message, args) {
        var params = [];
        
        for (var key in args) {
            if (key) {
                params.push(key + "=" + escape(args[key]));
            }
        } // for
        
        return "tile5://" + message + "/" + (params.length > 0 ? "?" + params.join("&") : "");
    } // messageToUrl
        
    function bridgeNotifyLog(message, args) {
        if (shouldBridgeMessage(message)) {
            GT.Log.info("would push url: " + messageToUrl(message, args));
        } // if
    } // bridgeCommandEmpty
    
    function bridgeNotifyUrl(message, args) {
        if (shouldBridgeMessage(message)) {
            queuedBridgeUrls.push(messageToUrl(message, args));
        
            if (! urlBridgeTimeout) {
                urlBridgeTimeout = setTimeout(processUrlBridgeNotifications, 100);
            } // if
        } // if
    } // bridgeNotifyUrlScheme
    
    function loadDeviceConfigs() {
        deviceConfigs = {
            base: {
                name: "Unknown",
                eventTarget: document,
                supportsTouch: "createTouch" in document,
                imageCacheMaxSize: null, 
                getScaling: function() {
                    return 1;
                },
                maxImageLoads: null,
                requireFastDraw: false,
                bridgeNotify: bridgeNotifyLog,
                targetFps: null
            },
            
            ipod: {
                name: "iPod Touch",
                regex: /ipod/i,
                imageCacheMaxSize: 6 * 1024,
                maxImageLoads: 4,
                requireFastDraw: false,
                bridgeNotify: bridgeNotifyUrl,
                targetFps: 25
            },

            // TODO: can we detect the 3G ???
            iphone: {
                name: "iPhone",
                regex: /iphone/i,
                imageCacheMaxSize: 6 * 1024,
                maxImageLoads: 4,
                bridgeNotify: bridgeNotifyUrl
            },

            ipad: {
                name: "iPad",
                regex: /ipad/i,
                imageCacheMaxSize: 6 * 1024,
                bridgeNotify: bridgeNotifyUrl
            },

            android: {
                name: "Android OS <= 2.1",
                regex: /android/i,
                eventTarget: document.body,
                supportsTouch: true,
                getScaling: function() {
                    // TODO: need to detect what device dpi we have instructed the browser to use in the viewport tag
                    return 1 / window.devicePixelRatio;
                },
                bridgeNotify: bridgeNotifyUrl
            },
            
            froyo: {
                name: "Android OS >= 2.2",
                regex: /froyo/i,
                eventTarget: document.body,
                supportsTouch: true,
                bridgeNotify: bridgeNotifyUrl
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
    
    T5.getConfig = function() {
        if (! deviceConfigs) {
            loadDeviceConfigs();
        } // if
        
        // if the device configuration hasn't already been detected do that now
        if (! detectedConfig) {
            GT.Log.info("ATTEMPTING TO DETECT PLATFORM: UserAgent = " + navigator.userAgent);

            // iterate through the platforms and run detection on the platform
            for (var ii = 0; ii < deviceCheckOrder.length; ii++) {
                var testPlatform = deviceCheckOrder[ii];

                if (testPlatform.regex && testPlatform.regex.test(navigator.userAgent)) {
                    detectedConfig = T5.ex({}, deviceConfigs.base, testPlatform);
                    GT.Log.info("PLATFORM DETECTED AS: " + detectedConfig.name);
                    break;
                } // if
            } // for

            if (! detectedConfig) {
                GT.Log.warn("UNABLE TO DETECT PLATFORM, REVERTING TO BASE CONFIGURATION");
                detectedConfig = deviceConfigs.base;
            }
            
            GT.Log.info("CURRENT DEVICE PIXEL RATIO = " + window.devicePixelRatio);
        } // if
        
        return detectedConfig;        
    }; // T5.getConfig
})();

