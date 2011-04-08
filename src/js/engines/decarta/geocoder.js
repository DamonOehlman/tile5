T5.Service.register('geocoder', function() {
    
    /* internals */
    
    var GeocodeRequest = function(params) {
        params = COG.extend({
            addresses: [],
            parserReport: false,
            parseOnly: false,
            returnSpatialKeys: false
        }, params);
        
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
                COG.exception(e);
            } // try..except
            
            return addresses;                
        } // getResponseAddresses
                    
        // create the parent
        var parent = new Request();
        
        // initialise _self
        var _self = COG.extend({}, parent, {
            methodName: "Geocode",
            
            getRequestBody: function() {
                var body = COG.formatStr("<xls:GeocodeRequest parserReport=\"{0}\" parseOnly=\"{1}\" returnSpatialKeys=\"{2}\">", 
                                params.parserReport, 
                                params.parseOnly,
                                params.returnSpatialKeys);
                
                // iterate through the addresses and create the inner tags
                for (var ii = 0; ii < params.addresses.length; ii++) {
                    body += params.addresses[ii].getXML();
                } // for
                
                return body + "</xls:GeocodeRequest>";
            },
            
            parseResponse: function(response) {
                // COG.info("got response: ", response);

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
        params = COG.extend({
            position: null,
            geocodePreference: "StreetAddress"
        }, params);
        
        var _self = COG.extend(new Request(), {
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
    
    function forward(args) {
        args = COG.extend({
            addresses: [],
            complete: null
        }, args);
        
        // initialise variables
        var ii, requestAddresses = [];
        
        // coerce a simple value into an array...
        if (args.addresses && (! COG.isArray(args.addresses))) {
            args.addresses = [args.addresses];
        } // if
        
        // iterate through the addresses supplied and issue geocoding requests for them
        for (ii = 0; ii < args.addresses.length; ii++) {
            // TODO: if the element is a simple object, then treat as a structured geocode
            if (COG.isPlainObject(args.addresses[ii])) {
                COG.warn("attempting to geocode a simple object - not implemented");
            }
            // else assume we are dealing with a free form routing request
            else {
                requestAddresses.push(new types.Address({
                    freeform: args.addresses[ii]
                }));
            }
        } // if
        
        // if we have request addresses to process, then issue a geocoding request
        // COG.info("attempting to geocode addresses: ", requestAddresses);
        if (requestAddresses.length > 0) {
            // create the geocoding request and execute it
            var request = new GeocodeRequest({
                addresses: requestAddresses
            });
        
            makeServerRequest(request, function(geocodeResponses) {
                if (args.complete) {
                    // iterate through the address matches, and fire the complete event for each
                    for (ii = 0; ii < geocodeResponses.length; ii++) {
                        // fire the complete event
                        args.complete(args.addresses[ii], geocodeResponses[ii]);
                    } // for
                } // if
                
            });
        } // if
    } // forward
    
    function reverse(args) {
        args = COG.extend({
            position: null,
            complete: null
        }, args);
        
        // if the position has not been provided, then throw an exception
        if (! args.position) {
            throw new Error("Cannot reverse geocode without a position");
        } // if
        
        // create the geocoding request and execute it
        var request = new ReverseGeocodeRequest(args);
    
        makeServerRequest(request, function(matchingAddress) {
            if (args.complete) {
                args.complete(matchingAddress);
            }
        });
    } // reverse
    
    return {
        forward: forward,
        reverse: reverse
    };
});