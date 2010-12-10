/**
# T5
The T5 core module contains classes and functionality that support basic drawing 
operations and math that are used in managing and drawing the graphical and tiling interfaces 
that are provided in the Tile5 library.

## Classes
- T5.Vector
- T5.Dimensions
- T5.Rect


## Submodules
- T5.Settings
- T5.V
- T5.D
- T5.R
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
        Get a T5.Rect that is large enough to contain the xy values passed
        to the function.
        */
        function getRect(points) {
            var arrayLen = points.length;
            if (arrayLen > 1) {
                return new Rect(
                    Math.min(
                        points[0].x, 
                        points[arrayLen - 1].x
                    ),
                    Math.min(
                        points[0].y, 
                        points[arrayLen - 1].y
                    ),
                    Math.abs(points[0].x - 
                        points[arrayLen - 1].x),
                    Math.abs(points[0].y - 
                        points[arrayLen - 1].y)
                );
            } // if
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
    # T5.Rect
    
    A class used to store details pertaining to a rectangular region.
    
    ## Constructor
    `new T5.Rect(x, y, width, height)`
    
    ## Properties
    
    - origin - the top left point of the rectangle
    - dimensions - the width and height of the rectangle
    - invalid - used to indicate that the rect dimensions are irrelevant
    
    
    ## Notes
    The invalid property was added and is used for assisting with managing
    the clip rect that will be drawn in a View.  If marked invalid then
    detailed checking of the draw area is skipped, and no clip() will be
    applied when drawing the canvas (the whole thing is drawn).
    */
    var Rect = function(x, y, width, height) {
        return {
            origin: xyTools.init(x, y),
            dimensions: new Dimensions(width, height),
            invalid: false
        };
    }; // Rect
    
    /**
    # T5.R
    A module of utility functions for working with T5.Rect objects.
    
    ## Functions
    */
    var rectTools = (function() {
        var subModule = {
            /**
            ## bottomRight(src)
            Get the a T5.Vector for the bottom right position of the rect
            */
            bottomRight: function(src) {
                return vectorTools.offset(
                            src.origin, 
                            src.dimensions.width, 
                            src.dimensions.height);
            },

            /**
            ### empty()
            Return a new empty T5.Rect
            */
            empty: function() {
                return new Rect(0, 0, 0, 0);
            },
            
            /**
            ### copy(src)
            Return a new T5.Rect that is a copy of the specified `src` 
            */
            copy: function(src) {
                return src ? 
                    new Rect(
                            src.origin.x, 
                            src.origin.y, 
                            src.dimensions.width, 
                            src.dimensions.height) :
                    null;
            },
            
            /**
            ### getCenter(rect)
            Return the a T5.Vector for the center of the specified `rect`
            */
            getCenter: function(rect) {
                return xyTools.init(
                            rect.origin.x + (rect.dimensions.width / 2), 
                            rect.origin.y + (rect.dimensions.height / 2));
            },
            
            /**
            ### isEmpty(rect)
            Return true if the `rect` has 0 width or 0 height.
            */
            isEmpty: function(rect) {
                return rect.dimensions.width === 0 || rect.dimensions.height === 0;
            },
            
            /**
            ### union(dst, src)
            This function takes the Rect values passed to the function and determines
            the required rect to contain all of those values. This origin and dimensions
            of this resulting Rect are then used to replace the first Rect passed to 
            the function.
            */
            union: function() {
                if (arguments.length < 2) { return; }

                var top = arguments[0].origin.y,
                    left = arguments[0].origin.x, 
                    bottom = top + arguments[0].dimensions.height,
                    right = left + arguments[0].dimensions.width,
                    rects = Array.prototype.slice.call(arguments, 1);
                    
                // iterate through the other rects and find the max bounds
                for (var ii = rects.length; ii--; ) {
                    var testTop = rects[ii].origin.y,
                        testLeft = rects[ii].origin.x,
                        testBottom = testTop + rects[ii].dimensions.height,
                        testRight = testLeft + rects[ii].dimensions.width;
                        
                    top = top < testTop ? top : testTop;
                    left = left < testLeft ? left : testLeft;
                    bottom = bottom > testBottom ? bottom : testBottom;
                    right = right > testRight ? right : testRight;
                } // for
                
                // update the first rect with the max bounds
                arguments[0].origin.x = left;
                arguments[0].origin.y = top;
                arguments[0].dimensions.width = right - left;
                arguments[0].dimensions.height = bottom - top;
            }
        };
        
        return subModule;
    })(); // rectTools

    /**
    # T5.Dimensions
    
    */
    var Dimensions = function(initWidth, initHeight) {
        return {
            width: initWidth ? initWidth : 0,
            height: initHeight ? initHeight : 0
        }; 
    }; // Dimensions
    
    /** 
    # T5.D
    A module of utility functions for working with T5.Dimension objects
    
    ## Functions
    */
    var dimensionTools = (function() {
        var subModule = {
            /**
            ### getAspectRatio(dimensions)
            Return the aspect ratio for the `dimensions` (width / height)
            */
            getAspectRatio: function(dimensions) {
                return dimensions.height !== 0 ? 
                    dimensions.width / dimensions.height : 1;
            },

            /**
            ### getCenter(dimensions)
            Get the a T5.Vector for the center of the `dimensions` (width / 2, height  / 2)
            */
            getCenter: function(dimensions) {
                return xyTools.init(
                            dimensions.width / 2, 
                            dimensions.height / 2);
            },
            
            /**
            ### getSize(dimensions)
            Get the size for the diagonal for the `dimensions`
            */
            getSize: function(dimensions) {
                return Math.sqrt(Math.pow(dimensions.width, 2) + 
                        Math.pow(dimensions.height, 2));
            }
        };
        
        return subModule;
    })(); // dimensionTools
    
    /* exports */
    
    function getTicks() {
        return new Date().getTime();
    } // getTicks
    
    /* module definition */

    var module = {
        ex: COG.extend,
        ticks: getTicks,
        
        XY: xyTools,
        
        Vector: Vector, // Vector
        V: COG.extend(xyTools, vectorTools),
        
        Dimensions: Dimensions, // Dimensions
        D: dimensionTools,
        
        Rect: Rect,
        R: rectTools
    };
    
    return module;
})();
