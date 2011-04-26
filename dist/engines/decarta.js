/*!
 * Sidelab COG Javascript Library v0.2.0
 * http://www.sidelab.com/
 *
 * Copyright 2011, Damon Oehlman <damon.oehlman@sidelab.com>
 * Licensed under the MIT licence
 * https://github.com/sidelab/cog
 *
 */

COG = typeof COG !== 'undefined' ? COG : {};

/**
# COG.extend
*/
COG.extend = function() {
    var target = arguments[0] || {},
        source;

    for (var ii = 1, argCount = arguments.length; ii < argCount; ii++) {
        if ((source = arguments[ii]) !== null) {
            for (var name in source) {
                var copy = source[name];

                if (target === copy) {
                    continue;
                } // if

                if (copy !== undefined) {
                    target[name] = copy;
                } // if
            } // for
        } // if
    } // for

    return target;
}; // extend

(function() {
    var DAY_SECONDS = 86400;

    var periodRegex = /^P(\d+Y)?(\d+M)?(\d+D)?$/,
        timeRegex = /^(\d+H)?(\d+M)?(\d+S)?$/,
        durationParsers = {
            8601: parse8601Duration
        };

    /* internal functions */

    /*
    Used to convert a ISO8601 duration value (not W3C subset)
    (see http://en.wikipedia.org/wiki/ISO_8601#Durations) into a
    composite value in days and seconds
    */
    function parse8601Duration(input) {
        var durationParts = input.split('T'),
            periodMatches = null,
            timeMatches = null,
            days = 0,
            seconds = 0;

        periodRegex.lastIndex = -1;
        periodMatches = periodRegex.exec(durationParts[0]);

        days = days + (periodMatches[3] ? parseInt(periodMatches[3].slice(0, -1), 10) : 0);

        timeRegex.lastIndex = -1;
        timeMatches = timeRegex.exec(durationParts[1]);

        seconds = seconds + (timeMatches[1] ? parseInt(timeMatches[1].slice(0, -1), 10) * 3600 : 0);
        seconds = seconds + (timeMatches[2] ? parseInt(timeMatches[2].slice(0, -1), 10) * 60 : 0);
        seconds = seconds + (timeMatches[3] ? parseInt(timeMatches[3].slice(0, -1), 10) : 0);

        return new Duration(days, seconds);
    } // parse8601Duration

    /* exports */

    var Duration = COG.Duration = function(days, seconds) {
        return {
            days: days ? days : 0,
            seconds: seconds ? seconds : 0
        };
    };

    /**
    ### addDuration(duration*)
    This function is used to return a new duration that is the sum of the duration
    values passed to the function.
    */
    var addDuration = COG.addDuration = function() {
        var result = new Duration();

        for (var ii = arguments.length; ii--; ) {
            result.days = result.days + arguments[ii].days;
            result.seconds = result.seconds + arguments[ii].seconds;
        } // for

        if (result.seconds >= DAY_SECONDS) {
            result.days = result.days + ~~(result.seconds / DAY_SECONDS);
            result.seconds = result.seconds % DAY_SECONDS;
        } // if

        return result;
    }; // increaseDuration

    /**
    ### formatDuration(duration)

    This function is used to format the specified duration as a string value

    #### TODO
    Add formatting options and i18n support
    */
    var formatDuration = COG.formatDuration = function(duration) {

        var days, hours, minutes, totalSeconds,
            output = '';

        if (duration.days) {
            output = duration.days + ' days ';
        } // if

        if (duration.seconds) {
            totalSeconds = duration.seconds;

            if (totalSeconds >= 3600) {
                hours = ~~(totalSeconds / 3600);
                totalSeconds = totalSeconds - (hours * 3600);
            } // if

            if (totalSeconds >= 60) {
                minutes = Math.round(totalSeconds / 60);
                totalSeconds = totalSeconds - (minutes * 60);
            } // if

            if (hours) {
                output = output + hours +
                    (hours > 1 ? ' hrs ' : ' hr ') +
                    (minutes ?
                        (minutes > 10 ?
                            minutes :
                            '0' + minutes) + ' min '
                        : '');
            }
            else if (minutes) {
                output = output + minutes + ' min';
            }
            else if (totalSeconds > 0) {
                output = output +
                    (totalSeconds > 10 ?
                        totalSeconds :
                        '0' + totalSeconds) + ' sec';
            } // if..else
        } // if

        return output;
    }; // formatDuration

    var parseDuration = COG.parseDuration = function(duration, format) {
        var parser = format ? durationParsers[format] : null;

        if (parser) {
            return parser(duration);
        }

        COG.Log.warn('Could not find duration parser for specified format: ' + format);
        return new Duration();
    }; // durationToSeconds
})();

T5.Decarta = (function() {
    var currentConfig = {
        sessionID: new Date().getTime(),
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

        requestTimeout: 30000,

        geocoding: {
            countryCode: "US",
            language: "EN"
        }
    };

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
    requestCounter = 1,
    header = _formatter(
        "<xls:XLS version='1' xls:lang='en' xmlns:xls='http://www.opengis.net/xls' rel='{4}' xmlns:gml='http://www.opengis.net/gml'>" +
            "<xls:RequestHeader clientName='{0}' clientPassword='{1}' sessionID='{2}' configuration='{3}' />" +
            "{5}" +
        "</xls:XLS>"),
    requestFormatter = _formatter("<xls:Request maximumResponses='{0}' version='{1}' requestID='{2}' methodName='{3}Request'>{4}</xls:Request>"),
    urlFormatter = _formatter('{0}/JSON?reqID={1}&chunkNo=1&numChunks=1&data={2}&responseFormat=JSON');

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

var Address = function(params) {
        params = T5.ex({
            countryCode: currentConfig.geocoding.countryCode,
            language: currentConfig.geocoding.language,
            freeform: null,
            streetAddress: {
                building: null
            }
        }, params);

        var addressHeader = _formatter('<xls:Address countryCode="{0}" language="{1}">');

        var _self = {
            getXML: function() {
                var addressXml = addressHeader(params.countryCode, params.language);

                if (params.freeform) {
                    var addressText = String(params.freeform).replace(/(\'|\")/, "\\$1");
                    addressXml += "<xls:freeFormAddress>" + addressText + "</xls:freeFormAddress>";
                }
                else {

                } // if..else

                return addressXml + "</xls:Address>";
            } //getXML
        };

        return _self;
    },

    Place = function(params) {
        params = T5.ex({
            landmark: "",
            municipality: "",
            municipalitySubdivision: "",
            countrySubdivision: "",
            countryCode: ""
        }, params);

        var _self = T5.ex({
            calcMatchPercentage: function(input) {
                var fnresult = 0;

                if (params.landmark && params.landmarkSubType) {
                    if (T5.wordExists(input, params.landmarkSubType)) {
                        fnresult += 0.4;

                        fnresult += T5.wordExists(input, params.landmark) ? 0.6 : 0;
                    } // if
                }
                else {
                    fnresult += T5.wordExists(input, params.municipalitySubdivision) ? 0.8 : 0;

                    if ((fnresult === 0) && params.municipality) {
                        fnresult += T5.wordExists(input, params.municipality) ? 0.7 : 0;
                    } // if
                } // if..else

                if (params.countrySubdivision) {
                    fnresult += T5.wordExists(input, params.countrySubdivision) ? 0.2 : 0;
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
                for (var ii = 0; details && (ii < details.length); ii++) {
                    var contentType = details[ii].type ? (details[ii].type.slice(0, 1).toLowerCase() + details[ii].type.slice(1)) : "";

                    if (typeof params[contentType] !== 'undefined') {
                        params[contentType] = details[ii].content;

                        if (details[ii].subType) {
                            params[contentType + "SubType"] = details[ii].subType;
                        } // if
                    } // if
                } // for

                T5.ex(_self, params);
            },

            toString: function() {
                var formatter = placeFormatters[_self.getCountryCode()];

                if (! formatter) {
                    formatter = placeFormatters.DEFAULT;
                } // if

                return formatter(params);
            }
        }, params);

        return _self;
    },

    Street = function(params) {
        params = T5.ex({
            json: {}
        }, params);

        var street = "",
            building = "";

        if (params.json.Street) {
            street = params.json.Street.content ? params.json.Street.content : params.json.Street;
        } // if

        street = (street && street.replace) ? street.replace(/\/\d+$/, "") : "";

        if (params.json.Building) {
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

                if (test1 && test2 && T5.wordExists(test1, test2)) {
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
    };

/* request types and functions */

function createRequestHeader(payload) {
    return header(
        currentConfig.clientName,
        currentConfig.clientPassword,
        currentConfig.sessionID,
        currentConfig.configuration,
        currentConfig.release,
        payload);
} // createRequestHeader

function createRequestTag(request, payload) {
    return requestFormatter(
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
        _log("No server configured for deCarta - we are going to have issues", 'warn');
    } // if

    return urlFormatter(currentConfig.server, request.requestID, escape(request_data));
} // generateRequestUrl

function makeServerRequest(request, callback) {

    _jsonp(generateRequestUrl(request, generateRequest(request)), function(data) {
        var response = data.response.XLS.Response;

        if ((response.numberOfResponses > 0) && response[request.methodName + 'Response']) {
            var parsedResponse = null;
            if (request.parseResponse) {
                parsedResponse = request.parseResponse(response[request.methodName + 'Response']);
            } // if

            if (callback) {
                callback(parsedResponse);
            } // if
        }
        else {
            _log("no responses from server: " + data.response, 'error');
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

    placeDetails.parse(address.Place);

    var addressParams = {
        streetDetails: streetDetails,
        location: placeDetails,
        country: address.countryCode ? address.countryCode : "",
        postalCode: address.PostalCode ? address.PostalCode : "",
        pos: position
    };

    return new T5.Geo.Address(addressParams);
} // parseAddress

var Request = function() {
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
    return T5.ex(new Request(), {
        methodName: 'RUOK',

        parseResponse: function(response) {
            return {
                aliasCount: response.maxHostAliases,
                host: response.hostName
            };
        }
    });
}; // RUOKRequest
T5.Registry.register('generator', 'decarta', function(params) {
    params = T5.ex({
        tileSize: 256
    }, params);

    var DEGREES_TO_RADIANS = Math.PI / 180,
        RADIANS_TO_DEGREES = 180 / Math.PI;

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
        var zoomLevel = view.zoom ? view.zoom() : 0;

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
                    y: (numTilesHalf + yTile*-1 - yTiles) * tileSize,
                    w: xTiles * tileSize,
                    h: yTiles * tileSize
                }),
                tileIds = {},
                ii;

            for (ii = tiles.length; ii--; ) {
                tileIds[tiles[ii].id] = true;
            } // for

            for (var xx = 0; xx <= xTiles; xx++) {
                for (var yy = 0; yy <= yTiles; yy++) {
                    var tileX = xTile + xx,
                        tileY = yTile + yy - 1,
                        tileId = tileX + '_' + tileY;

                    if (! tileIds[tileId]) {
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

                        store.insert(tile, tile);
                    } // if
                } // for
            } // for

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
            makeServerRequest(new RUOKRequest(), function(tileConfig) {
                hosts = [];

                if (tileConfig.aliasCount) {
                    for (var ii = 0; ii < tileConfig.aliasCount; ii++) {
                        hosts[ii] = 'http://' + tileConfig.host.replace('^(.*?)\.(.*)$', '\1-0' + (ii + 1) + '.\2');
                    } // for
                }
                else {
                    hosts = ['http://' + tileConfig.host];
                } // if..else

                createTiles(view, viewRect, store, callback);
            });
        }
    } // run

    /* define the generator */

    T5.userMessage('ack', 'decarta', '&copy; deCarta, Inc. Map and Imagery Data &copy; NAVTEQ or Tele Atlas or DigitalGlobe');

    return {
        run: run
    };
});
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
                if (match && match.Point) {
                    matchPos = new T5.Pos(match.Point.pos);
                } // if

                if (match && match.Address) {
                    matchAddress = parseAddress(match.Address, matchPos);
                } // if
            }

            return matchAddress;
        } // parseMatchResult

        function getResponseAddresses(responseList) {
            var addresses = [];
            var responseCount = responseList ? responseList.numberOfGeocodedAddresses : 0;
            var matchList = [];

            if (responseCount > 1) {
                matchList = responseList.GeocodedAddress;
            }
            else if (responseCount == 1) {
                matchList = [responseList.GeocodedAddress];
            } // if..else

            try {
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

        var parent = new Request();

        var _self = T5.ex({}, parent, {
            methodName: "Geocode",

            getRequestBody: function() {
                var body = requestFormatter(params.parserReport, params.parseOnly, params.returnSpatialKeys);

                for (var ii = 0; ii < params.addresses.length; ii++) {
                    body += params.addresses[ii].getXML();
                } // for

                return body + "</xls:GeocodeRequest>";
            },

            parseResponse: function(response) {

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

                if (response && response.Point) {
                    matchPos = new T5.Pos(match.Point.pos);
                } // if

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
        args = T5.ex({
            addresses: [],
            complete: null
        }, args);

        var ii, requestAddresses = [];

        if (args.addresses && (! T5.is(args.addresses, 'array'))) {
            args.addresses = [args.addresses];
        } // if

        for (ii = 0; ii < args.addresses.length; ii++) {
            if (T5.is(args.addresses[ii], 'object')) {
                _log("attempting to geocode a simple object - not implemented", 'warn');
            }
            else {
                requestAddresses.push(new types.Address({
                    freeform: args.addresses[ii]
                }));
            }
        } // if

        if (requestAddresses.length > 0) {
            var request = new GeocodeRequest({
                addresses: requestAddresses
            });

            makeServerRequest(request, function(geocodeResponses) {
                if (args.complete) {
                    for (ii = 0; ii < geocodeResponses.length; ii++) {
                        args.complete(args.addresses[ii], geocodeResponses[ii]);
                    } // for
                } // if

            });
        } // if
    } // forward

    function reverse(args) {
        args = T5.ex({
            position: null,
            complete: null
        }, args);

        if (! args.position) {
            throw new Error("Cannot reverse geocode without a position");
        } // if

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
T5.Registry.register('service', 'routing', function() {
    var RouteRequest = function(params) {
        params = T5.ex({
            waypoints: [],
            provideRouteHandle: false,
            distanceUnit: "KM",
            routeQueryType: "RMAN",
            routePreference: "Fastest",
            routeInstructions: true,
            routeGeometry: true
        }, params);

        var parent = new Request(),
            routeHeaderFormatter = _formatter('<xls:DetermineRouteRequest provideRouteHandle="{0}" distanceUnit="{1}" routeQueryType="{2}">'),
            waypointFormatter = _formatter('<xls:{0}><xls:Position><gml:Point><gml:pos>{1}</gml:pos></gml:Point></xls:Position></xls:{0}>');

        function parseInstructions(instructionList) {
            var fnresult = [],
                instructions = instructionList && instructionList.RouteInstruction ?
                    instructionList.RouteInstruction : [],
                totalDistance = 0,
                totalTime = new COG.Duration();

            for (var ii = 0; ii < instructions.length; ii++) {
                var distance = distanceToMeters(instructions[ii].distance),
                    time = COG.parseDuration(instructions[ii].duration, '8601');

                totalDistance = totalDistance + distance;
                totalTime = COG.addDuration(totalTime, time);

                fnresult.push(new T5.RouteTools.Instruction({
                    position: new T5.Pos(instructions[ii].Point),
                    description: instructions[ii].Instruction,
                    distance: distance,
                    distanceTotal: totalDistance,
                    time: time,
                    timeTotal: totalTime
                }));
            } // for


            return fnresult;
        } // parseInstructions

        var _self = T5.ex({}, parent, {
            methodName: "DetermineRoute",

            getRequestBody: function() {
                if (params.waypoints.length < 2) {
                    throw new Error("Cannot send RouteRequest, less than 2 waypoints specified");
                } // if

                var body = routeHeaderFormatter(params.provideRouteHandle, params.distanceUnit, params.routeQueryType);

                body += "<xls:RoutePlan>";

                body += "<xls:RoutePreference>" + params.routePreference + "</xls:RoutePreference>";

                body += "<xls:WayPointList>";

                for (var ii = 0; ii < params.waypoints.length; ii++) {
                    var tagName = (ii === 0 ? "StartPoint" : (ii === params.waypoints.length-1 ? "EndPoint" : "ViaPoint"));

                    body += waypointFormatter(tagName, params.waypoints[ii].toString());
                }

                body += "</xls:WayPointList>";


                body += "</xls:RoutePlan>";

                if (params.routeInstructions) {
                    body += "<xls:RouteInstructionsRequest rules=\"maneuver-rules\" providePoint=\"true\" />";
                } // if

                if (params.routeGeometry) {
                    body += "<xls:RouteGeometryRequest />";
                } // if

                body += "</xls:DetermineRouteRequest>";
                return body;
            },

            parseResponse: function(response) {

                return new T5.RouteTools.RouteData({
                    geometry: T5.Geo.PosFns.parseArray(response.RouteGeometry.LineString.pos),
                    instructions: parseInstructions(response.RouteInstructionsList)
                });
            }
        });

        return _self;
    };

    /* exports */

    function calculate(args, callback) {
        args = T5.ex({
           waypoints: []
        }, args);

        if (typeof T5.RouteTools !== 'undefined') {
            var request = new RouteRequest(args);
            makeServerRequest(request, function(routeData) {
                if (callback) {
                    callback(routeData);
                } // if
            });
        }
        else {
            _log('Could not generate route, T5.RouteTools plugin not found', 'warn');
        } // if..else
    } // calculate

    return {
        calculate: calculate
    };
});

    return {
        applyConfig: function(args) {
            T5.ex(currentConfig, args);
        },

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
    };
})();
