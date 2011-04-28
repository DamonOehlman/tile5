/**
### simplify(xy*, generalization)
This function is used to simplify a xy array by removing what would be considered
'redundant' xy positions by elimitating at a similar position.  
*/
function simplify(points, generalization) {
    if (! points) {
        return null;
    } // if

    // set the the default generalization
    generalization = generalization || VECTOR_SIMPLIFICATION;

    var tidied = [],
        last = null;

    for (var ii = points.length; ii--; ) {
        var current = points[ii];

        // determine whether the current point should be included
        include = !last || ii === 0 || 
            (abs(current.x - last.x) + 
                abs(current.y - last.y) >
                generalization);

        if (include) {
            tidied.unshift(current);
            last = current;
        }
    } // for

    return tidied;
} // simplify

reg('fn', 'simplify', simplify);