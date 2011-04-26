var Parser = (function() {
    
    /* internals */
    var REGEX_XYRAW = /^xy\((.*)\).*$/i;
    
    /* exports */
    
    function parseXY(xyStr, target) {
        // if the target has not been provided, create a new xy
        target = target || new GeoXY();
        
        // if the xystr is a raw xy string, then process as such
        if (REGEX_XYRAW.test(xyStr)) {
            
        }
        else {
            // split the string and parse as a position
            var xyVals = xyStr.split(reDelimitedSplit),
                mercXY = _project(xyVals[1], xyVals[0]);
            
            // initialise the x and y as mercator pixel positions
            target.mercX = mercXY.x;
            target.mercY = mercXY.y;
        } // if..else
        
        return target;
    } // parseXY
    
    return {
        parseXY: parseXY
    };
})();