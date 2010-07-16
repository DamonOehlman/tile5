/**
@module

Define functionality to enable routing for mapping
*/
SLICK.Geo.Routing = (function() {
    
    function createRouteOverlay(map, routeData) {
        // get the map dimensions
        var dimensions = map.getDimensions();
        
        // GRUNT.Log.info("creating route overlay with route data: ", routeData);
        
        // create a new route overlay for the specified data
        var overlay = new SLICK.Mapping.RouteOverlay({
            data: routeData,
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
                autoFit: true,
                success: null
            }, args);
            
            GRUNT.Log.info("attempting to calculate route");
            
            // find an available routing engine
            var engine = SLICK.Geo.getEngine("route");
            if (engine) {
                engine.route(args, function(routeData) {
                    // firstly, if we have a map defined, then let's place the route on the map
                    // you know, just because we are nice like that
                    if (args.map) {
                        createRouteOverlay(args.map, routeData);
                        
                        // if we are to auto fit the map to the bounds, then do that now
                        if (args.autoFit) {
                            GRUNT.Log.info("AUTOFITTING MAP TO ROUTE: bounds = " + routeData.getBoundingBox());
                            args.map.gotoBounds(routeData.getBoundingBox());
                        } // if
                    } // if
                    
                    // if we have a success handler, then call it
                    if (args.success) {
                        
                    }
                });
            } // if
        },
        
        Maneuver: {
            None: 0,
            
            // continue maneuver
            Continue: 1,
            
            // turn left maneuvers
            TurnLeft: 100,
            TurnLeftSlight: 101,
            TurnLeftSharp: 102,
            
            // turn right maneuvers
            TurnRight: 110,
            TurnRightSlight: 111,
            TurnRightSharp: 112,
            
            // uturn
            TurnAround: 190,
            
            // enter roundabout maneuver
            EnterRoundabout: 200,
            
            // exit ramp
            ExitRamp: 300
        },
        
        Instruction: function(params) {
            params = GRUNT.extend({
                position: null,
                description: "",
                manuever: module.Maneuver.None
            }, params);
            
            // initialise self
            var self = {
                position: params.position,
                
                getDescription: function() {
                    return params.description;
                }
            };
            
            return self;
        },
        
        RouteData: function(params) {
            params = GRUNT.extend({
                geometry: [],
                instructions: [],
                boundingBox: null
            }, params);
            
            var positions = new Array(params.geometry.length),
                boundingBox = params.boundingBox;
            
            // create position objects for the specified geometry
            for (var ii = 0; ii < params.geometry.length; ii++) {
                positions[ii] = new SLICK.Geo.Position(params.geometry[ii]);
            } // for
            
            // update the bounding box
            if (! boundingBox) {
                boundingBox = SLICK.Geo.getBoundsForPositions(positions);
            } // if
            
            // initialise self
            var self = {
                getGeometry: function() {
                    return positions;
                },
                
                getBoundingBox: function() {
                    return boundingBox;
                },
                
                getInstructions: function() {
                    return params.instructions;
                }
            };
            
            return self;
        }
    };
    
    return module;
})();