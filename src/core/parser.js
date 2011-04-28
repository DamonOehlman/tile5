var Parser = (function() {
    
    /* internals */
    var REGEX_XYRAW = /^xy\((.*)\).*$/i;
    
    /* exports */
    
    function parseXY(xyStr) {
        // if the xystr is a raw xy string, then process as such
        if (REGEX_XYRAW.test(xyStr)) {
            
        }
        else {
            // split the string and parse as a position
            var xyVals = xyStr.split(reDelimitedSplit);
            
            return _project(xyVals[1], xyVals[0]);
        } // if..else
        
        return undefined;
    } // parseXY
    
    return {
        parseXY: parseXY
    };
})();