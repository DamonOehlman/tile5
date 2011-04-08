var ZOOM_MAX = 18,
    ZOOM_MIN = 3;

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
var Address = function(params) {
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
    
    Place = function(params) {
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
    
    Street = function(params) {
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
    
    CenterContext = function(jsonData) {
        return {
            centerPos: new T5.Pos(jsonData.CenterPoint ? jsonData.CenterPoint.pos.content : ""),
            radius: new T5.Geo.Radius(jsonData.Radius ? jsonData.Radius.content : 0, jsonData.Radius ? jsonData.Radius.unit : null)
        }; // _self
    };

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
    var streetDetails = new Street({
            json: address.StreetAddress
        });
        
    var placeDetails = new Place({
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