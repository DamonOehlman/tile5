/**
# T5.Geo.Position

The Geo.Position submodule is used to perform operations on Geo.Position objects rather 
than have those operations bundled with the object.

## Functions
*/
var Position = (function() {
    var DEFAULT_VECTORIZE_CHUNK_SIZE = 100,
        VECTORIZE_PER_CYCLE = 500;
        
    /* exports */
    
    /**
    ### calcDistance(pos1, pos2)
    Calculate the distance between two T5.Geo.Position objects, pos1 and pos2.  The 
    distance returned is measured in kilometers.
    */
    function calcDistance(pos1, pos2) {
        if (empty(pos1) || empty(pos2)) {
            return 0;
        } // if
        
        var halfdelta_lat = toRad(pos2.lat - pos1.lat) >> 1;
        var halfdelta_lon = toRad(pos2.lon - pos1.lon) >> 1;

        // TODO: find out what a stands for, I don't like single char variables in code (same goes for c)
        var a = sin(halfdelta_lat) * sin(halfdelta_lat) + 
                (cos(toRad(pos1.lat)) * cos(toRad(pos2.lat))) * 
                (sin(halfdelta_lon) * sin(halfdelta_lon)),
            c = 2 * atan2(sqrt(a), sqrt(1 - a));

        // calculate the distance
        return KM_PER_RAD * c;
    } // calcDistance
    
    /**
    ### copy(src)
    Create a copy of the specified T5.Geo.Position object.
    */
    function copy(src) {
        return src ? init(src.lat, src.lon) : null;
    } // copy
    
    /**
    ### empty(pos)
    Returns true if the T5.Geo.Position object is empty, false if not.
    */
    function empty(pos) {
        return (! pos) || ((pos.lat === 0) && (pos.lon === 0));
    } // empty
    
    /**
    ### equal(pos1, pos2)
    Compares to T5.Geo.Position objects and returns true if they 
    have the same latitude and longitude values
    */
    function equal(pos1, pos2) {
        return pos1 && pos2 && (pos1.lat == pos2.lat) && (pos1.lon == pos2.lon);
    } // equal
    
    /**
    ### fromMercatorPixels(x, y)
    This function is used to take x and y mercator pixels values, 
    and using the value passed in the radsPerPixel value convert 
    that to a Geo.Position object.
    */
    function fromMercatorPixels(mercX, mercY) {
        // return the new position
        return init(pix2lat(mercY), pix2lon(mercX));
    } // fromMercatorPixel
    
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

        COG.info("generalizing positions, must include " + requiredPositions.length + " positions");

        // iterate thorugh the source data and add positions the differ by the required amount to 
        // the result positions
        for (var ii = sourceLen; ii--; ) {
            if (ii === 0) {
                positions.unshift(sourceData[ii]);
            }
            else {
                var include = (! lastPosition) || Position.inArray(sourceData[ii], requiredPositions),
                    posDiff = include ? minDist : Position.calcDistance(lastPosition, sourceData[ii]);

                // if the position difference is suitable then include
                if (sourceData[ii] && (posDiff >= minDist)) {
                    positions.unshift(sourceData[ii]);

                    // update the last position
                    lastPosition = sourceData[ii];
                } // if
            } // if..else
        } // for

        COG.info("generalized " + sourceLen + " positions into " + positions.length + " positions");
        return positions;
    } // generalize    
    
    /**
    ### inArray(pos, testArray)
    Checks to see whether the specified T5.Geo.Position is contained within 
    the array of position objects passed in the testArray.
    */
    function inArray(pos, testArray) {
        var arrayLen = testArray.length,
            testFn = Position.equal;
            
        for (var ii = arrayLen; ii--; ) {
            if (testFn(pos, testArray[ii])) {
                return true;
            } // if
        } // for
        
        return false;
    } // inArray
    
    /**
    ### inBounds(pos, bounds)
    Returns true if the specified Geo.Position object is within the 
    T5.Geo.BoundingBox specified by the bounds argument.
    */
    function inBounds(pos, bounds) {
        // initialise variables
        var fnresult = ! (Position.empty(pos) || Position.empty(bounds));

        // check the pos latitude
        fnresult = fnresult && (pos.lat >= bounds.min.lat) && (pos.lat <= bounds.max.lat);

        // check the pos longitude
        fnresult = fnresult && (pos.lon >= bounds.min.lon) && (pos.lon <= bounds.max.lon);

        return fnresult;
    } // inBounds
    
    /**
    ### init(initLat, initLon)
    */
    function init(initLat, initLon) {
        // initialise self
        return {
            lat: parseFloat(initLat ? initLat : 0),
            lon: parseFloat(initLon ? initLon : 0)
        };
    } // init
    
    /**
    ### offset(pos, latOffset, lonOffset)
    Return a new T5.Geo.Position which is the original `pos` offset by
    the specified `latOffset` and `lonOffset` (which are specified in 
    km distance)
    */
    function offset(pos, latOffset, lonOffset) {
        var radOffsetLat = latOffset / KM_PER_RAD,
            radOffsetLon = lonOffset / KM_PER_RAD,
            radLat = pos.lat * DEGREES_TO_RADIANS,
            radLon = pos.lon * DEGREES_TO_RADIANS,
            newLat = radLat + radOffsetLat,
            deltaLon = asin(sin(radOffsetLon) / cos(radLat)),
            newLon = radLon + deltaLon;
           
        // if the new latitude has wrapped, then update
        newLat = ((newLat + HALF_PI) % Math.PI) - HALF_PI;
        newLon = newLon % TWO_PI;
        
        return init(newLat * RADIANS_TO_DEGREES, newLon * RADIANS_TO_DEGREES);
    } // offset
    
    /**
    ### parse(object)
    This function is used to take a latitude and longitude String 
    pair (either space or comma delimited) and return a new T5.Geo.Position 
    value.  The function is also tolerant of being passed an existing 
    T5.Geo.Position object as the object argument, and in these cases 
    returns a copy of the position.
    */
    function parse(pos) {
        // first case, null value, create a new empty position
        if (! pos) {
            return init();
        }
        else if (typeof(pos.lat) !== 'undefined') {
            return copy(pos);
        }
        // now attempt the various different types of splits
        else if (pos.split) {
            var sepChars = [' ', ','];
            for (var ii = 0; ii < sepChars.length; ii++) {
                var coords = pos.split(sepChars[ii]);
                if (coords.length === 2) {
                    return init(coords[0], coords[1]);
                } // if
            } // for
        } // if..else

        return null;
    } // parse
    
    /**
    ### parseArray(sourceData)
    Just like parse, but with lots of em'
    */
    function parseArray(sourceData) {
        var sourceLen = sourceData.length,
            positions = new Array(sourceLen);

        for (var ii = sourceLen; ii--; ) {
            positions[ii] = parse(sourceData[ii]);
        } // for

        // COG.info("parsed " + positions.length + " positions");
        return positions;
    } // parseArray
    
    /**
    ### toMercatorPixels(pos, radsPerPixel)
    Basically, the reverse of the fromMercatorPixels function - 
    pass it a Geo.Position object and get a Vector object back 
    with x and y mercator pixel values back.
    */
    function toMercatorPixels(pos) {
        return T5.XY.init(lon2pix(pos.lon), lat2pix(pos.lat));
    } // toMercatorPixels
    
    /**
    ### toString(pos)
    Return a string representation of the Geo.Position object
    */
    function toString(pos) {
        return pos ? pos.lat + " " + pos.lon : "";
    } // toString
    
    /**
    ### vectorize(positions, options)
    The vectorize function is used to take an array of positions specified in the 
    `positions` argument and convert these into GeoXY composites. By default
    the vectorize function will process these asyncronously and will return a 
    COG Worker that will be taking care of chunking up and processing the request
    in an efficient way.  It is, however, possible to specify that the conversion should
    happen synchronously and in this case the array of vectors is returned rather
    than a worker instance.
    
    #### Example Usage (Asyncronous)
    ~ // default options are used (async + 500 conversions per cycle)
    ~ T5.Geo.Position.vectorize(positions);
    ~ 
    #### Example Usage (Synchronous)
    ~ var vectors = T5.Geo.Position.vectorize(positions, {
    ~     async: false
    ~ });
    */
    function vectorize(positions, options) {
        var posIndex = positions.length,
            vectors = new Array(posIndex);
            
        // initialise options
        options = COG.extend({
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
                vectors[ii] = T5.GeoXY.init(positions[ii]);
                
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
                vectors[ii] = T5.GeoXY.init(positions[ii]);
            } // for
            
            return vectors;
        } // if
        
        animFrame(processPositions);
        return null;
    } // vectorize
    
    return {
        calcDistance: calcDistance,
        copy: copy,
        empty: empty,
        equal: equal,
        fromMercatorPixels: fromMercatorPixels,
        generalize: generalize,
        inArray: inArray,
        inBounds: inBounds,
        init: init,
        offset: offset,
        parse: parse,
        parseArray: parseArray,
        toMercatorPixels: toMercatorPixels,
        toString: toString,
        vectorize: vectorize
    };
})();