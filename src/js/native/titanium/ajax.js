(function() {
    var CROSSDOMAIN_REQ_REGEX = /^https?/i;
    var requestId = new Date().getTime();
    
    if (typeof Ti !== 'undefined') {
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

                            GRUNT.Log.info("registered request event listener: " + request.id);
                            Ti.App.addEventListener("crossDomainReadyStateChange-" + request.id, function(eventArgs) {
                                GRUNT.Log.info("response listener fired");

                                // copy the event args to this xhr object
                                GRUNT.extend(self, eventArgs);

                                // if the readystate is done, then check to see if we need to parse the xml
                                if ((self.readyState === 4) && (self.responseText) && window.DOMParser) {
                                    var parser = new DOMParser();
                                    self.responseXML = parser.parseFromString(self.responseText, "text/xml");
                                } // if

                                // NOTE: jQuery 1.3.2 and 1.4.2 handle AJAX requests quite differently, and 1.3.2 does
                                // not attach a handler to the event but rather just monitors the readyState of the XHR
                                // object.  So 
                                GRUNT.Log.info("status = " + self.status);
                                if (self.onreadystatechange) {
                                    self.onreadystatechange.call(self);
                                } // if

                                // TODO: mark this xhr object for deletion

                                Ti.App.removeEventListener("crossDomainReadyStateChange-" + request.id, this);
                            });

                            Ti.App.fireEvent("crossDomainRequest", request);
                        } // if
                    },

                    getResponseHeader: function(name) {
                        GRUNT.Log.info("requesting response header: " + name);
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
                        GRUNT.Log.info("aborting request");
                        request = null;
                    },

                    onreadystatechange: null,
                    onload: null
                };                
            } // if

            return self;            
        }; // xhr
    } // if
})();

