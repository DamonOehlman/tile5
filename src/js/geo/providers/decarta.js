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
            params = T5.ex({
                countryCode: currentConfig.geocoding.countryCode,
                language: currentConfig.geocoding.language,
                freeform: null,
                streetAddress: {
                    building: null
                }
            }, params);

            var self = {
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
            
            return self;
        },
        
        Place: function(params) {
            params = T5.ex({
                landmark: "",
                municipality: "",
                municipalitySubdivision: "",
                countrySubdivision: "",
                countryCode: ""
            }, params);
            
            // initialise self (including params in self)
            var self = T5.ex({
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
                    
                    // apply the updated parameter values to self
                    T5.ex(self, params);
                },
                
                toString: function() {
                    // if a country code is assigned, then look for a place formatter
                    var formatter = placeFormatters[self.getCountryCode()];
                    
                    // if we don't have a formatter assigned, then use the default
                    if (! formatter) {
                        formatter = placeFormatters.DEFAULT;
                    } // if
                    
                    return formatter(params);
                }
            }, params);
            
            return self;
        },
        
        Street: function(params) {
            params = T5.ex({
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
                centerPos: T5.Geo.P.parse(jsonData.CenterPoint ? jsonData.CenterPoint.pos.content : ""),
                radius: new T5.Geo.Radius(jsonData.Radius ? jsonData.Radius.content : 0, jsonData.Radius ? jsonData.Radius.unit : null)
            }; // self
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
            COG.Log.warn("No server configured for deCarta - we are going to have issues");
        } // if
        
        return COG.formatStr("{0}/JSON?reqID={1}&chunkNo=1&numChunks=1&data={2}&responseFormat=JSON",
            currentConfig.server,
            request.requestID,
            escape(request_data));
    } // generateRequestUrl

    function makeServerRequest(request, callback) {
        // COG.Log.info("making request: " + generateRequest(request));
        
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
                COG.Log.error("no responses from server: " + JSON.stringify(data.response));
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

    var requestTypes = {
        Request: function() {
            // initialise self
            var self = {
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
            }; // self

            return self;
        },
        
        PortrayMapRequest: function(lat, lon, zoom_level, pinPosition) {
            // initialise variables

            function findGridLayer(layers, layer_name) {
                for (var ii = 0; ii < layers.length; ii++) {
                    if (layers[ii].GridLayer.name == layer_name) {
                        return layers[ii];
                    } // if
                } // for

                return null;
            } // findGridLayer

            function parseImageUrl(url) {
                var fnresult = {
                    mask: url
                };
                var regexes = [
                    (/(\?|\&)(N)\=(\-?\d+)/i),
                    (/(\?|\&)(E)\=(\-?\d+)/i)
                ]; 

                // iterate through the regular expressions and capture north position and east positio
                for (var ii = 0; ii < regexes.length; ii++) {
                    // get the matches
                    var matches = regexes[ii].exec(url);

                    // update the fnresult with the appropriate parameter
                    fnresult[matches[2]] = matches[3];
                    fnresult.mask = fnresult.mask.replace(regexes[ii], "$1$2=${" + matches[2] + "}");
                } // for

                return fnresult;
            } // parseImageUrl
            
            // check the zoom level is within tolerances
            zoom_level = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom_level));
            
            // if the last zoom level is defined, then set the zoom string 
            var zoomString = zoom_level;
            if (lastZoom) {
                zoomString += ":" + lastZoom;
                // COG.Log.info("zoom string = " + zoomString);
            } // if

            // create the parent
            var parent = new requestTypes.Request();

            var self = T5.ex({}, parent, {
                // override core properties
                methodName: "PortrayMap",
                maxResponses: 10,

                // initialise map request props
                latitude: lat,
                longitude: lon,
                zoom: zoom_level,

                getRequestBody: function() {
                    // update the last zoom
                    lastZoom = zoom_level;
                    
                    return COG.formatStr(
                        // initialise the xml request content
                        "<xls:PortrayMapRequest>" + 
                            "<xls:Output height='{0}' width='{0}' format='{1}' fixedgrid='{2}' useCache='{3}'>" + 
                                "<xls:CenterContext SRS='WGS-84'>" + 
                                    "<xls:CenterPoint>" + 
                                        "<gml:pos>{4} {5}</gml:pos>" + 
                                    "</xls:CenterPoint>" +
                                    "<xls:Radius unit='{6}'>{7}</xls:Radius>" + 
                                "</xls:CenterContext>" +
                                "<xls:TileGrid rows='1' columns='1'>" + 
                                    "<xls:GridLayer name='deCarta' />" + 
                                    "<xls:GridLayer name='globexplorer' meta-inf='{8}' />" + 
                                "</xls:TileGrid>" + 
                            "</xls:Output>" +
                            (pinPosition ? 
                            // TODO: encapsulate this center overlay request in a debug setting...
                            "<xls:Overlay>" + 
                                "<xls:Position>" + 
                                    "<gml:Point>" +
                                        "<gml:pos>{4} {5}</gml:pos>" + 
                                    "</gml:Point>" +
                                "</xls:Position>" +
                                "<xls:Style><xls:StyleContent>poi.gif:Center</xls:StyleContent></xls:Style>" +
                            "</xls:Overlay>" : "") +
                        "</xls:PortrayMapRequest>",

                        // set the variables in the order they were used
                        T5.tileSize,
                        currentConfig.tileFormat,
                        currentConfig.fixedGrid,
                        currentConfig.useCache,

                        // set lat and lon
                        self.latitude,
                        self.longitude,

                        // set zoom measurement and radius
                        // TODO: pass these in effectively...
                        "KM",
                        0,
                        "zoom=" + zoomString
                    );
                },

                parseResponse: function(response) {
                    // find the decarta tile grid layer
                    var grid = findGridLayer(response.TileGrid, "deCarta");
                    
                    function applyPanOffset(offset, tileSize, panInfo) {
                        if (panInfo.direction == "E") {
                            // COG.Log.info("E pan offset = " + panInfo.numTiles);
                            offset.x = (panInfo.numTiles * tileSize);
                        }
                        else if (panInfo.direction == "N") {
                            // COG.Log.info("N pan offset = " + panInfo.numTiles);
                            offset.y = (panInfo.numTiles * tileSize) - tileSize;
                        } // if..else
                    } // applyPanOffset

                    // if we have found the grid, then get the map content url
                    if (grid) {
                        // parse out the tile url details
                        var urlData = parseImageUrl(grid.Tile.Map.Content.URL);
                        var tileSize = grid.Tile.Map.Content.height;
                        var panOffset = T5.XY.init();

                        // COG.Log.info(COG.formatStr("parsed image url: {0}, N = {1}, E = {2}", urlData.mask, urlData.N, urlData.E));
                        
                        // calculate the pan offset 
                        for (var ii = 0; ii < grid.Pan.length; ii++) {
                            applyPanOffset(panOffset, tileSize, grid.Pan[ii]);
                        } // for

                        return {
                            imageUrl: urlData.mask,
                            tileSize: tileSize,
                            centerContext: new types.CenterContext(grid.CenterContext),
                            centerTile: {
                                N: parseInt(urlData.N, 10),
                                E: parseInt(urlData.E, 10)
                            },
                            panOffset: panOffset
                        };
                    } // if
                }
            });

            return self;
        },

        GeocodeRequest: function(params) {
            params = T5.ex({
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
                        matchPos = T5.Geo.P.parse(match.Point.pos);
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
                    COG.Log.exception(e);
                } // try..except
                
                return addresses;                
            } // getResponseAddresses
                        
            // create the parent
            var parent = new requestTypes.Request();
            
            // initialise self
            var self = T5.ex({}, parent, {
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
                    // COG.Log.info("got response: ", response);

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
            
            // return self
            return self;
        },
        
        ReverseGeocodeRequest: function(params) {
            params = T5.ex({
                position: null,
                geocodePreference: "StreetAddress"
            }, params);
            
            var self = T5.ex(new requestTypes.Request(), {
                methodName: "ReverseGeocode",
                
                getRequestBody: function() {
                    return "" +
                        "<xls:ReverseGeocodeRequest>" + 
                            "<xls:Position>" + 
                                "<gml:Point>" + 
                                    "<gml:pos>" + T5.Geo.P.toString(params.position) + "</gml:pos>" + 
                                "</gml:Point>" + 
                            "</xls:Position>" + 
                            "<xls:ReverseGeocodePreference>" + params.geocodePreference + "</xls:ReverseGeocodePreference>" + 
                        "</xls:ReverseGeocodeRequest>";
                },
                
                parseResponse: function(response) {
                    var matchPos = null;
                    
                    // if the point is defined, then convert that to a position
                    if (response && response.Point) {
                        matchPos = T5.Geo.P.parse(match.Point.pos);
                    } // if

                    // if we have the address then convert that to an address
                    if (response && response.ReverseGeocodedLocation && response.ReverseGeocodedLocation.Address) {
                        return parseAddress(response.ReverseGeocodedLocation.Address, matchPos);
                    } // if                    
                    
                    return null;
                }
            });
            
            return self;
        },
        
        
        RouteRequest: function(params) {
            params = T5.ex({
                waypoints: [],
                provideRouteHandle: false,
                distanceUnit: "KM",
                routeQueryType: "RMAN",
                routePreference: "Fastest",
                routeInstructions: true,
                routeGeometry: true
            }, params);
            
            // define the base request
            var parent = new requestTypes.Request();
            
            function parseInstructions(instructionList) {
                var fnresult = [],
                    instructions = instructionList && instructionList.RouteInstruction ? 
                        instructionList.RouteInstruction : [],
                    totalDistance = 0,
                    totalTime = new T5.TimeLord.Duration();

                // COG.Log.info("parsing " + instructions.length + " instructions", instructions[0], instructions[1], instructions[2]);
                for (var ii = 0; ii < instructions.length; ii++) {
                    // initialise the time and duration for this instruction
                    var distance = distanceToMeters(instructions[ii].distance),
                        time = T5.TimeLord.parseDuration(instructions[ii].duration, '8601');
                        
                    // increment the total distance and total time
                    totalDistance = totalDistance + distance;
                    totalTime = T5.TimeLord.addDuration(totalTime, time);
                    
                    fnresult.push(new T5.Geo.Routing.Instruction({
                        position: T5.Geo.P.parse(instructions[ii].Point),
                        description: instructions[ii].Instruction,
                        distance: distance,
                        distanceTotal: totalDistance,
                        time: time,
                        timeTotal: totalTime
                    }));
                } // for
                

                // COG.Log.info("parsed " + fnresult.length + " instructions", fnresult[0], fnresult[1], fnresult[2]);
                return fnresult;
            } // parseInstructions
            
            // initialise self
            var self = T5.ex({}, parent, {
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
                        
                        body += COG.formatStr("<xls:{0}><xls:Position><gml:Point><gml:pos>{1}</gml:pos></gml:Point></xls:Position></xls:{0}>", tagName, T5.Geo.P.toString(params.waypoints[ii]));
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
                    // COG.Log.info("received route request response:", response);
                    
                    // create a new route data object and map items 
                    return new T5.Geo.Routing.RouteData({
                        geometry: T5.Geo.P.parseArray(response.RouteGeometry.LineString.pos),
                        instructions: parseInstructions(response.RouteInstructionsList)
                    });
                }
            });
            
            return self;
        }
    }; // requestTypes
    
    /* exposed module functionality */
    
    // define the module
    var module = {
        
        applyConfig: function(args) {
            // extend the current configuration with the supplied params
            T5.ex(currentConfig, args);
        },
        
        /**
        Send through a route request to the decarta server 
        */
        calculateRoute: function(args, callback) {
            args = T5.ex({
               waypoints: []
            }, args);
            
            // create the geocoding request and execute it
            var request = new requestTypes.RouteRequest(args);
            makeServerRequest(request, function(routeData) {
                if (callback) {
                    callback(routeData);
                } // if
            });
        },
        
        geocode: function(args) {
            args = T5.ex({
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
                    COG.Log.warn("attempting to geocode a simple object - not implemented");
                }
                // else assume we are dealing with a free form routing request
                else {
                    requestAddresses.push(new types.Address({
                        freeform: args.addresses[ii]
                    }));
                }
            } // if
            
            // if we have request addresses to process, then issue a geocoding request
            // COG.Log.info("attempting to geocode addresses: ", requestAddresses);
            if (requestAddresses.length > 0) {
                // create the geocoding request and execute it
                var request = new requestTypes.GeocodeRequest({
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
            args = T5.ex({
                position: null,
                complete: null
            }, args);
            
            // if the position has not been provided, then throw an exception
            if (! args.position) {
                throw new Error("Cannot reverse geocode without a position");
            } // if
            
            // create the geocoding request and execute it
            var request = new requestTypes.ReverseGeocodeRequest(args);
        
            makeServerRequest(request, function(matchingAddress) {
                if (args.complete) {
                    args.complete(matchingAddress);
                }
            });
        },
        
        // define the decarta utilities as per this thread on the decarta forum
        // http://devzone.decarta.com/web/guest/forums?p_p_id=19&p_p_action=0&p_p_state=maximized&p_p_mode=view&_19_struts_action=/message_boards/view_message&_19_messageId=43131
        
        Utilities: (function() {
            // define some constants
            var MAX_GX_ZOOM = 21;

            var self = {
                /* start forum extracted functions */

                radsPerPixelAtZoom: function(tileSize, gxZoom) {
                    // COG.Log.info("calculating rpp@z for gx zoomlevel = " + gxZoom + ", tilesize = " + tileSize);
                    return 2*Math.PI / (tileSize << gxZoom);
                },

                /* end forum extracted functions */

                zoomLevelToGXZoom: function(zoom_level) {
                    return Math.abs(MAX_GX_ZOOM - parseInt(zoom_level, 10));
                }
            };

            return self;
        })(),
        
        MapProvider: function(params) {
            params = T5.ex({
                pinPosition: false,
                tileDrawArgs: {},
                drawGrid: false
            }, params);
            
            // initialise parent
            var parent = new T5.Geo.MapProvider();
            
            function buildTileGrid(requestedPosition, responseData, containerDimensions) {
                // initialise the first tile origin
                var halfWidth = Math.round(responseData.tileSize / 2),
                    centerXY = T5.D.getCenter(containerDimensions),
                    pos_first = {
                        x: centerXY.x - halfWidth,
                        y: centerXY.y - halfWidth
                    },
                    gridInitArgs = self.prepTileGridArgs(
                        containerDimensions.width,
                        containerDimensions.height, 
                        responseData.tileSize,
                        T5.XY.init(responseData.centerTile.E, responseData.centerTile.N),
                        params);

                // create the tile grid
                var tileGrid = new T5.ImageTileGrid(T5.ex({
                    shiftOrigin: function(topLeftOffset, shiftDelta) {
                        return T5.XY.init(topLeftOffset.x + shiftDelta.x, topLeftOffset.y - shiftDelta.y);
                    }
                }, gridInitArgs));
                
                // set the tile grid origin
                tileGrid.populate(function(col, row, topLeftOffset, gridSize) {
                    return new T5.ImageTile({ 
                        url: responseData.imageUrl.replace("${N}", topLeftOffset.y + (gridSize - row)).replace("${E}", topLeftOffset.x + col),
                        sessionParamRegex: /(SESSIONID)/i,
                        size: responseData.tileSize
                    });
                });

                // get the virtual xy
                var virtualXY = tileGrid.getTileVirtualXY(responseData.centerTile.E, responseData.centerTile.N, true);
                
                // apply the pan offset and half tiles
                virtualXY = T5.XY.offset(virtualXY, responseData.panOffset.x, responseData.panOffset.y);
                
                return new T5.Geo.UI.GeoTileGrid({
                    grid: tileGrid, 
                    centerXY:  virtualXY,
                    centerPos: requestedPosition,
                    offsetAdjustment: T5.XY.init(),
                    radsPerPixel: module.Utilities.radsPerPixelAtZoom(responseData.tileSize, self.zoomLevel)
                });
            } // buildTileGrid

            // initialise self
            var self = T5.ex({}, parent, {
                getCopyright: function() {
                    return "Mapping Webservices &copy; deCarta, Map Data &copy;Navteq";
                },
                
                getMapTiles: function(tiler, position, callback) {
                    makeServerRequest(
                            new requestTypes.PortrayMapRequest(position.lat, position.lon, self.zoomLevel, params.pinPosition),
                            function (response) {
                                if (callback) {
                                    callback(buildTileGrid(position, response, tiler.getDimensions()));
                                } // if
                            });
                }
            });
            
            self.setZoomRange(ZOOM_MIN, ZOOM_MAX);

            return self;
        } // MapProvider
    };
    
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

