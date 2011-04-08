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

    var GeoSearchResult = function(params) {
        params = COG.extend({
            id: null,
            caption: "",
            resultType: "",
            data: null,
            pos: null,
            matchWeight: 0
        }, params);

        return COG.extend(params, {
            toString: function() {
                return params.caption + (params.matchWeight ? " (" + params.matchWeight + ")" : "");
            }
        });
    };

    var LocationSearch = function(params) {
        params = COG.extend({
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
            COG.info('caught location tracking error:', error);
        } // trackingError

        var _self = new T5.Geo.GeoSearchAgent(COG.extend({
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
            compareFns = COG.extend({}, compareFns, engine.compareFns);
        } // if

        for (var ii = 0; ii < responseAddresses.length; ii++) {
            matches.push(new module.GeoSearchResult({
                caption: addrTools.toString(responseAddresses[ii]),
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

        /**
        ### search(args, callback)
        The search method represents the guts of the SearchTools module. The args parameter accepts
        either a simple string or an object literal which is then passed onto suitable search agents.
        */
        search: function(args, callback) {

        }
    };

    COG.observable(module);

    return module;
})();
