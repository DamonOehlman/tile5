TILE5 = (function () {
    var module = {
        Settings: (function() {
            var currentSettings = {};
            
            // define self
            var self = {
                /** @lends TILE5.Settings */
                
                /** 
                @static
                Get a setting with the specified name
                
                @param {String} name the name of the setting to retrieve
                @returns the value of the setting if definied, undefined otherwise
                */
                get: function(name) {
                    return currentSettings[name];
                },
                
                /** @static */
                set: function(name, value) {
                    currentSettings[name] = value;
                },
                
                /** static */
                extend: function(params) {
                    GRUNT.extend(currentSettings, params);
                }
            };
            
            return self;
        })(),
        
        Clock: (function() {
            var ticks = null;
            
            return {
                // TODO: reduce the number of calls to new date get time
                getTime: function(cached) {
                    return (cached && ticks) ? ticks : ticks = new Date().getTime();
                }
            };
        })(),
        
        /**
        Initialise a new Vector instance
        
        @param {Number} init_x the Initial x value for the Vector
        @param {Number} init_y the Initial y value for the Vector

        @class 
        @name TILE5.Vector
        */
        Vector: function(initX, initY) {
            return {
                x: initX ? initX : 0,
                y: initY ? initY : 0
            };
        }, // Vector
        
        V: (function() {

            function edges(vectors) {
                if ((! vectors) || (vectors.length <= 1)) {
                    throw new Error("Cannot determine edge distances for a vector array of only one vector");
                } // if
                
                var fnresult = {
                    edges: new Array(vectors.length - 1),
                    accrued: new Array(vectors.length - 1),
                    total: 0
                };
                
                var diffFn = TILE5.V.diff;
                
                // iterate through the vectors and calculate the edges
                // OPTMIZE: look for speed up opportunities
                for (var ii = 0; ii < vectors.length-1; ii++) {
                    var diff = diffFn(vectors[ii], vectors[ii + 1]);
                    
                    fnresult.edges[ii] = Math.sqrt((diff.x * diff.x) + (diff.y * diff.y));
                    fnresult.accrued[ii] = fnresult.total + fnresult.edges[ii];
                    fnresult.total += fnresult.edges[ii];
                } // for
                
                return fnresult;
            } // edges

            return {
                create: function(x, y) {
                    return new module.Vector(x, y);
                },
                
                add: function() {
                    var fnresult = new module.Vector();
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
                    return new module.Vector(v1.x - v2.x, v1.y - v2.y);
                },
                
                copy: function(src) {
                    return src ? new module.Vector(src.x, src.y) : null;
                },
                
                invert: function(vector) {
                    return new TILE5.Vector(-vector.x, -vector.y);
                },
                
                offset: function(vector, offsetX, offsetY) {
                    return new TILE5.Vector(vector.x + offsetX, vector.y + (offsetY ? offsetY : offsetX));
                },
                
                edges: edges,
                distance: function(vectors) {
                    return edges(vectors).total;
                },
                
                theta: function(v1, v2, distance) {
                    var theta = Math.asin((v1.y - v2.y) / distance);
                    return v1.x > v2.x ? theta : Math.PI -theta;
                },
                
                pointOnEdge: function(v1, v2, theta, delta) {
                    var xyDelta = new TILE5.Vector(Math.cos(theta) * delta, Math.sin(theta) * delta);
                    
                    return new TILE5.Vector(v1.x - xyDelta.x, v1.y - xyDelta.y);
                },
                
                getRect: function(vectorArray) {
                    var arrayLen = vectorArray.length;
                    if (arrayLen > 1) {
                        return new TILE5.Rect(
                            Math.min(vectorArray[0].x, vectorArray[arrayLen - 1].x),
                            Math.min(vectorArray[0].y, vectorArray[arrayLen - 1].y),
                            Math.abs(vectorArray[0].x - vectorArray[arrayLen - 1].x),
                            Math.abs(vectorArray[0].y - vectorArray[arrayLen - 1].y)
                        );
                    }
                }
            };
        })(),
        
        Dimensions: function(initWidth, initHeight) {
            return {
                width: initWidth ? initWidth : 0,
                height: initHeight ? initHeight : 0
            }; 
        }, // Dimensions
        
        D: (function() {
            var subModule = {
                getAspectRatio: function(dimensions) {
                    return dimensions.height !== 0 ? dimensions.width / dimensions.height : 1;
                },

                getCenter: function(dimensions) {
                    return new module.Vector(dimensions.width / 2, dimensions.height / 2);
                },
                
                getSize: function(dimensions) {
                    return Math.sqrt(Math.pow(dimensions.width, 2) + Math.pow(dimensions.height, 2));
                }
            };
            
            return subModule;
        })(),
        
        Rect: function(x, y, width, height) {
            return {
                origin: new module.Vector(x, y),
                dimensions: new module.Dimensions(width, height)
            };
        },
        
        R: (function() {
            var subModule = {
                copy: function(src) {
                    return src ? new module.Rect(src.origin.x, src.origin.y, src.dimensions.width, src.dimensions.height) : null;
                },
                
                getCenter: function(rect) {
                    return new TILE5.Vector(rect.origin.x + (rect.dimensions.width / 2), rect.origin.y + (rect.dimensions.height / 2));
                }
            };
            
            return subModule;
        })()
    };
    
    return module;
})();

