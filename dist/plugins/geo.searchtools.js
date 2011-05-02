/**
# T5.SearchTools
__PLUGIN__: `plugins/geo.searchtools.js`

The Tile5 search tools plugin is an extraction of some of the core search
functionality that was originally implemented in the core Tile5 library. Basically
the goal is to create a suite of tools that assist with the rationalization of
multiple search results across a number of disparate stores and help aggregate
those into a single meaningful set of results.

Depending on the capabilities of the current browser the search tools module is
capable of taking forward geocoding requests, reverse geocoding requests, direction
requests and 'Current Location' requests and attempting to provide results based
on the geo engines that are currently available in the Tile5 application.

## Events

### locationDetected

## Module Methods
*/
T5.SearchTools = (function() {

    /* internals */

    /*
    This function is used to determine the match weight between a freeform geocoding
    request and it's structured response.
    */
    function plainTextAddressMatch(request, response, compareFns, fieldWeights) {
        var matchWeight = 0;

        request = request.toUpperCase();


        for (var fieldId in fieldWeights) {
            var fieldVal = response[fieldId];

            if (fieldVal) {
                var compareFn = compareFns[fieldId],
                    matchStrength = compareFn ? compareFn(request, fieldVal) : (_wordExists(request, fieldVal) ? 1 : 0);

                matchWeight += (matchStrength * fieldWeights[fieldId]);
            } // if
        } // for

        return matchWeight;
    } // plainTextAddressMatch

    var GeoSearchResult = function(params) {
        params = _extend({
            id: null,
            caption: "",
            resultType: "",
            data: null,
            pos: null,
            matchWeight: 0
        }, params);

        return _extend(params, {
            toString: function() {
                return params.caption + (params.matchWeight ? " (" + params.matchWeight + ")" : "");
            }
        });
    };

    var LocationSearch = function(params) {
        params = _extend({
            name: "Geolocation Search",
            requiredAccuracy: null,
            searchTimeout: 5000,
            watch: false
        }, params);

        var geoWatchId = 0,
            locationTimeout = 0,
            lastPosition = null;

        /* tracking functions */

        function parsePosition(position) {
            var currentPos = new Pos(
                    position.coords.latitude,
                    position.coords.longitude);

            return new GeoSearchResult({
                id: 1,
                caption: 'Current Location',
                pos: currentPos,
                accuracy: position.coords.accuracy / 1000,
                matchWeight: 100
            });
        } // trackingUpdate

        function sendPosition(searchResult, callback) {
            navigator.geolocation.clearWatch(geoWatchId);
            geoWatchId = 0;

            if (locationTimeout) {
                clearTimeout(locationTimeout);
                locationTimeout = 0;
            } // if

            if (callback) {
                callback([searchResult], params);
            } // if
        } // sendPosition

        function trackingError(error) {
            _log('caught location tracking error:', error);
        } // trackingError

        var _self = new T5.Geo.GeoSearchAgent(_extend({
            execute: function(searchParams, callback) {
                if (navigator.geolocation && (! geoWatchId)) {
                    geoWatchId = navigator.geolocation.watchPosition(
                        function(position) {
                            var newPosition = parsePosition(position);

                            if ((! lastPosition) || (newPosition.accuracy < lastPosition.accuracy)) {
                                lastPosition = newPosition;
                            } // if

                            if ((! params.requiredAccuracy) ||
                                (lastPosition.accuracy < params.requiredAccuracy)) {
                                sendPosition(lastPosition, callback);
                            } // if
                        },
                        trackingError, {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 5000
                        });

                    if (params.searchTimeout) {
                        locationTimeout = setTimeout(function() {
                            if (lastPosition) {
                                sendPosition(lastPosition, callback);
                            } // if
                        }, params.searchTimeout);
                    } // if
                } // if
            }
        }, params));

        return _self;
    };

    var DEFAULT_MAXDIFF = 20;

    function bestResults(searchResults, maxDifference) {
        maxDifference = maxDifference || DEFAULT_MAXDIFF;

        var bestMatch = searchResults.length > 0 ? searchResults[0] : null,
            fnresult = [];

        for (var ii = 0; ii < searchResults.length; ii++) {
            if (bestMatch && searchResults[ii] &&
                (bestMatch.matchWeight - searchResults[ii].matchWeight <= maxDifference)) {

                fnresult.push(searchResults[ii]);
            }
            else {
                break;
            } // if..else
        } // for

        return fnresult;
    }

    /*
    ### rankGeocodeResponses(requestAddress, responseAddress, engine)
    To be completed
    */
    function rankGeocodeResponses(requestAddress, responseAddresses, engine) {
        var matches = [],
            compareFns = {};

        if (engine && engine.compareFns) {
            compareFns = T5.ex({}, compareFns, engine.compareFns);
        } // if

        for (var ii = 0; ii < responseAddresses.length; ii++) {
            matches.push(new GeoSearchResult({
                caption: responseAddresses[ii].toString(),
                data: responseAddresses[ii],
                pos: responseAddresses[ii].pos,
                matchWeight: plainTextAddressMatch(requestAddress, responseAddresses[ii], compareFns, module.GeocodeFieldWeights)
            }));
        } // for

        matches.sort(function(itemA, itemB) {
            return itemB.matchWeight - itemA.matchWeight;
        });

        return matches;
    } // rankGeocodeResponses

    /* exports */

    var module = {
        GeocodeFieldWeights: {
            streetDetails: 50,
            location: 50
        },

        rankGeocodeResponses: rankGeocodeResponses,

        /**
        ### search(args, callback)
        The search method represents the guts of the SearchTools module. The args parameter accepts
        either a simple string or an object literal which is then passed onto suitable search agents.
        */
        search: function(args, callback) {

        }
    };

    T5.observable(module);

    return module;
})();
