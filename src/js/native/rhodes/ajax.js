(function() {
    var CROSSDOMAIN_REQ_REGEX = /^https?/i;
    var requestId = new Date().getTime();
    
    GRUNT.XHR.ajaxSettings.xhr = function(params) {
        var self = null;
        var request = null;
        
        GRUNT.Log.info("checking for cross domain request on url: " + params.url);
        if (CROSSDOMAIN_REQ_REGEX.test(params.url)) {
            GRUNT.Log.info("!! Have a cross domain request, routing to Titanium to execute");
            
            self = {
                readyState: 0,

                open: function(method, url, async, username, password) {
                    // increment the request id
                    requestId += 1;

                    // initialise the request
                    request = {
                        id: requestId,
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

                        GRUNT.Log.watch("XHR RHODES REQUEST", function() {
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
                            client.send(jQuery.param(GRUNT.extend({}, request, {
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
                    GRUNT.Log.info("aborting request");
                    request = null;
                },

                onreadystatechange: null,
                onload: null
            };                
        } // if

        return self;            
    }; // xhr
})();