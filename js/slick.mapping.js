// define the GEO namespace
var GEO = {};

GEO.Distance = function(pos1, pos2) {
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
}; // GEO.Distance

GEO.Position = function(init_lat, init_lon) {
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
        
        clear: function() {
            self.lat = 0;
            self.lon = 0;
            
        },
        
        /*
        Method: inBounds
        This method is used to determine whether or not the position is
        within the bounds rect supplied. 
        */
        inBounds: function(bounds) {
            // initialise variables
            var fnresult = ! (self.isEmpty() || bounds.isEmpty());
            
            // check the pos latitude
            fnresult = fnresult && (self.lat >= bounds.min.lat) && (self.lat <= bounds.max.lat);
            
            // check the pos longitude
            fnresult = fnresult && (self.lon >= bounds.min.lon) && (self.lon <= bounds.max.lon);
            
            return fnresult;
        },
        
        isEmpty: function() {
            return (self.lat === 0) && (self.lon === 0);
        }, 
        
        toString: function() {
            return self.lat + " " + self.lon;
        }
    }; // self
    
    return self;
}; // Position

/*
Class: GEO.BoundingBox
*/
GEO.BoundingBox = function(init_min, init_max) {
    // if min is a string, then create a new position from it (positions can parsea string)
    if (! init_min) {
        init_min = new GEO.Position();
    }
    else if (init_min.split) {
        init_min = new GEO.Position(init_min);
    } // if

    // do the same for max
    if (! init_max) {
        init_max = new GEO.Position();
    }
    else if (init_max.split) {
        init_max = new GEO.Position(init_max);
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
        
        isEmpty: function() {
            return self.min.isEmpty() || self.max.isEmpty();
        },
        
        toString: function() {
            return String.format("({0}, {1})", self.min, self.max);
        }
    }; // self
    
    return self;
}; // BoundingBox

GEO.MapProvider = function() {
    // initialise variables
    
    // initailise self
    var self = {
        getMapTiles: function(tiler, position, zoom_level, callback) {
            
        }
    };
    
    return self;
}; // MapDataProvider

GEO.PointOfInterest = function(args) {
    // initialise default parameters
    var DEFAULT_ARGS = {
        id: 0,
        title: "",
        pos: null,
        lat: "",
        lon: "",
        type: "",
        retrieved: 0
    };

    // extend args with defaults
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
    // if the position is not defined, but we have a lat and lon, create a new position
    if ((! args.pos) && args.lat && args.lon) {
        args.pos = new GEO.Position(args.lat, args.lon);
    } // if
    
    // initialise self
    var self = {
        id: args.id,
        title: args.title,
        pos: args.pos,
        pin: null,
        type: args.type,
        
        toString: function() {
            return String.format("{0}: '{1}'", self.id, self.title);
        }
    };
    
    return self;
}; // PointOfInterest

GEO.POIInfoBox = function(args) {
    // initialise default args
    var DEFAULT_ARGS = {
        pois: []
    }; // initialise

    // extend args with the defaults
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
    // initialise the pois
    var active_poi = null;
    var pois = args.pois;
    var poi_index = 0;
    
    function updateButtons() {
        var buttons = [];
        
        if (pois.length > 1) {
            // push some test buttons
            buttons.push({
                text: "Back",
                click: function() {
                    self.setActivePOI(poi_index - 1);
                }
            });

            buttons.push({
                text: "Next",
                click: function() {
                    self.setActivePOI(poi_index + 1);
                },
                align: 'right'
            });
        } // if
        
        buttons.push({
            text: "View Details",
            click: function() {
                // save a reference to the button
                var this_button = this;
                
                if (self.getDetailsVisible()) {
                    self.hideDetails();
                }
                else if (self.args.requirePOIDetails) {
                    self.args.requirePOIDetails(self.getActivePOI(), function(details_html) {
                        self.showDetails(details_html);
                    });
                } // if..else
            },
            align: 'center'
        });

        // update the buttons
        self.setButtons(buttons);
    } // updateButtons
    
    function updateDisplay() {
        LOGGER.info("updating poi display: index = " + poi_index);
        
        active_poi = null;
        if ((poi_index >= 0) && (poi_index < pois.length)) {
            active_poi = pois[poi_index];
            self.updateContent("<h4>" + active_poi.title + "</h4>");

            // if the details are visible, then hide them
            if (self.getDetailsVisible()) {
                if (self.args.requirePOIDetails) {
                    self.args.requirePOIDetails(active_poi, function(details_html) {
                        self.showDetails(details_html);
                    });
                }
                else {
                    self.hideDetails();
                } // if..else
            } // if
        } // if
    } // updateDisplay
    
    // create the parent
    var parent = new SLICK.InfoBox(args);
    
    // initialise self
    var self = jQuery.extend({}, parent, {
        args: args,
        
        getActivePOI: function() {
            return active_poi;
        },
        
        setActivePOI: function(index, force_change) {
            // wrap the index 
            if (index < 0) {
                index = pois.length - 1;
            }
            else if (index >= pois.length) {
                index = 0;
            } // if..else
            
            // if the index is different, then update
            if ((index != poi_index) || force_change) {
                poi_index = index;
                updateDisplay();
                
                // if we have a poi changed event then fire that
                if (args.handlePOIChange) {
                    args.handlePOIChange(pois[poi_index]);
                } // if
            } // if
        },
        
        setPOIs: function(poi_array) {
            pois = [];
            for (var ii = 0; poi_array && (ii < poi_array.length); ii++) {
                pois.push(poi_array[ii]);
            } // for
            
            // if we have pois, then display the info box, if not then hide it
            if (pois.length > 0) {
                updateButtons();
                self.show();
                
                // update the display by forcing a poi update
                self.setActivePOI(0, true);
            }
            else {
                self.hide();
            } // if..else
        } // setPOIs
    });
    
    return self;
}; // POIInfoBox

/*
This class is used to store a list of points of interest and offer some 
simple operations on that array that make managing the pois simpler.

TODO: optimize the find functions
TODO: add a sort function to sort the pois 
*/
GEO.POILayer = function(args) {
    // initialise default args
    var DEFAULT_ARGS = {
        visibilityChange: null
    }; 
    
    // initialise variables
    var storage = [];
    var visible = true;
    
    // initialise self
    var self = {
        args: jQuery.extend({}, DEFAULT_ARGS, args),
        
        getPOIs: function() {
            var fnresult = [];
            for (var ii = 0; ii < storage.length; ii++) {
                fnresult.push(storage[ii]);
            } // for
            
            return fnresult;
        },
        
        getOldPOIs: function(test_time) {
            var fnresult = [];
            for (var ii = 0; ii < storage.length; ii++) {
                if (storage[ii].retrieved < test_time) {
                    fnresult.push(storage[ii]);
                } // if
            } // for
            
            return fnresult;
        },
        
        getVisible: function() {
            return visible;
        },
        
        setVisible: function(value) {
            if (value != visible) {
                visible = value;
                
                // fire the visibility change event
                if (args.visibilityChange) {
                    args.visibilityChange();
                } // if
            } // if
        },
        
        findById: function(search_id) {
            for (var ii = 0; ii < storage.length; ii++) {
                if (storage[ii].id == search_id) {
                    return storage[ii];
                } // if
            } // for
            
            // no result, found return null
            return null;
        },
        
        /*
        Method:  findByBounds
        Returns an array of the points of interest that have been located within
        the bounds of the specified bounding box
        */
        findByBounds: function(search_bounds) {
            var fnresult = [];
            
            // iterate through the pois and check whether they are in the bounds
            for (var ii = 0; ii < storage.length; ii++) {
                if (storage[ii].pos && storage[ii].pos.inBounds(search_bounds)) {
                    fnresult.push(storage[ii]);
                } // if
            } // for
            
            return fnresult;
        },
        
        removeById: function(search_id) {
            // iterate through the array and look for the matching item, when found splice it out of the array
            for (var ii = 0; ii < storage.length; ii++) {
                if (storage[ii].id == search_id) {
                    // TODO: investigate how intesive splice is and whether it would be better batched and use delete
                    storage.splice(ii, 1);
                    return;
                } // if
            } // for
        },
        
        addPOIs: function(new_pois, clear_existing) {
            // if we need to clear existing, then reset the storage
            if (clear_existing) {
                storage = [];
            } // if
            
            // iterate through the new pois and put into storage
            for (var ii = 0; new_pois && (ii < new_pois.length); ii++) {
                new_pois[ii].retrieved = new Date().getTime();
                storage.push(new_pois[ii]);
            } // for
        }
    };
    
    return self;
}; // GEO.POILayer

/*
The POIProvider class is used to define generic methods for implementing
something that is going to provide point of interest information on a map.
The provider does not handle displaying any information about the POI, nor
does it enabling pinning on the map.  It simply is responsible for optimized
data retrieval for points of interest.  To that end, the POI provider has 
events that inform the application / tiler when points of interest are added
or removed and hence should be added to or removed from the map.  
*/
GEO.POIProvider = function(args) {
    // initialise default args
    var DEFAULT_ARGS = {
        onInitRequest: null,
        onCheckBounds: null,
        onParseResponse: null,
        onPOIAdded: null,
        onPOIDeleted: null,
        layerClass: GEO.POILayer
    }; 
    
    // initialise variables
    var last_bounds = new GEO.BoundingBox();
    var next_bounds = new GEO.BoundingBox();
    var request_active = false;
    var request_timer = 0;
    
    /*
    Function:  updatePOIs
    This function is used to compare the old poi array and new poi arrays 
    retrieved from the provider.  Determine which of the pois have been added, 
    which ones removed.  TODO: support poi title changes, etc.
    */
    function updatePOIs(refreshed_pois) {
        // initialise arrays to receive the pois
        var new_pois = [];
        var ii = 0;
        var time_retrieved = new Date().getTime();
        
        LOGGER.info(String.format("{0} pois to process :)", refreshed_pois.length));
        
        // iterate through the pois and determine state
        for (ii = 0; ii < refreshed_pois.length; ii++) {
            // look for the poi in the poi layer
            var found_poi = self.pois.findById(refreshed_pois[ii].id);
        
            // add the poi to either the update or new array according to whether it was found
            if (found_poi) {
                found_poi.retrieved = time_retrieved;
            }
            else {
                new_pois.push(refreshed_pois[ii]);
            }
        } // for
    
        // now all we have left are deleted pois transpose those into the deleted list
        var deleted_pois = self.pois.getOldPOIs(time_retrieved);
        
        // add new pois to the poi layer
        self.pois.addPOIs(new_pois);
        LOGGER.info(String.format("POI-UPDATE: {0} new, {1} deleted", new_pois.length, deleted_pois.length));
            
        // fire the on poi added event when appropriate
        for (ii = 0; self.args.onPOIAdded && (ii < new_pois.length); ii++) {
            self.args.onPOIAdded(new_pois[ii]);
        } // for
    
        for (ii = 0; self.args.onPOIDeleted && (ii < deleted_pois.length); ii++) {
            self.args.onPOIDeleted(deleted_pois[ii]);
            self.pois.removeById(deleted_pois[ii].id);
        } // for
    } // updatePOIs
    
    // extend the args
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
    // initialise self
    var self = {
        args: args,
        pois: new args.layerClass(),
        
        getForBounds: function(bounds, callback) {
            // if we are currently, executing a request, then save the bounds as the next query
            if (request_active) {
                next_bounds.copy(bounds);
                return;
            } // if
            
            if (request_timer) {
                clearTimeout(request_timer);
            };
            
            request_timer = setTimeout(function() {
                // check for empty bounds, if empty then exit
                if ((! bounds) || bounds.isEmpty()) {
                    LOGGER.warn("cannot get pois for empty bounding box");
                    return;
                } // if
            
                // calculate the bounds change
                var bounds_change = null;
                if (! last_bounds.isEmpty()) {
                    bounds_change = new GEO.Distance(last_bounds.min, bounds.min);
                } // if
            
                if ((! bounds_change) || self.testBoundsChange(bounds_change)) {
                    LOGGER.info("yep - bounds changed = " + bounds_change);

                    // define the ajax args
                    var ajax_args = jQuery.extend({
                        success: function(data, textStatus, raw_request) {
                            try {
                                // update the pois
                                updatePOIs(self.parseResponse(data, textStatus, raw_request));
                                request_active = false;
                            
                                if (callback) {
                                    callback(self.pois);
                                } // if
                            
                                // if we have a next request, then execute that request
                                request_timer = 0;
                                if (! next_bounds.isEmpty()) {
                                    self.getForBounds(next_bounds, callback);
                            
                                    // update the next bounds to empty
                                    next_bounds.clear();
                                } // if
                            }  
                            catch (e) {
                                LOGGER.exception(e);
                            } // try..catch
                        },
                        error: function(raw_request, textStatus, errorThrown) {
                            request_active = false;
                            LOGGER.error("failed getting POIS from server: " + textStatus + ":" + errorThrown);
                        }
                    }, self.initRequest());
                
                    // update the last bounds called and flag the request as active
                    last_bounds.copy(bounds);
                    request_active = true;
                
                    // make the request
                    LOGGER.info("Looking for POIS within bounding box");
                    jQuery.ajax(ajax_args);
                
                } // if
            }, 500);
        },
        
        initRequest: function() {
            return self.args.onInitRequest ? self.args.onInitRequest() : {};
        },
        
        parseResponse: function(data, textStatus, raw_request) {
            return self.args.onParseResponse ? self.args.onParseResponse(data, textStatus, raw_request) : [];
        },
        
        testBoundsChange: function(distance) {
            LOGGER.info("testing for bounds change: distance = " + distance);
            
            // if the distance is equal to 0 don't call event, just return false
            if (distance && (distance.toKM() == 0)) { return false; }
            
            return self.args.onCheckBounds ? self.args.onCheckBounds(distance) : true;
        }
    };
    
    return self;
}; // GEO.POIProvider

SLICK.MapTileGrid = function(args) {
    // initailise defaults
    var DEFAULT_BUFFER_SIZE = 1;
    
    // initialise default args
    var DEFAULT_ARGS = {
        
    };
    
    // initialise variables
    
    // initialise parent
    var parent = new SLICK.TileGrid(args);
    
    // initialise self
    var self = jQuery.extend({}, parent, {
        getBoundingBox: function(buffer_size) {
            // if the buffer size is not defined, then set to the default
            if (typeof buffer_size === undefined) {
                buffer_size = DEFAULT_BUFFER_SIZE;
            } // if
            
            return new GEO.BoundingBox();
        }
    });
    
    return self;
}; // SLICK.MapTileGrid

SLICK.MappingTiler = function(args) {
    // initialise variables
    var provider = args.provider;
    var zoom_level = 0;
    
    // if the data provider has not been created, then create a default one
    if (! provider) {
        provider = new GEO.MapProvider();
    } // if
    
    // if we have a pan handler in the args, then save it as we are going to insert our own
    var caller_pan_handler = args.panHandler;
    
    // initialise our own pan handler
    args.panHandler = function(x, y) {
        // get the grid
        var grid = self.getGrid();
        if (grid) {
            // get the current grid rect
            bounds = grid.getBoundingBox();
        } // if
        
        if (caller_pan_handler) {
            caller_pan_handler(x, y);
        } // if
    }; // 
    
    // create the base tiler
    var parent = new SLICK.Tiler(args);
    
    // initialise self
    var self = jQuery.extend({}, parent, {
        getBounds: function() {
            
        },
        
        gotoPosition: function(position, zoom_level) {
            provider.getMapTiles(self, position, zoom_level, function(tile_grid) {
                LOGGER.info(String.format("created tile grid {0} x {1}", tile_grid.columns, tile_grid.rows));
                self.setGrid(tile_grid);
            });
        }
    }, parent);
    
    return self;
}; // MapTiler