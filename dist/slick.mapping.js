/*
File:   slick.geo.js
File is used to define geo namespace and classes for implementing GIS classes and operations
*/

// define the GEO namespace
var GEO = {};

/* GEO Basic Type definitions */

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

GEO.Radius = function(init_dist, init_uom) {
    // initialise variables
    
    // TODO: actually make this class useful
    
    // initialise self
    var self = {
        distance: parseInt(init_dist, 10),
        uom: init_uom
    }; 
    
    return self;
}; // GEO.Radius

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
        
        getMercatorPixels: function(rads_per_pixel) {
            return new SLICK.Vector(GEO.Utilities.lon2pix(self.lon, rads_per_pixel), GEO.Utilities.lat2pix(self.lat, rads_per_pixel));
        },
        
        setMercatorPixels: function(x, y, rads_per_pixel) {
            if (! rads_per_pixel) {
                throw "Unable to calculate position from mercator pixels without rads_per_pixel value";
            } // if
            
            self.lat = GEO.Utilities.pix2lat(y, rads_per_pixel);
            self.lon = GEO.Utilities.pix2lon(x, rads_per_pixel);
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
        
        transform: function(transformers) {
            // create a new instance of the BoundingBox to transform
            var target = new GEO.BoundingBox(self.min, self.max);
            
            LOGGER.info("applying " + transformers.length + " transformers");
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
}; // BoundingBox

/* GEO Transformers */

GEO.TRANSFORM = (function() {
    return {
        Shrink: function(new_width, new_height) {
            return function() {
                //LOGGER.info(String.format("SHRINKING {2} to {0} x {1}", new_width, new_height, this));
            };
        },
        
        Offset: function(x_offset, y_offset) {
            return function() {
                //LOGGER.info(String.format("OFFSETING {2} by {0}, {1}", x_offset, y_offset, this));
            };
        }
    };
})();

/* GEO Utilities */

/*
Module:  GEO.Utilities
This module contains GIS utility functions that apply across different mapping platforms.  Credit 
goes to the awesome team at decarta for providing information on many of the following functions through
their forums here (http://devzone.decarta.com/web/guest/forums?p_p_id=19&p_p_action=0&p_p_state=maximized&p_p_mode=view&_19_struts_action=/message_boards/view_message&_19_messageId=43131)
*/
GEO.Utilities = (function() {
    // define some constants
    var ECC = 0.08181919084262157;
    
    // initialise variables
    
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
            return (x * scale)*180/Math.PI;
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
        }
    }; // self
    
    return self;
})();

GEO.MapProvider = function() {
    // initailise self
    var self = {
        zoomLevel: 0,
        
        getMapTiles: function(tiler, position, zoom_level, callback) {
            
        },
        
        getPositionForXY: function(x, y) {
            return null;
        }
    };
    
    return self;
}; // MapDataProvider
SLICK.MapTileGrid = function(args) {
    // initailise defaults
    var DEFAULT_BUFFER_SIZE = 1;
    
    // initialise default args
    var DEFAULT_ARGS = {
        
    };
    
    // initialise variables
    var rads_per_pixel = 0;
    var center_pos = new GEO.Position();
    var bl_mercator_pix = null;
    var grid_bounds = new GEO.BoundingBox();
    
    function calculateGridBounds() {
        if (center_pos.isEmpty() || (rads_per_pixel === 0)) { return; }
        
        // determine the mercator 
        var center_mercator_pix = center_pos.getMercatorPixels(rads_per_pixel);
            
        // now calculate the top left mercator pix
        bl_mercator_pix = new SLICK.Vector(
            center_mercator_pix.x - (self.getGridWidth() * 0.5),
            center_mercator_pix.y - (self.getGridHeight() * 0.5));
            
        LOGGER.info("CALCULATING GRID BOUNDS");
        LOGGER.info("center position:             " + center_pos);
        LOGGER.info("center mercator pixels:      " + center_mercator_pix);
        LOGGER.info("bottom left mercator pixels: " + bl_mercator_pix);
            
        updateGridBounds();
    } // calculateGridBounds
    
    function updateGridBounds() {
        // set the bounds min position
        grid_bounds.min.setMercatorPixels(
            bl_mercator_pix.x, 
            bl_mercator_pix.y, 
            rads_per_pixel);
            
        // set the max bounds position
        grid_bounds.max.setMercatorPixels(
            bl_mercator_pix.x + self.getGridWidth(),
            bl_mercator_pix.y + self.getGridHeight(),
            rads_per_pixel);
    } // updateGridBounds
    
    // initialise parent
    var parent = new SLICK.TileGrid(args);
    
    // initialise self
    var self = jQuery.extend({}, parent, {
        getBoundingBox: function() {
            return grid_bounds;
        },
        
        getMercatorMin: function() {
            return new SLICK.Vector(bl_mercator_pix.x, bl_mercator_pix.y);
        },
        
        getCenterPos: function() {
            return center_pos;
        },
        
        setCenterPos: function(value) {
            // update the center position
            center_pos.copy(value);
            calculateGridBounds();
        },
        
        getTopLeftMercatorPixels: function() {
            return new SLICK.Vector(bl_mercator_pix.x, bl_mercator_pix.y + self.getGridHeight());
        },
        
        getMercatorPixelsForPos: function(pos) {
            return pos.getMercatorPixels(rads_per_pixel);
        },
        
        getGridXYForPosition: function(pos) {
            // determine the mercator pixels for teh position
            var pos_mp = pos.getMercatorPixels(rads_per_pixel);

            // calculate the offsets
            LOGGER.info("GETTING OFFSET for position: " + pos);
            var offset_x = Math.abs(pos_mp.x - bl_mercator_pix.x) + self.getTileSize();
            var offset_y = self.getGridHeight() - Math.abs(pos_mp.y - bl_mercator_pix.y) + self.getTileSize();
            
            LOGGER.info("position mercator pixels: " + pos_mp);
            LOGGER.info("bottom left mercator pixels: " + bl_mercator_pix);
            LOGGER.info("calcalated pos offset:    " + offset_x + ", " + offset_y);
            
            return new SLICK.Vector(offset_x, offset_y);
        },
        
        getRadsPerPixel: function() {
            return rads_per_pixel;
        },
        
        setRadsPerPixel: function(value) {
            if (rads_per_pixel !== value) {
                rads_per_pixel = value;
                calculateGridBounds();
            } // if
        },
        
        pixelsToPos: function(vector) {
            // initialise the new position object
            var fnresult = new GEO.Position();
            
            // update the position pixels
            fnresult.setMercatorPixels(
                bl_mercator_pix.x + vector.x - self.getTileSize(), 
                bl_mercator_pix.y + Math.abs(self.getGridHeight() - vector.y) + self.getTileSize(), 
                rads_per_pixel);
            
            // return the position
            return fnresult;
        },
        
        offsetPixelPositions: function(offset_delta) {
            // get the tile size
            // inverse the results as -cols is the top, -rows is the left, which was a bit confusing in hindsight...
            var offset_x = -offset_delta.cols * self.getTileSize();
            var offset_y = -offset_delta.rows * self.getTileSize();
            
            LOGGER.info("OFFSETTING MERCATOR POSITIONS BY: x: " + offset_x + ", y: " + offset_y);
            LOGGER.info("bottom left mercator before: " + bl_mercator_pix);
            bl_mercator_pix.x += offset_x;
            bl_mercator_pix.y -= offset_y;
            LOGGER.info("bottom left mercator after:  " + bl_mercator_pix);
            
            // update the grid bounds
            updateGridBounds();
        }
    });
    
    return self;
}; // SLICK.MapTileGrid

SLICK.MappingTiler = function(args) {
    // initialise defaults
    var DEFAULT_ARGS = {
        tapExtent: 10,
        provider: null
    };
    
    // extend the args
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
    // initialise variables
    var provider = args.provider;
    var zoom_level = 10;
    var current_position = null;
    
    // if the data provider has not been created, then create a default one
    if (! provider) {
        provider = new GEO.MapProvider();
    } // if
    
    // if we have a pan handler in the args, then save it as we are going to insert our own
    var caller_pan_handler = args.panHandler;
    var caller_tap_handler = args.tapHandler;
    var pins = {};
    
    /*
    function mercatorPixelsToScreen(x, y) {
        // get the current offset
        var offset = self.pannable ? self.getOffset() : new SLICK.Vector();
        var grid = self.getGrid();
        var dimensions = self.getDimensions();
        var fnresult = new SLICK.Vector();
        
        if (grid) {
            var minmerc = grid.getMercatorMin();
            
            // calculate the x position
            fnresult.x = Math.abs(x - minmerc.x) - offset.x;
            fnresult.y = dimensions.height - (Math.abs(minmerc.y - y) - offset.y);
        } // if
        
        return fnresult;
    } // 
    */
    
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
    
    // initialise our own tap handler
    args.tapHandler = function(x, y) {
        var grid = self.getGrid();
        var tap_bounds = null;
        
        if (grid) {
            var grid_pos = self.viewPixToGridPix(new SLICK.Vector(x, y));

            // create a min xy and a max xy using a tap extent
            var min_pos = grid.pixelsToPos(grid_pos.offset(-args.tapExtent, args.tapExtent));
            var max_pos = grid.pixelsToPos(grid_pos.offset(args.tapExtent, -args.tapExtent));
            
            // turn that into a bounds object
            tap_bounds = new GEO.BoundingBox(min_pos.toString(), max_pos.toString());
            
            LOGGER.info("tap bounds = " + tap_bounds);
        } // if
        
        if (caller_tap_handler) {
            caller_tap_handler(x, y, tap_bounds); 
        } // if
    }; // tapHandler
    
    args.onDraw = function(context) {
        // get the offset
        var offset = self.pannable ? self.getOffset() : new SLICK.Vector();;
        var grid = self.getGrid();

        // draw each of the pins
        for (var pin_id in pins) {
            if (pins[pin_id] && grid) {
                // get the offset for the position
                var xy = self.gridPixToViewPix(grid.getGridXYForPosition(pins[pin_id].poi.pos));
                pins[pin_id].drawToContext(context, xy.x, xy.y);
            } // if
        } // for
    }; // onDraw
    
    // create the base tiler
    var parent = new SLICK.Tiler(args);
    
    // initialise self
    var self = jQuery.extend({}, parent, {
        getBoundingBox: function(buffer_size) {
            // initialise the buffer size if left null
            buffer_size = buffer_size ? buffer_size : 0;
            
            // get the current dimensions
            var dimensions = self.getDimensions();
            var offset = self.getOffset();
            var grid_bounds = self.getGrid().getBoundingBox();

            // get the display bounds (first shrink)
            var displayBounds = grid_bounds.transform([
                    GEO.TRANSFORM.Shrink(dimensions.width + buffer_size * 2, dimensions.height + buffer_size * 2),
                    GEO.TRANSFORM.Offset(offset.x + buffer_size, offset.y + buffer_size)]);

            return displayBounds;
        },
        
        getCenterPosition: function() {
            // TODO: detect and retrieve the center position
            return null;
        },
        
        gotoPosition: function(position, new_zoom_level, callback) {
            // if a new zoom level is specified, then use it
            zoom_level = new_zoom_level ? new_zoom_level : zoom_level;
            
            // if the zoom level is not defined, then raise an exception
            if (! zoom_level) {
                throw "Zoom level required to goto a position.";
            } // if
            
            // update the provider zoom level
            provider.zoomLevel = zoom_level;
            provider.getMapTiles(self, position, function(tile_grid) {
                LOGGER.info(String.format("created tile grid {0} x {1}", tile_grid.columns, tile_grid.rows));
                self.setGrid(tile_grid);
                
                self.panToPosition(position, callback);
            });
        },
        
        panToPosition: function(position, callback) {
            var grid = self.getGrid();
            if (grid) {
                // determine the tile offset for the requested position
                var center_xy = grid.getGridXYForPosition(position);
                var dimensions = self.getDimensions();
            
                // determine the actual pan amount, by calculating the center of the viewport
                center_xy.x -= dimensions.width * 0.5;
                center_xy.y -= dimensions.height * 0.5;
            
                // pan the required amount
                LOGGER.info(String.format("need to apply pan vector of ({0}) to correctly center", center_xy));
                LOGGER.info("offset before pan = " + self.getOffset());
                self.pan(center_xy.x, center_xy.y);
                LOGGER.info("offset after pan = " + self.getOffset());
            
                // if we have a callback defined, then run it
                if (callback) {
                    callback(self);
                } // if
            } // if
        },
        
        setZoomLevel: function(value) {
            if (zoom_level !== value) {
                zoom_level = value;
            } // if
            
            // if the current position is set, then goto the updated position
            self.gotoPosition(self.getCenterPosition(), zoom_level);
        },
        
        /* poi methods */
        
        addPOI: function(poi) {
            var grid = self.getGrid();
            
            if (grid && poi && poi.id && poi.pos) {
                // create the pin
                pins[poi.id] = new GEO.POIPin({
                    poi: poi
                });
                self.invalidate();
            } // if
        },
        
        removePOI: function(poi) {
            LOGGER.info("removing poi: " + poi);
            if (poi && poi.id) {
                pins[poi.id] = null;
                self.invalidate();
            } // if
        }
    }, parent);
    
    return self;
}; // MapTiler
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

GEO.POIPin = function(args) {
    // initialise the default args
    var DEFAULT_ARGS = {
        poi: null
    }; // DEFAULT_ARGS
    
    // initialise args
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
    // initialise self
    var self = {
        poi: args.poi,
        
        drawToContext: function(context, x, y) {
            if (pin_image && pin_image.complete) {
                LOGGER.info(String.format("DRAWING POI: {0} @ {1}, {2}", self.poi, x, y));
                context.drawImage(pin_image, x, y);
            } // if
        }
    }; // self
    
    // load the image
    // TODO: make this more generic
    var pin_image = new Image();
    pin_image.src = "/public/images/app/markers/" + self.poi.type + ".png";
    
    return self;
}; // POIPin

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
        poitype: "",
        onInitRequest: null,
        onCheckBounds: null,
        onParseResponse: null,
        onPOIAdded: null,
        onPOIDeleted: null,
        onChangedPOIs: null,
        layerClass: GEO.POILayer
    }; 
    
    // initialise variables
    var last_bounds = new GEO.BoundingBox();
    var next_bounds = new GEO.BoundingBox();
    var request_active = false;
    var request_timer = 0;
    var update_listeners = [];
    
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
        
        // iterate through the update listeners and let them know things have changed
        for (ii = 0; ii < update_listeners.length; ii++) {
            update_listeners[ii](self);
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
        
        requestUpdates: function(callback) {
            update_listeners.push(callback);
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
