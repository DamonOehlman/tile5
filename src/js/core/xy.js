/**
# T5.XY
This module contains simple functions for creating and manipulating an object literal that 
contains an `x` and `y` value.  Previously this functionaliy lived in the T5.V module but has
been moved to communicate it's more generic implementation.  The T5.V module still exists, however,
and also exposes the functions of this module for the sake of backward compatibility.
*/
var XY = (function() {
    /* internal functions */
    
    /* exports */
    
    /**
    ### add(xy*)
    Return a new xy composite that is the value of all the xy values added together.
    */
    function add() {
        var sumX = 0, sumY = 0;
        for (var ii = arguments.length; ii--; ) {
            sumX += arguments[ii].x;
            sumY += arguments[ii].y;
        } // for
        
        return init(sumX, sumY);
    } // add
    
    /**
    ### absSize(vector)
    */
    function absSize(xy) {
        return Math.max(Math.abs(xy.x), Math.abs(xy.y));
    } // absSize
    
    /**
    ### copy(src)
    Return a new xy composite that is a copy of the one passed to the function
    */
    function copy(src) {
        return src ? init(src.x, src.y) : null;
    } // copy
    
    /**
    ### diff(pt1, pt2)
    Return a point that is difference between the x and y values of `xy1` and `xy2`.
    */
    function difference(xy1, xy2) {
        return init(xy1.x - xy2.x, xy1.y - xy2.y);
    } // difference
    
    /**
    ### distance(xy*)
    Return the total euclidean distance between all the xy values passed to the 
    function.
    */
    function distance(xy, count) {
        return edges(xy, count).total;
    } // distance
    
    /**
    ### edges(points, count)
    */
    function edges(points, count) {
        if (! count) {
            count = points.length;
        } // if
        
        if (count <= 1) {
            throw new Error("Cannot determine edge " +
                "distances for a vector array of only one vector");
        } // if
        
        var fnresult = {
            edges: new Array(count - 1),
            accrued: new Array(count - 1),
            total: 0
        };
        
        // iterate through the vectors and calculate the edges
        // OPTMIZE: look for speed up opportunities
        for (var ii = 0; ii < count - 1; ii++) {
            var diff = difference(points[ii], points[ii + 1]);
            
            fnresult.edges[ii] = 
                Math.sqrt((diff.x * diff.x) + (diff.y * diff.y));
            fnresult.accrued[ii] = 
                fnresult.total + fnresult.edges[ii];
                
            fnresult.total += fnresult.edges[ii];
        } // for
        
        return fnresult;
    } // edges
    
    /**
    ### equals(pt1, pt2)
    Return true if the two points are equal, false otherwise.  __NOTE:__ This function
    does not automatically floor the values so if the point values are floating point
    then floating point precision errors will likely occur.
    */
    function equals(pt1, pt2) {
        return pt1.x === pt2.x && pt1.y === pt2.y;
    } // equals
    
    /**
    ### extendBy(xy, theta, delta)
    */
    function extendBy(xy, theta, delta) {
        var xDelta = Math.cos(theta) * delta,
            yDelta = Math.sin(theta) * delta;
        
        return init(xy.x - xDelta, xy.y - yDelta);
    } // extendBy
    
    /**
    ### floor(pt*)
    This function is used to take all the points in the array and convert them to
    integer values
    */
    function floor(points) {
        var results = new Array(points.length);
        for (var ii = points.length; ii--; ) {
            results[ii] = init(~~points[ii].x, ~~points[ii].y);
        } // for
        
        return results;
    } // floor
    
    /**
    ### getRect(xy*)
    Get a XYRect composite that is large enough to contain the xy values passed
    to the function.
    */
    function getRect(points) {
        var minX, minY, maxX, maxY;
        
        for (var ii = points.length; ii--; ) {
            var xy = points[ii];
            
            // update the min x and min y
            minX = (typeof minX === 'undefined') || xy.x < minX ? xy.x : minX;
            minY = (typeof minY === 'undefined') || xy.y < minY ? xy.y : minY;
            
            // update the max x and max y
            maxX = (typeof maxX === 'undefined') || xy.x > maxX ? xy.x : maxX;
            maxY = (typeof maxY === 'undefined') || xy.y > maxY ? xy.y : maxY;
        } // for
        
        return XYRect.init(minX, minY, maxX, maxY);
    } // getRect        
    
    /**
    ### init(x, y)
    Initialize a new point that can be used in Tile5.  A point is simply an 
    object literal with the attributes `x` and `y`.  If initial values are passed
    through when creating the point these will be used, otherwise 0 values will 
    be used.
    */
    function init(initX, initY) {
        return {
            x: initX ? initX : 0,
            y: initY ? initY : 0
        };
    } // init
    
    /**
    ### invert(xy)
    Return a new composite xy value that is the inverted value of the one passed
    to the function.
    */
    function invert(xy) {
        return init(-xy.x, -xy.y);
    } // invert
    
    /**
    ### max(xy1, xy2)
    */
    function max(xy1, xy2) {
        return init(
            xy1.x > xy2.x ? xy1.x : xy2.x, 
            xy1.y > xy2.y ? xy1.y : xy2.y);
    } // max
    
    /**
    ### min(xy1, xy2)
    */
    function min(xy1, xy2) {
        return init(
            xy1.x < xy2.x ? xy1.x : xy2.x, 
            xy1.y < xy2.y ? xy1.y : xy2.y);
    } // min
    
    /**
    ### offset(xy, offsetX, offsetY)
    Return a new composite xy which is offset by the specified amount.
    */
    function offset(xy, offsetX, offsetY) {
        return init(xy.x + offsetX, xy.y + (offsetY ? offsetY : offsetX));
    } // offset
    
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
        generalization = generalization ? generalization : XY.VECTOR_SIMPLIFICATION;

        var tidied = [],
            last = null;

        for (var ii = points.length; ii--; ) {
            var current = points[ii];

            // determine whether the current point should be included
            include = !last || ii === 0 || 
                (Math.abs(current.x - last.x) + 
                    Math.abs(current.y - last.y) >
                    generalization);

            if (include) {
                tidied.unshift(current);
                last = current;
            }
        } // for

        return tidied;
    } // simplify
    
    /**
    ### theta (xy1, xy2, distance)
    */
    function theta(xy1, xy2, distance) {
        var theta = Math.asin((xy1.y - xy2.y) / distance);
        return xy1.x > xy2.x ? theta : Math.PI - theta;
    } // theta
    
    /**
    ### toString(xy)
    Return the string representation of the xy
    */
    function toString(xy) {
        return xy.x + ', ' + xy.y;
    } // toString
    
    /* module export */
    
    return {
        VECTOR_SIMPLIFICATION: 3,
        SIMPLIFICATION_MIN_VECTORS: 25,
        
        add: add,
        absSize: absSize,
        copy: copy,
        diff: difference,
        distance: distance,
        edges: edges,
        equals: equals,
        extendBy: extendBy,
        floor: floor,
        getRect: getRect,
        init: init,
        invert: invert,
        min: min,
        max: max,
        offset: offset,
        simplify: simplify,
        theta: theta
    };
})();