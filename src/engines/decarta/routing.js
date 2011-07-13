T5.Registry.register('service', 'routing', function() {
    
    var RouteRequest = function(waypoints, params) {
        params = T5.ex({
            provideRouteHandle: false,
            distanceUnit: "KM",
            routeQueryType: "RMAN",
            preference: "Fastest",
            routeInstructions: true,
            routeGeometry: true,
            rulesFile: 'maneuver-rules'
        }, params);
        
        // define the base request
        var parent = new Request(),
            routeHeaderFormatter = T5.formatter('<xls:DetermineRouteRequest provideRouteHandle="{0}" distanceUnit="{1}" routeQueryType="{2}">'),
            waypointFormatter = T5.formatter('<xls:{0}><xls:Position><gml:Point><gml:pos>{1}</gml:pos></gml:Point></xls:Position></xls:{0}>'),
            routeInsFormatter = T5.formatter('<xls:RouteInstructionsRequest rules="{0}" providePoint="true" />');
        
        function parseInstructions(instructionList) {
            var fnresult = [],
                instructions = instructionList && instructionList.RouteInstruction ? 
                    instructionList.RouteInstruction : [];
                    
            // T5.log("parsing " + instructions.length + " instructions", instructions[0], instructions[1], instructions[2]);
            for (var ii = 0; ii < instructions.length; ii++) {
                // initialise the time and duration for this instruction
                var distance = instructions[ii].distance;
                    
                fnresult.push({
                    text: instructions[ii].Instruction,
                    latlng: instructions[ii].Point,
                    distance: distance.value + (distance.uom || 'M').toUpperCase(),
                    time: TL.parse(instructions[ii].duration, '8601')
                });
            } // for
            

            // T5.log("parsed " + fnresult.length + " instructions", fnresult[0], fnresult[1], fnresult[2]);
            return fnresult;
        } // parseInstructions
        
        // initialise _self
        var _self = T5.ex({}, parent, {
            methodName: "DetermineRoute",
            
            getRequestBody: function() {
                // check that we have some waypoints, if not throw an exception 
                if (waypoints.length < 2) {
                    throw new Error("Cannot send RouteRequest, less than 2 waypoints specified");
                } // if
                
                var body = routeHeaderFormatter(params.provideRouteHandle, params.distanceUnit, params.routeQueryType);
                                
                // open the route plan tag
                body += "<xls:RoutePlan>";
                                
                // specify the route preference
                body += "<xls:RoutePreference>" + params.preference + "</xls:RoutePreference>";
                
                // open the waypoint list
                body += "<xls:WayPointList>";
                
                // add the waypoints
                for (var ii = 0; ii < waypoints.length; ii++) {
                    // determine the appropriate tag to use for the waypoint
                    // as to why this is required, who knows....
                    var tagName = (ii === 0 ? "StartPoint" : (ii === waypoints.length-1 ? "EndPoint" : "ViaPoint"));
                    
                    body += waypointFormatter(tagName, waypoints[ii].toString());
                }
                
                // close the waypoint list
                body += "</xls:WayPointList>";
                
                // TODO: add the avoid list
                
                // close the route plan tag
                body += "</xls:RoutePlan>";
                
                // add the route instruction request
                if (params.routeInstructions) {
                    body += routeInsFormatter(params.rulesFile);
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
                // T5.log("received route request response:", response);
                return [
                    response.RouteGeometry.LineString.pos,
                    parseInstructions(response.RouteInstructionsList)
                ];
            }
        });
        
        return _self;
    };
    
    /* exports */
    
    function calculate(waypoints, callback, errorCallback, opts) {
        opts = T5.ex({
            preference: 'Fastest',
            rulesFile: 'maneuver-rules'
        }, currentConfig.routing, opts);
        
        // create the route request, mapping the common opts to decarta opts
        var routeRequest = new RouteRequest(waypoints, opts);
        
        // create the geocoding request and execute it
        makeServerRequest(routeRequest, callback, errorCallback);
    } // calculate
    
    return {
        calculate: calculate
    };
});