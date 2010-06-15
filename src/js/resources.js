SLICK.Resources = (function() {
    var basePath = "";
    var cachedSnippets = {};
    
    var module = {
        getPath: function(path) {
            return basePath + path;
        },
        
        setBasePath: function(path) {
            basePath = path;
        },
        
        loadSnippet: function(snippetPath, callback) {
            // if the snippet path does not an extension, add the default
            if (! (/\.\w+$/).test(snippetPath)) {
                snippetPath += ".html";
            } // if
            
            // TODO: consider putting parameters in here and adding an allow cached parameter as part of that
            // if the snippet is cached, then return from cache
            if (cachedSnippets[snippetPath]) {
                callback(cachedSnippets[snippetPath]);
            }
            else {
                jQuery.ajax({
                    url: module.getPath("snippets/" + snippetPath),
                    success: function(data, textStatus, xml_request) {
                        // add the snippet to the cache
                        cachedSnippets[snippetPath] = data;
                        
                        // trigger the callback
                        callback(data, textStatus, xml_request);
                    },
                    error: function(raw_request, textStatus, error_thrown) {
                        SLICK.logger.error("error loading requested snippet: " + snippetPath);
                    }
                });
            } // if..else
        }
    };
    
    return module;
})();

