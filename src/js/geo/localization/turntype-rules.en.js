// EN-* manuever text matching rules 
var TurnTypeRules = (function() {
    var rules = [];
        
    rules.push({
        regex: /continue/i,
        turnType: TurnType.Continue
    });
    
    rules.push({
        regex: /(take|bear|turn)(.*?)left/i,
        customCheck: function(text, matches) {
            var isSlight = (/bear/i).test(matches[1]);
            
            return isSlight ? TurnType.TurnLeftSlight : TurnType.TurnLeft;
        }
    });
    
    rules.push({
        regex: /(take|bear|turn)(.*?)right/i,
        customCheck: function(text, matches) {
            var isSlight = (/bear/i).test(matches[1]);
            
            return isSlight ? TurnType.TurnRightSlight : TurnType.TurnRight;
        }
    });
    
    rules.push({
        regex: /enter\s(roundabout|rotaty)/i,
        turnType: TurnType.EnterRoundabout
    });
    
    rules.push({
        regex: /take.*?ramp/i,
        turnType: TurnType.Ramp
    });
    
    rules.push({
        regex: /take.*?exit/i,
        turnType: TurnType.RampExit
    });
    
    rules.push({
        regex: /make(.*?)u\-turn/i,
        customCheck: function(text, matches) {
            return (/right/i).test(matches[1]) ? TurnType.UTurnRight : TurnType.UTurnLeft;
        }
    });
    
    rules.push({
        regex: /proceed/i,
        turnType: TurnType.Start
    });
    
    rules.push({
        regex: /arrive/i,
        turnType: TurnType.Arrive
    });
    
    // "FELL THROUGH" - WTF!
    rules.push({
        regex: /fell\sthrough/i,
        turnType: TurnType.Merge
    });
    
    return rules;
})();

