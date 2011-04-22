/**
# T5.Hits

Utility module for creating and managing hit tests and the hits that are
associated with that hit test.
*/
Hits = (function() {
    
    /* interials */
    
    /* exports */
    
    /**
    ### diffHits(oldHitData, newHitData)
    */
    function diffHits(oldHits, newHits) {
        var diff = [],
            objIds = {},
            ii;
            
        // iterate through the new hit data and find the objects within
        for (ii = newHits.length; ii--; ) {
            objIds[newHits[ii].target.id] = true;
        } // for 
            
        for (ii = oldHits.length; ii--; ) {
            if (! objIds[oldHits[ii].target.id]) {
                diff[diff.length] = oldHits[ii];
            } // for
        } // for
        
        return diff;
    } // diff
    
    /**
    ### init
    */
    function init(hitType, absXY, relXY, scaledXY) {
        return {
            // store the required hit data
            type: hitType,
            x: scaledXY.x | 0,
            y: scaledXY.y | 0,
            elements: [],
            
            // also store the original event data
            absXY: absXY,
            relXY: relXY
        };        
    } // init
    
    /**
    ### initHit(type, target, opts)
    */
    function initHit(type, target, drag) {
        return {
            type: type,
            target: target,
            drag: drag
        };
    } // initHit
    
    /**
    ### triggerEvent(hitData, target, evtSuffix, elements)
    */
    function triggerEvent(hitData, target, evtSuffix, elements) {
        target.triggerCustom(
            hitData.type + (evtSuffix ? evtSuffix : 'Hit'), {
                hitType: hitData.type
            },
            elements ? elements : hitData.elements, 
            hitData.absXY,
            hitData.relXY,
            new XY(hitData.x, hitData.y)
        );                
    } // triggerEvent
    
    /* define the module */
    
    return {
        diffHits: diffHits,
        init: init,
        initHit: initHit,
        triggerEvent: triggerEvent
    };
})();