SLICK.Resources = (function() {
    var basePath = "";
    var cachedSnippets = {};
    var cachedResources = {};
    
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
                    SLICK.Logger.info("cache key = " + cacheKey);

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
            return basePath + path;
        },
        
        setBasePath: function(path) {
            basePath = path;
        },
        
        loadResource: function(params) {
            // extend parameters with defaults
            params = jQuery.extend({
                filename: "",
                cacheable: true,
                dataType: null,
                callback: null
            }, params);
            
            SLICK.Logger.info(params.filename + " resource requested");
            var callback = function(data) {
                if (params.callback) {
                    SLICK.errorWatch("CALLING RESOURCE CALLBACK", function() {
                        params.callback(data);
                    });
                } // if
            };
            
            if (params.cacheable && cachedResources[params.filename]) {
                callback(cachedResources[params.filename]); 
            }
            else {
                jQuery.ajax({
                    url: module.getPath(params.filename),
                    dataType: params.dataType,
                    success: function(data, textStatus, xml_request) {
                        // add the snippet to the cache
                        if (params.cacheable) {
                            cachedResources[params.filename] = data;
                        }
                        
                        // trigger the callback
                        callback(data);
                    },
                    error: function(raw_request, textStatus, error_thrown) {
                        SLICK.Logger.error("error loading resource [" + params.filename + "], error = " + error_thrown);
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

