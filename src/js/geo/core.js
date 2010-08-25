/*
File:   TILE5.geo.js
File is used to define geo namespace and classes for implementing GIS classes and operations
*/

/* GEO Basic Type definitions */

TILE5.Geo = (function() {
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
        RADIANS_TO_DEGREES = 180 / Math.PI;
    
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
    
    /**
    This function is used to determine the match weight between a freeform geocoding
    request and it's structured response.
    */
    function plainTextAddressMatch(request, response, compareFns, fieldWeights) {
        var matchWeight = 0;
        
        // uppercase the request for comparisons
        request = request.toUpperCase();
        
        // GRUNT.Log.info("CALCULATING MATCH WEIGHT FOR [" + request + "] = [" + response + "]");
        
        // iterate through the field weights
        for (var fieldId in fieldWeights) {
            // get the field value
            var fieldVal = response[fieldId];

            // if we have the field value, and it exists in the request address, then add the weight
            if (fieldVal) {
                // get the field comparison function
                var compareFn = compareFns[fieldId],
                    matchStrength = compareFn ? compareFn(request, fieldVal) : (request.containsWord(fieldVal) ? 1 : 0);

                // increment the match weight
                matchWeight += (matchStrength * fieldWeights[fieldId]);
            } // if
        } // for
        
        return matchWeight;
    } // plainTextAddressMatch
   
    // define the module
    var module = {
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
        
        /* geo type definitions */
        
        Radius: function(init_dist, init_uom) {
            return {
                distance: parseInt(init_dist, 10),
                uom: init_uom
            }; 
        }, // Radius
        
        Position: function(initLat, initLon) {
            // initialise self
            return {
                lat: parseFloat(initLat ? initLat : 0),
                lon: parseFloat(initLon ? initLon : 0)
            };
        }, // Position
        
        BoundingBox: function(initMin, initMax) {
            return {
                min: module.P.parse(initMin),
                max: module.P.parse(initMax)
            };
        }, // BoundingBox
        
        /* addressing and geocoding support */
        
        // TODO: probably need to include local support for addressing, but really don't want to bulk out TILE5 :/
        
        Address: function(params) {
            params = GRUNT.extend({
                streetDetails: "",
                location: "",
                country: "",
                postalCode: "",
                pos: null,
                boundingBox: null
            }, params);
            
            return params;
        },
        
        GeocodeFieldWeights: {
            streetDetails: 50,
            location: 50
        },
        
        AddressCompareFns: {
        },
        
        /* utilities */
        
        
        /*
        Module:  TILE5.Geo.Utilities
        This module contains GIS utility functions that apply across different mapping platforms.  Credit 
        goes to the awesome team at decarta for providing information on many of the following functions through
        their forums here (http://devzone.decarta.com/web/guest/forums?p_p_id=19&p_p_action=0&p_p_state=maximized&p_p_mode=view&_19_struts_action=/message_boards/view_message&_19_messageId=43131)
        */
        Utilities: (function() {
            // define some constants
            var ECC = 0.08181919084262157;

            var self = {
                dist2rad: function(distance) {
                    return distance / KM_PER_RAD;
                },
                
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
        
        GeoSearchResult: function(params) {
            params = GRUNT.extend({
                id: null,
                caption: "",
                resultType: "",
                data: null,
                pos: null,
                matchWeight: 0
            }, params);
            
            return GRUNT.extend(params, {
                toString: function() {
                    return params.caption + (params.matchWeight ? " (" + params.matchWeight + ")" : "");
                }
            });
        },
        
        GeoSearchAgent: function(params) {
            return TILE5.Dispatcher.createAgent(params);
        },
        
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
            params = GRUNT.extend({
                name: "Geocoding Search Agent",
                paramTranslator: null,
                execute: function(searchParams, callback) {
                    try {
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
                                        callback(rankResults(searchParams, possibleMatches), params);
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
            
            var self = new module.GeoSearchAgent(params);
            
            return self;
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
                retrieved: 0,
                isNew: true
            }, params);

            // if the position is not defined, but we have a lat and lon, create a new position
            if ((! params.pos) && params.lat && params.lon) {
                params.pos = new TILE5.Geo.Position(params.lat, params.lon);
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
            
            function triggerUpdate() {
                GRUNT.WaterCooler.say("geo.pois-updated", {
                    srcID: self.id,
                    pois: self.getPOIs()
                });
            } // triggerUpdate

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
                        return TILE5.Geo.P.inBounds(testPOI.pos, searchBounds);
                    });
                },

                addPOIs: function(newPOIs, clearExisting) {
                    // if we need to clear existing, then reset the storage
                    if (clearExisting) {
                        storageGroups = {};
                    } // if

                    // iterate through the new pois and put into storage
                    for (var ii = 0; newPOIs && (ii < newPOIs.length); ii++) {
                        newPOIs[ii].retrieved = TILE5.Clock.getTime(true);
                        addPOI(newPOIs[ii]);
                    } // for
                },
                
                removeGroup: function(group) {
                    if (storageGroups[group]) {
                        delete storageGroups[group];
                        triggerUpdate();
                    } // if
                },
                
                update: function(refreshedPOIs) {
                    // initialise arrays to receive the pois
                    var newPOIs = [],
                        ii = 0,
                        groupName = refreshedPOIs.length > 0 ? refreshedPOIs[0].group : '',
                        timeRetrieved = TILE5.Clock.getTime(true);
                        
                    // iterate through the pois and determine state
                    for (ii = 0; ii < refreshedPOIs.length; ii++) {
                        // look for the poi in the poi layer
                        var foundPOI = findExisting(refreshedPOIs[ii]);

                        // add the poi to either the update or new array according to whether it was found
                        if (foundPOI) {
                            // GRUNT.Log.info("FOUND EXISTING POI");
                            foundPOI.retrieved = timeRetrieved;
                            foundPOI.isNew = false;
                        }
                        else {
                            newPOIs.push(refreshedPOIs[ii]);
                        }
                    } // for
                    
                    // now all we have left are deleted pois transpose those into the deleted list
                    var deletedPOIs = self.getOldPOIs(groupName, timeRetrieved);

                    // add new pois to the poi layer
                    self.addPOIs(newPOIs);
                    // GRUNT.Log.info(String.format("POI-UPDATE: {0} new, {1} deleted", newPOIs.length, deletedPOIs.length));

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
                        triggerUpdate();
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
        
        /* Position utility functions */
        P: (function() {
            var subModule = {
                calcDistance: function(pos1, pos2) {
                    if (subModule.empty(pos1) || subModule.empty(pos2)) {
                        return 0;
                    } // if
                    
                    var halfdelta_lat = (pos2.lat - pos1.lat).toRad() / 2;
                    var halfdelta_lon = (pos2.lon - pos1.lon).toRad() / 2;

                    // TODO: find out what a stands for, I don't like single char variables in code (same goes for c)
                    var a = (Math.sin(halfdelta_lat) * Math.sin(halfdelta_lat)) + 
                            (Math.cos(pos1.lat.toRad()) * Math.cos(pos2.lat.toRad())) * 
                            (Math.sin(halfdelta_lon) * Math.sin(halfdelta_lon));

                    // calculate c (whatever c is)
                    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                    // calculate the distance
                    return KM_PER_RAD * c;
                },
                
                copy: function(src) {
                    return src ? new module.Position(src.lat, src.lon) : null;
                },

                empty: function(pos) {
                    return (! pos) || ((pos.lat === 0) && (pos.lon === 0));
                },
                
                equal: function(pos1, pos2) {
                    return pos1 && pos2 && (pos1.lat == pos2.lat) && (pos1.lon == pos2.lon);
                },
                
                almostEqual: function(pos1, pos2) {
                    var multiplier = 1000;
                    
                    return pos1 && pos2 && 
                        (Math.floor(pos1.lat * multiplier) === Math.floor(pos2.lat * multiplier)) &&
                        (Math.floor(pos1.lon * multiplier) === Math.floor(pos2.lon * multiplier));
                },
                
                inArray: function(pos, testArray) {
                    var arrayLen = testArray.length,
                        testFn = module.P.equal;
                        
                    for (var ii = arrayLen; ii--; ) {
                        if (testFn(pos, testArray[ii])) {
                            return true;
                        } // if
                    } // for
                    
                    return false;
                },
                
                inBounds: function(pos, bounds) {
                    // initialise variables
                    var fnresult = ! (module.P.empty(pos) || module.P.empty(bounds));

                    // check the pos latitude
                    fnresult = fnresult && (pos.lat >= bounds.min.lat) && (pos.lat <= bounds.max.lat);

                    // check the pos longitude
                    fnresult = fnresult && (pos.lon >= bounds.min.lon) && (pos.lon <= bounds.max.lon);

                    return fnresult;
                },
                
                parse: function(pos) {
                    // first case, null value, create a new empty position
                    if (! pos) {
                        return new module.Position();
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
                                return new module.Position(coords[0], coords[1]);
                            } // if
                        } // for
                    } // if..else

                    return null;
                },
                
                parseArray: function(sourceData) {
                    var sourceLen = sourceData.length,
                        positions = new Array(sourceLen);

                    for (var ii = sourceLen; ii--; ) {
                        positions[ii] = subModule.parse(sourceData[ii]);
                    } // for

                    GRUNT.Log.info("parsed " + positions.length + " positions");
                    return positions;
                },
                
                fromMercatorPixels: function(x, y, radsPerPixel) {
                    // return the new position
                    return new module.Position(
                        TILE5.Geo.Utilities.pix2lat(y, radsPerPixel),
                        TILE5.Geo.Utilities.normalizeLon(TILE5.Geo.Utilities.pix2lon(x, radsPerPixel))
                    );
                },

                toMercatorPixels: function(pos, radsPerPixel) {
                    return new TILE5.Vector(TILE5.Geo.Utilities.lon2pix(pos.lon, radsPerPixel), TILE5.Geo.Utilities.lat2pix(pos.lat, radsPerPixel));
                },
                
                generalize: function(sourceData, requiredPositions, minDist) {
                    var sourceLen = sourceData.length,
                        positions = [],
                        lastPosition = null;

                    if (! minDist) {
                        minDist = DEFAULT_GENERALIZATION_DISTANCE;
                    } // if

                    // convert min distance to km
                    minDist = minDist / 1000;

                    GRUNT.Log.info("generalizing positions, must include " + requiredPositions.length + " positions");

                    // iterate thorugh the source data and add positions the differ by the required amount to 
                    // the result positions
                    for (var ii = sourceLen; ii--; ) {
                        if (ii === 0) {
                            positions.unshift(sourceData[ii]);
                        }
                        else {
                            var include = (! lastPosition) || module.P.inArray(sourceData[ii], requiredPositions),
                                posDiff = include ? minDist : module.P.calcDistance(lastPosition, sourceData[ii]);

                            // if the position difference is suitable then include
                            if (sourceData[ii] && (posDiff >= minDist)) {
                                positions.unshift(sourceData[ii]);

                                // update the last position
                                lastPosition = sourceData[ii];
                            } // if
                        } // if..else
                    } // for

                    GRUNT.Log.info("generalized " + sourceLen + " positions into " + positions.length + " positions");
                    return positions;
                },                

                toString: function(pos) {
                    return pos ? pos.lat + " " + pos.lon : "";
                }
            };
            
            return subModule;
        })(),
        
        /* BoundingBox utility functions */
        B: (function() {
            var MIN_LAT = -(Math.PI / 2),
                MAX_LAT = Math.PI / 2,
                MIN_LON = -Math.PI * 2,
                MAX_LON = Math.PI * 2;
            
            var subModule = {
                calcSize: function(min, max, normalize) {
                    var size = new TILE5.Vector(0, max.lat - min.lat);
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

                // adapted from: http://janmatuschek.de/LatitudeLongitudeBoundingCoordinates
                createBoundsFromCenter: function(centerPos, distance) {
                    var radDist = distance / KM_PER_RAD,
                        radLat = centerPos.lat * DEGREES_TO_RADIANS,
                        radLon = centerPos.lon * DEGREES_TO_RADIANS,
                        minLat = radLat - radDist,
                        maxLat = radLat + radDist,
                        minLon, maxLon;
                        
                    // GRUNT.Log.info("rad distance = " + radDist);
                    // GRUNT.Log.info("rad lat = " + radLat + ", lon = " + radLon);
                    // GRUNT.Log.info("min lat = " + minLat + ", max lat = " + maxLat);
                        
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
                    
                    return new module.BoundingBox(
                                    new module.Position(minLat * RADIANS_TO_DEGREES, minLon * RADIANS_TO_DEGREES), 
                                    new module.Position(maxLat * RADIANS_TO_DEGREES, maxLon * RADIANS_TO_DEGREES));
                },
                
                expand: function(bounds, amount) {
                    return new module.BoundingBox(
                        new module.Position(bounds.min.lat - amount, bounds.min.lon - module.Utilities.normalizeLon(amount)),
                        new module.Position(bounds.max.lat + amount, bounds.max.lon + module.Utilities.normalizeLon(amount)));
                },
                
                forPositions: function(positions, padding) {
                    var bounds = null,
                        startTicks = TILE5.Clock.getTime();

                    // if padding is not specified, then set to auto
                    if (! padding) {
                        padding = "auto";
                    } // if

                    for (var ii = positions.length; ii--; ) {
                        if (! bounds) {
                            bounds = new TILE5.Geo.BoundingBox(positions[ii], positions[ii]);
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

                    GRUNT.Log.trace("calculated bounds for " + positions.length + " positions", startTicks);
                    return bounds;
                },
                
                getCenter: function(bounds) {
                    // calculate the bounds size
                    var size = module.B.calcSize(bounds.min, bounds.max);
                    
                    // create a new position offset from the current min
                    return new TILE5.Geo.Position(bounds.min.lat + (size.y / 2), bounds.min.lon + (size.x / 2));
                },
                
                getGeoHash: function(bounds) {
                    var minHash = TILE5.Geo.GeoHash.encode(bounds.min.lat, bounds.min.lon),
                        maxHash = TILE5.Geo.GeoHash.encode(bounds.max.lat, bounds.max.lon);
                        
                    GRUNT.Log.info("min hash = " + minHash + ", max hash = " + maxHash);
                },

                /** 
                Function adapted from the following code:
                http://groups.google.com/group/google-maps-js-api-v3/browse_thread/thread/43958790eafe037f/66e889029c555bee
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

                    // GRUNT.Log.info("constant index for bbox: " + bounds + " (center = " + boundsCenter + ") is " + variabilityIndex);
                    // GRUNT.Log.info("distances  = " + delta);
                    // GRUNT.Log.info("optimal zoom levels: height = " + bestZoomH + ", width = " + bestZoomW);

                    // return the lower of the two zoom levels
                    return Math.min(isNaN(bestZoomH) ? maxZoom : bestZoomH, isNaN(bestZoomW) ? maxZoom : bestZoomW);
                },

                isEmpty: function(bounds) {
                    return (! bounds) || module.P.empty(bounds.min) || module.P.empty(bounds.max);
                },
                
                toString: function(bounds) {
                    return "min: " + module.P.toString(bounds.min) + ", max: " + module.P.toString(bounds.max);
                }
            };
            
            return subModule;
        })(),
       
        /* Addressing utility functions */
        A: (function() {
            var REGEX_BUILDINGNO = /^(\d+).*$/,
                REGEX_NUMBERRANGE = /(\d+)\s?\-\s?(\d+)/;
            
            var subModule = {
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
                The normalizeAddress function is used to take an address that could be in a variety of formats
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
                
                toString: function(address) {
                    return address.streetDetails + " " + address.location;
                }
            };
            
            return subModule;
        })(),
        
        /* static functions */
        
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
            fnresult = fnresult ? fnresult : findEngine(requiredCapability);
            
            // if no engine was found, then throw an exception
            if (! fnresult) {
                throw new Error("Unable to find GEO engine with " + requiredCapability + " capability");
            }
            
            return fnresult;
        },
        
        rankGeocodeResponses: function(requestAddress, responseAddresses, engine) {
            var matches = [],
                compareFns = module.AddressCompareFns;
                
            // if the engine is specified and the engine has compare fns, then extend them
            if (engine && engine.compareFns) {
                compareFns = GRUNT.extend({}, compareFns, engine.compareFns);
            } // if
            
            // iterate through the response addresses and compare against the request address
            for (var ii = 0; ii < responseAddresses.length; ii++) {
                matches.push(new module.GeoSearchResult({
                    caption: module.A.toString(responseAddresses[ii]),
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
        }
    }; // module

    return module;
})();