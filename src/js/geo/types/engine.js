// initialise the engine registry
var engines = {};

/**
# T5.Geo.Engine
*/
var GeoEngine = function(params) {
    // if the id for the engine is not specified, throw an exception
    if (! params.id) {
        throw new Error("A GEO.Engine cannot be registered without providing an id.");
    } // if

    // map the parameters directly to self
    var self = COG.extend({
        remove: function() {
            delete engines[self.id];
        }
    }, params);

    // register the engine
    engines[self.id] = self;
    return self;
};