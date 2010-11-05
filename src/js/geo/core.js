/**
# MODULE: Geo

The Geo module contains classes and functionality to support geospatial 
operations and calculations that are required when drawing maps, routes, etc.

## Functions
*/
T5.Geo = (function() {
    // define constants
    var LAT_VARIABILITIES = [
        1.406245461070741,
        1.321415085624082,
        1.077179995861952,
        0.703119412486786,
        0.488332580888611
    ];
    
    // define some constants
    var M_PER_KM = 1000,
        KM_PER_RAD = 6371,
        DEGREES_TO_RADIANS = Math.PI / 180,
        RADIANS_TO_DEGREES = 180 / Math.PI,
        HALF_PI = Math.PI / 2,
        TWO_PI = Math.PI * 2,
        ECC = 0.08181919084262157,
        PHI_EPSILON = 1E-7,
        PHI_MAXITER = 12;
    
    var ROADTYPE_REGEX = null,
        // TODO: I think these need to move to the provider level..
        ROADTYPE_REPLACEMENTS = {
            RD: "ROAD",
            ST: "STREET",
            CR: "CRESCENT",
            CRES: "CRESCENT",
            CT: "COURT",
            LN: "LANE",
            HWY: "HIGHWAY",
            MWY: "MOTORWAY"
        },
        DEFAULT_GENERALIZATION_DISTANCE = 250;
    
    /* define some module constants */
    
    var moduleConstants = {
        VECTORIZE_PER_CYCLE: 500
    };
    
    /* define the exported functions */
        
    var exportedFunctions = {
        /**
        - `getEngine(requiredCapability)`

        Returns the engine that provides the required functionality.  If preferred engines are supplied
        as additional arguments, then those are looked for first
        */
        getEngine: function(requiredCapability) {
            // initialise variables
            var fnresult = null;

            // iterate through the arguments beyond the capabililty for the preferred engine
            for (var ii = 1; (! fnresult) && (ii < arguments.length); ii++) {
                fnresult = findEngine(requiredCapability, arguments[ii]);
            } // for

            // if we found an engine using preferences, return that otherwise return an alternative
            fnresult = fnresult ? fnresult : findEngine(requiredCapability);

            // if no engine was found, then throw an exception
            if (! fnresult) {
                throw new Error("Unable to find GEO engine with " + requiredCapability + " capability");
            }

            return fnresult;
        },

        /**
        - `rankGeocodeResponses(requestAddress, responseAddress, engine)`
        
        TODO
        */
        rankGeocodeResponses: function(requestAddress, responseAddresses, engine) {
            var matches = [],
                compareFns = module.AddressCompareFns;

            // if the engine is specified and the engine has compare fns, then extend them
            if (engine && engine.compareFns) {
                compareFns = T5.ex({}, compareFns, engine.compareFns);
            } // if

            // iterate through the response addresses and compare against the request address
            for (var ii = 0; ii < responseAddresses.length; ii++) {
                matches.push(new module.GeoSearchResult({
                    caption: addrTools.toString(responseAddresses[ii]),
                    data: responseAddresses[ii],
                    pos: responseAddresses[ii].pos,
                    matchWeight: plainTextAddressMatch(requestAddress, responseAddresses[ii], compareFns, module.GeocodeFieldWeights)
                }));
            } // for

            // TODO: sort the matches
            matches.sort(function(itemA, itemB) {
                return itemB.matchWeight - itemA.matchWeight;
            });

            return matches;
        },
        
        /**
        - `distanceToString(distance)`
        
        This function simply formats a distance value (in meters) into a human readable string.
        
        ### TODO
        - Add internationalization and other formatting support to this function
        */
        distanceToString: function(distance) {
            if (distance > 1000) {
                return (~~(distance / 10) / 100) + " km";
            } // if
            
            return distance ? distance + " m" : '';
        },

        /**
        - `dist2rad(distance)`
        
        TODO
        */
        dist2rad: function(distance) {
            return distance / KM_PER_RAD;
        },

        /**
        - `lat2pix(lat)`
        
        TODO
        */
        lat2pix: function(lat) {
            var radLat = parseFloat(lat) * DEGREES_TO_RADIANS; // *(2*Math.PI))/360;
            var sinPhi = Math.sin(radLat);
            var eSinPhi = ECC * sinPhi;
            var retVal = Math.log(((1.0 + sinPhi) / (1.0 - sinPhi)) * Math.pow((1.0 - eSinPhi) / (1.0 + eSinPhi), ECC)) / 2.0;

            return retVal;
        },

        /**
        - `lon2pix(lon)`
        
        TODO
        */
        lon2pix: function(lon) {
            return parseFloat(lon) * DEGREES_TO_RADIANS; // /180)*Math.PI;
        },

        /**
        - `pix2lon(mercX)`
        
        TODO
        */
        pix2lon: function(mercX) {
            return module.normalizeLon(mercX) * RADIANS_TO_DEGREES;
        },

        /**
        - `pix2lat`
        
        TODO
        */
        pix2lat: function(mercY) {
            var t = Math.pow(Math.E, -mercY),
                prevPhi = mercatorUnproject(t),
                newPhi = findRadPhi(prevPhi, t),
                iterCount = 0;

            while (iterCount < PHI_MAXITER && Math.abs(prevPhi - newPhi) > PHI_EPSILON) {
                prevPhi = newPhi;
                newPhi = findRadPhi(prevPhi, t);
                iterCount++;
            } // while

            return newPhi * RADIANS_TO_DEGREES;
        },

        /**
        - `normalizeLon(lon)`
        
        TODO
        */
        normalizeLon: function (lon) {
            // return lon;
            while (lon < -180) {
                lon += 360;
            } // while

            while (lon > 180) {
                lon -= 360;
            } // while

            return lon;
        }
    }; // exportedFunctions
        
    /* define the geo simple types */
    
    var Radius = function(init_dist, init_uom) {
        return {
            distance: parseInt(init_dist, 10),
            uom: init_uom
        }; 
    }; // Radius
    
    /**
    # Geo.Position
    
    The position class is simply a data-storage class that is used to store 
    a latitude and longitude pair.  While this class used to contain methods 
    to support manipulation on these objects, these have been moved to the 
    Geo.P submodule for performance optimization reasons.

    ## Properties

    - lat
    The latitude of the position

    - lon
    The longitude of the position

    ## Usage

    Creating a new position object can be done by either specifically creating 
    a new Position object, by specifying the lat and lon as arguments:

    <pre>
    var pos = new T5.Geo.Position(-27.468, 153.028);
    </pre>

    Alternative, the T5.Geo.P submodule can be used to parse a 
    latitude / longitude pair from a string value

    <pre>
    var pos = T5.Geo.P.parse("-27.468 153.028");
    </pre>

    The parse function supports both space-separated, and comma-separated syntaxes.    
    */
    var Position = function(initLat, initLon) {
        // initialise self
        return {
            lat: parseFloat(initLat ? initLat : 0),
            lon: parseFloat(initLon ? initLon : 0)
        };
    }; // Position
    
    /**
    # Geo.BoundingBox

    The BoundingBox class is used to store the min and max Geo.Position 
    that represents a bounding box.  For support functions for manipulating 
    a bounding box, see the Geo.B submodule.
    
    ## Properties

    - min
    The T5.Geo.Position object representing the minimum of the bounding box.  
    The minimum position of the bounding box is the south-western (or 
    bottom-left) corner of the bounding box.

    - max
    The T5.Geo.Position object representing the maximum position of the bounding 
    box.  The maximum position is the north-eastern (or top-right) corner of 
    the bounding box.

    ## Usage

    Creating a new Geo.BoundingBox is done by specifying either 
    a Geo.Position objects or parsable strings to the constructor:

    Created position objects example:
    
    <pre>
    var minPos = T5.Geo.P.parse("-27.587 152.876"),
        maxPos = T5.Geo.P.parse("-27.468 153.028"),
        bounds = new T5.Geo.BoundingBox(minPos, maxPos);
    </pre>

    Creating from latlon string pairs example (constructor arguments 
    automatically passed through the T5.Geo.P.parse function):

    <pre>
    var bounds = new T5.Geo.BoundingBox("-27.587 152.876", "-27.468 153.028");
    </pre>
    */
    var BoundingBox = function(initMin, initMax) {
        return {
            min: posTools.parse(initMin),
            max: posTools.parse(initMax)
        };
    }; // BoundingBox

    /**
    # Geo.Address
    
    TODO
    */
    var Address = function(params) {
        params = T5.ex({
            streetDetails: "",
            location: "",
            country: "",
            postalCode: "",
            pos: null,
            boundingBox: null
        }, params);
        
        return params;
    }; // Address
    
    /**
    # Geo.P

    The Geo.P submodule is used to perform operations on Geo.Position objects rather 
    than have those operations bundled with the object.
    
    ## Functions
    */
    var posTools = (function() {
        var DEFAULT_VECTORIZE_CHUNK_SIZE = 100;
        
        var subModule = {
            /**
            - `calcDistance(pos1, pos2)`

            Calculate the distance between two Geo.Position objects, pos1 and pos2.  The 
            distance returned is measured in kilometers.
            */
            calcDistance: function(pos1, pos2) {
                if (subModule.empty(pos1) || subModule.empty(pos2)) {
                    return 0;
                } // if
                
                var halfdelta_lat = toRad(pos2.lat - pos1.lat) / 2;
                var halfdelta_lon = toRad(pos2.lon - pos1.lon) / 2;

                // TODO: find out what a stands for, I don't like single char variables in code (same goes for c)
                var a = (Math.sin(halfdelta_lat) * Math.sin(halfdelta_lat)) + 
                        (Math.cos(toRad(pos1.lat)) * Math.cos(toRad(pos2.lat))) * 
                        (Math.sin(halfdelta_lon) * Math.sin(halfdelta_lon));

                // calculate c (whatever c is)
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                // calculate the distance
                return KM_PER_RAD * c;
            },
            
            /**
            - `copy(src)`

            Create a copy of the specified T5.Geo.Position object.
            */
            copy: function(src) {
                return src ? new Position(src.lat, src.lon) : null;
            },

            /**
            - `empty(pos)`

            Returns true if the T5.Geo.Position object is empty, false if not.
            */
            empty: function(pos) {
                return (! pos) || ((pos.lat === 0) && (pos.lon === 0));
            },
            
            /**
            - `equal(pos1, pos2)`

            Compares to T5.Geo.Position objects and returns true if they 
            have the same latitude and longitude values
            */
            equal: function(pos1, pos2) {
                return pos1 && pos2 && (pos1.lat == pos2.lat) && (pos1.lon == pos2.lon);
            },
            
            /**
            - `inArray(pos, testArray)`

            Checks to see whether the specified T5.Geo.Position is contained within 
            the array of position objects passed in the testArray.
            */
            inArray: function(pos, testArray) {
                var arrayLen = testArray.length,
                    testFn = posTools.equal;
                    
                for (var ii = arrayLen; ii--; ) {
                    if (testFn(pos, testArray[ii])) {
                        return true;
                    } // if
                } // for
                
                return false;
            },
            
            /**
            - `inBounds(pos, bounds)`

            Returns true if the specified Geo.Position object is within the 
            Geo.BoundingBox specified by the bounds argument.
            */
            inBounds: function(pos, bounds) {
                // initialise variables
                var fnresult = ! (posTools.empty(pos) || posTools.empty(bounds));

                // check the pos latitude
                fnresult = fnresult && (pos.lat >= bounds.min.lat) && (pos.lat <= bounds.max.lat);

                // check the pos longitude
                fnresult = fnresult && (pos.lon >= bounds.min.lon) && (pos.lon <= bounds.max.lon);

                return fnresult;
            },
            
            /**
            - `parse(object)`

            This function is used to take a latitude and longitude String 
            pair (either space or comma delimited) and return a new Geo.Position 
            value.  The function is also tolerant of being passed an existing 
            Geo.Position object as the object argument, and in these cases 
            returns a copy of the position.
            */
            parse: function(pos) {
                // first case, null value, create a new empty position
                if (! pos) {
                    return new Position();
                }
                else if (typeof(pos.lat) !== 'undefined') {
                    return subModule.copy(pos);
                }
                // now attempt the various different types of splits
                else if (pos.split) {
                    var sepChars = [' ', ','];
                    for (var ii = 0; ii < sepChars.length; ii++) {
                        var coords = pos.split(sepChars[ii]);
                        if (coords.length === 2) {
                            return new Position(coords[0], coords[1]);
                        } // if
                    } // for
                } // if..else

                return null;
            },

            /**
            - `parseArray(sourceData)`

            Fust like parse, but with lots of em'
            */
            parseArray: function(sourceData) {
                var sourceLen = sourceData.length,
                    positions = new Array(sourceLen);

                for (var ii = sourceLen; ii--; ) {
                    positions[ii] = subModule.parse(sourceData[ii]);
                } // for

                // COG.Log.info("parsed " + positions.length + " positions");
                return positions;
            },
            
            /**
            - `fromMercatorPixels(x, y, radsPerPixel)`

            This function is used to take x and y mercator pixels values, 
            and using the value passed in the radsPerPixel value convert 
            that to a Geo.Position object.
            */
            fromMercatorPixels: function(mercX, mercY) {
                // return the new position
                return new Position(
                    T5.Geo.pix2lat(mercY),
                    T5.Geo.normalizeLon(T5.Geo.pix2lon(mercX))
                );
            },

            /**
            - `toMercatorPixels(pos, radsPerPixel)`

            Basically, the reverse of the fromMercatorPixels function - 
            pass it a Geo.Position object and get a Vector object back 
            with x and y mercator pixel values back.
            */
            toMercatorPixels: function(pos) {
                return new T5.Vector(T5.Geo.lon2pix(pos.lon), T5.Geo.lat2pix(pos.lat));
            },
            
            /**
            - `generalize(sourceData, requiredPositions, minDist)`
            
            TODO
            */
            generalize: function(sourceData, requiredPositions, minDist) {
                var sourceLen = sourceData.length,
                    positions = [],
                    lastPosition = null;

                if (! minDist) {
                    minDist = DEFAULT_GENERALIZATION_DISTANCE;
                } // if

                // convert min distance to km
                minDist = minDist / 1000;

                COG.Log.info("generalizing positions, must include " + requiredPositions.length + " positions");

                // iterate thorugh the source data and add positions the differ by the required amount to 
                // the result positions
                for (var ii = sourceLen; ii--; ) {
                    if (ii === 0) {
                        positions.unshift(sourceData[ii]);
                    }
                    else {
                        var include = (! lastPosition) || posTools.inArray(sourceData[ii], requiredPositions),
                            posDiff = include ? minDist : posTools.calcDistance(lastPosition, sourceData[ii]);

                        // if the position difference is suitable then include
                        if (sourceData[ii] && (posDiff >= minDist)) {
                            positions.unshift(sourceData[ii]);

                            // update the last position
                            lastPosition = sourceData[ii];
                        } // if
                    } // if..else
                } // for

                COG.Log.info("generalized " + sourceLen + " positions into " + positions.length + " positions");
                return positions;
            },
            
            vectorize: function(positions, options) {
                var posIndex = positions.length,
                    vectors = new Array(posIndex);
                    
                // initialise options
                options = T5.ex({
                    chunkSize: moduleConstants.VECTORIZE_PER_CYCLE,
                    async: true
                }, options);
                
                // if we are not processing async, then do it right now
                if (! options.async) {
                    for (var ii = posIndex; ii--; ) {
                        vectors[ii] = new T5.Geo.GeoVector(positions[ii]);
                    } // for
                    
                    return vectors;
                } // if
                
                // create a new loopage worker to manage the conversion 
                // as there could be a lot of positions...
                return COG.Loopage.join({
                    frequency: 10,
                    execute: function(tickCount, worker) {
                        // initialise variables
                        var chunkCounter = 0,
                            chunkSize = options.chunkSize,
                            ii = posIndex;
                        
                        // process from the last position index
                        for (; ii--;) {
                            vectors[ii] = new T5.Geo.GeoVector(positions[ii]);
                            
                            // increase the chunk counter
                            chunkCounter += 1;
                            
                            // if we have hit the chunk size, then break
                            if (chunkCounter > chunkSize) {
                                break;
                            } // if
                        } // for
                        
                        posIndex = ii;
                        if (posIndex <= 0) {
                            worker.trigger('complete', vectors);
                        } // if
                    }
                });
            },

            /**
            - `toString(pos)`
            
            Return a string representation of the Geo.Position object
            */
            toString: function(pos) {
                return pos ? pos.lat + " " + pos.lon : "";
            }
        };
        
        return subModule;
    })();
    
    
    /**
    # Geo.B
    
    A collection of utilities that are primarily designed to help with working 
    with Geo.BoundingBox objects.  The functions are implemented here rather 
    than with the actual object itself to ensure that the object remains lightweight.
    
    ## Functions
    */
    var boundsTools = (function() {
        var MIN_LAT = -HALF_PI,
            MAX_LAT = HALF_PI,
            MIN_LON = -TWO_PI,
            MAX_LON = TWO_PI;
        
        var subModule = {
            /**
            - `calcSize(min, max, normalize)`

            The calcSize function is used to determine the size of a Geo.BoundingBox given 
            a minimum position (relates to the bottom-left / south-western corner) and 
            maximum position (top-right / north-eastern corner) of the bounding box.  
            The 3rd parameter specifies whether the size calculations should normalize the 
            calculation in cases where the bounding box crosses the 360 degree boundary.
            */
            calcSize: function(min, max, normalize) {
                var size = new T5.Vector(0, max.lat - min.lat);
                if (typeof normalize === 'undefined') {
                    normalize = true;
                } // if

                if (normalize && (min.lon > max.lon)) {
                    size.x = 360 - min.lon + max.lon;
                }
                else {
                    size.x = max.lon - min.lon;
                } // if..else

                return size;
            },

            /**
            - `createBoundsFromCenter(centerPos, distance)`

            This function is very useful for creating a Geo.BoundingBox given a 
            center position and a radial distance (specified in KM) from the center 
            position.  Basically, imagine a circle is drawn around the center 
            position with a radius of distance from the center position, and then 
            a box is drawn to surround that circle.  Adapted from the [functions written 
            in Java by Jan Philip Matuschek](http://janmatuschek.de/LatitudeLongitudeBoundingCoordinates)
            */
            createBoundsFromCenter: function(centerPos, distance) {
                var radDist = distance / KM_PER_RAD,
                    radLat = centerPos.lat * DEGREES_TO_RADIANS,
                    radLon = centerPos.lon * DEGREES_TO_RADIANS,
                    minLat = radLat - radDist,
                    maxLat = radLat + radDist,
                    minLon, maxLon;
                    
                // COG.Log.info("rad distance = " + radDist);
                // COG.Log.info("rad lat = " + radLat + ", lon = " + radLon);
                // COG.Log.info("min lat = " + minLat + ", max lat = " + maxLat);
                    
                if ((minLat > MIN_LAT) && (maxLat < MAX_LAT)) {
                    var deltaLon = Math.asin(Math.sin(radDist) / Math.cos(radLat));
                    
                    // determine the min longitude
                    minLon = radLon - deltaLon;
                    if (minLon < MIN_LON) {
                        minLon += 2 * Math.PI;
                    } // if
                    
                    // determine the max longitude
                    maxLon = radLon + deltaLon;
                    if (maxLon > MAX_LON) {
                        maxLon -= 2 * Math.PI;
                    } // if
                }
                else {
                    minLat = Math.max(minLat, MIN_LAT);
                    maxLat = Math.min(maxLat, MAX_LAT);
                    minLon = MIN_LON;
                    maxLon = MAX_LON;
                } // if..else
                
                return new BoundingBox(
                    new Position(minLat * RADIANS_TO_DEGREES, minLon * RADIANS_TO_DEGREES), 
                    new Position(maxLat * RADIANS_TO_DEGREES, maxLon * RADIANS_TO_DEGREES));
            },
            
            /**
            - `expand(bounds, amount)`

            A simple function that is used to expand a Geo.BoundingBox 
            by the specified amount (in degrees).
            */
            expand: function(bounds, amount) {
                return new BoundingBox(
                    new Position(bounds.min.lat - amount, bounds.min.lon - module.normalizeLon(amount)),
                    new Position(bounds.max.lat + amount, bounds.max.lon + module.normalizeLon(amount)));
            },
            
            /**
            - `forPositions(positions, padding)`

            This function is very useful when you need to create a 
            Geo.BoundingBox to contain an array of T5.Geo.Position.  
            The optional second parameter allows you to specify an amount of 
            padding (in degrees) to apply to the bounding box that is created.
            */
            forPositions: function(positions, padding) {
                var bounds = null,
                    startTicks = Date.now();

                // if padding is not specified, then set to auto
                if (! padding) {
                    padding = "auto";
                } // if

                for (var ii = positions.length; ii--; ) {
                    if (! bounds) {
                        bounds = new T5.Geo.BoundingBox(positions[ii], positions[ii]);
                    }
                    else {
                        var minDiff = subModule.calcSize(bounds.min, positions[ii], false),
                            maxDiff = subModule.calcSize(positions[ii], bounds.max, false);

                        if (minDiff.x < 0) { bounds.min.lon = positions[ii].lon; }
                        if (minDiff.y < 0) { bounds.min.lat = positions[ii].lat; }
                        if (maxDiff.x < 0) { bounds.max.lon = positions[ii].lon; }
                        if (maxDiff.y < 0) { bounds.max.lat = positions[ii].lat; }
                    } // if..else
                } // for

                // expand the bounds to give us some padding
                if (padding) {
                    if (padding == "auto") {
                        var size = subModule.calcSize(bounds.min, bounds.max);

                        // update padding to be a third of the max size
                        padding = Math.max(size.x, size.y) * 0.3;
                    } // if

                    bounds = subModule.expand(bounds, padding);
                } // if

                COG.Log.trace("calculated bounds for " + positions.length + " positions", startTicks);
                return bounds;
            },
            
            /**
            - `getCenter(bounds)`

            Returns a Geo.Position for the center position of the bounding box.
            */
            getCenter: function(bounds) {
                // calculate the bounds size
                var size = boundsTools.calcSize(bounds.min, bounds.max);
                
                // create a new position offset from the current min
                return new T5.Geo.Position(bounds.min.lat + (size.y / 2), bounds.min.lon + (size.x / 2));
            },
            
            /**
            - `getGeohash(bounds)`
            
            TODO
            */
            getGeoHash: function(bounds) {
                var minHash = T5.Geo.GeoHash.encode(bounds.min.lat, bounds.min.lon),
                    maxHash = T5.Geo.GeoHash.encode(bounds.max.lat, bounds.max.lon);
                    
                COG.Log.info("min hash = " + minHash + ", max hash = " + maxHash);
            },

            /** 
            - `getZoomLevel(bounds, displaySize)`

            This function is used to return the zoom level (seems consistent across 
            mapping providers at this stage) that is required to properly display 
            the specified T5.Geo.BoundingBox given the screen dimensions (specified as 
            a Dimensions object) of the map display.
            
            Adapted from the following code:
            [http://groups.google.com/group/google-maps-js-api-v3/browse_thread/thread/43958790eafe037f/66e889029c555bee]
            */
            getZoomLevel: function(bounds, displaySize) {
                // get the constant index for the center of the bounds
                var boundsCenter = subModule.getCenter(bounds),
                    maxZoom = 1000,
                    variabilityIndex = Math.min(Math.round(Math.abs(boundsCenter.lat) * 0.05), LAT_VARIABILITIES.length),
                    variability = LAT_VARIABILITIES[variabilityIndex],
                    delta = subModule.calcSize(bounds.min, bounds.max),
                    // interestingly, the original article had the variability included, when in actual reality it isn't, 
                    // however a constant value is required. must find out exactly what it is.  At present, though this
                    // works fine.
                    bestZoomH = Math.ceil(Math.log(LAT_VARIABILITIES[3] * displaySize.height / delta.y) / Math.log(2)),
                    bestZoomW = Math.ceil(Math.log(variability * displaySize.width / delta.x) / Math.log(2));

                // COG.Log.info("constant index for bbox: " + bounds + " (center = " + boundsCenter + ") is " + variabilityIndex);
                // COG.Log.info("distances  = " + delta);
                // COG.Log.info("optimal zoom levels: height = " + bestZoomH + ", width = " + bestZoomW);

                // return the lower of the two zoom levels
                return Math.min(isNaN(bestZoomH) ? maxZoom : bestZoomH, isNaN(bestZoomW) ? maxZoom : bestZoomW);
            },

            /**
            - `isEmpty(bounds)`

            Returns true if the specified Geo.BoundingBox is empty.
            */
            isEmpty: function(bounds) {
                return (! bounds) || posTools.empty(bounds.min) || posTools.empty(bounds.max);
            },
            
            /**
            - `toString(bounds)`

            Returns a string representation of a Geo.BoundingBox
            */
            toString: function(bounds) {
                return "min: " + posTools.toString(bounds.min) + ", max: " + posTools.toString(bounds.max);
            }
        };
        
        return subModule;
    })();
    
    /* define the address tools */
    
    /**
    # Geo.A
    
    A collection of utilities for working with Geo.Address objects
    
    ## Functions
    */
    var addrTools = (function() {
        var REGEX_BUILDINGNO = /^(\d+).*$/,
            REGEX_NUMBERRANGE = /(\d+)\s?\-\s?(\d+)/;
        
        var subModule = {
            /**
            - `buildingMatch(freeForm, numberRange, name)`
            
            TODO
            */
            buildingMatch: function(freeform, numberRange, name) {
                // from the freeform address extract the building number
                REGEX_BUILDINGNO.lastIndex = -1;
                if (REGEX_BUILDINGNO.test(freeform)) {
                    var buildingNo = freeform.replace(REGEX_BUILDINGNO, "$1");

                    // split up the number range
                    var numberRanges = numberRange.split(",");
                    for (var ii = 0; ii < numberRanges.length; ii++) {
                        REGEX_NUMBERRANGE.lastIndex = -1;
                        if (REGEX_NUMBERRANGE.test(numberRanges[ii])) {
                            var matches = REGEX_NUMBERRANGE.exec(numberRanges[ii]);
                            if ((buildingNo >= parseInt(matches[1], 10)) && (buildingNo <= parseInt(matches[2], 10))) {
                                return true;
                            } // if
                        }
                        else if (buildingNo == numberRanges[ii]) {
                            return true;
                        } // if..else
                    } // for
                } // if

                return false;
            },
            
            /**
            - `normalize(addressText)`
            
            Used to take an address that could be in a variety of formats
            and normalize as many details as possible.  Text is uppercased, road types are replaced, etc.
            */
            normalize: function(addressText) {
                if (! addressText) { return ""; }

                addressText = addressText.toUpperCase();

                // if the road type regular expression has not been initialised, then do that now
                if (! ROADTYPE_REGEX) {
                    var abbreviations = [];
                    for (var roadTypes in ROADTYPE_REPLACEMENTS) {
                        abbreviations.push(roadTypes);
                    } // for

                    ROADTYPE_REGEX = new RegExp("(\\s)(" + abbreviations.join("|") + ")(\\s|$)", "i");
                } // if

                // run the road type normalizations
                ROADTYPE_REGEX.lastIndex = -1;

                // get the matches for the regex
                var matches = ROADTYPE_REGEX.exec(addressText);
                if (matches) {
                    // get the replacement road type
                    var normalizedRoadType = ROADTYPE_REPLACEMENTS[matches[2]];
                    addressText = addressText.replace(ROADTYPE_REGEX, "$1" + normalizedRoadType);
                } // if

                return addressText;
            },
            
            /**
            - `toString(address)`
            
            Returns a string representation of the Geo.Address object
            */
            toString: function(address) {
                return address.streetDetails + " " + address.location;
            }
        };
        
        return subModule;
    })(); // addrTools

    /* define the distance tools */
    
    // define the engines array
    var engines = {};
    
    /* private internal functions */
    
    function findEngine(capability, preference) {
        var matchingEngine = null;
        
        // iterate through the registered engines
        for (var engineId in engines) {
            if (preference) {
                if ((engineId == preference) && engines[engineId][capability]) {
                    matchingEngine = engines[engineId];
                    break;
                } // if
            }
            else if (engines[engineId][capability]) {
                matchingEngine = engines[engineId];
                break;
            } // if..else
        } // for

        return matchingEngine;
    } // findEngine
    
    function findRadPhi(phi, t) {
        var eSinPhi = ECC * Math.sin(phi);

        return HALF_PI - (2 * Math.atan (t * Math.pow((1 - eSinPhi) / (1 + eSinPhi), ECC / 2)));
    } // findRadPhi
    
    function mercatorUnproject(t) {
        return HALF_PI - 2 * Math.atan(t);
    } // mercatorUnproject
    
    /**
    This function is used to determine the match weight between a freeform geocoding
    request and it's structured response.
    */
    function plainTextAddressMatch(request, response, compareFns, fieldWeights) {
        var matchWeight = 0;
        
        // uppercase the request for comparisons
        request = request.toUpperCase();
        
        // COG.Log.info("CALCULATING MATCH WEIGHT FOR [" + request + "] = [" + response + "]");
        
        // iterate through the field weights
        for (var fieldId in fieldWeights) {
            // get the field value
            var fieldVal = response[fieldId];

            // if we have the field value, and it exists in the request address, then add the weight
            if (fieldVal) {
                // get the field comparison function
                var compareFn = compareFns[fieldId],
                    matchStrength = compareFn ? compareFn(request, fieldVal) : (COG.wordExists(request, fieldVal) ? 1 : 0);

                // increment the match weight
                matchWeight += (matchStrength * fieldWeights[fieldId]);
            } // if
        } // for
        
        return matchWeight;
    } // plainTextAddressMatch
    
    function toRad(value) {
        return value * DEGREES_TO_RADIANS;
    } // toRad
    
    /* public functions */
    
    // define the module
    var module = {
        /* position, bounds and address utility modules */

        P: posTools,
        B: boundsTools,
        A: addrTools,

        /* geo type definitions */
        
        Radius: Radius,
        Position: Position,
        BoundingBox: BoundingBox,
        
        GeoVector: function(initPos) {
            var self = new T5.Vector();
                
            function updatePos(newPos) {
                // update the internal variables
                self.pos = newPos;
                self.mercXY = posTools.toMercatorPixels(newPos);
            } // updatePos
            
            T5.ex(self, {
                radsPerPixel: null,
                
                setRadsPerPixel: function(radsPerPixel, offsetX, offsetY) {
                    var mercXY = self.mercXY;

                    // calculate the x and y
                    self.x = Math.abs(
                        ((mercXY.x / radsPerPixel) >> 0) + 
                        (offsetX ? offsetX : 0));
                        
                    self.y = Math.abs(
                        ((mercXY.y / radsPerPixel) >> 0) + 
                        (offsetY ? offsetY : 0));

                    // update the rads per pixel
                    self.radsPerPixel = radsPerPixel;
                }
            });
            
            // initialise the position
            updatePos(initPos);
            return self;
        },
        
        /* addressing and geocoding support */
        
        // TODO: probably need to include local support for addressing, but really don't want to bulk out T5 :/
        
        Address: Address,
        GeocodeFieldWeights: {
            streetDetails: 50,
            location: 50
        },
        
        AddressCompareFns: {
        },
        
        /**
        # Geo.Engine

        TODO
        */
        Engine: function(params) {
            // if the id for the engine is not specified, throw an exception
            if (! params.id) {
                throw new Error("A GEO.Engine cannot be registered without providing an id.");
            } // if

            // map the parameters directly to self
            var self = T5.ex({
                remove: function() {
                    delete engines[self.id];
                }
            }, params);

            // register the engine
            engines[self.id] = self;

            return self;
        },
        
        /**
        # Geo.GeoSearchResult
        
        TODO
        */
        GeoSearchResult: function(params) {
            params = T5.ex({
                id: null,
                caption: "",
                resultType: "",
                data: null,
                pos: null,
                matchWeight: 0
            }, params);
            
            return T5.ex(params, {
                toString: function() {
                    return params.caption + (params.matchWeight ? " (" + params.matchWeight + ")" : "");
                }
            });
        },
        
        /**
        # Geo.GeoSearchAgent
        
        TODO
        */
        GeoSearchAgent: function(params) {
            return new T5.Dispatcher.Agent(params);
        },
        
        /**
        # Geo.GeocodingAgent
        
        TODO
        */
        GeocodingAgent: function(params) {
            
            function rankResults(searchParams, results) {
                // if freeform parameters then rank
                if (searchParams.freeform) {
                    results = module.rankGeocodeResponses(searchParams.freeform, results, module.getEngine("geocode"));
                } // if
                // TODO: rank structured results
                else {
                    
                }

                return results;
            } // rankResults
            
            // extend parameters with defaults
            params = T5.ex({
                name: "Geocoding Search Agent",
                paramTranslator: null,
                execute: function(searchParams, callback) {
                    try {
                        // check for a freeform request
                        if ((! searchParams.reverse) && (! searchParams.freeform)) {
                            address = new Address(searchParams);
                        } // if
                        
                        // get the geocoding engine
                        var engine = module.getEngine("geocode");
                        if (engine) {
                            engine.geocode({
                                addresses: [searchParams.freeform ? searchParams.freeform : address],
                                complete: function(requestAddress, possibleMatches) {
                                    if (callback) {
                                        callback(rankResults(searchParams, possibleMatches), params);
                                    } // if
                                }
                            });
                        } // if
                    } 
                    catch (e) {
                        COG.Log.exception(e);
                    } // try..catch
                }
            }, params);
            
            var self = new module.GeoSearchAgent(params);
            
            return self;
        }
    }; // module

    return T5.ex(module, moduleConstants, exportedFunctions);
})();