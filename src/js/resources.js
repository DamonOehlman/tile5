SLICK.Resources = (function() {
    var basePath = "",
        cachedSnippets = {},
        cachedResources = {},
        cachedImages = [],
        images = {},
        imageLoadingCount = 0,
        queuedImages = [],
        imageCacheFullness = 0;
        
    
    function cleanupImageCache() {
        // TODO: make this more selective... currently some images on screen may be removed :/
        cachedImages.sort(function(itemA, itemB) {
            var compareVal = itemA.created - itemB.created;
            if (compareVal === 0) {
                compareVal = itemA.hitCount - itemB.hitCount;
            } // if
            
            return compareVal;
        });

        // images should now be in hit count / created time order
        // GRUNT.Log.info("sorted images: first image hit count = " + cachedImages[0].hitCount + ", created = " + cachedImages[0].created);
        // GRUNT.Log.info("sorted images: last  image hit count = " + cachedImages[cachedImages.length-1].hitCount + ", created = " + cachedImages[cachedImages.length-1].created);
        
        // ok super rough - ditch the first half of the image cache
        images = {};
        cachedImages.splice(0, Math.floor(cachedImages.length * 0.5));
        
        // regenerate the images lookups
        for (var ii = cachedImages.length; ii--; ) {
            images[cachedImages[ii].url] = ii;
        } // for
    } // cleanupImageCache
    
    function getImageResource(url) {
        var image = null,
            config = SLICK.getDeviceConfig();
        
        // if the requested image does not exist, then request it
        if (images[url] === undefined) {
            image = new module.ImageResource({ url: url });
            
            // add the image to the cached images array
            images[url] = cachedImages.push(image) - 1;
        }
        else {
            var imageIndex = images[url];
            if (imageIndex < cachedImages.length) {
                image = cachedImages[imageIndex];
            } // if
        } // if..else
        
        // if we have a configuration and an image cache max size, then ensure we haven't exceeded it
        if (config && config.imageCacheMaxSize) {
            imageCacheFullness = (cachedImages.length * module.avgImageSize) / config.imageCacheMaxSize;
            if (imageCacheFullness >= 1) {
                cleanupImageCache();
            } // if
        } // if
        
        if (! image) {
            GRUNT.Log.warn("could not return image for: " + url);
        } // if
        
        return image;
    } // getImageResource
    
    function loadNextImage() {
        // if we have queued images, then load
        if (queuedImages.length > 0) {
            var nextImage = queuedImages.shift();
            
            // reset the queued flag and attempt to load the image
            nextImage.queued = false;
            nextImage.load();
        } // if
    } // loadNextImage
    
    var module = {
        maxImageLoads: 8,
        avgImageSize: 25,
        loadTimeout: 10,
        
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

        getImage: function(url, callback) {
            // get the image url
            var image = getImageResource(module.getPath(url));
            
            if (image) {
                // increment the image hit count
                image.hitCount++;

                // if the image is loaded, then fire the callback immediated
                if (image.loaded && image.get()) {
                    if (callback) {
                        callback(image.get(), true);
                    }
                }
                // otherwise add the callback to the load listeners for the image
                else {
                    image.load();
                    image.loadListeners.push(callback);
                } // if
            } // if
        },
        
        resetImageLoadListeners: function(url) {
            var image = getImageResource(module.getPath(url));
            if (image) {
                image.loadListeners = [];
            } // if
        },
        
        resetImageLoadQueue: function() {
            for (var ii = queuedImages.length; ii--; ) {
                queuedImages[ii].reset();
            } // for
            
            // reset queued images count and loading image count
            queuedImages = [];
            imageLoadingCount = 0;
        },
        
        getStats: function() {
            return {
                imageLoadingCount: imageLoadingCount,
                queuedImageCount: queuedImages.length,
                imageCacheFullness: imageCacheFullness
            };
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
                    imageLoadingCount = Math.min(imageLoadingCount - 1, 0);
                    
                    // load the next image
                    loadNextImage();
                } // if
            } // checkLoad
            
            function handleImageLoad() {
                self.loaded = true;
                imageLoadingCount = Math.min(imageLoadingCount - 1, 0);
                
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
                queued: false,
                loadListeners: [],
                created: new Date().getTime(),
                hitCount: 0,
                url: params.url,
                
                get: function() {
                    return image;
                },
                
                load: function() {
                    if (params.url && image && (image.src != params.url)) {
                        if ((! module.maxImageLoads) || (imageLoadingCount < module.maxImageLoads)) {
                            // increment the image loading count
                            imageLoadingCount++;
                            
                            // set the image source and start the loading
                            image.src = null;
                            image.src = params.url;
                            
                            // schedule a timeout to check the image load state
                            loadCheckTimeout = setTimeout(checkLoad, module.loadTimeout * 1000);
                        }
                        else if (! self.queued) {
                            queuedImages.push(self);
                            self.queued = true;
                        }
                    } // if
                },
                
                reset: function() {
                    // release the references
                    image.src = null;
                    image.onload = null;
                    
                    // clear the load checktimeout
                    if (loadCheckTimeout !== 0) {
                        clearTimeout(loadCheckTimeout);
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

