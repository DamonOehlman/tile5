/**
@module

Define functionality to enable routing for mapping
*/
SLICK.Geo.Routing = (function() {
    // initialise variables
    var engines = [];
    
    function findEngine(engineId) {
        var matchingEngine = null;
        
        // first pass, look for an engine with the matching id or the preferred engine if engine id is not supplied
        for (var ii = 0; ii < engines.length; ii++) {
            if ((engineId && (engines[ii].id == engineId)) || ((! engineId) && engines[ii].preferred)) {
                matchingEngine = engines[ii];
            } // if
        } // for
        
        // if we don't have a matching engine, but we do have engines, just take the first one
        if ((! matchingEngine) && (engines.length > 0)) {
            matchingEngine = engines[0];
        } // if
        
        return matchingEngine;
    } // findEngine
    
    function createRouteOverlay(map, routeData) {
        // get the map dimensions
        var dimensions = map.getDimensions();
        
        // create a new route overlay for the specified data
        var overlay = new SLICK.Mapping.RouteOverlay({
            geometry: routeData.getGeometry(),
            width: dimensions.width,
            height: dimensions.height
        });
        
        // add the overlay to the map
        map.setLayer("route", overlay);
    } // createRouteOverlay
    
    // define the module
    var module = {
        /* module functions */
        
        calculate: function(args) {
            args = GRUNT.extend({
                engineId: "",
                waypoints: [],
                map: null,
                error: null,
                success: null
            }, args);
            
            // find an available routing engine
            var engine = findEngine(args.engineId);
            if (engine) {
                engine.calculateRoute(args, function(routeData) {
                    // firstly, if we have a map defined, then let's place the route on the map
                    // you know, just because we are nice like that
                    if (args.map) {
                        createRouteOverlay(args.map, routeData);
                    } // if
                    
                    // if we have a success handler, then call it
                    if (args.success) {
                        
                    }
                });
            } // if
        },
        
        /**
        Add / update a routing engine in the array of routing engines.  In most cases only one routing engine will
        be registered in an application, but just in case there are more than one, the functionality has been provided
        to support multiple.
        
        */
        register: function(args) {
            args = GRUNT.extend({
                id: "",
                preferred: engines.length === 0,
                calculateRoute: null
            }, args);
            
            // initialise variables
            var existingIndex = -1;
            
            // if calculate route is not defined for the engine, then raise an exception
            // (why do we want a routing engine that can't provide a route)
            if (! args.calculateRoute) {
                throw new Error(String.format("Routing Engine '{0}' provides no calculateRoute functionality - not adding", args.id));
            } // if
            
            // if the id for the engine is not specified, throw an exception
            if (! args.id) {
                throw new Error("Routing engines require an id to register them.");
            } // if
            
            // iterate through the engines and look for a router with the id already specified
            for (var ii = 0; ii < engines.length; ii++) {
                if (engines[ii].id == args.id) {
                    existingIndex = ii;
                    break;
                } // if
            } // if
            
            // if the engine has already been registered, then update it
            if (existingIndex >= 0) {
                engines[existingIndex] = args;
            }
            else {
                engines.push(args);
            } // if..else
            
            GRUNT.Log.info(String.format("Routing engine '{0}' registered", args.id));
        },
        
        RouteData: function(params) {
            params = GRUNT.extend({
                geometry: []
            }, params);
            
            var positions = new Array(params.geometry.length);
            
            // create position objects for the specified geometry
            for (var ii = 0; ii < params.geometry.length; ii++) {
                positions[ii] = new SLICK.Geo.Position(params.geometry[ii]);
            } // for
            
            // initialise self
            var self = {
                getGeometry: function() {
                    return positions;
                }
            };
            
            return self;
        }
    };
    
    return module;
})();