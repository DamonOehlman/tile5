var PosFns = (function() {
    var DEFAULT_VECTORIZE_CHUNK_SIZE = 100,
        VECTORIZE_PER_CYCLE = 500;
        
    /* exports */
    
    /**
    ### generalize(sourceData, requiredPositions, minDist)
    To be completed
    */
    function generalize(sourceData, requiredPositions, minDist) {
        var sourceLen = sourceData.length,
            positions = [],
            lastPosition = null;

        if (! minDist) {
            minDist = DEFAULT_GENERALIZATION_DISTANCE;
        } // if

        // convert min distance to km
        minDist = minDist / 1000;

        _log("generalizing positions, must include " + requiredPositions.length + " positions");

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

        _log("generalized " + sourceLen + " positions into " + positions.length + " positions");
        return positions;
    } // generalize    
    
    /**
    ### parseArray(sourceData)
    Just like parse, but with lots of em'
    */
    function parseArray(sourceData) {
        var sourceLen = sourceData.length,
            positions = new Array(sourceLen);

        for (var ii = sourceLen; ii--; ) {
            positions[ii] = new Pos(sourceData[ii]);
        } // for

        // _log("parsed " + positions.length + " positions");
        return positions;
    } // parseArray
    
    /**
    ### vectorize(positions, options)
    The vectorize function is used to take an array of positions specified in the 
    `positions` argument and convert these into xy values. By default
    the vectorize function will process these asyncronously and will return a 
    COG Worker that will be taking care of chunking up and processing the request
    in an efficient way.  It is, however, possible to specify that the conversion should
    happen synchronously and in this case the array of vectors is returned rather
    than a worker instance.
    */
    function vectorize(positions, options) {
        var posIndex = positions.length,
            vectors = new Array(posIndex);
            
        // initialise options
        options = _extend({
            chunkSize: VECTORIZE_PER_CYCLE,
            async: true,
            callback: null
        }, options);
        
        function processPositions(tickCount) {
            // initialise variables
            var chunkCounter = 0,
                chunkSize = options.chunkSize,
                ii = posIndex;
                
            // process from the last position index
            for (; ii--;) {
                vectors[ii] = new XY(positions[ii]);
                
                // increase the chunk counter
                chunkCounter += 1;
                
                // if we have hit the chunk size, then break
                if (chunkCounter > chunkSize) {
                    break;
                } // if
            } // for
            
            posIndex = ii;
            if (posIndex <= 0) {
                if (options.callback) {
                    options.callback(vectors);
                }
            }
            else {
                animFrame(processPositions);
            } // if..else
        } // processPositions
        
        // if we are not processing async, then do it right now
        if (! options.async) {
            for (var ii = posIndex; ii--; ) {
                vectors[ii] = new XY(positions[ii]);
            } // for
            
            return vectors;
        } // if
        
        animFrame(processPositions);
        return null;
    } // vectorize
    
    return {
        generalize: generalize,
        parseArray: parseArray,
        vectorize: vectorize
    };
})();