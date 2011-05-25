/**
# T5.RouteTools
__PLUGIN__: `plugins/geo.routetools.js`


## Events

## Module Methods
*/
T5.RouteTools = (function() {
    
    /* internals */
    
    var customTurnTypeRules = undefined,
        generalize = T5.fn('generalize'),
    
        // predefined regexes
        REGEX_BEAR = /bear/i,
        REGEX_DIR_RIGHT = /right/i,
        
        // initialise the turn type sprite positions
        TurnTypeSprites = {
            'unknown': '0:0',
            
            'start': '1:0',
            'continue': '1:1',
            'arrive': '1:2',
            
            'left': '2:0',
            'left-slight': '2:1',
            'left-sharp': '2:2',
            
            'right': '3:0',
            'right-slight': '3:1',
            'right-sharp': '3:2',
             
            'uturn-left': '4:0',
            'uturn-right': '4:1',
            'merge': '4:2',
            
            'roundabout': '5:0',
            
            'ramp': '6:0',
            'ramp-exit': '6:1'
        };
    
    // EN-* manuever text matching rules 
    var DefaultTurnTypeRules = (function() {
        var rules = [];

        rules.push({
            regex: /continue/i,
            turnType: 'continue'
        });

        rules.push({
            regex: /(take|bear|turn)(.*?)left/i,
            customCheck: function(text, matches) {
                return 'left' + getTurnAngle(matches[1]);
            }
        });

        rules.push({
            regex: /(take|bear|turn)(.*?)right/i,
            customCheck: function(text, matches) {
                return 'right' + getTurnAngle(matches[1]);
            }
        });

        rules.push({
            regex: /enter\s(roundabout|rotary)/i,
            turnType: 'roundabout'
        });

        rules.push({
            regex: /take.*?ramp/i,
            turnType: 'ramp'
        });

        rules.push({
            regex: /take.*?exit/i,
            turnType: 'ramp-exit'
        });

        rules.push({
            regex: /make(.*?)u\-turn/i,
            customCheck: function(text, matches) {
                return 'uturn' + getTurnDirection(matches[1]);
            }
        });

        rules.push({
            regex: /proceed/i,
            turnType: 'start'
        });

        rules.push({
            regex: /arrive/i,
            turnType: 'arrive'
        });

        // "FELL THROUGH" - WTF!
        rules.push({
            regex: /fell\sthrough/i,
            turnType: 'merge'
        });

        return rules;
    })();
    
    var RouteData = function(params) {
        params = _extend({
            geometry: [],
            instructions: [],
            boundingBox: null
        }, params);
        
        // update the bounding box
        if (! params.boundingBox) {
            params.boundingBox = new GeoJS.BBox(params.geometry);
        } // if
        
        var _self = _extend({
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
        
        return _self;
    }; // RouteData
    
    var Instruction = function(params) {
        params = _extend({
            position: null,
            description: "",
            distance: 0,
            distanceTotal: 0,
            time: 0,
            timeTotal: 0,
            turnType: null
        }, params);
        
        // parse the description
        params.description = markupInstruction(params.description);
        
        // if the manuever has not been defined, then attempt to parse the description
        if (! params.turnType) {
            params.turnType = parseTurnType(params.description);
        } // if
        
        return params;
    }; // instruction
    
    // include the turntype rules based on the locale (something TODO)
    // TODO: require "localization/turntype-rules.en"
    
    /* internal functions */
    
    function getTurnDirection(turnDir) {
        return REGEX_DIR_RIGHT.test(turnDir) ? '-right' : '-left';
    } // getTurnDirection
    
    function getTurnAngle(turnText) {
        if (REGEX_BEAR.test(turnText)) {
            return '-slight';
        } // if
        
        return '';
    } // getTurnAngle
    
    /*
    This function is used to cleanup a turn instruction that has been passed
    back from a routing engine.  At present it has been optimized to work with
    decarta instructions but will be modified to work with others in time
    */
    function markupInstruction(text) {
        // firstly replace all non breaking descriptions with suitable spaces
        text = text.replace(/(\w)(\/)(\w)/g, '$1 $2 $3');
        
        return text;
    } // markupInstruction
    
    /* exports */

    /**
    ### calculate(args)
    To be completed
    */
    function calculate(args) {
        args = _extend({
            engineId: "",
            waypoints: [],
            map: null,
            error: null,
            autoFit: true,
            success: null,
            // TODO: reimplement generalization...
            generalize: false
        }, args);
        
        // find an available routing engine
        var service = T5.Registry.create('service', 'routing');
        if (service) {
            service.calculate(args, function(routeData) {
                if (args.generalize) {
                    routeData.geometry = generalize(routeData.geometry, routeData.getInstructionPositions());
                } // if
                
                // calculate the instruction totals
                if (routeData.instructions) {
                    var totalTime = new TL.Duration(),
                        totalDist = new GeoJS.Distance();

                    for (var ii = 0, insCount = routeData.instructions.length; ii < insCount; ii++) {
                        var instruction = routeData.instructions[ii];

                        // update the total time and distance for the instruction
                        instruction.timeTotal = totalTime = totalTime.add(instruction.time);
                        instruction.distanceTotal = totalDist = totalDist.add(instruction.distance);
                    } // for
                } // if
                
                // firstly, if we have a map defined, then let's place the route on the map
                // you know, just because we are nice like that
                if (args.map) {
                    createMapOverlay(args.map, routeData);
                    
                    // if we are to auto fit the map to the bounds, then do that now
                    if (args.autoFit) {
                        // _log("AUTOFITTING MAP TO ROUTE: bounds = " + routeData.boundingBox);
                        args.map.bounds(routeData.boundingBox);
                    } // if
                } // if
                
                // if we have a success handler, then call it
                if (args.success) {
                    args.success(routeData);
                } // if
            }, args.error);
        } // if
    } // calculate
    
    /**
    ### createMapOverlay(map, routeData)
    To be completed
    */
    function createMapOverlay(map, routeData) {
        if (routeData.geometry) {
            map.layer('route', 'draw').create('line', {
                points: routeData.geometry,
                style: 'waypoints',
                simplify: true
            });
        } // if
    } // createMapOverlay
    
    /**
    ### getSpriteOffset(turnType)
    This is a utility function that provides the sprite offset that can be used in a `background-position`
    CSS rule if one of the standard turn icon sprite sheets are being used.
    */
    function getSpriteOffset(turnType, spriteSize) {
        var spritePos = TurnTypeSprites[turnType],
            spriteCoords = spritePos ? spritePos.split(':') : null;
        
        if (spriteCoords) {
            return {
                x: -spriteCoords[0] * (spriteSize || 16),
                y: -spriteCoords[1] * (spriteSize || 16)
            };
        } // if
        
        return null;
    } // getSpriteOffset
    
    /**
    ### parseTurnType(text)
    To be completed
    */
    function parseTurnType(text) {
        var turnType = 'unknown',
            rules = customTurnTypeRules || DefaultTurnTypeRules;
        
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
    } // parseTurnType    
    
    var module = {
        calculate: calculate,
        createMapOverlay: createMapOverlay,
        getSpriteOffset: getSpriteOffset,
        parseTurnType: parseTurnType,
        
        Instruction: Instruction,
        RouteData: RouteData
    };
    
    // make the module observable
    T5.observable(module);
    
    return module;
})();