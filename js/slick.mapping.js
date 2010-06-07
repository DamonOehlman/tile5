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