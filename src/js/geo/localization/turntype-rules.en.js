// EN-* manuever text matching rules 
TILE5.Geo.Routing.TurnTypeRules = (function() {
    var m = TILE5.Geo.Routing.TurnType,
        rules = [];
        
    rules.push({
        regex: /continue/i,
        turnType: m.Continue
    });
    
    rules.push({
        regex: /(take|bear|turn)(.*?)left/i,
        customCheck: function(text, matches) {
            var isSlight = (/bear/i).test(matches[1]);
            
            return isSlight ? m.TurnLeftSlight : m.TurnLeft;
        }
    });
    
    rules.push({
        regex: /(take|bear|turn)(.*?)right/i,
        customCheck: function(text, matches) {
            var isSlight = (/bear/i).test(matches[1]);
            
            return isSlight ? m.TurnRightSlight : m.TurnRight;
        }
    });
    
    rules.push({
        regex: /enter\s(roundabout|rotaty)/i,
        turnType: m.EnterRoundabout
    });
    
    rules.push({
        regex: /take.*?ramp/i,
        turnType: m.Ramp
    });
    
    rules.push({
        regex: /take.*?exit/i,
        turnType: m.RampExit
    });
    
    rules.push({
        regex: /make(.*?)u\-turn/i,
        customCheck: function(text, matches) {
            return (/right/i).test(matches[1]) ? m.UTurnRight : m.UTurnLeft;
        }
    });
    
    rules.push({
        regex: /proceed/i,
        turnType: m.Start
    });
    
    rules.push({
        regex: /arrive/i,
        turnType: m.Arrive
    });
    
    // "FELL THROUGH" - WTF!
    rules.push({
        regex: /fell\sthrough/i,
        turnType: m.Merge
    });
    
    return rules;
})();

