/**
# T5.RouteTools
__PLUGIN__: `plugins/geo.routetools.js`


## Events

## Module Methods
*/
T5.RouteTools = (function() {

    /* internals */

    var customTurnTypeRules = undefined,

        REGEX_BEAR = /bear/i,
        REGEX_DIR_RIGHT = /right/i,

        TurnTypes = [
            'unknown',

            'start',
            'none',
            'arrive',

            'left',
            'left-slight',
            'left-sharp',

            'right',
            'right-slight',
            'right-sharp',

            'merge',

            'uturn-left',
            'uturn-right',

            'roundabout-enter',

            'ramp',
            'ramp-exit'
        ];

    var DefaultTurnTypeRules = (function() {
        var rules = [];

        rules.push({
            regex: /continue/i,
            turnType: 'none'
        });

        rules.push({
            regex: /(take|bear|turn)(.*?)left/i,
            customCheck: function(text, matches) {
                return 'turn-left' + getTurnAngle(matches[1]);
            }
        });

        rules.push({
            regex: /(take|bear|turn)(.*?)right/i,
            customCheck: function(text, matches) {
                return 'turn-right' + getTurnAngle(matches[1]);
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

        rules.push({
            regex: /fell\sthrough/i,
            turnType: 'merge'
        });

        return rules;
    })();

    var RouteData = function(params) {
        params = COG.extend({
            geometry: [],
            instructions: [],
            boundingBox: null
        }, params);

        if (! params.boundingBox) {
            params.boundingBox = T5.Geo.BoundingBox.forPositions(params.geometry);
        } // if

        var _self = COG.extend({
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
        params = COG.extend({
            position: null,
            description: "",
            distance: 0,
            distanceTotal: 0,
            time: 0,
            timeTotal: 0,
            turnType: null
        }, params);

        params.description = markupInstruction(params.description);

        if (! params.turnType) {
            params.turnType = parseTurnType(params.description);
        } // if

        return params;
    }; // instruction


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
        text = text.replace(/(\w)(\/)(\w)/g, '$1 $2 $3');

        return text;
    } // markupInstruction

    /* exports */

    /**
    ### calculate(args)
    To be completed
    */
    function calculate(args) {
        args = COG.extend({
            engineId: "",
            waypoints: [],
            map: null,
            error: null,
            autoFit: true,
            success: null,
            generalize: false
        }, args);

        var service = T5.Service.find('routing');
        if (service) {
            service.calculate(args, function(routeData) {
                if (args.generalize) {
                    routeData.geometry = T5.Geo.Position.generalize(routeData.geometry, routeData.getInstructionPositions());
                } // if

                if (args.map) {
                    createMapOverlay(args.map, routeData);

                    if (args.autoFit) {
                        args.map.gotoBounds(routeData.boundingBox);
                    } // if
                } // if

                if (args.success) {
                    args.success(routeData);
                } // if
            });
        } // if
    } // calculate

    /**
    ### createMapOverlay(map, routeData)
    To be completed
    */
    function createMapOverlay(map, routeData) {
        var routeOverlay = new T5.ShapeLayer();

        /*
        TODO: put instruction markers back on the route - maybe markers
        if (routeData.instructions) {
            var instructions = routeData.instructions,
                positions = new Array(instructions.length);

            for (var ii = instructions.length; ii--; ) {
                positions[ii] = instructions[ii].position;
            } // for

            Position.vectorize(positions, {
                callback: function(coords) {
                    routeOverlay.add(new T5.Points(coords, {
                        zIndex: 1
                    }));
                }
            });
        } // if
        */

        if (routeData.geometry) {
            T5.Geo.Position.vectorize(routeData.geometry, {
                callback: function(coords) {
                    routeOverlay.add(new T5.Line(coords, {
                        style: 'waypoints',
                        simplify: true
                    }));

                    map.setLayer("route", routeOverlay);
                }
            });
        } // if
    } // createMapOverlay

    /**
    ### parseTurnType(text)
    To be completed
    */
    function parseTurnType(text) {
        var turnType = 'unknown',
            rules = customTurnTypeRules || DefaultTurnTypeRules;

        for (var ii = 0; ii < rules.length; ii++) {
            rules[ii].regex.lastIndex = -1;

            var matches = rules[ii].regex.exec(text);
            if (matches) {
                if (rules[ii].customCheck) {
                    turnType = rules[ii].customCheck(text, matches);
                }
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
        parseTurnType: parseTurnType,

        Instruction: Instruction,
        RouteData: RouteData
    };

    COG.observable(module);

    return module;
})();
