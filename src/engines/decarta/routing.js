T5.Service.register('routing', function() {
    var RouteRequest = function(params) {
        params = T5.ex({
            waypoints: [],
            provideRouteHandle: false,
            distanceUnit: "KM",
            routeQueryType: "RMAN",
            routePreference: "Fastest",
            routeInstructions: true,
            routeGeometry: true
        }, params);
        
        // define the base request
        var parent = new Request(),
            routeHeaderFormatter = _formatter('<xls:DetermineRouteRequest provideRouteHandle="{0}" distanceUnit="{1}" routeQueryType="{2}">'),
            waypointFormatter = _formatter('<xls:{0}><xls:Position><gml:Point><gml:pos>{1}</gml:pos></gml:Point></xls:Position></xls:{0}>');
        
        function parseInstructions(instructionList) {
            var fnresult = [],
                instructions = instructionList && instructionList.RouteInstruction ? 
                    instructionList.RouteInstruction : [],
                totalDistance = 0,
                totalTime = new COG.Duration();

            // _log("parsing " + instructions.length + " instructions", instructions[0], instructions[1], instructions[2]);
            for (var ii = 0; ii < instructions.length; ii++) {
                // initialise the time and duration for this instruction
                var distance = distanceToMeters(instructions[ii].distance),
                    time = COG.parseDuration(instructions[ii].duration, '8601');
                    
                // increment the total distance and total time
                totalDistance = totalDistance + distance;
                totalTime = COG.addDuration(totalTime, time);
                
                fnresult.push(new T5.RouteTools.Instruction({
                    position: new T5.Pos(instructions[ii].Point),
                    description: instructions[ii].Instruction,
                    distance: distance,
                    distanceTotal: totalDistance,
                    time: time,
                    timeTotal: totalTime
                }));
            } // for
            

            // _log("parsed " + fnresult.length + " instructions", fnresult[0], fnresult[1], fnresult[2]);
            return fnresult;
        } // parseInstructions
        
        // initialise _self
        var _self = T5.ex({}, parent, {
            methodName: "DetermineRoute",
            
            getRequestBody: function() {
                // check that we have some waypoints, if not throw an exception 
                if (params.waypoints.length < 2) {
                    throw new Error("Cannot send RouteRequest, less than 2 waypoints specified");
                } // if
                
                var body = routeHeaderFormatter(params.provideRouteHandle, params.distanceUnit, params.routeQueryType);
                                
                // open the route plan tag
                body += "<xls:RoutePlan>";
                                
                // specify the route preference
                body += "<xls:RoutePreference>" + params.routePreference + "</xls:RoutePreference>";
                
                // open the waypoint list
                body += "<xls:WayPointList>";
                
                // add the waypoints
                for (var ii = 0; ii < params.waypoints.length; ii++) {
                    // determine the appropriate tag to use for the waypoint
                    // as to why this is required, who knows....
                    var tagName = (ii === 0 ? "StartPoint" : (ii === params.waypoints.length-1 ? "EndPoint" : "ViaPoint"));
                    
                    body += waypointFormatter(tagName, params.waypoints[ii].toString());
                }
                
                // close the waypoint list
                body += "</xls:WayPointList>";
                
                // TODO: add the avoid list
                
                // close the route plan tag
                body += "</xls:RoutePlan>";
                
                // add the route instruction request
                if (params.routeInstructions) {
                    body += "<xls:RouteInstructionsRequest rules=\"maneuver-rules\" providePoint=\"true\" />";
                } // if
                
                // add the geometry request
                if (params.routeGeometry) {
                    body += "<xls:RouteGeometryRequest />";
                } // if
                
                // close the route request tag
                body += "</xls:DetermineRouteRequest>";
                return body;
            },
            
            parseResponse: function(response) {
                // _log("received route request response:", response);
                
                // create a new route data object and map items 
                return new T5.RouteTools.RouteData({
                    geometry: T5.Geo.Position.parseArray(response.RouteGeometry.LineString.pos),
                    instructions: parseInstructions(response.RouteInstructionsList)
                });
            }
        });
        
        return _self;
    };
    
    /* exports */
    
    function calculate(args, callback) {
        args = T5.ex({
           waypoints: []
        }, args);
        
        // check for the route tools
        if (typeof T5.RouteTools !== 'undefined') {
            // create the geocoding request and execute it
            var request = new RouteRequest(args);
            makeServerRequest(request, function(routeData) {
                if (callback) {
                    callback(routeData);
                } // if
            });
        }
        else {
            _log('Could not generate route, T5.RouteTools plugin not found', 'warn');
        } // if..else
    } // calculate
    
    return {
        calculate: calculate
    };
});