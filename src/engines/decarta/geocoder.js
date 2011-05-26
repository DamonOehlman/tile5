T5.Registry.register('service', 'geocoder', function() {
    
    /* internals */
    
    var geocodeRequestFormatter = T5.formatter(
            '<xls:GeocodeRequest>' + 
                '<xls:Address countryCode="{0}" language="{1}">{2}</xls:Address>' + 
            '</xls:GeocodeRequest>'
        ),
        _streetAddressFormatter = T5.formatter(
            '<xls:StreetAddress>' + 
                '<xls:Building number="{0}" />' + 
                '<xls:Street>{1}</xls:Street>' +
            '</xls:StreetAddress>'
        ),
        placeTypes = ['Municipality', 'CountrySubdivision'];
    
    var GeocodeRequest = function(address, params) {
        params = T5.ex({
            countryCode: currentConfig.geocoding.countryCode,
            language: currentConfig.geocoding.language
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
                    matchPos = new GeoJS.Pos(match.Point.pos);
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
            
            // iterate through the response list
            for (var ii = 0; matchList && (ii < matchList.length); ii++) {
                var matchResult = parseMatchResult(matchList[ii]);
                if (matchResult) {
                    addresses.push(matchResult);
                } // if
            } // for
            
            return addresses;                
        } // getResponseAddresses
                    
        // create the parent
        var parent = new Request();
        
        // initialise _self
        var _self = T5.ex({}, parent, {
            methodName: "Geocode",
            
            getRequestBody: function() {
                var addressXML = _streetAddressFormatter(address.number, address.street);
                
                /*
                // iterate through the regions in the parsed street, and add to the address xml
                for (var ii = 0; ii < parsed.regions.length; ii++) {
                    if (ii < placeTypes.length) {
                        addressXML += '<xls:Place type="' + placeTypes[ii] + '">' + parsed.regions[ii] + '</xls:Place>';
                    } // if
                } // for
                */
                
                addressXML += '<xls:Place type="Municipality">' + address.regions.join(' ') + '</xls:Place>';
                
                return geocodeRequestFormatter(
                    params.countryCode,
                    params.language,
                    addressXML);
            },
            
            parseResponse: function(response) {
                return [getResponseAddresses(response.GeocodeResponseList)];
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
                    matchPos = new GeoJS.Pos(match.Point.pos);
                } // if

                // if we have the address then convert that to an address
                if (response && response.ReverseGeocodedLocation && response.ReverseGeocodedLocation.Address) {
                    return [parseAddress(response.ReverseGeocodedLocation.Address, matchPos)];
                } // if
                
                return [];
            }
        });
        
        return _self;
    };
    
    /* exports */
    
    function forward(address, callback) {
        makeServerRequest(new GeocodeRequest(address), function(geocodingResponse) {
            callback(address, geocodingResponse);
        });
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

    // check that the sidelab addressing module is available
    if (typeof ADDR === 'undefined') {
        T5.log('Sidelab addressing module not found, geocoder will not function', 'warn');
    } // if
    
    return {
        forward: forward,
        reverse: reverse
    };
});