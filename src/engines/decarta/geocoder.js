T5.Registry.register('service', 'geocoder', function() {
    
    /* internals */
    
    var GeocodeRequest = function(params) {
        params = T5.ex({
            addresses: [],
            parserReport: false,
            parseOnly: false,
            returnSpatialKeys: false
        }, params);
        
        var requestFormatter = _formatter('<xls:GeocodeRequest parserReport="{0}" parseOnly="{1}" returnSpatialKeys="{2}">');
        
        function validMatch(match) {
            return match.GeocodeMatchCode && match.GeocodeMatchCode.matchType !== "NO_MATCH";
        } // validMatch
        
        function parseMatchResult(match) {
            var matchAddress = null;
            var matchPos = null;

            if (match && validMatch(match)) {
                // if the point is defined, then convert that to a position
                if (match && match.Point) {
                    matchPos = new T5.Pos(match.Point.pos);
                } // if

                // if we have the address then convert that to an address
                if (match && match.Address) {
                    matchAddress = parseAddress(match.Address, matchPos);
                } // if
            }
            
            return matchAddress;
        } // parseMatchResult
        
        function getResponseAddresses(responseList) {
            // get the number of responses
            var addresses = [];
            var responseCount = responseList ? responseList.numberOfGeocodedAddresses : 0;
            var matchList = [];
            
            // NOTE: this code has been implemented to compensate for strangeness in deCarta JSON land...
            // see https://github.com/sidelab/T5-closed/wikis/geocoder-json-response for more information
            if (responseCount > 1) {
                matchList = responseList.GeocodedAddress;
            }
            else if (responseCount == 1) {
                matchList = [responseList.GeocodedAddress];
            } // if..else
            
            try {
                // iterate through the response list
                for (var ii = 0; matchList && (ii < matchList.length); ii++) {
                    var matchResult = parseMatchResult(matchList[ii]);
                    if (matchResult) {
                        addresses.push(matchResult);
                    } // if
                } // for
            } 
            catch (e) {
                _log(e, 'error');
            } // try..except
            
            return addresses;                
        } // getResponseAddresses
                    
        // create the parent
        var parent = new Request();
        
        // initialise _self
        var _self = T5.ex({}, parent, {
            methodName: "Geocode",
            
            getRequestBody: function() {
                var body = requestFormatter(params.parserReport, params.parseOnly, params.returnSpatialKeys);
                
                // iterate through the addresses and create the inner tags
                for (var ii = 0; ii < params.addresses.length; ii++) {
                    body += params.addresses[ii].getXML();
                } // for
                
                return body + "</xls:GeocodeRequest>";
            },
            
            parseResponse: function(response) {
                // _log("got response: ", response);

                if (params.addresses.length === 1) {
                    return [getResponseAddresses(response.GeocodeResponseList)];
                }
                else {
                    var results = [];
                    for (var ii = 0; ii < params.addresses.length; ii++) {
                        results.push(getResponseAddresses(response.GeocodeResponseList[ii]));
                    } // for
                    
                    return results;
                } // if..else
            }
        });
        
        // return _self
        return _self;
    };
    
    var ReverseGeocodeRequest = function(params) {
        params = T5.ex({
            position: null,
            geocodePreference: "StreetAddress"
        }, params);
        
        var _self = T5.ex(new Request(), {
            methodName: "ReverseGeocode",
            
            getRequestBody: function() {
                return "" +
                    "<xls:ReverseGeocodeRequest>" + 
                        "<xls:Position>" + 
                            "<gml:Point>" + 
                                "<gml:pos>" + params.position.toString() + "</gml:pos>" + 
                            "</gml:Point>" + 
                        "</xls:Position>" + 
                        "<xls:ReverseGeocodePreference>" + params.geocodePreference + "</xls:ReverseGeocodePreference>" + 
                    "</xls:ReverseGeocodeRequest>";
            },
            
            parseResponse: function(response) {
                var matchPos = null;
                
                // if the point is defined, then convert that to a position
                if (response && response.Point) {
                    matchPos = new T5.Pos(match.Point.pos);
                } // if

                // if we have the address then convert that to an address
                if (response && response.ReverseGeocodedLocation && response.ReverseGeocodedLocation.Address) {
                    return parseAddress(response.ReverseGeocodedLocation.Address, matchPos);
                } // if                    
                
                return null;
            }
        });
        
        return _self;
    };
    
    /* exports */
    
    function forward(address, callback) {
        // initialise variables
        var ii, requestAddresses = [];
        
        // TODO: if the element is a simple object, then treat as a structured geocode
        if (T5.is(address, 'object')) {
            T5.log("attempting to geocode a simple object - not implemented", 'warn');
        }
        // else assume we are dealing with a free form routing request
        else {
            requestAddresses.push(new Address({
                freeform: address
            }));
        }
        
        // if we have request addresses to process, then issue a geocoding request
        // _log("attempting to geocode addresses: ", requestAddresses);
        if (requestAddresses.length > 0) {
            // create the geocoding request and execute it
            var request = new GeocodeRequest({
                addresses: requestAddresses
            });
        
            makeServerRequest(request, function(geocodeResponses) {
                // iterate through the address matches, and fire the complete event for each
                for (ii = 0; callback && ii < geocodeResponses.length; ii++) {
                    // fire the complete event
                    callback(address, geocodeResponses[ii]);
                } // for
            });
        } // if
    } // forward
    
    function reverse(pos, callback) {
        // create the geocoding request and execute it
        var request = new ReverseGeocodeRequest({
            position: pos
        });
    
        makeServerRequest(request, function(matchingAddress) {
            if (callback) {
                callback(matchingAddress);
            } // if
        });
    } // reverse
    
    return {
        forward: forward,
        reverse: reverse
    };
});