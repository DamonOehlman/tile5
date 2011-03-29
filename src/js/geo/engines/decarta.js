//= require <cog/src/timelord>

// define the DECARTA library
T5.Geo.Decarta = (function() {
    // initialise the default configuration parameters
    var currentConfig = {
        sessionID: T5.ticks(),
        server: "",
        clientName: "",
        clientPassword: "",
        configuration: "",
        maxResponses: 25,
        release: "4.4.2sp03",
        tileFormat: "PNG",
        fixedGrid: true,
        useCache: true,
        tileHosts: [],
        
        // REQUEST TIMEOUT in milliseconds
        requestTimeout: 30000,
        
        // GEOCODING information
        geocoding: {
            countryCode: "US",
            language: "EN"
        }
    };
    
    var ZOOM_MAX = 18;
    var ZOOM_MIN = 3;
    
    var placeFormatters = {
        DEFAULT: function(params) {
            var keys = ["landmark", "municipalitySubdivision", "municipality", "countrySubdivision"];
            var place = "";
            
            for (var ii = 0; ii < keys.length; ii++) {
                if (params[keys[ii]]) {
                    place += params[keys[ii]] + " ";
                } // if
            } // for

            return place;
        } // DEFAULT formatter
    };
    
    var lastZoom = null,
        requestCounter = 1;

    
    /* internal decarta functions */
    
    /*
    This function is used to convert from the deCarta distance JSON data
    to an integer value representing the distance in meters
    */
    function distanceToMeters(distance) {
        var uom = distance.uom ? distance.uom.toUpperCase() : 'M',
            conversionFactors = {
                'M': 1,
                'KM': 1000
            },
            factor = conversionFactors[uom];
            
        return distance.value && factor ? distance.value * factor : 0;
    } // uomToMeters
    
    // define the decarta internal types
    var types = {
        Address: function(params) {
            params = COG.extend({
                countryCode: currentConfig.geocoding.countryCode,
                language: currentConfig.geocoding.language,
                freeform: null,
                streetAddress: {
                    building: null
                }
            }, params);

            var _self = {
                getXML: function() {
                    // initailise the address xml
                    var addressXml = COG.formatStr("<xls:Address countryCode=\"{0}\" language=\"{1}\">", params.countryCode, params.language);
                    
                    // if we have a freeform address, then simply add the freeform address request
                    if (params.freeform) {
                        var addressText = String(params.freeform).replace(/(\'|\")/, "\\$1");
                        addressXml += "<xls:freeFormAddress>" + addressText + "</xls:freeFormAddress>";
                    }
                    // otherwise, add the structured address request
                    else {
                        
                    } // if..else

                    // return the closed address xml
                    return addressXml + "</xls:Address>";
                } //getXML
            };
            
            return _self;
        },
        
        Place: function(params) {
            params = COG.extend({
                landmark: "",
                municipality: "",
                municipalitySubdivision: "",
                countrySubdivision: "",
                countryCode: ""
            }, params);
            
            // initialise _self (including params in _self)
            var _self = COG.extend({
                calcMatchPercentage: function(input) {
                    var fnresult = 0;
                    
                    // if this place is a landmark and the subtype is in the request
                    // then process as a landmark
                    if (params.landmark && params.landmarkSubType) {
                        // if we found the landmark subtype
                        if (COG.wordExists(input, params.landmarkSubType)) {
                            fnresult += 0.4;
                            
                            // add another 0.5 if we find the name
                            fnresult += COG.wordExists(input, params.landmark) ? 0.6 : 0;
                        } // if
                    }
                    else {
                        fnresult += COG.wordExists(input, params.municipalitySubdivision) ? 0.8 : 0;
                        
                        if ((fnresult === 0) && params.municipality) {
                            fnresult += COG.wordExists(input, params.municipality) ? 0.7 : 0;
                        } // if
                    } // if..else
                    
                    // check for the country subdivision
                    if (params.countrySubdivision) {
                        fnresult += COG.wordExists(input, params.countrySubdivision) ? 0.2 : 0;
                    } // if
                    
                    return fnresult;
                },
                
                getCountryCode: function() {
                    if (params.countryCode) {
                        return params.countryCode.toUpperCase();
                    } // if
                    
                    return "";
                },
                
                parse: function(details) {
                    // iterate through the details
                    for (var ii = 0; details && (ii < details.length); ii++) {
                        // get the type
                        var contentType = details[ii].type ? (details[ii].type.slice(0, 1).toLowerCase() + details[ii].type.slice(1)) : "";
                        
                        if (typeof params[contentType] !== 'undefined') {
                            params[contentType] = details[ii].content;
                            
                            // if the details has a subtype, then create an additional parameter for it
                            if (details[ii].subType) {
                                params[contentType + "SubType"] = details[ii].subType;
                            } // if
                        } // if
                    } // for
                    
                    // apply the updated parameter values to _self
                    COG.extend(_self, params);
                },
                
                toString: function() {
                    // if a country code is assigned, then look for a place formatter
                    var formatter = placeFormatters[_self.getCountryCode()];
                    
                    // if we don't have a formatter assigned, then use the default
                    if (! formatter) {
                        formatter = placeFormatters.DEFAULT;
                    } // if
                    
                    return formatter(params);
                }
            }, params);
            
            return _self;
        },
        
        Street: function(params) {
            params = COG.extend({
                json: {}
            }, params);
            
            // initialise variables
            var street = "",
                building = "";
                
            // parse the street
            if (params.json.Street) {
                street = params.json.Street.content ? params.json.Street.content : params.json.Street;
            } // if

            // strip any trailing highway specifiers from the street
            street = (street && street.replace) ? street.replace(/\/\d+$/, "") : "";
            
            // parse the building
            if (params.json.Building) {
                // TODO: suspect name will be involved here possibly also
                if (params.json.Building.number) {
                    building = params.json.Building.number;
                } // if
            } // if
            
            return {
                building: building,
                street: street,
                
                calcMatchPercentage: function(input) {
                    var fnresult = 0,
                        test1 = T5.Geo.A.normalize(input), 
                        test2 = T5.Geo.A.normalize(street);
                        
                    if (params.json.Building) {
                        if (T5.Geo.A.buildingMatch(input, params.json.Building.number.toString())) {
                            fnresult += 0.2;
                        } // if
                    } // if
                        
                    if (test1 && test2 && COG.wordExists(test1, test2)) {
                        fnresult += 0.8;
                    } // if

                    return fnresult;
                },
                
                toString: function() {
                    if (street) {
                        return (building ? building + " " : "") + street;
                    } // if
                    
                    return "";
                }
            };
        },
        
        CenterContext: function(jsonData) {
            return {
                centerPos: T5.Geo.Position.parse(jsonData.CenterPoint ? jsonData.CenterPoint.pos.content : ""),
                radius: new T5.Geo.Radius(jsonData.Radius ? jsonData.Radius.content : 0, jsonData.Radius ? jsonData.Radius.unit : null)
            }; // _self
        } // CenterContext
    }; // types
    
    /* request types and functions */
    
    function createRequestHeader(payload) {
        // TODO: write a function that takes parameters and generates xml
        return COG.formatStr(
            "<xls:XLS version='1' xls:lang='en' xmlns:xls='http://www.opengis.net/xls' rel='{4}' xmlns:gml='http://www.opengis.net/gml'>" + 
                "<xls:RequestHeader clientName='{0}' clientPassword='{1}' sessionID='{2}' configuration='{3}' />" + 
                "{5}" + 
            "</xls:XLS>",

            currentConfig.clientName,
            currentConfig.clientPassword,
            currentConfig.sessionID,
            currentConfig.configuration,
            currentConfig.release,
            payload);
    } // createRequestHeader
    
    function createRequestTag(request, payload) {
        return COG.formatStr(
            "<xls:Request maximumResponses='{0}' version='{1}' requestID='{2}' methodName='{3}Request'>{4}</xls:Request>",
            request.maxResponses,
            request.version,
            request.requestID,
            request.methodName,
            payload);
    } // createRequestTag

    function generateRequest(request) {
        return createRequestHeader(createRequestTag(request, request.getRequestBody()));
    } // generateRequest

    function generateRequestUrl(request, request_data) {
        if (! currentConfig.server) {
            COG.warn("No server configured for deCarta - we are going to have issues");
        } // if
        
        return COG.formatStr("{0}/JSON?reqID={1}&chunkNo=1&numChunks=1&data={2}&responseFormat=JSON",
            currentConfig.server,
            request.requestID,
            escape(request_data));
    } // generateRequestUrl

    function makeServerRequest(request, callback) {
        // COG.info("making request: " + generateRequest(request));
        
        // make the request to the server
        // TODO: convert ajax request to UG
        COG.jsonp(generateRequestUrl(request, generateRequest(request)), function(data) {
            // get the number of responses received
            var response = data.response.XLS.Response;

            // if we have one or more responeses, then handle them
            if ((response.numberOfResponses > 0) && response[request.methodName + 'Response']) {
                // parse the response if the handler is assigned
                var parsedResponse = null;
                if (request.parseResponse) {
                    parsedResponse = request.parseResponse(response[request.methodName + 'Response']);
                } // if
                
                // if the callback is assigned, then process the parsed response
                if (callback) {
                    callback(parsedResponse);
                } // if
            }
            // otherwise, report the error
            else {
                COG.error("no responses from server: " + data.response);
            } // if..else
        });
    } // openlsComms
    
    function parseAddress(address, position) {
        var streetDetails = new types.Street({
                json: address.StreetAddress
            });
            
        var placeDetails = new types.Place({
            countryCode: address.countryCode
        });
        
        // parse the place details
        placeDetails.parse(address.Place);
        
        // initialise the address params
        var addressParams = {
            streetDetails: streetDetails,
            location: placeDetails,
            country: address.countryCode ? address.countryCode : "",
            postalCode: address.PostalCode ? address.PostalCode : "",
            pos: position
        };
        
        return new T5.Geo.Address(addressParams);
    } // parseAddress

    // define the basic request type
    var Request = function() {
        // initialise _self
        var _self = {
            methodName: "",
            maxResponses: 25,
            version: "1.0",
            requestID: requestCounter++,

            getRequestBody: function() {
                return "";
            },

            parseResponse: function(response) {
                return response;
            }
        }; // _self

        return _self;
    };
    
    var RUOKRequest = function(params) {
        return COG.extend(new Request(), {
            methodName: 'RUOK',
            
            parseResponse: function(response) {
                return {
                    aliasCount: response.maxHostAliases,
                    host: response.hostName
                };
            }
        });
    }; // RUOKRequest
        
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
                    matchPos = T5.Geo.Position.parse(match.Point.pos);
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
                                "<gml:pos>" + T5.Geo.Position.toString(params.position) + "</gml:pos>" + 
                            "</gml:Point>" + 
                        "</xls:Position>" + 
                        "<xls:ReverseGeocodePreference>" + params.geocodePreference + "</xls:ReverseGeocodePreference>" + 
                    "</xls:ReverseGeocodeRequest>";
            },
            
            parseResponse: function(response) {
                var matchPos = null;
                
                // if the point is defined, then convert that to a position
                if (response && response.Point) {
                    matchPos = T5.Geo.Position.parse(match.Point.pos);
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
        
        
    var RouteRequest = function(params) {
        params = COG.extend({
            waypoints: [],
            provideRouteHandle: false,
            distanceUnit: "KM",
            routeQueryType: "RMAN",
            routePreference: "Fastest",
            routeInstructions: true,
            routeGeometry: true
        }, params);
        
        // define the base request
        var parent = new Request();
        
        function parseInstructions(instructionList) {
            var fnresult = [],
                instructions = instructionList && instructionList.RouteInstruction ? 
                    instructionList.RouteInstruction : [],
                totalDistance = 0,
                totalTime = new COG.Duration();

            // COG.info("parsing " + instructions.length + " instructions", instructions[0], instructions[1], instructions[2]);
            for (var ii = 0; ii < instructions.length; ii++) {
                // initialise the time and duration for this instruction
                var distance = distanceToMeters(instructions[ii].distance),
                    time = COG.parseDuration(instructions[ii].duration, '8601');
                    
                // increment the total distance and total time
                totalDistance = totalDistance + distance;
                totalTime = COG.addDuration(totalTime, time);
                
                fnresult.push(new T5.Geo.Routing.Instruction({
                    position: T5.Geo.Position.parse(instructions[ii].Point),
                    description: instructions[ii].Instruction,
                    distance: distance,
                    distanceTotal: totalDistance,
                    time: time,
                    timeTotal: totalTime
                }));
            } // for
            

            // COG.info("parsed " + fnresult.length + " instructions", fnresult[0], fnresult[1], fnresult[2]);
            return fnresult;
        } // parseInstructions
        
        // initialise _self
        var _self = COG.extend({}, parent, {
            methodName: "DetermineRoute",
            
            getRequestBody: function() {
                // check that we have some waypoints, if not throw an exception 
                if (params.waypoints.length < 2) {
                    throw new Error("Cannot send RouteRequest, less than 2 waypoints specified");
                } // if
                
                var body = COG.formatStr(
                                "<xls:DetermineRouteRequest provideRouteHandle=\"{0}\" distanceUnit=\"{1}\" routeQueryType=\"{2}\">",
                                params.provideRouteHandle, 
                                params.distanceUnit,
                                params.routeQueryType);
                                
                // open the route plan tag
                body += "<xls:RoutePlan>";
                                
                // specify the route preference
                body += "<xls:RoutePreference>" + params.routePreference + "</xls:RoutePreference>";
                
                // open the waypoint list
                body += "<xls:WayPointList>";
                
                // add the waypoints
                for (var ii = 0; ii < params.waypoints.length; ii++) {
                    // determine the appropriate tag to use for the waypoint
                    // as to why this is required, who knows....
                    var tagName = (ii === 0 ? "StartPoint" : (ii === params.waypoints.length-1 ? "EndPoint" : "ViaPoint"));
                    
                    body += COG.formatStr("<xls:{0}><xls:Position><gml:Point><gml:pos>{1}</gml:pos></gml:Point></xls:Position></xls:{0}>", tagName, T5.Geo.Position.toString(params.waypoints[ii]));
                }
                
                // close the waypoint list
                body += "</xls:WayPointList>";
                
                // TODO: add the avoid list
                
                // close the route plan tag
                body += "</xls:RoutePlan>";
                
                // add the route instruction request
                if (params.routeInstructions) {
                    body += "<xls:RouteInstructionsRequest rules=\"maneuver-rules\" providePoint=\"true\" />";
                } // if
                
                // add the geometry request
                if (params.routeGeometry) {
                    body += "<xls:RouteGeometryRequest />";
                } // if
                
                // close the route request tag
                body += "</xls:DetermineRouteRequest>";
                return body;
            },
            
            parseResponse: function(response) {
                // COG.info("received route request response:", response);
                
                // create a new route data object and map items 
                return new T5.Geo.Routing.RouteData({
                    geometry: T5.Geo.Position.parseArray(response.RouteGeometry.LineString.pos),
                    instructions: parseInstructions(response.RouteInstructionsList)
                });
            }
        });
        
        return _self;
    };
    
    /* exposed module functionality */
    
    // define the module
    var module = {
        
        applyConfig: function(args) {
            // extend the current configuration with the supplied params
            COG.extend(currentConfig, args);
        },
        
        /**
        Send through a route request to the decarta server 
        */
        calculateRoute: function(args, callback) {
            args = COG.extend({
               waypoints: []
            }, args);
            
            // create the geocoding request and execute it
            var request = new RouteRequest(args);
            makeServerRequest(request, function(routeData) {
                if (callback) {
                    callback(routeData);
                } // if
            });
        },
        
        geocode: function(args) {
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
        },
        
        reverseGeocode: function(args) {
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
        }
    };
        
    // initialise the decarta tile generator
    var DecartaTileGenerator = function(params) {
        params = COG.extend({
            tileSize: 256
        }, params);
        
        // initialise constants
        var DEGREES_TO_RADIANS = Math.PI / 180,
            RADIANS_TO_DEGREES = 180 / Math.PI;

        // Taken from deCarta's new mobile JS library
        // check it out at: http://developer.decarta.com/docs/read/Mobile_JS
        var _ll_LUT = [
            "89.787438015348100000,360.00000000000000000",
            "85.084059050110410000,180.00000000000000000",
            "66.653475896509040000,90.00000000000000000",
            "41.170427238429790000,45.000000000000000000",
            "22.076741328793200000,22.500000000000000000",
            "11.251819676168665000,11.250000000000000000",
            "5.653589942659626000,5.625000000000000000",
            "2.830287664051185000,2.812500000000000000",
            "1.415581451872543800,1.406250000000000000",
            "0.707845460801532700,0.703125000000000000",
            "0.353929573271679340,0.351562500000000000",
            "0.176965641673330230,0.175781250000000000",
            "0.088482927761462040,0.087890625000000000",
            "0.044241477246363230,0.043945312500000000",
            "0.022120740293895182,0.021972656250000000",
            "0.011060370355776452,0.010986328125000000",
            "0.005530185203987857,0.005493164062500000",
            "0.002765092605263539,0.002746582031250000",
            "0.001382546303032519,0.001373291015625000",
            "0.000691272945568983,0.000686645507812500",
            "0.000345636472797214,0.000343322753906250"
        ],
        hosts = null;
        
        /* internals */
        
        function createTiles(view, viewRect, store, callback) {
            var zoomLevel = view.getZoomLevel ? view.getZoomLevel() : 0;
            
            if (zoomLevel) {
                var numTiles = 2 << (zoomLevel - 1),
                    numTilesHalf = numTiles >> 1,
                    tileSize = params.tileSize,
                    xTiles = (viewRect.w / tileSize | 0) + 1,
                    yTiles = (viewRect.h / tileSize | 0) + 1,
                    xTile = (viewRect.x / tileSize | 0) - numTilesHalf,
                    yTile = numTiles - (viewRect.y / tileSize | 0) - numTilesHalf - yTiles,
                    tiles = store.search({
                        x: (numTilesHalf + xTile) * tileSize,
                        y: (numTilesHalf + yTile*-1) * tileSize,
                        w: xTiles * tileSize,
                        h: yTiles * tileSize
                    }),
                    idIndex = new Array(tiles.length),
                    ii;

                // iterate through the tiles and create the tile id index
                for (ii = tiles.length; ii--; ) {
                    idIndex[ii] = tiles[ii].id;
                } // for
                    
                for (var xx = 0; xx <= xTiles; xx++) {
                    for (var yy = 0; yy <= yTiles; yy++) {
                        var tileX = xTile + xx,
                            tileY = yTile + yy - 1,
                            tileId = tileX + '_' + tileY;
                            
                        // if the tile is not in the index, then create
                        if (T5.indexOf.call(idIndex, tileId) < 0) {
                            var tileUrl = hosts[xx % hosts.length] + '/openls/image-cache/TILE?'+
                                   'LLMIN=0.0,0.0' +
                                   '&LLMAX=' + _ll_LUT[zoomLevel] +
                                   '&CACHEABLE=true' + 
                                   '&DS=navteq-world' +
                                   '&WIDTH=' + (256 /* * dpr*/) +
                                   '&HEIGHT=' + (256 /* * dpr*/) +
                                   '&CLIENTNAME=' + currentConfig.clientName +
                                   '&SESSIONID=' + currentConfig.sessionID +
                                   '&FORMAT=PNG' +
                                   '&CONFIG=' + currentConfig.configuration +
                                   '&N=' + tileY +
                                   '&E=' + tileX,
                                tile = new T5.Tile(
                                    (numTilesHalf + xTile + xx) * tileSize,
                                    (numTilesHalf + yTile*-1 - yy) * tileSize,
                                    tileUrl,
                                    tileSize, 
                                    tileSize,
                                    tileId);
                                    
                            // add the new tile to the store
                            store.insert(tile, tile);
                        } // if
                    } // for
                } // for
                    
                // if the callback is assigned, then pass back the creator
                if (callback) {
                    callback();
                } // if                
            } // if
        } // createTiles
        
        
        /* exports */
        
        function run(view, viewRect, store, callback) {
            if (hosts) {
                createTiles(view, viewRect, store, callback);
            }
            else {
                // make an RUOK request to retrieve configuration information
                makeServerRequest(new RUOKRequest(), function(tileConfig) {
                    // reset the tile hosts
                    hosts = [];

                    // initialise the hosts
                    if (tileConfig.aliasCount) {
                        for (var ii = 0; ii < tileConfig.aliasCount; ii++) {
                            hosts[ii] = 'http://' + tileConfig.host.replace('^(.*?)\.(.*)$', '\1-0' + (ii + 1) + '.\2');
                        } // for
                    }
                    else {
                        hosts = ['http://' + tileConfig.host];
                    } // if..else

                    // create the tiles
                    createTiles(view, viewRect, store, callback);
                });
            }
        } // run
        
        /* define the generator */
        
        T5.userMessage('ack', 'decarta', '&copy; deCarta, Inc. Map and Imagery Data &copy; NAVTEQ or Tele Atlas or DigitalGlobe');
        
        return {
            run: run
        };
    };
    
    // register the decarta generator
    T5.Generator.register('decarta', DecartaTileGenerator);
    
    new T5.Geo.Engine({
        id: "decarta",
        route: module.calculateRoute,
        geocode: module.geocode,
        reverseGeocode: module.reverseGeocode,
        compareFns: (function() {
            return {
                streetDetails: function(input, fieldVal) {
                    return fieldVal.calcMatchPercentage(input);
                },
                location: function(input, fieldVal) {
                    return fieldVal.calcMatchPercentage(input);
                }
            };
        })()
    });
    
    return module;
})();

