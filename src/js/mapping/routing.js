/**
@module

Define functionality to enable routing for mapping
*/
SLICK.Geo.Routing = (function() {
    
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
                success: null,
                generalize: true
            }, args);
            
            GRUNT.Log.info("attempting to calculate route");
            
            // find an available routing engine
            var engine = SLICK.Geo.getEngine("route");
            if (engine) {
                engine.route(args, function(routeData) {
                    if (args.generalize) {
                        routeData.geometry = SLICK.Geo.generalizePositions(routeData.geometry, routeData.getInstructionPositions());
                    } // if
                    
                    // firstly, if we have a map defined, then let's place the route on the map
                    // you know, just because we are nice like that
                    if (args.map) {
                        module.createMapOverlay(args.map, routeData);
                        
                        // if we are to auto fit the map to the bounds, then do that now
                        if (args.autoFit) {
                            GRUNT.Log.info("AUTOFITTING MAP TO ROUTE: bounds = " + routeData.boundingBox);
                            args.map.gotoBounds(routeData.boundingBox);
                        } // if
                    } // if
                    
                    // if we have a success handler, then call it
                    if (args.success) {
                        args.success(routeData);
                    } // if
                });
            } // if
        },
        
        createMapOverlay: function(map, routeData) {
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
            var self = GRUNT.extend(params, {
                
            });
            
            return self;
        },
        
        RouteData: function(params) {
            params = GRUNT.extend({
                geometry: [],
                instructions: [],
                boundingBox: null
            }, params);
            
            // update the bounding box
            if (! params.boundingBox) {
                params.boundingBox = SLICK.Geo.getBoundsForPositions(params.geometry);
            } // if
            
            var self = GRUNT.extend({
                getInstructionPositions: function() {
                    var positions = [];
                        
                    for (var ii = 0; ii < params.instructions.length; ii++) {
                        if (params.instructions[ii].position) {
                            positions.push(params.instructions[ii].position);
                        } // if
                    } // for
                    
                    return positions;
                }
            }, params);
            
            return self;
        }
    };
    
    return module;
})();