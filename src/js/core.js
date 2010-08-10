/**
@namespace 

The top level SLICK namespace.  This module contains core types and functionality for implementing 
*/
SLICK = (function () {
    var deviceConfigs = null,
        deviceCheckOrder = [],
        detectedConfig = null;
    
    function loadDeviceConfigs() {
        deviceConfigs = {
            base: {
                name: "Unknown",
                eventTarget: document,
                supportsTouch: "createTouch" in document,
                // TODO: remove this (it's just for testing)
                imageCacheMaxSize: 4 * 1024,
                getScaling: function() {
                    return 1;
                },
                // TODO: reset this back to null after testing
                maxImageLoads: 4
            },

            iphone: {
                name: "iPhone",
                regex: /iphone/i,
                imageCacheMaxSize: 6 * 1024,
                maxImageLoads: 4
            },

            ipad: {
                name: "iPad",
                regex: /ipad/i,
                imageCacheMaxSize: 6 * 1024
            },

            android: {
                name: "Android OS <= 2.1",
                regex: /android/i,
                eventTarget: document.body,
                supportsTouch: true,
                getScaling: function() {
                    // TODO: need to detect what device dpi we have instructed the browser to use in the viewport tag
                    return 1 / window.devicePixelRatio;
                }
            },
            
            froyo: {
                name: "Android OS >= 2.2",
                regex: /froyo/i,
                eventTarget: document.body,
                supportsTouch: true
            }
        };
        
        // initilaise the order in which we will check configurations
        deviceCheckOrder = [
            deviceConfigs.iphone,
            deviceConfigs.froyo,
            deviceConfigs.android,
            deviceConfigs.ipad
        ];
    } // loadDeviceConfigs
    
    var module = {
        /** @lends SLICK */
        
        getDeviceConfig: function() {
            if (! deviceConfigs) {
                loadDeviceConfigs();
            } // if
            
            // if the device configuration hasn't already been detected do that now
            if (! detectedConfig) {
                GRUNT.Log.info("ATTEMPTING TO DETECT PLATFORM: UserAgent = " + navigator.userAgent);

                // iterate through the platforms and run detection on the platform
                for (var ii = 0; ii < deviceCheckOrder.length; ii++) {
                    var testPlatform = deviceCheckOrder[ii];

                    if (testPlatform.regex && testPlatform.regex.test(navigator.userAgent)) {
                        detectedConfig = GRUNT.extend({}, deviceConfigs.base, testPlatform);
                        GRUNT.Log.info("PLATFORM DETECTED AS: " + detectedConfig.name);
                        break;
                    } // if
                } // for

                if (! detectedConfig) {
                    GRUNT.Log.warn("UNABLE TO DETECT PLATFORM, REVERTING TO BASE CONFIGURATION");
                    detectedConfig = deviceConfigs.base;
                }
                
                GRUNT.Log.info("CURRENT DEVICE PIXEL RATIO = " + window.devicePixelRatio);
            } // if
            
            return detectedConfig;
        },
        
        copyRect: function(src) {
            return src ? new module.Rect(src.origin.x, src.origin.y, src.dimensions.width, src.dimensions.height) : null;
        },

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
        Vector: function(initX, initY) {
            return {
                x: initX ? initX : 0,
                y: initY ? initY : 0
            };
        }, // Vector
        
        V: (function() {
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
                    return new SLICK.Vector(-vector.x, -vector.y);
                },
                
                offset: function(vector, offsetX, offsetY) {
                    return new SLICK.Vector(vector.x + offsetX, vector.y + (offsetY ? offsetY : offsetX));
                }
            };
        })(),
        
        VectorArray: function(srcArray, copy) {
            var data = new Array(srcArray.length);
            
            // copy the source array
            for (var ii = srcArray.length; ii--; ) {
                data[ii] = copy ? module.V.copy(srcArray[ii]) : srcArray[ii];
            } // for
            
            return {
                applyOffset: function(offset) {
                    for (var ii = data.length; ii--; ) {
                        data[ii].x += offset.x;
                        data[ii].y += offset.y;
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
                    for (var ii = data.length; ii--; ) {
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
                
                var diffFn = SLICK.V.diff;
                
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

                getAspectRatio: function() {
                    return self.height !== 0 ? self.width / self.height : 1;
                },

                getCenter: function() {
                    return new SLICK.Vector(self.width >> 1, self.height >> 1);
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
                
                getCenter: function() {
                    return new SLICK.Vector(self.origin.x + (self.dimensions.width >> 1), self.origin.y + (self.dimensions.height >> 1));
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

