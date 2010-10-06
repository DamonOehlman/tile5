/**
T5.Core
=======

The T5.Core module contains classes and functionality that support basic drawing 
operations and math that are used in managing and drawing the graphical and tiling interfaces 
that are provided in the Tile5 library.

Classes
-------

- T5.Vector
- T5.Dimensions
- T5.Rect


Submodules
----------

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


    */
    var Vector = function(initX, initY) {
        return {
            x: initX ? initX : 0,
            y: initY ? initY : 0
        };
    }; // Vector
    
    /**
    # T5.V

    This module defines functions that are used to maintain T5.Vector objects and this
    is removed from the actual Vector class to keep the Vector object lightweight.

    ## Functions

    */
    var vectorTools = (function() {
        function edges(vectors) {
            if ((! vectors) || (vectors.length <= 1)) {
                throw new Error("Cannot determine edge " +
                    "distances for a vector array of only one vector");
            } // if
            
            var fnresult = {
                edges: new Array(vectors.length - 1),
                accrued: new Array(vectors.length - 1),
                total: 0
            };
            
            var diffFn = vectorTools.diff;
            
            // iterate through the vectors and calculate the edges
            // OPTMIZE: look for speed up opportunities
            for (var ii = 0; ii < vectors.length - 1; ii++) {
                var diff = diffFn(vectors[ii], vectors[ii + 1]);
                
                fnresult.edges[ii] = 
                    Math.sqrt((diff.x * diff.x) + (diff.y * diff.y));
                fnresult.accrued[ii] = 
                    fnresult.total + fnresult.edges[ii];
                    
                fnresult.total += fnresult.edges[ii];
            } // for
            
            return fnresult;
        } // edges

        return {
            create: function(x, y) {
                return new Vector(x, y);
            },
            
            /**
            - `add(v*)`
            
            Return a new T5.Vector that is the total sum value of all the 
            vectors passed to the function.
            */
            add: function() {
                var fnresult = new Vector();
                for (var ii = arguments.length; ii--; ) {
                    fnresult.x += arguments[ii].x;
                    fnresult.y += arguments[ii].y;
                } // for
                
                return fnresult;
            },
            
            absSize: function(vector) {
                return Math.max(Math.abs(vector.x), Math.abs(vector.y));
            },
            
            /**
            - `diff(v1, v2)`
            
            Return a new T5.Vector that contains the result of v1 - v2.
            */
            diff: function(v1, v2) {
                return new Vector(v1.x - v2.x, v1.y - v2.y);
            },
            
            /**
            - `copy(src)`
            
            Return a new T5.Vector copy of the vector passed to the function 
            */
            copy: function(src) {
                return src ? new Vector(src.x, src.y) : null;
            },
            
            /**
            - `invert(v)`
            
            Return a new T5.Vector that contains the inverted values of the 
            vector passed to the function
            */
            invert: function(vector) {
                return new Vector(-vector.x, -vector.y);
            },
            
            /**
            - `offset(vector, offsetX, offsetY)`
            
            Return a new T5.Vector that is offset by the specified x and y offset
            */
            offset: function(vector, offsetX, offsetY) {
                return new Vector(
                                vector.x + offsetX, 
                                vector.y + (offsetY ? offsetY : offsetX));
            },
            
            edges: edges,
            
            /**
            - `distance(v*)`
            
            Return the total euclidean distance between all the points of the
            vectors supplied to the function
            */
            distance: function(vectors) {
                return edges(vectors).total;
            },
            
            /**
            - `theta (v1, v2, distance)`
            
            */
            theta: function(v1, v2, distance) {
                var theta = Math.asin((v1.y - v2.y) / distance);
                return v1.x > v2.x ? theta : Math.PI - theta;
            },
            
            
            /**
            - `pointOnEdge(v1, v2, theta, delta)`
            
            */
            pointOnEdge: function(v1, v2, theta, delta) {
                var xyDelta = new Vector(
                                    Math.cos(theta) * delta, 
                                    Math.sin(theta) * delta);
                
                return new Vector(
                                    v1.x - xyDelta.x, 
                                    v1.y - xyDelta.y);
            },
            
            /**
            - `getRect(v*)`
            
            */
            getRect: function(vectorArray) {
                var arrayLen = vectorArray.length;
                if (arrayLen > 1) {
                    return new Rect(
                        Math.min(
                            vectorArray[0].x, 
                            vectorArray[arrayLen - 1].x
                        ),
                        Math.min(
                            vectorArray[0].y, 
                            vectorArray[arrayLen - 1].y
                        ),
                        Math.abs(vectorArray[0].x - 
                            vectorArray[arrayLen - 1].x),
                        Math.abs(vectorArray[0].y - 
                            vectorArray[arrayLen - 1].y)
                    );
                }
            },
            
            /**
            - `toString(vector)`
            
            */
            toString: function(vector) {
                return vector.x + ', ' + vector.y;
            }
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
    */
    var Rect = function(x, y, width, height) {
        return {
            origin: new Vector(x, y),
            dimensions: new Dimensions(width, height)
        };
    }; // Rect
    
    /**
    # T5.R
    
    */
    var rectTools = (function() {
        var subModule = {
            copy: function(src) {
                return src ? 
                    new Rect(
                            src.origin.x, 
                            src.origin.y, 
                            src.dimensions.width, 
                            src.dimensions.height) :
                    null;
            },
            
            getCenter: function(rect) {
                return new Vector(
                            rect.origin.x + (rect.dimensions.width / 2), 
                            rect.origin.y + (rect.dimensions.height / 2));
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
    
    */
    var dimensionTools = (function() {
        var subModule = {
            getAspectRatio: function(dimensions) {
                return dimensions.height !== 0 ? 
                    dimensions.width / dimensions.height : 1;
            },

            getCenter: function(dimensions) {
                return new Vector(
                            dimensions.width / 2, 
                            dimensions.height / 2);
            },
            
            getSize: function(dimensions) {
                return Math.sqrt(Math.pow(dimensions.width, 2) + 
                        Math.pow(dimensions.height, 2));
            }
        };
        
        return subModule;
    })(); // dimensionTools

    var module = {
        ex: GT.extend,
        
        newCanvas: function(width, height) {
            var tmpCanvas = document.createElement('canvas');

            // initialise the canvas element if using explorercanvas
            if (typeof FlashCanvas !== 'undefined') {
                FlashCanvas.initElement(tmpCanvas);
            } // if

            // set the size of the canvas if specified
            tmpCanvas.width = width ? width : 0;
            tmpCanvas.height = height ? height : 0;
            
            return tmpCanvas;
        },
        
        time: function() {
            return new Date().getTime();
        },
        
        Vector: Vector, // Vector
        V: vectorTools,
        
        Dimensions: Dimensions, // Dimensions
        D: dimensionTools,
        
        Rect: Rect,
        R: rectTools
    };
    
    return module;
})();
