/**
@module

Define functionality to enable routing for mapping
*/
T5.Geo.Routing = (function() {
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
            var engine = T5.Geo.getEngine("route");
            if (engine) {
                engine.route(args, function(routeData) {
                    if (args.generalize) {
                        routeData.geometry = T5.Geo.P.generalize(routeData.geometry, routeData.getInstructionPositions());
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
            var overlay = new T5.Geo.UI.RouteOverlay({
                data: routeData,
                width: dimensions.width,
                height: dimensions.height
            });

            // add the overlay to the map
            map.setLayer("route", overlay);
        },
        
        parseTurnType: function(text) {
            var turnType = module.TurnType.Unknown,
                rules = T5.Geo.Routing.TurnTypeRules;
            
            // run the text through the manuever rules
            for (var ii = 0; ii < rules.length; ii++) {
                rules[ii].regex.lastIndex = -1;
                
                var matches = rules[ii].regex.exec(text);
                if (matches) {
                    // if we have a custom check defined for the rule, then pass the text in 
                    // for the manuever result
                    if (rules[ii].customCheck) {
                        turnType = rules[ii].customCheck(text, matches);
                    }
                    // otherwise, take the manuever provided by the rule
                    else {
                        turnType = rules[ii].turnType;
                    } // if..else
                    
                    break;
                } // if
            } // for
            
            return turnType;
        },
        
        TurnType: {
            Unknown: "turn-unknown",
            
            // continue maneuver
            Start: "turn-none-start",
            Continue: "turn-none",
            Arrive: "turn-none-arrive",
            
            // turn left maneuvers
            TurnLeft: "turn-left",
            TurnLeftSlight: "turn-left-slight",
            TurnLeftSharp: "turn-left-sharp",
            
            // turn right maneuvers
            TurnRight: "turn-right",
            TurnRightSlight: "turn-right-slight",
            TurnRightSharp: "turn-right-sharp",
            
            // merge maneuvers
            Merge: "merge",
            
            // uturn
            UTurnLeft:  "uturn-left",
            UTurnRight: "uturn-right",
            
            // enter roundabout maneuver
            EnterRoundabout: "roundabout-enter",
            
            // ramp maneuvers
            Ramp: "ramp",
            RampExit: "ramp-exit"
        },
        
        Instruction: function(params) {
            params = GRUNT.extend({
                position: null,
                description: "",
                turnType: null
            }, params);
            
            // if the manuever has not been defined, then attempt to parse the description
            if (! params.turnType) {
                params.turnType = module.parseTurnType(params.description);
            } // if
            
            return params;
        },
        
        
        RouteData: function(params) {
            params = GRUNT.extend({
                geometry: [],
                instructions: [],
                boundingBox: null
            }, params);
            
            // update the bounding box
            if (! params.boundingBox) {
                params.boundingBox = T5.Geo.B.forPositions(params.geometry);
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

