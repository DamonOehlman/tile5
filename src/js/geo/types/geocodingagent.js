/**
# T5.Geo.GeocodingAgent

TODO
*/
var GeocodingAgent = function(params) {
    
    function rankResults(searchParams, results) {
        // if freeform parameters then rank
        if (searchParams.freeform) {
            results = module.rankGeocodeResponses(searchParams.freeform, results, getEngine("geocode"));
        } // if
        // TODO: rank structured results
        else {
            
        }

        return results;
    } // rankResults
    
    // extend parameters with defaults
    params = COG.extend({
        name: "Geocoding Search Agent",
        paramTranslator: null,
        execute: function(searchParams, callback) {
            try {
                // check for a freeform request
                if ((! searchParams.reverse) && (! searchParams.freeform)) {
                    address = new Address(searchParams);
                } // if
                
                // get the geocoding engine
                var engine = getEngine("geocode");
                if (engine) {
                    engine.geocode({
                        addresses: [searchParams.freeform ? searchParams.freeform : address],
                        complete: function(requestAddress, possibleMatches) {
                            if (callback) {
                                callback(rankResults(searchParams, possibleMatches), params);
                            } // if
                        }
                    });
                } // if
            } 
            catch (e) {
                COG.exception(e);
            } // try..catch
        }
    }, params);
    
    var _self = new T5.Dispatcher.Agent(params);
    
    return _self;
};