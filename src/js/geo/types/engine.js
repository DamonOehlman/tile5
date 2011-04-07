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

    // map the parameters directly to _self
    var _self = COG.extend({
        remove: function() {
            delete engines[_self.id];
        }
    }, params);

    // register the engine
    engines[_self.id] = _self;
    return _self;
};

/**
### getEngine(requiredCapability)
Returns the engine that provides the required functionality.  If preferred engines are supplied
as additional arguments, then those are looked for first
*/
function getEngine(requiredCapability) {
    // initialise variables
    var fnresult = null;

    // iterate through the arguments beyond the capabililty for the preferred engine
    for (var ii = 1; (! fnresult) && (ii < arguments.length); ii++) {
        fnresult = findEngine(requiredCapability, arguments[ii]);
    } // for

    // if we found an engine using preferences, return that otherwise return an alternative
    fnresult = fnresult ? fnresult : findEngine(requiredCapability);

    // if no engine was found, then throw an exception
    if (! fnresult) {
        throw new Error("Unable to find GEO engine with " + requiredCapability + " capability");
    }

    return fnresult;
} // getEngine