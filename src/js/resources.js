T5.Resources = (function() {
    var basePath = "",
        cachedSnippets = {},
        cachedResources = {};
        
    var ImageLoader = (function() {
        // initialise image loader internal variables
        var images = {},
            loadWatchers = {},
            imageCounter = 0,
            queuedImages = [],
            loadingImages = [],
            cachedImages = [],
            interceptors = [],
            imageCacheFullness = 0,
            clearingCache = false;
            
        function handleImageLoad() {
            // get the image data
            var imageData = loadWatchers[this.id];
            if (imageData && imageData.image.complete && (imageData.image.width > 0)) {
                imageData.loaded = true;
                // TODO: check the image width to ensure the image is loaded properly
                imageData.hitCount = 1;
                
                // remove the image data from the loading images array
                for (var ii = loadingImages.length; ii--; ) {
                    if (loadingImages[ii].image.src == this.src) {
                        loadingImages.splice(ii, 1);
                        break;
                    } // if
                } // for
                
                // if the image data has a callback, fire it
                if (imageData.loadCallback) {
                    imageData.loadCallback(this, false);
                } // if
                
                // add the image to the cached images
                cachedImages.push({
                    url: this.src,
                    created: imageData.requested
                });
                
                // remove the item from the load watchers
                delete loadWatchers[this.id];
                
                // load the next image
                loadNextImage();
            } // if
        } // handleImageLoad
        
        function loadNextImage() {
            var maxImageLoads = T5.Device.getConfig().maxImageLoads;

            // if we have queued images and a loading slot available, then start a load operation
            while ((queuedImages.length > 0) && ((! maxImageLoads) || (loadingImages.length < maxImageLoads))) {
                var imageData = queuedImages.shift();
                
                if (imageData.imageLoader) {
                    // add the image data to the loading images
                    loadingImages.push(imageData);
                    
                    // run the image loader
                    imageData.imageLoader(imageData, handleImageLoad);
                } // if
            } // if
        } // loadNextImage
        
        function getImageLoader(url) {
            var loaderFn = null;
            
            // iterate through the interceptors and see if any of them want it
            for (var ii = interceptors.length; ii-- && (! loaderFn); ) {
                loaderFn = interceptors[ii](url);
            } // for
            
            // if one of the interceptors provided an image loader, then use that otherwise provide the default
            return loaderFn ? loaderFn : function(imageData, onLoadCallback) {
                // reset the queued flag and attempt to load the image
                imageData.image.onload = onLoadCallback;
                imageData.image.src = module.getPath(imageData.url);
                imageData.requested = T5.time();
            };
        } // getImageLoader
        
        function cleanupImageCache() {
            clearingCache = true;
            try {
                var halfLen = Math.floor(cachedImages.length / 2);
                if (halfLen > 0) {
                    // TODO: make this more selective... currently some images on screen may be removed :/
                    cachedImages.sort(function(itemA, itemB) {
                        return itemA.created - itemB.created;
                    });

                    // remove the cached image data
                    for (var ii = halfLen; ii--; ) {
                        delete images[cachedImages[ii].url];
                    } // for

                    // now remove the images from the cached images
                    cachedImages.splice(0, halfLen);
                } // if
            }
            finally {
                clearingCache = false;
            } // try..finally
            
            GRUNT.WaterCooler.say("imagecache.cleared");
        } // cleanupImageCache

        function checkTimeoutsAndCache() {
            var currentTickCount = T5.time(),
                timedOutLoad = false, ii = 0,
                config = T5.Device.getConfig();
            
            // iterate through the loading images, and check if any of them have been active too long
            while (ii < loadingImages.length) {
                var loadingTime = currentTickCount - loadingImages[ii].requested;
                if (loadingTime > (module.loadTimeout * 1000)) {
                    loadingImages.splice(ii, 1);
                    timedOutLoad = true;
                }
                else {
                    ii++;
                } // if..else
            } // while
            
            // if we timeout some images, then load next images
            if (timedOutLoad) {
                loadNextImage();
            } // if
            
            // if we have a configuration and an image cache max size, then ensure we haven't exceeded it
            if (config && config.imageCacheMaxSize) {
                imageCacheFullness = (cachedImages.length * module.avgImageSize) / config.imageCacheMaxSize;
                if (imageCacheFullness >= 1) {
                    cleanupImageCache();
                } // if
            } // if
        } // checkTimeoutsAndCache
        
        var subModule = {
            loadingImages: loadingImages,
            queuedImages: queuedImages,
            
            addInterceptor: function(callback) {
                interceptors.push(callback);
            },
            
            getCacheFullness: function() {
                return imageCacheFullness;
            },
            
            getImage: function(url) {
                var imageData = null;
                if (! clearingCache) {
                    imageData = images[url];
                } // if

                // return the image from the image data
                return imageData ? imageData.image : null;
            },
            
            loadImage: function(url, callback) {
                // look for the image data
                var imageData = images[url];

                // if the image data is not defined, then create new image data
                if (! imageData) {
                    // initialise the image data
                    imageData = {
                        url: url,
                        image: new Image(),
                        loaded: false,
                        imageLoader: getImageLoader(url),
                        created: T5.time(),
                        requested: null,
                        hitCount: 0,
                        loadCallback: callback
                    };
                    
                    // initialise the image id
                    imageData.image.id = "resourceLoaderImage" + (imageCounter++);
                    
                    // add the image to the images lookup
                    images[url] = imageData;
                    loadWatchers[imageData.image.id] = imageData;
                    
                    // add the image to the queued images
                    queuedImages.push(imageData);
                    
                    // trigger the next load event
                    loadNextImage();
                }
                else {
                    imageData.hitCount++;
                    if (imageData.image.complete && callback) {
                        callback(imageData.image, true);
                    } // if
                }
                
                return imageData;
            },
            
            resetLoadingQueue: function() {
                loadingImages = [];
            }
        }; // 
        
        setInterval(checkTimeoutsAndCache, 1000);
        
        return subModule;
    })();
    
    var module = {
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
        
        addInterceptor: ImageLoader.addInterceptor,
        
        getPath: function(path) {
            // if the path is an absolute url, then just return that
            if (/^(file|https?|\/)/.test(path)) {
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

        getImage: function(url) {
            return ImageLoader.getImage(url);
        },

        loadImage: function(url, callback) {
            ImageLoader.loadImage(url, callback);
        },
        
        resetImageLoadQueue: function() {
            ImageLoader.resetLoadingQueue();
        },
        
        getStats: function() {
            return {
                imageLoadingCount: ImageLoader.loadingImages.length,
                queuedImageCount: ImageLoader.queuedImages.length,
                imageCacheFullness: ImageLoader.getCacheFullness()
            };
        },
        
        loadResource: function(params) {
            // extend parameters with defaults
            params = T5.ex({
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
        }
    };
    
    return module;
})();

