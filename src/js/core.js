/**
# T5
The T5 core module contains classes and functionality that support basic drawing 
operations and math that are used in managing and drawing the graphical and tiling interfaces 
that are provided in the Tile5 library.

## Classes
- T5.Vector (deprecated)

## Submodules
- T5.XY
- T5.XYRect
- T5.V
- T5.D
*/
T5 = (function() {
    /**
    # T5.Vector
    A vector is used to encapsulate X and Y coordinates for a point, and rather than 
    bundle it with methods it has been kept to just core data to ensure it has a 
    lightweight memory footprint.

    ## Constructor
    `T5.Vector(x, y)`
    */
    var Vector = function(initX, initY) {
        COG.Log.warn('The T5.Vector class has been deprecated, please use T5.XY.init instead');
        
        return xyTools.init(initX, initY);
    }; // Vector
    
    
    
    /**
    # T5.XY
    This module contains simple functions for creating and manipulating an object literal that 
    contains an `x` and `y` value.  Previously this functionaliy lived in the T5.V module but has
    been moved to communicate it's more generic implementation.  The T5.V module still exists, however,
    and also exposes the functions of this module for the sake of backward compatibility.
    */
    var xyTools = (function() {
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
            
            return xyRectTools.init(minX, minY, maxX, maxY);            
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
            generalization = generalization ? generalization : xyTools.VECTOR_SIMPLIFICATION;

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
    
    /**
    # T5.V
    This module defines functions that are used to maintain T5.Vector objects and this
    is removed from the actual Vector class to keep the Vector object lightweight.

    ## Functions
    */
    var vectorTools = (function() {
        
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
            epsilon = epsilon ? epsilon : vectorTools.VECTOR_SIMPLIFICATION;
            
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

                // COG.Log.info('orth dist = ' + orthDist + ', diff Vector = ', diffVector);
                if (orthDist > distanceMax) {
                    index = ii;
                    distanceMax = orthDist;
                } // if
            } // for

            COG.Log.info('max distance = ' + distanceMax + ', unitized distance vector = ', u);

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

            // COG.Log.info('unitizing vectors, length = ' + unitLength);
            return xyTools.init(absX, absY);
        } // unitize
        
        /* define module */

        return {
            dotProduct: dotProduct
        };
    })(); // vectorTools
    
    /**
    # T5.XYRect
    This module provides helper functions for working with an object literal that represents a set of xy
    values that represent the top-left and bottom-right corners of a rectangle respectively.
    
    ## XYRect Object Literal Format
    An XYRect object literal has the following properties.
    
    - `x1` - The x value for the top left corner
    - `y1` - The y value for the top left corner
    - `x2` - The x value for the bottom right corner
    - `y2` - The y value for the bottom right corner
    - `width` - The width of the rect
    - `height` - The height of the rect
    
    ## Functions
    */
    var xyRectTools = (function() {
        
        /* exports */
        
        /**
        ### center(rect)
        Return a xy composite for the center of the rect
        */
        function center(rect) {
            return xyTools.init(rect.x1 + rect.width/2, rect.y1 + rect.height/2);
        } // center
        
        /**
        ### copy(rect)
        Return a duplicate of the XYRect
        */
        function copy(rect) {
            return init(rect.x1, rect.y1, rect.x2, rect.y2);
        } // copy
        
        /**
        ### diagonalSize(rect)
        */
        function diagonalSize(rect) {
            return Math.sqrt(rect.width * rect.width + rect.height * rect.height);
        } // diagonalSize
        
        /**
        ### fromCenter(centerX, centerY, width, height)
        */
        function fromCenter(centerX, centerY, width, height) {
            var halfWidth = ~~(width / 2),
                halfHeight = ~~(height / 2);
            
            return init(
                centerX - halfWidth, 
                centerY - halfHeight,
                centerX + halfWidth,
                centerY + halfHeight);
        } // fromCenter
        
        /**
        ### init(x1, y1, x2, y2)
        Create a new XYRect composite object
        */
        function init(x1, y1, x2, y2) {
            // default the xy and y1 to 0 if not specified
            x1 = x1 ? x1 : 0;
            y1 = y1 ? y1 : 0;
            x2 = typeof x2 !== 'undefined' ? x2 : x1;
            y2 = typeof y2 !== 'undefined '? y2 : y2;
            
            return {
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2,
            
                width: x2 - x1,
                height: y2 - y1
            };
        } // init
        
        /**
        ### intersect(rect1, rect2)
        Returns the intersecting rect between the two specified XYRect composites
        */
        function intersect(rect1, rect2) {
            var x1 = Math.max(rect1.x1, rect2.x1),
                y1 = Math.max(rect1.y1, rect2.y1),
                x2 = Math.min(rect1.x2, rect2.x2),
                y2 = Math.min(rect1.y2, rect2.y2),
                r = init(x1, y1, x2, y2);
                
            return ((r.width > 0) && (r.height > 0)) ? r : null;
        } // intersect
        
        /**
        ### union(rect1, rect2)
        */
        function union(rect1, rect2) {
            if (rect1.width === 0 || rect1.height === 0) {
                return copy(rect2);
            }
            else if (rect2.width === 0 || rect2.height === 0) {
                return copy(rect1);
            }
            else {
                var x1 = Math.min(rect1.x1, rect2.x1),
                    y1 = Math.min(rect1.y1, rect2.y1),
                    x2 = Math.max(rect1.x2, rect2.x2),
                    y2 = Math.max(rect1.y2, rect2.y2),
                    r = init(x1, y1, x2, y2);

                return ((r.width > 0) && (r.height > 0)) ? r : null;
            } // if..else
        } // union
        
        /* module definition */
        
        return {
            center: center,
            copy: copy,
            diagonalSize: diagonalSize,
            fromCenter: fromCenter,
            init: init,
            intersect: intersect,
            union: union
        };
    })();
    
    /** 
    # T5.D
    A module of utility functions for working with dimensions composites
    
    ## Dimension Object Literal Properties
    - `width`
    - `height`
    
    
    ## Functions
    */
    var dimensionTools = (function() {
        
        /* exports */
        
        /**
        ### getAspectRatio(dimensions)
        Return the aspect ratio for the `dimensions` (width / height)
        */
        function getAspectRatio(dimensions) {
            return dimensions.height !== 0 ? 
                dimensions.width / dimensions.height : 1;
        } // getAspectRatio

        /**
        ### getCenter(dimensions)
        Get the a XY composite for the center of the `dimensions` (width / 2, height  / 2)
        */
        function getCenter(dimensions) {
            return xyTools.init(
                        dimensions.width / 2, 
                        dimensions.height / 2);
        } // getCenter

        /**
        ### getSize(dimensions)
        Get the size for the diagonal for the `dimensions`
        */
        function getSize(dimensions) {
            return Math.sqrt(Math.pow(dimensions.width, 2) + 
                    Math.pow(dimensions.height, 2));
        } // getSize
        
        /** 
        ### init(width, height)
        Create a new dimensions composite (width, height)
        */
        function init(width, height) {
            // initialise the width
            width = width ? width : 0;
            
            return {
                width: width,
                height: height ? height : width
            };
        } // init

        /* module definition */
        
        return {
            getAspectRatio: getAspectRatio,
            getCenter: getCenter,
            getSize: getSize,
            init: init
        };
    })(); // dimensionTools
    
    /* exports */
    
    function getTicks() {
        return new Date().getTime();
    } // getTicks
    
    /**
    ### userMessage(msgType, msgKey, msgHtml)
    */
    function userMessage(msgType, msgKey, msgHtml) {
        module.trigger('userMessage', msgType, msgKey, msgHtml);
    } // userMessage
    
    /* module definition */

    var module = {
        ex: COG.extend,
        ticks: getTicks,
        userMessage: userMessage,
        
        XY: xyTools,
        XYRect: xyRectTools,
        
        Vector: Vector, // Vector
        V: COG.extend(xyTools, vectorTools),
        D: dimensionTools
    };
    
    // make T5 itself observable 
    COG.observable(module);
    
    return module;
})();
