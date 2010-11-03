/**
# Geo.PointOfInterest

TODO
*/
T5.Geo.PointOfInterest = function(params) {
    params = T5.ex({
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
        params.pos = new T5.Geo.Position(params.lat, params.lon);
    } // if
    
    return T5.ex({
        toString: function() {
            return params.id + ": '" + params.title + "'";
        }
    }, params);
}; 

/**
# Geo.POIStorage

TODO
*/
T5.Geo.POIStorage = function(params) {
    params = T5.ex({
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
        COG.say("geo.pois-updated", {
            srcID: self.id,
            pois: self.getPOIs()
        });
    } // triggerUpdate

    // initialise self
    var self = {
        id: COG.objId(),
        
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
                return T5.Geo.P.inBounds(testPOI.pos, searchBounds);
            });
        },

        addPOIs: function(newPOIs, clearExisting) {
            // if we need to clear existing, then reset the storage
            if (clearExisting) {
                storageGroups = {};
            } // if

            // iterate through the new pois and put into storage
            for (var ii = 0; newPOIs && (ii < newPOIs.length); ii++) {
                newPOIs[ii].retrieved = Date.now();
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
                timeRetrieved = Date.now();
                
            // iterate through the pois and determine state
            for (ii = 0; ii < refreshedPOIs.length; ii++) {
                // look for the poi in the poi layer
                var foundPOI = findExisting(refreshedPOIs[ii]);

                // add the poi to either the update or new array according to whether it was found
                if (foundPOI) {
                    // COG.Log.info("FOUND EXISTING POI");
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
            // COG.Log.info(COG.formatStr("POI-UPDATE: {0} new, {1} deleted", newPOIs.length, deletedPOIs.length));

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
};
