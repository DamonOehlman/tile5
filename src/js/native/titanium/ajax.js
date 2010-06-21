SLICK.errorWatch("SLICK-APPCELERATOR AJAX INIT", function() {
    var CROSSDOMAIN_REQ_REGEX = /^https?/i;
    
    var oldAjax = jQuery.ajax;
    var requestId = 0;
    
    jQuery.ajax = function(args) {
        // use the appcelerator proxy for cross domain requests
        if (CROSSDOMAIN_REQ_REGEX.test(args.url) && (args.dataType !== 'jsonp')) {
            args.xhr = function() {
                var request = null;
                
                var self = {
                    readyState: 0,
                    
                    open: function(method, url, async, username, password) {
                        // initialise the request
                        request = {
                            id: ++requestId,
                            method: method,
                            url: url,
                            async: async ? async : true,
                            username: username,
                            password: password,
                            headers: {}
                        };
                    },
                    
                    send: function(data) {
                        // add the data to the request
                        if (request) {
                            request.data = data;
                            
                            Ti.App.addEventListener("crossDomainReadyStateChange", function(eventArgs) {
                                if (eventArgs.id == request.id) {
                                    // copy the event args to this xhr object
                                    jQuery.extend(self, eventArgs);

                                    // if the readystate is done, then check to see if we need to parse the xml
                                    if ((self.readyState === 4) && (self.responseText) && window.DOMParser) {
                                        SLICK.errorWatch("PARSING APPCELERATOR XML RESPONSE", function() {
                                            var parser = new DOMParser();
                                            self.responseXML = parser.parseFromString(self.responseText, "text/xml");
                                        });
                                    }

                                    if (self.onreadystatechange) {
                                        self.onreadystatechange.call(self, "");
                                    } // if                                    
                                }
                            });

                            Ti.App.fireEvent("crossDomainRequest", request);
                        } // if
                    },
                    
                    getResponseHeader: function(name) {
                        if (self.responseHeaders) {
                            return self.responseHeaders[name];
                        } // if
                        
                        return "";
                    },
                    
                    setRequestHeader: function(name, value) {
                        if (request) {
                            request.headers[name] = value;
                        } // if
                    },
                    
                    abort: function() {
                        request = null;
                    }, 
                    
                    onreadystatechange: null
                };
                
                return self;
            };
        } // if
        
        oldAjax(args);
    };
});

