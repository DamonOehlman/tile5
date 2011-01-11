/**
# T5.Vector
This module defines functions that are used to maintain T5.Vector objects and this
is removed from the actual Vector class to keep the Vector object lightweight.

## Functions
*/
var Vector = (function() {
    
    /* exports */
    
    function dotProduct(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    } // dotProduct
     
    /*
    This method implements the Ramer–Douglas–Peucker algorithm for simplification instead.
    */
    function simplifyRDP(vectors, epsilon) {
        if ((! vectors) || (vectors.length <= 2)) {
            return vectors;
        } // if
        
        // initialise epsilon to the default if not provided
        epsilon = epsilon ? epsilon : XY.VECTOR_SIMPLIFICATION;
        
        // initialise variables
        var distanceMax = 0,
            index = 0,
            lastIndex = vectors.length - 1,
            u,
            tailItem,
            results;

        // calculate the unit vector (ignoring the last index if it is the same as the first)
        u = unitize(vectors[0], vectors[lastIndex]);

        for (var ii = 1; ii < lastIndex; ii++) {
            var diffVector = difference(vectors[ii], vectors[0]),
                orthDist = dotProduct(diffVector, u);

            // COG.info('orth dist = ' + orthDist + ', diff Vector = ', diffVector);
            if (orthDist > distanceMax) {
                index = ii;
                distanceMax = orthDist;
            } // if
        } // for

        COG.info('max distance = ' + distanceMax + ', unitized distance vector = ', u);

        // find the point with the max distance
        if (distanceMax >= epsilon) {
            var r1 = simplify(vectors.slice(0, index), epsilon),
                r2 = simplify(vectors.slice(index, lastIndex), epsilon);
            
            results = r1.slice(0, -1).concat(r2);
        }
        else {
            results = vectors;
        } // if..else
        
        // if we were holding a tail item put it back
        if (tailItem) {
            results[results.length] = tailItem;
        } // if
        
        return results;
    } // simplify
    
    function unitize(v1, v2) {
        var unitLength = edges([v1, v2]).total,
            absX = unitLength !== 0 ? (v2.x - v1.x) / unitLength : 0, 
            absY = unitLength !== 0 ? (v2.y - v1.y) / unitLength : 0;

        // COG.info('unitizing vectors, length = ' + unitLength);
        return XY.init(absX, absY);
    } // unitize
    
    /* define module */

    return {
        dotProduct: dotProduct
    };
})(); // vectorTools