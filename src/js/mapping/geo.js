/*
File:   slick.geo.js
File is used to define geo namespace and classes for implementing GIS classes and operations
*/

/* GEO Basic Type definitions */

SLICK.Geo = (function() {
    // define constants
    var LAT_VARIABILITIES = [
        1.406245461070741,
        1.321415085624082,
        1.077179995861952,
        0.703119412486786,
        0.488332580888611
    ];
    
    // define the engines array
    var engines = {};
    
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
    
    // define the module
    var module = {
        
        /* module functions */
        
        /* geo engine class */
        
        Engine: function(params) {
            // if the id for the engine is not specified, throw an exception
            if (! params.id) {
                throw new Error("A GEO.Engine cannot be registered without providing an id.");
            } // if

            // map the parameters directly to self
            var self = GRUNT.extend({
                remove: function() {
                    delete engines[self.id];
                }
            }, params);
            
            // register the engine
            engines[self.id] = self;
            
            return self;
        },
        
        /**
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
            return fnresult ? fnresult : findEngine(requiredCapability);
        },
        
        /* geo type definitions */
        
        Distance: function(pos1, pos2) {
            // define some constants
            var M_PER_KM = 1000;
            var KM_PER_RAD = 6371;

            // initialise private members
            var dist = 0;

            /* calculate the distance */

            // if both position 1 and position 2 are passed and valid
            if (pos1 && (! pos1.isEmpty()) && pos2 && (! pos2.isEmpty())) {
                var halfdelta_lat = (pos2.lat - pos1.lat).toRad() * 0.5;
                var halfdelta_lon = (pos2.lon - pos1.lon).toRad() * 0.5;

                // TODO: find out what a stands for, I don't like single char variables in code (same goes for c)
                var a = (Math.sin(halfdelta_lat) * Math.sin(halfdelta_lat)) + 
                        (Math.cos(pos1.lat.toRad()) * Math.cos(pos2.lat.toRad())) * 
                        (Math.sin(halfdelta_lon) * Math.sin(halfdelta_lon));

                // calculate c (whatever c is)
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                // calculate the distance
                dist = KM_PER_RAD * c;
            } // if

            // initialise self
            var self = {
                toM: function() {
                    return dist * M_PER_KM;
                },

                toKM: function() {
                    return dist;
                },

                toString: function() {
                    return dist + "km";
                }
            }; // 


            return self;
        }, // Distance
        
        Radius: function(init_dist, init_uom) {
            // initialise variables

            // TODO: actually make this class useful

            // initialise self
            var self = {
                distance: parseInt(init_dist, 10),
                uom: init_uom
            }; 

            return self;
        }, // Radius
        
        Position: function(init_lat, init_lon) {
            // initialise variables

            // if the init lon is not specified, and the initial lat contains a space then split on space 
            if ((! init_lon) && init_lat && init_lat.split && (init_lat.indexOf(' ') >= 0)) {
                var coords = init_lat.split(' ');

                // update the initial lat and lon
                init_lat = coords[0];
                init_lon = coords[1];
            } // if

            // if we don't have an init lat, then set both parameters to 0
            if (! init_lat) {
                init_lat = 0;
                init_lon = 0;
            } // if

            // initialise self
            var self = {
                lat: parseFloat(init_lat),
                lon: parseFloat(init_lon),
                
                copy: function(src_pos) {
                    self.lat = src_pos.lat;
                    self.lon = src_pos.lon;
                },
                
                duplicate: function() {
                    return new module.Position(self.lat, self.lon);
                },

                clear: function() {
                    self.lat = 0;
                    self.lon = 0;

                },
                
                isEmpty: function() {
                    return (self.lat === 0) && (self.lon === 0);
                }, 

                getMercatorPixels: function(rads_per_pixel) {
                    return new SLICK.Vector(SLICK.Geo.Utilities.lon2pix(self.lon, rads_per_pixel), SLICK.Geo.Utilities.lat2pix(self.lat, rads_per_pixel));
                },

                setMercatorPixels: function(x, y, rads_per_pixel) {
                    if (! rads_per_pixel) {
                        throw "Unable to calculate position from mercator pixels without rads_per_pixel value";
                    } // if

                    self.lat = SLICK.Geo.Utilities.pix2lat(y, rads_per_pixel);
                    self.lon = SLICK.Geo.Utilities.normalizeLon(SLICK.Geo.Utilities.pix2lon(x, rads_per_pixel));
                },

                toString: function() {
                    return self.lat + " " + self.lon;
                }
            }; // self

            return self;
        }, // Position
        
        BoundingBox: function(init_min, init_max) {
            // if min is a string, then create a new position from it (positions can parsea string)
            if (! init_min) {
                init_min = new SLICK.Geo.Position();
            }
            else if (init_min.split) {
                init_min = new SLICK.Geo.Position(init_min);
            } // if

            // do the same for max
            if (! init_max) {
                init_max = new SLICK.Geo.Position();
            }
            else if (init_max.split) {
                init_max = new SLICK.Geo.Position(init_max);
            } // if

            // initialise self
            var self = {
                min: init_min,
                max: init_max,

                copy: function(src_bounds) {
                    self.min.copy(src_bounds.min);
                    self.max.copy(src_bounds.max);
                },

                clear: function() {
                    self.min.clear();
                    self.max.clear();
                },
                
                expand: function(amount) {
                    self.min.lat -= amount;
                    self.min.lon -= module.Utilities.normalizeLon(amount);
                    self.max.lat += amount;
                    self.max.lon += module.Utilities.normalizeLon(amount);
                },
                
                getDistance: function() {
                    return new module.Distance(self.min, self.max);
                },
                
                getCenter: function() {
                    // calculate the bounds size
                    var size = module.calculateBoundsSize(self.min, self.max);
                    
                    // create a new position offset from the current min
                    return new SLICK.Geo.Position(self.min.lat + (size.y * 0.5), self.min.lon + (size.x * 0.5));
                },

                isEmpty: function() {
                    return self.min.isEmpty() || self.max.isEmpty();
                },
                
                transform: function(transformers) {
                    // create a new instance of the BoundingBox to transform
                    var target = new SLICK.Geo.BoundingBox(self.min, self.max);

                    GRUNT.Log.info("applying " + transformers.length + " transformers");
                    // iterate through the transformers, and call them
                    for (var ii = 0; transformers && (ii < transformers.length); ii++) {
                        transformers[ii].apply(target);
                    } // for

                    return target;
                },

                toString: function() {
                    return String.format("({0}, {1})", self.min, self.max);
                }
            }; // self

            return self;
        }, // BoundingBox
        
        Transforms: (function() {
            return {
                Shrink: function(new_width, new_height) {
                    return function() {
                        //GRUNT.Log.info(String.format("SHRINKING {2} to {0} x {1}", new_width, new_height, this));
                    };
                },

                Offset: function(x_offset, y_offset) {
                    return function() {
                        //GRUNT.Log.info(String.format("OFFSETING {2} by {0}, {1}", x_offset, y_offset, this));
                    };
                }
            };
        })(),
        
        /* addressing and geocoding support */
        
        // TODO: probably need to include local support for addressing, but really don't want to bulk out slick :/
        
        Address: function(params) {
            params = GRUNT.extend({
                streetDetails: "",
                location: "",
                country: "",
                postalCode: "",
                pos: null,
                boundingBox: null
            }, params);
            
            // define self
            var self = {
                getPos: function() {
                    return params.pos;
                },
                
                toString: function() {
                    return params.streetDetails + " " + params.location;
                }
            };
            
            return self;
        },
        
        /**
        A landmark is a specialized type of address, something like a park, airport, etc
        */
        Landmark: function(params) {
            
        },
        
        /* utilities */
        
        
        /*
        Module:  SLICK.Geo.Utilities
        This module contains GIS utility functions that apply across different mapping platforms.  Credit 
        goes to the awesome team at decarta for providing information on many of the following functions through
        their forums here (http://devzone.decarta.com/web/guest/forums?p_p_id=19&p_p_action=0&p_p_state=maximized&p_p_mode=view&_19_struts_action=/message_boards/view_message&_19_messageId=43131)
        */
        Utilities: (function() {
            // define some constants
            var ECC = 0.08181919084262157;

            var self = {
                lat2pix: function(lat, scale) {
                    var radLat = (parseFloat(lat)*(2*Math.PI))/360;
                    var sinPhi = Math.sin(radLat);
                    var eSinPhi = ECC * sinPhi;
                    var retVal = Math.log(((1.0 + sinPhi) / (1.0 - sinPhi)) * Math.pow((1.0 - eSinPhi) / (1.0 + eSinPhi), ECC)) / 2.0;

                    return (retVal / scale);
                },

                lon2pix: function(lon, scale) {
                    return ((parseFloat(lon)/180)*Math.PI) / scale;
                },

                pix2lon: function(x, scale) {
                    return self.normalizeLon((x * scale)*180/Math.PI);
                },

                pix2lat: function(y, scale) {
                    var phiEpsilon = 1E-7;
                    var phiMaxIter = 12;
                    var t = Math.pow(Math.E, -y * scale);
                    var prevPhi = self.mercatorUnproject(t);
                    var newPhi = self.findRadPhi(prevPhi, t);
                    var iterCount = 0;

                    while (iterCount < phiMaxIter && Math.abs(prevPhi - newPhi) > phiEpsilon) {
                        prevPhi = newPhi;
                        newPhi = self.findRadPhi(prevPhi, t);
                        iterCount++;
                    } // while

                    return newPhi*180/Math.PI;
                },

                mercatorUnproject: function(t) {
                    return (Math.PI / 2) - 2 * Math.atan(t);
                },

                findRadPhi: function(phi, t) {
                    var eSinPhi = ECC * Math.sin(phi);

                    return (Math.PI / 2) - (2 * Math.atan (t * Math.pow((1 - eSinPhi) / (1 + eSinPhi), ECC / 2)));
                },
                
                normalizeLon: function(lon) {
                    // return lon;
                    while (lon < -180) {
                        lon += 360;
                    } // while
                    
                    while (lon > 180) {
                        lon -= 360;
                    } // while
                    
                    return lon;
                }
            }; // self

            return self;
        })(), // Utilitities
        
        GeocodingAgent: function(params) {
            // extend parameters with defaults
            params = GRUNT.extend({
                name: "Geocoding Search Agent",
                paramTranslator: null,
                execute: function(searchParams, callback) {
                    try {
                        GRUNT.Log.info("Running geocoding agent");
                    
                        // if we have a param translator, then call that on the search params
                        if (params.paramTranslator) {
                            searchParams = params.paramTranslator(searchParams);
                        } // if
                    
                        // check for a freeform request
                        if ((! searchParams.reverse) && (! searchParams.freeform)) {
                            address = new module.Address(searchParams);
                        } // if
                        
                        // get the geocoding engine
                        var engine = module.getEngine("geocode");
                        if (engine) {
                            engine.geocode({
                                addresses: [searchParams.freeform ? searchParams.freeform : address],
                                complete: function(requestAddress, possibleMatches) {
                                    if (callback) {
                                        callback(possibleMatches, params);
                                    } // if
                                }
                            });
                        } // if
                    } 
                    catch (e) {
                        GRUNT.Log.exception(e);
                    } // try..catch
                }
            }, params);
            
            return SLICK.Dispatcher.createAgent(params);
        },
        
        /* Point of Interest Objects */
        
        PointOfInterest: function(params) {
            params = GRUNT.extend({
                id: 0,
                title: "",
                pos: null,
                lat: "",
                lon: "",
                group: "",
                retrieved: 0
            }, params);

            // if the position is not defined, but we have a lat and lon, create a new position
            if ((! params.pos) && params.lat && params.lon) {
                params.pos = new SLICK.Geo.Position(params.lat, params.lon);
            } // if
            
            return GRUNT.extend({
                toString: function() {
                    return params.id + ": '" + params.title + "'";
                }
            }, params);
        },
        
        POIStorage: function(params) {
            params = GRUNT.extend({
                visibilityChange: null,
                onPOIDeleted: null,
                onPOIAdded: null
            }, params);

            // initialise variables
            var storageGroups = {},
                visible = true;
                
            function getStorageGroup(groupName) {
                // first get storage group for the poi based on type
                var groupKey = groupName ? groupName : "default";
                
                // if the storage group does not exist, then create it
                if (! storageGroups[groupKey]) {
                    storageGroups[groupKey] = [];
                } // if                
                
                return storageGroups[groupKey];
            } // getStorageGroup
                
            function findExisting(poi) {
                if (! poi) { return null; }
                
                // iterate through the specified group and look for the key by matching the id
                var group = getStorageGroup(poi.group);
                for (var ii = 0; ii < group.length; ii++) {
                    if (group[ii].id == poi.id) {
                        return group[ii];
                    } // if
                } // for
                
                return null;
            } // findExisting
            
            function addPOI(poi) {
                getStorageGroup(poi.group).push(poi);
            } // addPOI
            
            function removeFromStorage(poi) {
                var group = getStorageGroup(poi.group);
                
                for (var ii = 0; ii < group.length; ii++) {
                    if (group[ii].id == poi.id) {
                        group.splice(ii, 1);
                        break;
                    }
                } // for
            } // removeFromStorage
            
            function poiGrabber(test) {
                var matchingPOIs = [];
                
                // iterate through the groups and pois within each group
                for (var groupKey in storageGroups) {
                    for (var ii = 0; ii < storageGroups[groupKey].length; ii++) {
                        if ((! test) || test(storageGroups[groupKey][ii])) {
                            matchingPOIs.push(storageGroups[groupKey][ii]);
                        } // if
                    } // for
                } // for
                
                return matchingPOIs;
            } // poiGrabber

            // initialise self
            var self = {
                id: GRUNT.generateObjectID(),
                
                getPOIs: function() {
                    return poiGrabber();
                },

                getOldPOIs: function(groupName, testTime) {
                    return poiGrabber(function(testPOI) {
                        return (testPOI.group == groupName) && (testPOI.retrieved < testTime);
                    });
                },

                getVisible: function() {
                    return visible;
                },

                setVisible: function(value) {
                    if (value != visible) {
                        visible = value;

                        // fire the visibility change event
                        if (params.visibilityChange) {
                            params.visibilityChange();
                        } // if
                    } // if
                },

                findById: function(searchId) {
                    var matches = poiGrabber(function(testPOI) {
                        return testPOI.id == searchId;
                    });
                    
                    return matches.length > 0 ? matches[0] : null;
                },

                /*
                Method:  findByBounds
                Returns an array of the points of interest that have been located within
                the bounds of the specified bounding box
                */
                findByBounds: function(searchBounds) {
                    return poiGrabber(function(testPOI) {
                        return SLICK.Geo.posInBounds(testPOI.pos, searchBounds);
                    });
                },

                addPOIs: function(newPOIs, clearExisting) {
                    // if we need to clear existing, then reset the storage
                    if (clearExisting) {
                        storageGroups = {};
                    } // if

                    // iterate through the new pois and put into storage
                    for (var ii = 0; newPOIs && (ii < newPOIs.length); ii++) {
                        newPOIs[ii].retrieved = new Date().getTime();
                        addPOI(newPOIs[ii]);
                    } // for
                },
                
                update: function(refreshedPOIs) {
                    // initialise arrays to receive the pois
                    var newPOIs = [],
                        ii = 0,
                        groupName = refreshedPOIs.length > 0 ? refreshedPOIs[0].group : '',
                        timeRetrieved = new Date().getTime();
                        
                    GRUNT.Log.info(String.format("{0} {1} pois to process :)", refreshedPOIs.length, groupName));

                    // iterate through the pois and determine state
                    for (ii = 0; ii < refreshedPOIs.length; ii++) {
                        // look for the poi in the poi layer
                        var foundPOI = findExisting(refreshedPOIs[ii]);

                        // add the poi to either the update or new array according to whether it was found
                        if (foundPOI) {
                            foundPOI.retrieved = timeRetrieved;
                        }
                        else {
                            newPOIs.push(refreshedPOIs[ii]);
                        }
                    } // for
                    
                    // now all we have left are deleted pois transpose those into the deleted list
                    var deletedPOIs = self.getOldPOIs(groupName, timeRetrieved);

                    // add new pois to the poi layer
                    self.addPOIs(newPOIs);
                    GRUNT.Log.info(String.format("POI-UPDATE: {0} new, {1} deleted", newPOIs.length, deletedPOIs.length));

                    // fire the on poi added event when appropriate
                    for (ii = 0; params.onPOIAdded && (ii < newPOIs.length); ii++) {
                        params.onPOIAdded(newPOIs[ii]);
                    } // for

                    for (ii = 0; ii < deletedPOIs.length; ii++) {
                        // trigger the event if assigned
                        if (params.onPOIDeleted) {
                            params.onPOIDeleted(deletedPOIs[ii]);
                        } // if

                        // remove the poi from storage
                        removeFromStorage(deletedPOIs[ii]);
                    } // for
                    
                    // if we have made updates, then fire the geo pois updated event
                    if (newPOIs.length + deletedPOIs.length > 0) {
                        GRUNT.WaterCooler.say("geo.pois-updated", {
                            srcID: self.id,
                            pois: self.getPOIs()
                        });
                    } // if
                }
            };

            return self;
        },
          
        MapProvider: function() {
            // initailise self
            var self = {
                zoomLevel: 0,
                
                checkZoomLevel: function(zoomLevel) {
                    return zoomLevel;
                },
                
                getCopyright: function() {
                },

                getMapTiles: function(tiler, position, zoom_level, callback) {

                },

                getPositionForXY: function(x, y) {
                    return null;
                }
            };

            return self;
        }, // MapProvider
        
        /* static functions */
        
        /*
        Method: inBounds
        This method is used to determine whether or not the position is
        within the bounds rect supplied. 
        */
        posInBounds: function(pos, bounds) {
            // initialise variables
            var fnresult = ! (pos.isEmpty() || bounds.isEmpty());

            // check the pos latitude
            fnresult = fnresult && (pos.lat >= bounds.min.lat) && (pos.lat <= bounds.max.lat);

            // check the pos longitude
            fnresult = fnresult && (pos.lon >= bounds.min.lon) && (pos.lon <= bounds.max.lon);

            return fnresult;
        },
        
        calculateBoundsSize: function(min, max, normalize) {
            var size = new SLICK.Vector(0, max.lat - min.lat);
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
        Function adapted from the following code:
        http://groups.google.com/group/google-maps-js-api-v3/browse_thread/thread/43958790eafe037f/66e889029c555bee
        */
        getBoundingBoxZoomLevel: function(bounds, displaySize) {
            // get the constant index for the center of the bounds
            var boundsCenter = bounds.getCenter(),
                variabilityIndex = Math.min(Math.round(Math.abs(boundsCenter.lat) * 0.05), LAT_VARIABILITIES.length),
                variability = LAT_VARIABILITIES[variabilityIndex],
                delta = module.calculateBoundsSize(bounds.min, bounds.max),
                // interestingly, the original article had the variability included, when in actual reality it isn't, 
                // however a constant value is required. must find out exactly what it is.  At present, though this
                // works fine.
                bestZoomH = Math.ceil(Math.log(LAT_VARIABILITIES[3] * displaySize.height / delta.y) / Math.log(2)),
                bestZoomW = Math.ceil(Math.log(variability * displaySize.width / delta.x) / Math.log(2));
            
            GRUNT.Log.info("constant index for bbox: " + bounds + " (center = " + boundsCenter + ") is " + variabilityIndex);
            GRUNT.Log.info("distances  = " + delta);
            GRUNT.Log.info("optimal zoom levels: height = " + bestZoomH + ", width = " + bestZoomW);
            
            // return the lower of the two zoom levels
            return Math.min(bestZoomH, bestZoomW);
        },
        
        getBoundsForPositions: function(positions, padding) {
            var bounds = null,
                startTicks = new Date().getTime();
                
            // if padding is not specified, then set to auto
            if (! padding) {
                padding = "auto";
            } // if
            
            for (var ii = 0; ii < positions.length; ii++) {
                if (! bounds) {
                    bounds = new SLICK.Geo.BoundingBox(positions[ii].duplicate(), positions[ii].duplicate());
                }
                else {
                    var minDiff = module.calculateBoundsSize(bounds.min, positions[ii], false),
                        maxDiff = module.calculateBoundsSize(positions[ii], bounds.max, false);

                    if (minDiff.x < 0) { bounds.min.lon = positions[ii].lon; }
                    if (minDiff.y < 0) { bounds.min.lat = positions[ii].lat; }
                    if (maxDiff.y < 0) { bounds.max.lon = positions[ii].lon; }
                    if (maxDiff.y < 0) { bounds.max.lat = positions[ii].lat; }
                } // if..else
            } // for
            
            // expand the bounds to give us some padding
            if (padding) {
                if (padding == "auto") {
                    var size = module.calculateBoundsSize(bounds.min, bounds.max);
                    
                    // update padding to be a third of the max size
                    padding = Math.max(size.x, size.y) * 0.3;
                } // if
                
                bounds.expand(padding);
            } // if
            
            GRUNT.Log.info(":: " + (new Date().getTime() - startTicks) + "ms to calculate bounds for " + positions.length + " position values");
            return bounds;
        }
    }; // module
    
    return module;
})();