/**
# T5.Line

__inherits: [Array](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array)

## Methods
*/
function Line(allowCull) {
    this.allowCull = allowCull;
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
                inVP;

            // iterate through the points in the array
            for (var ii = this.length; ii--; ) {
                // determine whether the current point is within the viewport
                inVP = this[ii].x >= minX && this[ii].x <= maxX && 
                    this[ii].y >= minY && this[ii].y <= maxY;

                // if so, update teh first and last indexes
                if (inVP) {
                    firstIdx = ii < firstIdx ? ii : firstIdx;
                    lastIdx = ii > lastIdx ? ii : lastIdx;
                } // if
            } // for

            // create a slice of the points for the visible points
            // including one point either side
            return this.slice(max(firstIdx - 1, 0), min(lastIdx + 1, this.length));
        } // if
        
        // otherwise just return the array
        return this;
    },
    
    /**
    ### simplify(generalization)
    */
    simplify: function(generalization) {
        // set the the default generalization
        generalization = generalization || VECTOR_SIMPLIFICATION;

        var tidied = new Line(),
            last = null;

        for (var ii = this.length; ii--; ) {
            var current = this[ii];

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
    }
});