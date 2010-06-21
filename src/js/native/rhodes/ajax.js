SLICK.errorWatch("SLICK-RHODES AJAX INIT", function() {
    var CROSSDOMAIN_REQ_REGEX = /^https?/i;
    
    var oldAjax = jQuery.ajax;
    var client = null;
    
    jQuery.ajax = function(args) {
        // use the appcelerator proxy for cross domain requests
        if (CROSSDOMAIN_REQ_REGEX.test(args.url) && (args.url.indexOf("localhost") < 0) && (args.dataType !== 'jsonp')) {
            SLICK.Logger.info("got cross domain request - handling");
            
            args.xhr = function() {
                var request = null;
                
                var self = {
                    readyState: 0,
                    
                    open: function(method, url, async, username, password) {
                        request = {
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
                            SLICK.errorWatch("XHR RHODES REQUEST", function() {
                                // create the client
                                client = new XMLHttpRequest();

                                // open the request
                                client.open("POST", "/app/SlickBridge/ajaxProxy", request.async, request.username, request.password);

                                /*
                                for (var headerName in request.headers) {
                                    client.setRequestHeader(headerName, request.headers[headerName]);
                                } // for
                                */

                                // attach on ready state change event handlers to the request
                                client.onreadystatechange = function(params) {
                                    // if the readystate is done, then check to see if we need to parse the xml
                                    if ((client.readyState === 4) && (client.responseText)) {
                                        // update the status
                                        self.status = client.status;
                                        self.responseText = client.responseText;
                                        self.responseXML = client.responseXML;
                                    } // if

                                    if (self.onreadystatechange) {
                                        self.onreadystatechange.call(self, params);
                                    } // if
                                }; // if

                                // send the request
                                client.send(jQuery.param(jQuery.extend({}, request, {
                                    data: data
                                }), false));
                            });
                        } // if
                    },
                    
                    getResponseHeader: function(name) {
                        if (client) {
                            return client.getResponseHeader(name);
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

