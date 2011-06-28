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

/**
# Timelord
*/
TL = (function() {
/**
# TL.Duration
A Timelord duration is what IMO is a sensible and usable representation of a
period of "human-time".  A duration value contains both days and seconds values.

## Methods
*/
function Duration(p1, p2) {
    if (typeof p1 == 'number') {
        this.days = p1 || 0;
        this.seconds = p2 || 0;
    }
    else if (typeof p1 != 'undefined') {
        this.days = p1.days || 0;
        this.seconds = p1.seconds || 0;
    } // if..else
} // Duration

Duration.prototype = {
    /**
    ### add(args*)
    The add method returns a new Duration object that is the value of the current
    duration plus the days and seconds value provided.
    */
    add: function() {
        var result = new Duration(this.days, this.seconds);

        for (var ii = arguments.length; ii--; ) {
            result.days += arguments[ii].days;
            result.seconds += arguments[ii].seconds;
        } // for

        return result;
    },

    /**
    ### toString()
    Convert the duration to it's string represenation

    __TODO__:
    - Improve the implementation
    - Add internationalization support
    */
    toString: function() {

        var days, hours, minutes, totalSeconds,
            output = '';

        if (this.days) {
            output = this.days + ' days ';
        } // if

        if (this.seconds) {
            totalSeconds = this.seconds;

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
    }
};
var parse = (function() {
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

    return function(duration, format) {
        var parser = durationParsers[format];

        if (! parser) {
            throw 'No parser found for the duration format: ' + format;
        } // if

        return parser(duration);
    };
})();


    return {
        Duration: Duration,

        parse: parse
    };
})();
var ZOOM_MAX = 18,
    ZOOM_MIN = 3,
    REGEX_BUILDINGNO = /^(\d+).*$/,
    REGEX_NUMBERRANGE = /(\d+)\s?\-\s?(\d+)/,
    ROADTYPE_REGEX = null,

    ROADTYPE_REPLACEMENTS = {
        RD: "ROAD",
        ST: "STREET",
        CR: "CRESCENT",
        CRES: "CRESCENT",
        CT: "COURT",
        LN: "LANE",
        HWY: "HIGHWAY",
        MWY: "MOTORWAY"
    },

    placeFormatters = {
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
    },

    lastZoom = null,
    requestCounter = 1,
    header = _formatter(
        "<xls:XLS version='1' xls:lang='en' xmlns:xls='http://www.opengis.net/xls' rel='{4}' xmlns:gml='http://www.opengis.net/gml'>" +
            "<xls:RequestHeader clientName='{0}' clientPassword='{1}' sessionID='{2}' configuration='{3}' />" +
            "{5}" +
        "</xls:XLS>"),
    requestFormatter = _formatter("<xls:Request maximumResponses='{0}' version='{1}' requestID='{2}' methodName='{3}Request'>{4}</xls:Request>"),
    urlFormatter = _formatter('{0}/JSON?reqID={1}&chunkNo=1&numChunks=1&data={2}&responseFormat=JSON');

/* internal decarta functions */

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
                    test1 = normalize(input),
                    test2 = normalize(street);

                if (params.json.Building) {
                    if (buildingMatch(input, params.json.Building.number.toString())) {
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
        T5.log("No server configured for deCarta - we are going to have issues", 'warn');
    } // if

    return urlFormatter(currentConfig.server, request.requestID, escape(request_data));
} // generateRequestUrl

function makeServerRequest(request, callback, errorCallback) {
    _log("making request: " + generateRequest(request));

    _jsonp(generateRequestUrl(request, generateRequest(request)), function(data) {
        console.log(data.response);

        var response = data.response.XLS.Response;

        if ((response.numberOfResponses > 0) && response[request.methodName + 'Response']) {
            var responseValues = [];
            if (request.parseResponse) {
                responseValues = request.parseResponse(response[request.methodName + 'Response']);
            } // if

            if (callback) {
                callback.apply(null, responseValues);
            } // if
        }
        else if (errorCallback) {
            errorCallback('Server returned no responses', data.response);
        } // if..else
    });
} // openlsComms

function parseAddress(address, position) {
    var streetDetails = new Street({
            json: address.StreetAddress
        }),
        regions = [];

    if (address.Place) {
        if (! address.Place.length) {
            address.Place = [address.Place];
        } // if

        for (var ii = address.Place.length; ii--; ) {
            regions[regions.length] = address.Place[ii].content;
        } // for
    } // if

    return {
        building: streetDetails.building,
        street: streetDetails.street,
        regions: regions,
        countryCode: address.countryCode || '',
        postalCode: address.PostalCode || '',
        pos: position
    };
} // parseAddress

/* define the address tools */

function buildingMatch(freeform, numberRange, name) {
    REGEX_BUILDINGNO.lastIndex = -1;
    if (REGEX_BUILDINGNO.test(freeform)) {
        var buildingNo = freeform.replace(REGEX_BUILDINGNO, "$1");

        var numberRanges = numberRange.split(",");
        for (var ii = 0; ii < numberRanges.length; ii++) {
            REGEX_NUMBERRANGE.lastIndex = -1;
            if (REGEX_NUMBERRANGE.test(numberRanges[ii])) {
                var matches = REGEX_NUMBERRANGE.exec(numberRanges[ii]);
                if ((buildingNo >= parseInt(matches[1], 10)) && (buildingNo <= parseInt(matches[2], 10))) {
                    return true;
                } // if
            }
            else if (buildingNo == numberRanges[ii]) {
                return true;
            } // if..else
        } // for
    } // if

    return false;
} // buildingMatch

function normalize(addressText) {
    if (! addressText) { return ""; }

    addressText = addressText.toUpperCase();

    if (! ROADTYPE_REGEX) {
        var abbreviations = [];
        for (var roadTypes in ROADTYPE_REPLACEMENTS) {
            abbreviations.push(roadTypes);
        } // for

        ROADTYPE_REGEX = new RegExp("(\\s)(" + abbreviations.join("|") + ")(\\s|$)", "i");
    } // if

    ROADTYPE_REGEX.lastIndex = -1;

    var matches = ROADTYPE_REGEX.exec(addressText);
    if (matches) {
        var normalizedRoadType = ROADTYPE_REPLACEMENTS[matches[2]];
        addressText = addressText.replace(ROADTYPE_REGEX, "$1" + normalizedRoadType);
    } // if

    return addressText;
} // normalize

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
            return [response];
        }
    }; // _self

    return _self;
};

var RUOKRequest = function(params) {
    return T5.ex(new Request(), {
        methodName: 'RUOK',

        parseResponse: function(response) {
            return [{
                aliasCount: response.maxHostAliases,
                host: response.hostName
            }];
        }
    });
}; // RUOKRequest
T5.Registry.register('generator', 'decarta', function(view, params) {
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
    tileConfig = currentConfig.tileConfig;

    /* internals */

    function createTiles(store, callback) {
        var zoomLevel = view.zoom ? view.zoom() : 0,
            viewport = view.viewport();

        if (zoomLevel) {
            var numTiles = 2 << (zoomLevel - 1),
                numTilesHalf = numTiles >> 1,
                tileSize = params.tileSize,
                xTiles = (viewport.w / tileSize | 0) + 1,
                yTiles = (viewport.h / tileSize | 0) + 1,
                xTile = (viewport.x / tileSize | 0) - numTilesHalf,
                yTile = numTiles - (viewport.y / tileSize | 0) - numTilesHalf - yTiles,
                tiles = store.search({
                    x: (numTilesHalf + xTile) * tileSize,
                    y: (numTilesHalf + yTile*-1 - yTiles) * tileSize,
                    w: xTiles * tileSize,
                    h: yTiles * tileSize
                }),
                tileIds = {},
                hosts = tileConfig.hosts,
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
                               '&CLIENTNAME=' + tileConfig.clientName +
                               '&SESSIONID=' + tileConfig.sessionID +
                               '&FORMAT=PNG' +
                               '&CONFIG=' + tileConfig.configuration +
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

    function run(store, callback) {
        if (tileConfig) {
            createTiles(store, callback);
        }
        else {
            var userId = currentConfig.clientName.replace(/.*?\:/, '');

            T5.Decarta.getTileConfig(userId, function(config) {
                setTileConfig(config);

                createTiles(store, callback);
            });
        } // if..else
    } // run

    function setTileConfig(config) {
        tileConfig = config;
    } // setTileConfig

    /* define the generator */

    view.addCopy('&copy; deCarta, Inc. Map and Imagery Data &copy; NAVTEQ or Tele Atlas or DigitalGlobe');

    return {
        run: run,
        setTileConfig: setTileConfig
    };
});
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
                if (match && match.Point) {
                    matchPos = new GeoJS.Pos(match.Point.pos);
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

            for (var ii = 0; matchList && (ii < matchList.length); ii++) {
                var matchResult = parseMatchResult(matchList[ii]);
                if (matchResult) {
                    addresses.push(matchResult);
                } // if
            } // for

            return addresses;
        } // getResponseAddresses

        var parent = new Request();

        var _self = T5.ex({}, parent, {
            methodName: "Geocode",

            getRequestBody: function() {
                var addressXML = _streetAddressFormatter(address.number, address.street);

                /*
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
                    matchPos = new GeoJS.Pos(match.Point.pos);
                } // if

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
        var request = new ReverseGeocodeRequest({
            position: pos
        });

        makeServerRequest(request, function(matchingAddress) {
            if (callback) {
                callback(matchingAddress);
            } // if
        });
    } // reverse

    if (typeof ADDR === 'undefined') {
        T5.log('Sidelab addressing module not found, geocoder will not function', 'warn');
    } // if

    return {
        forward: forward,
        reverse: reverse
    };
});
T5.Registry.register('service', 'routing', function() {

    var RouteRequest = function(waypoints, params) {
        params = T5.ex({
            provideRouteHandle: false,
            distanceUnit: "KM",
            routeQueryType: "RMAN",
            preference: "Fastest",
            routeInstructions: true,
            routeGeometry: true
        }, params);

        var parent = new Request(),
            routeHeaderFormatter = T5.formatter('<xls:DetermineRouteRequest provideRouteHandle="{0}" distanceUnit="{1}" routeQueryType="{2}">'),
            waypointFormatter = T5.formatter('<xls:{0}><xls:Position><gml:Point><gml:pos>{1}</gml:pos></gml:Point></xls:Position></xls:{0}>');

        function parseInstructions(instructionList) {
            var fnresult = [],
                instructions = instructionList && instructionList.RouteInstruction ?
                    instructionList.RouteInstruction : [];

            for (var ii = 0; ii < instructions.length; ii++) {
                var distance = instructions[ii].distance;

                fnresult.push({
                    text: instructions[ii].Instruction,
                    latlng: instructions[ii].Point,
                    distance: distance.value + (distance.uom || 'M').toUpperCase(),
                    time: TL.parse(instructions[ii].duration, '8601')
                });
            } // for


            return fnresult;
        } // parseInstructions

        var _self = T5.ex({}, parent, {
            methodName: "DetermineRoute",

            getRequestBody: function() {
                if (waypoints.length < 2) {
                    throw new Error("Cannot send RouteRequest, less than 2 waypoints specified");
                } // if

                var body = routeHeaderFormatter(params.provideRouteHandle, params.distanceUnit, params.routeQueryType);

                body += "<xls:RoutePlan>";

                body += "<xls:RoutePreference>" + params.preference + "</xls:RoutePreference>";

                body += "<xls:WayPointList>";

                for (var ii = 0; ii < waypoints.length; ii++) {
                    var tagName = (ii === 0 ? "StartPoint" : (ii === waypoints.length-1 ? "EndPoint" : "ViaPoint"));

                    body += waypointFormatter(tagName, waypoints[ii].toString());
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
                return [
                    response.RouteGeometry.LineString.pos,
                    parseInstructions(response.RouteInstructionsList)
                ];
            }
        });

        return _self;
    };

    /* exports */

    function calculate(waypoints, callback, errorCallback, opts) {
        opts = T5.ex({
            preference: 'Fastest'
        }, opts);

        var routeRequest = new RouteRequest(waypoints, opts);

        makeServerRequest(routeRequest, callback, errorCallback);
    } // calculate

    return {
        calculate: calculate
    };
});

    return {
        applyConfig: function(args) {
            T5.ex(currentConfig, args);
        },

        getTileConfig: function(userId, callback) {
            makeServerRequest(new RUOKRequest(), function(config) {
                var clientName = currentConfig.clientName.replace(/\:.*/, ':' + (userId || ''));

                hosts = [];

                if (config.aliasCount) {
                    for (var ii = 0; ii < config.aliasCount; ii++) {
                        hosts[ii] = 'http://' + config.host.replace('^(.*?)\.(.*)$', '\1-0' + (ii + 1) + '.\2');
                    } // for
                }
                else {
                    hosts = ['http://' + config.host];
                } // if..else

                callback({
                    hosts: hosts,
                    clientName: clientName,
                    sessionID: currentConfig.sessionID,
                    configuration: currentConfig.configuration
                });
            });
        },

        setTileConfig: function(data) {
            currentConfig.tileConfig = data;
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
