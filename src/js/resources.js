SLICK.Resources = (function() {
    var basePath = "";
    var cachedSnippets = {};
    var cachedResources = {};
    var images = {};
    
    function getImageResource(url) {
        // if the requested image does not exist, then request it
        if (! images[url]) {
            images[url] = new module.ImageResource({ url: url });
        } // if
        
        return images[url];
    } // getImageResource
    
    var module = {
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
        
        loadImage: function(args) {
            args = GRUNT.extend({
                url: null,
                callback: null
            }, args);
            
            // get the image url
            var image = getImageResource(module.getPath(args.url));
            
            // if the image is loaded, then fire the callback immediated
            if (image.loaded) {
                if (args.callback) {
                    args.callback(image.get());
                }
            }
            // otherwise add the callback to the load listeners for the image
            else {
                image.loadListeners.push(args.callback);
            } // if
        },
        
        loadResource: function(params) {
            // extend parameters with defaults
            params = GRUNT.extend({
                filename: "",
                cacheable: true,
                dataType: null,
                callback: null
            }, params);
            
            GRUNT.Log.info(params.filename + " resource requested");
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
                        GRUNT.Log.info("got data: " + data);
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
            
            var image = null;
            
            var self = {
                loaded: false,
                loadListeners: [],
                
                get: function() {
                    return image;
                }
            };
            
            if (params.url) {
                GRUNT.Log.info("LOADING IMAGE RESOURCE FROM: " + params.url);
                
                image = new Image();
                image.onload = function() {
                    self.loaded = true;
                    
                    // iterate through the load listeners and let them know the image is loaded
                    for (var ii = 0; ii < self.loadListeners.length; ii++) {
                        if (self.loadListeners[ii]) {
                            self.loadListeners[ii](image);
                        } // if
                    } // for
                }; // onload handler

                // update the image source
                image.src = params.url;
            } // if
            
            return self;
        }
    };
    
    return module;
})();

