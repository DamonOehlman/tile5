/**
@namespace 

The top level SLICK namespace.  This module contains core types and functionality for implementing 
*/
SLICK = (function () {
    var deviceConfigs = {
        base: {
            eventTarget: document,
            supportsTouch: "createTouch" in document
        },
        
        iphone: {
            regex: /iphone/i
        },
        
        android: {
            regex: /android/i,
            eventTarget: document.body,
            supportsTouch: true
        }
    }; // deviceConfigs
    
    var module = {
        /** @lends SLICK */

        /** @namespace
        Core SLICK module for setting and retrieving application settings.
        - should possibly be moved to GRUNT as it's pretty useful for most applications
        */
        Settings: (function() {
            var currentSettings = {};
            
            // define self
            var self = {
                /** @lends SLICK.Settings */
                
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
        
        Device: (function() {
            var deviceConfig = null;
            GRUNT.Log.info("ATTEMPTING TO DETECT PLATFORM: UserAgent = " + navigator.userAgent);
            
            // iterate through the platforms and run detection on the platform
            for (var deviceId in deviceConfigs) {
                var testPlatform = deviceConfigs[deviceId];
                
                if (testPlatform.regex && testPlatform.regex.test(navigator.userAgent)) {
                    deviceConfig = GRUNT.extend({}, deviceConfigs.base, testPlatform);
                    GRUNT.Log.info("PLATFORM DETECTED AS: " + deviceId);
                    break;
                } // if
            } // for
            
            if (! deviceConfig) {
                GRUNT.Log.warn("UNABLE TO DETECT PLATFORM, REVERTING TO BASE CONFIGURATION");
                deviceConfig = deviceConfigs.base;
            }
            
            return deviceConfig;
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
        @name SLICK.Vector
        */
        Vector: function(init_x, init_y) {
            // if the initialise x is not specified then set to 0
            if (! init_x) {
                init_x = 0;
            } // if

            // repeat for the y
            if (! init_y) {
                init_y = 0;
            } // if

            var self = {
                /** @lends SLICK.Vector */
                
                x: init_x,
                y: init_y,

                /**
                Add the value of the specified to the *current* vector and return the updated value of the vector.
                
                @memberOf SLICK.Vector#
                @param {SLICK.Vector} vector the vector to add to the current vector object
                @returns {SLICK.Vector} itself (chaining style)
                */
                add: function(vector) {
                  self.x += vector.x;
                  self.y += vector.y;
                  
                  return self;
                },
                
                /**
                Determine the difference between the current vector and a second vector. The result is returned in a new
                vector
                
                @memberOf SLICK.Vector#
                @param {SLICK.Vector} vector the vector to subtract from the current vector
                @return {SLICK.Vector} a new vector representing the difference between the current vector and the 2nd vector
                */
                diff: function(vector) {
                    return new SLICK.Vector(self.x - vector.x, self.y - vector.y);
                },

                /**
                Copy the specified vector value into the current object
                
                @memberOf SLICK.Vector#
                @param {SLICK.Vector} vector the source vector from which to copy the x, y values
                */
                copy: function(vector) {
                    self.x = vector.x;
                    self.y = vector.y;
                },
                
                empty: function() {
                    self.x = 0;
                    self.y = 0;
                },
                
                /**
                Create a copy of the current object
                
                @memberOf SLICK.Vector#
                @returns {SLICK.Vector} a new vector instance with the x, y value of the current vector
                */
                duplicate: function() {
                    return new SLICK.Vector(self.x, self.y);
                },
                
                /**
                @memberOf SLICK.Vector#
                */
                getAbsSize: function() {
                    return Math.max(Math.abs(self.x), Math.abs(self.y));
                },

                /** 
                Apply an offset to the current vector and return the result as a new vector instance.  The value
                of the current object is not changed through calling this function.
                
                @memberOf SLICK.Vector#
                @param {Number} x the amount to apply to the x value of the vector
                @param {Number} y the amount to apply to the y value of the vector
                @returns {SLICK.Vector} a *new* vector instance offset from the current value by the specified x, y values
                */
                offset: function(x, y) {
                    return new SLICK.Vector(self.x + x, self.y + y);
                },
                
                /** 
                Return a new vector instance that is the inverted value of the current vector
                
                @memberOf SLICK.Vector#
                @returns {SLICK.Vector} a *new* vector instance that contains the inverted values of the current vector
                */
                invert: function() {
                    return new SLICK.Vector(-self.x, -self.y);
                },
                
                matches: function(test) {
                    return test && (self.x == test.x) && (self.y == test.y);
                },

                /** 
                Return a string representation "x, y" of the current vector
                
                @memberOf SLICK.Vector#
                */
                toString: function() {
                    return self.x + ", " + self.y;
                }
            }; // self

            return self;
        }, // Vector
        
        VectorArray: function(srcArray, copy) {
            var data = [];
            
            // copy the source array
            for (var ii = 0; ii < srcArray.length; ii++) {
                data.push(copy ? srcArray[ii].duplicate() : srcArray[ii]);
            } // for
            
            return {
                applyOffset: function(offset) {
                    for (var ii = 0; ii < data.length; ii++) {
                        data[ii].add(offset);
                    } // for
                },
                
                getRect: function() {
                    return new SLICK.Rect(
                        Math.min(data[0].x, data[1].x),
                        Math.min(data[0].y, data[1].y),
                        Math.abs(data[0].x - data[1].x),
                        Math.abs(data[0].y - data[1].y)
                    );
                },
                
                toString: function() {
                    var fnresult = "";
                    for (var ii = 0; ii < data.length; ii++) {
                        fnresult += "[" + data[ii].toString() + "] ";
                    } // for
                    
                    return fnresult;
                }
            };
        },
        
        VectorMath: (function() {
            function edges(vectors) {
                if ((! vectors) || (vectors.length <= 1)) {
                    throw new Error("Cannot determine edge distances for a vector array of only one vector");
                } // if
                
                var fnresult = {
                    edges: new Array(vectors.length - 1),
                    accrued: new Array(vectors.length - 1),
                    total: 0
                };
                
                // iterate through the vectors and calculate the edges
                for (var ii = 0; ii < vectors.length-1; ii++) {
                    var diff = vectors[ii].diff(vectors[ii + 1]);
                    
                    fnresult.edges[ii] = Math.sqrt((diff.x * diff.x) + (diff.y * diff.y));
                    fnresult.accrued[ii] = fnresult.total + fnresult.edges[ii];
                    fnresult.total += fnresult.edges[ii];
                } // for
                
                return fnresult;
            } // edges
            
            return {
                edges: edges,
                distance: function(vectors) {
                    return edges(vectors).total;
                },
                
                theta: function(v1, v2, distance) {
                    var theta = Math.asin((v1.y - v2.y) / distance);
                    return v1.x > v2.x ? theta : Math.PI -theta;
                },
                
                pointOnEdge: function(v1, v2, theta, delta) {
                    var xyDelta = new SLICK.Vector(Math.cos(theta) * delta, Math.sin(theta) * delta);
                    
                    return new SLICK.Vector(v1.x - xyDelta.x, v1.y - xyDelta.y);
                }
            };
        })(),
        
        /**
        @class
        */
        Dimensions: function(init_width, init_height) {
            // initialise variables

            // calculate the aspect ratio
            var init_aspect_ratio = init_height ? (init_width / init_height) : 1;

            // intiialise self
            var self = {
                /** lends SLICK.Dimensions */
                
                width: init_width,
                height: init_height,
                aspect_ratio: init_aspect_ratio,
                inv_aspect_ratio: 1 / init_aspect_ratio,

                duplicate: function() {
                    return new SLICK.Dimensions(self.width, self.height);
                },
                
                getAspectRatio: function() {
                    return self.height !== 0 ? self.width / self.height : 1;
                },

                getCenter: function() {
                    return new SLICK.Vector(self.width * 0.5, self.height * 0.5);
                },
                
                grow: function(widthDelta, heightDelta) {
                    return new SLICK.Dimensions(self.width + widthDelta, self.height + heightDelta);
                },
                
                matches: function(test) {
                    return test && (self.width == test.width) && (self.height == test.height);
                },
                
                toString: function() {
                    return self.width + " x " + self.height;
                }
            }; // self

            return self;
        }, // Dimensions
        
        /** @class */
        Rect: function(x, y, width, height) {
            // TODO: move dimensions access through setters and getters so half width can be calculated once and only when required
            
            var self = {
                /** @lends SLICK.Rect */
                
                origin: new SLICK.Vector(x, y),
                dimensions: new SLICK.Dimensions(width, height),
                
                duplicate: function() {
                    return new SLICK.Rect(self.origin.x, self.origin.y, self.dimensions.width, self.dimensions.height);
                },
                
                getCenter: function() {
                    return new SLICK.Vector(self.origin.x + (self.dimensions.width * 0.5), self.origin.y + (self.dimensions.height * 0.5));
                },
                
                getSize: function() {
                    return Math.sqrt(Math.pow(self.dimensions.width, 2) + Math.pow(self.dimensions.height, 2));
                },
                
                grow: function(new_width, new_height) {
                    var growFactor = new SLICK.Dimensions(new_width - self.dimensions.width, new_height - self.dimensions.height);
                    
                    self.dimensions.width = new_width;
                    self.dimensions.height = new_height;
                    
                    return growFactor;
                },
                
                expand: function(amountX, amountY) {
                    self.origin.x -= amountX;
                    self.origin.y -= amountY;
                    self.dimensions.width += amountX;
                    self.dimensions.height += amountY;
                },
                
                offset: function(offsetVector) {
                    return new module.Rect(
                                    self.origin.x + offsetVector.x, 
                                    self.origin.y + offsetVector.y,
                                    self.dimensions.width,
                                    self.dimensions.height);
                },
                
                /**
                The alignTo function is used to determine the 
                delta amounts required to adjust the rect to the specified target rect.  
                
                @returns a hash object containing the following parameters
                 - top: the delta change to adjust the top to the target rect,
                 - left: the delta change to adjust the left
                 - bottom: the delta bottom change
                 - right: the delta right change
                */
                getRequiredDelta: function(targetRect, offset) {
                    var delta = {
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0
                    }; // delta
                    
                    // calculate the top left delta
                    delta.top = targetRect.origin.y - self.origin.y + (offset ? offset.y : 0);
                    delta.left = targetRect.origin.x - self.origin.x + (offset ? offset.x : 0);
                    
                    // calculate the bottom right delta
                    delta.right = (targetRect.origin.x + targetRect.dimensions.width) - (self.origin.x + self.dimensions.width) - delta.left;
                    delta.bottom = (targetRect.origin.y + targetRect.dimensions.height) - (self.origin.y + self.dimensions.height) - delta.top;

                    return delta;
                },
                
                /**
                Apply a delta that was previously calculated using the getRequiredDelta function or one you determined
                yourself, given you are of course smart enough ;)
                
                @memberOf SLICK.Rect#
                @param {Object} delta the delta to apply in the form of a named hash (top, left, bottom, right)
                @param {Number} scalingFactor a scaling factor to apply to the delta transformation (optional)
                @param {Number} aspectRatio the aspect ratio to constrain the transformation by - if specified, the height will be automatically calculated (optional)
                */
                applyDelta: function(delta, scalingFactor, aspectRatio) {
                    // check the delta
                    if ((! delta) || (! GRUNT.contains(delta, ["top", "left", "bottom", "right"]))) {
                        throw new Error("Invalid delta - cannot apply to SLICK.Rect");
                    } // if
                    
                    // if the scaling factor is not assigned, then default to 1
                    if (! scalingFactor) {
                        scalingFactor = 1;
                    } // if
                    
                    // adjust the top left
                    self.origin.x += (delta.left * scalingFactor);
                    self.origin.y += (delta.top * scalingFactor);
                    
                    // adjust the width and height
                    self.dimensions.width += (delta.right * scalingFactor);
                    self.dimensions.height += (delta.bottom * scalingFactor);
                    
                    // if the aspect ratio is specified, then calculate the difference required to match the aspect ratio
                    // and apply a subsequent delta
                    if (aspectRatio) {
                        self.constrainAspectRatio(aspectRatio);
                    } // if
                },
                
                /**
                Calculate and apply a delta to keep the rect at the specified aspect ratio.  In all cases, the size 
                of the rect is increased to match the aspect ratio and not reduced.
                
                // TODO: update this function to keep the rect centered...
                */
                constrainAspectRatio: function(aspectRatio) {
                    // get the current aspect ratio
                    var adjustment = 0;
                    var currentAspect = self.dimensions.getAspectRatio();
                    var delta = {top: 0, left: 0, bottom: 0, right: 0};
                    
                    // if the current aspect ratio is less than the desired, then increase the width
                    if (currentAspect < aspectRatio) {
                        adjustment = Math.abs(self.dimensions.width - (self.dimensions.height * aspectRatio));
                        
                        // apply the adjustments
                        delta.left = -adjustment;
                        delta.right = adjustment;
                    }
                    // otherwise, increase the height
                    else {
                        adjustment = Math.abs(self.dimensions.height - (self.dimensions.width / aspectRatio));
                        
                        delta.top = -adjustment;
                        delta.bottom = adjustment;
                    } // if..else
                    
                    // apply the delta
                    self.applyDelta(delta);
                },
                
                moveTo: function(x, y) {
                    var offsetFactor = new SLICK.Vector(x - self.origin.x, y - self.origin.y);
                    
                    self.origin.x = x;
                    self.origin.y = y;
                    
                    return offsetFactor;
                },
                
                toString: function() {
                    return String.format("(origin: {0}, dimensions: {1})", self.origin, self.dimensions);
                }
            };
            
            return self;
        }
    };
    
    return module;
})();

