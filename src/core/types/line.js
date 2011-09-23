/**
# T5.Line

## Methods
*/
function Line(allowCull) {
    this.allowCull = allowCull;
    this.points = [];
};

Line.prototype = _extend(new Array(), {
    /**
    ### cull(viewport)
    */
    cull: function(viewport) {
        // if culling is allowed, then points to those within the viewport
        if (this.allowCull) {
            var minX = viewport.x,
                minY = viewport.y,
                maxX = viewport.x + viewport.w,
                maxY = viewport.y + viewport.h,
                firstIdx = Infinity,
                lastIdx = 0,
                points = this.points,
                inVP;

            // iterate through the points in the array
            for (var ii = points.length; ii--; ) {
                // determine whether the current point is within the viewport
                inVP = points[ii].x >= minX && points[ii].x <= maxX && 
                    points[ii].y >= minY && points[ii].y <= maxY;

                // if so, update teh first and last indexes
                if (inVP) {
                    firstIdx = ii < firstIdx ? ii : firstIdx;
                    lastIdx = ii > lastIdx ? ii : lastIdx;
                } // if
            } // for

            // create a slice of the points for the visible points
            // including one point either side
            return points.slice(max(firstIdx - 2, 0), min(lastIdx + 2, points.length));
        } // if
        
        // otherwise just return the array
        return this.points;
    },
    
    /**
    ### simplify(generalization)
    */
    simplify: function(generalization) {
        // set the the default generalization
        generalization = generalization || VECTOR_SIMPLIFICATION;

        var tidied = new Line(this.allowCull),
            points = this.points,
            last = null;

        for (var ii = points.length; ii--; ) {
            var current = points[ii];

            // determine whether the current point should be included
            include = !last || ii === 0 || 
                (abs(current.x - last.x) + 
                    abs(current.y - last.y) >
                    generalization);

            if (include) {
                tidied.points.unshift(current);
                last = current;
            }
        } // for

        return tidied;
    }
});