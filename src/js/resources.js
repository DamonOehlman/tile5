SLICK.Resources = (function() {
    var basePath = "",
        cachedSnippets = {},
        cachedResources = {},
        images = {},
        imageLoadingCount = 0,
        queuedImages = [];
    
    function getImageResource(url) {
        // if the requested image does not exist, then request it
        if (! images[url]) {
            images[url] = new module.ImageResource({ url: url });
        } // if
        
        return images[url];
    } // getImageResource
    
    function loadNextImage() {
        // if we have queued images, then load
        if (queuedImages.length > 0) {
            queuedImages.shift().load();
        } // if
    } // loadNextImage
    
    var module = {
        maxImageLoads: 4,
        loadTimeout: 30,
        
        Cache: (function() {
            // initailise self
            var self = {
                read: function(key) {
                    return null;
                },

                write: function(key, data) {
                },
                
                getUrlCacheKey: function(url, sessionParamRegex) {
                    // get the url parameters
                    var queryParams = (url ? url.replace(/^.*\?/, "") : "").split("&");
                    var coreUrl = url ? url.replace(/\?.*$/, "?") : "";

                    // iterate through the query params and weed out any session params
                    for (var ii = 0; ii < queryParams.length; ii++) {
                        var kv = queryParams[ii].split("=");

                        if ((! sessionParamRegex) || (! sessionParamRegex.test(kv[0]))) {
                            coreUrl += queryParams[ii] + "&";
                        } // if
                    } // for

                    return coreUrl.replace(/\W/g, "");
                },

                isValidCacheKey: function(cacheKey) {
                    GRUNT.Log.info("cache key = " + cacheKey);

                    return false;
                }
            };
            
            return self;
        })(),
        
        // TODO: if we have something like phonegap available, maybe look at using it to get the resource and save it locally
        getCachedUrl: function(url, sessionParams) {
           return url;
        },
        
        getPath: function(path) {
            // if the path is an absolute url, then just return that
            if (/^(https?|\/)/.test(path)) {
                return path;
            }
            // otherwise prepend the base path
            else {
                return basePath + path;
            } // if..else
        },
        
        setBasePath: function(path) {
            basePath = path;
        },
        
        loadImage: function(url, callback) {
            // get the image url
            var image = getImageResource(module.getPath(url));
            
            // increment the image hit count
            image.hitCount++;
            
            // if the image is loaded, then fire the callback immediated
            if (image.loaded) {
                if (callback) {
                    callback(image.get());
                }
            }
            // otherwise add the callback to the load listeners for the image
            else {
                image.load();
                image.loadListeners.push(callback);
            } // if
        },
        
        resetImageLoadQueue: function() {
            queuedImages = [];
        },
        
        loadResource: function(params) {
            // extend parameters with defaults
            params = GRUNT.extend({
                filename: "",
                cacheable: true,
                dataType: null,
                callback: null
            }, params);
            
            var callback = function(data) {
                if (params.callback) {
                    GRUNT.Log.watch("CALLING RESOURCE CALLBACK", function() {
                        params.callback(data);
                    });
                } // if
            };
            
            if (params.cacheable && cachedResources[params.filename]) {
                callback(cachedResources[params.filename]); 
            }
            else {
                GRUNT.XHR.ajax({
                    url: module.getPath(params.filename),
                    dataType: params.dataType,
                    success: function(data) {
                        // GRUNT.Log.info("got data: " + data);
                        // add the snippet to the cache
                        if (params.cacheable) {
                            cachedResources[params.filename] = data;
                        }
                        
                        // trigger the callback
                        callback(data);
                    },
                    error: function(raw_request, textStatus, error_thrown) {
                        GRUNT.Log.error("error loading resource [" + params.filename + "], error = " + error_thrown);
                    }
                });
            } // if..else
        },
        
        loadSnippet: function(snippetPath, callback) {
            // if the snippet path does not an extension, add the default
            if (! (/\.\w+$/).test(snippetPath)) {
                snippetPath += ".html";
            } // if
            
            module.loadResource({
                filename: "snippets/" + snippetPath,
                callback: callback,
                dataType: "html"
            });
        },
        
        ImageResource: function(params) {
            params = GRUNT.extend({
                url: ""
            }, params);
            
            var image = new Image(),
                loadCheckTimeout = 0;
                
            function checkLoad() {
                if (! self.loaded) {
                    GRUNT.Log.warn("timed out loading image: " + image.src);

                    // reset the image and decrement loading count
                    image.src = null;
                    imageLoadingCount--;
                    
                    // load the next image
                    loadNextImage();
                } // if
            } // checkLoad
            
            function handleImageLoad() {
                self.loaded = true;
                imageLoadingCount--;
                
                // clear the check timeout
                clearTimeout(loadCheckTimeout);

                // iterate through the load listeners and let them know the image is loaded
                for (var ii = 0; ii < self.loadListeners.length; ii++) {
                    if (self.loadListeners[ii]) {
                        self.loadListeners[ii](image);
                    } // if
                } // for

                loadNextImage();
            } // handleImageLoad
            
            var self = {
                loaded: false,
                loadListeners: [],
                hitCount: 0,
                
                get: function() {
                    return image;
                },
                
                load: function() {
                    if (params.url && (image.src != params.url)) {
                        if ((! module.maxImageLoads) || (imageLoadingCount < module.maxImageLoads)) {
                            imageLoadingCount++;
                            
                            // set the image source and start the loading
                            image.src = params.url;
                            
                            // schedule a timeout to check the image load state
                            loadCheckTimeout = setTimeout(checkLoad, module.loadTimeout * 1000);
                        }
                        else {
                            queuedImages.push(self);
                        }
                    } // if
                }
            };

            // attach the image load handler
            image.onload = handleImageLoad;
            
            return self;
        }
    };
    
    return module;
})();

