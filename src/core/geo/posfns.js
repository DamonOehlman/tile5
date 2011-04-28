(function() {
    var DEFAULT_VECTORIZE_CHUNK_SIZE = 100,
        VECTORIZE_PER_CYCLE = 500,
        DEFAULT_GENERALIZATION_DISTANCE = 250;
        
    /* exports */
    
    /**
    ### generalize(sourceData, requiredPositions, minDist)
    To be completed
    */
    function generalize(sourceData, requiredPositions, minDist) {
        var sourceLen = sourceData.length,
            positions = [],
            lastPosition = null;
            

        // convert min distance to km
        minDist = (minDist || DEFAULT_GENERALIZATION_DISTANCE) / 1000;

        // iterate thorugh the source data and add positions the differ by the required amount to 
        // the result positions
        for (var ii = sourceLen; ii--; ) {
            if (ii === 0) {
                positions.unshift(sourceData[ii]);
            }
            else {
                var include = (! lastPosition) || sourceData[ii].inArray(requiredPositions),
                    posDiff = include ? minDist : lastPosition.distanceTo(sourceData[ii]);

                // if the position difference is suitable then include
                if (sourceData[ii] && (posDiff >= minDist)) {
                    positions.unshift(sourceData[ii]);

                    // update the last position
                    lastPosition = sourceData[ii];
                } // if
            } // if..else
        } // for

        return positions;
    } // generalize
    
    
    // register the generalizer
    reg('fn', 'generalize', generalize);
})();