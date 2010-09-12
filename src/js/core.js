T5 = (function() {
    /* vector definition and tools */
    
    var Vector = function(initX, initY) {
        return {
            x: initX ? initX : 0,
            y: initY ? initY : 0
        };
    }; // Vector
    
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
            
            diff: function(v1, v2) {
                return new Vector(v1.x - v2.x, v1.y - v2.y);
            },
            
            copy: function(src) {
                return src ? new Vector(src.x, src.y) : null;
            },
            
            invert: function(vector) {
                return new Vector(-vector.x, -vector.y);
            },
            
            offset: function(vector, offsetX, offsetY) {
                return new Vector(
                                vector.x + offsetX, 
                                vector.y + (offsetY ? offsetY : offsetX));
            },
            
            edges: edges,
            distance: function(vectors) {
                return edges(vectors).total;
            },
            
            theta: function(v1, v2, distance) {
                var theta = Math.asin((v1.y - v2.y) / distance);
                return v1.x > v2.x ? theta : Math.PI - theta;
            },
            
            pointOnEdge: function(v1, v2, theta, delta) {
                var xyDelta = new Vector(
                                    Math.cos(theta) * delta, 
                                    Math.sin(theta) * delta);
                
                return new Vector(
                                    v1.x - xyDelta.x, 
                                    v1.y - xyDelta.y);
            },
            
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
            
            toString: function(vector) {
                return vector.x + ', ' + vector.y;
            }
        };
    })(); // vectorTools
    
    /* rect definition and tools */
    
    var Rect = function(x, y, width, height) {
        return {
            origin: new Vector(x, y),
            dimensions: new Dimensions(width, height)
        };
    }; // Rect
    
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

    /* dimensions definition and tools */
    
    var Dimensions = function(initWidth, initHeight) {
        return {
            width: initWidth ? initWidth : 0,
            height: initHeight ? initHeight : 0
        }; 
    }; // Dimensions
    
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
            if (typeof(G_vmlCanvasManager) !== "undefined") {
                G_vmlCanvasManager.initElement(tmpCanvas);
            } // if

            // set the size of the canvas if specified
            tmpCanvas.width = width ? width : 0;
            tmpCanvas.height = height ? height : 0;
            
            return tmpCanvas;
        },
        
        time: function() {
            return new Date().getTime();
        },
        
        /**
        Initialise a new Vector instance
        
        @param {Number} init_x the Initial x value for the Vector
        @param {Number} init_y the Initial y value for the Vector

        @class 
        @name Vector
        */
        Vector: Vector, // Vector
        V: vectorTools,
        
        Dimensions: Dimensions, // Dimensions
        D: dimensionTools,
        
        Rect: Rect,
        R: rectTools
    };
    
    return module;
})();
