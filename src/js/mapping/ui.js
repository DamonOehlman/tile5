SLICK.Mapping = (function() {
    var module = {
        GeoTileGrid: function(params) {
            // extend the params with some defaults
            params = GRUNT.extend({
                grid: null,
                centerPos: new SLICK.Geo.Position(),
                centerXY: new SLICK.Vector(),
                radsPerPixel: 0
            }, params);
            
            // determine the mercator 
            var centerMercatorPix = params.centerPos.getMercatorPixels(params.radsPerPixel);
            
            // calculate the bottom left mercator pix
            // the position of the bottom left mercator pixel is determined by subtracting the actual 
            var blMercatorPix = new SLICK.Vector(centerMercatorPix.x - params.centerXY.x, centerMercatorPix.y - params.centerXY.y);
            
            // initialise self
            var self = GRUNT.extend({}, params.grid, {
                getBoundingBox: function(x, y, width, height) {
                    return new SLICK.Geo.BoundingBox(
                        self.pixelsToPos(new SLICK.Vector(x, y + height)),
                        self.pixelsToPos(new SLICK.Vector(x + width, y)));
                },
                
                getCenterOffset: function() {
                    return params.centerXY;
                },
                
                getGridXYForPosition: function(pos) {
                    // determine the mercator pixels for teh position
                    var pos_mp = pos.getMercatorPixels(params.radsPerPixel);

                    // calculate the offsets
                    // GRUNT.Log.info("GETTING OFFSET for position: " + pos);
                    var offset_x = Math.abs(pos_mp.x - blMercatorPix.x);
                    var offset_y = self.getDimensions().height - Math.abs(pos_mp.y - blMercatorPix.y);

                    // GRUNT.Log.info("position mercator pixels: " + pos_mp);
                    // GRUNT.Log.info("bottom left mercator pixels: " + blMercatorPix);
                    // GRUNT.Log.info("calcalated pos offset:    " + offset_x + ", " + offset_y);

                    return new SLICK.Vector(offset_x, offset_y);
                },
                
                pixelsToPos: function(vector) {
                    // initialise the new position object
                    var fnresult = new SLICK.Geo.Position();
                    
                    var mercX = blMercatorPix.x + vector.x;
                    var mercY = (blMercatorPix.y + self.getDimensions().height) - vector.y;

                    // update the position pixels
                    fnresult.setMercatorPixels(mercX, mercY, params.radsPerPixel);

                    // return the position
                    return fnresult;
                }
            });
            
            return self;
        }
    };
    
    return module;
})();


SLICK.MappingTiler = function(args) {
    // initialise defaults
    var DEFAULT_ARGS = {
        tapExtent: 10,
        provider: null,
        drawCenter: false
    };
    
    // extend the args
    args = GRUNT.extend({}, DEFAULT_ARGS, args);
    
    // initialise variables
    var provider = args.provider;
    var zoom_level = 10;
    var current_position = null;
    var centerPos = null;
    
    // if the data provider has not been created, then create a default one
    if (! provider) {
        provider = new SLICK.Geo.MapProvider();
    } // if
    
    // if we have a pan handler in the args, then save it as we are going to insert our own
    var caller_pan_handler = args.panHandler;
    var caller_tap_handler = args.tapHandler;
    var pins = {};
    
    function drawCenter(context, width, height) {
        var xPos = width * 0.5;
        var yPos = height * 0.5;

        context.strokeStyle = "#333333";
        context.beginPath();
        context.moveTo(xPos, 0);
        context.lineTo(xPos, height);
        context.stroke();

        context.beginPath();
        context.moveTo(0, yPos);
        context.lineTo(width, yPos);
        context.stroke();
    } // drawCenter 
    
    function updateCenterPos() {
        // get the dimensions of the object
        var dimensions = self.getDimensions();
        var grid = self.getGrid();

        if (grid) {
            // get the relative positioning on the grid for the current control center position
            var grid_pos = self.viewPixToGridPix(new SLICK.Vector(dimensions.width * 0.5, dimensions.height * 0.5));

            // get the position for the grid position
            centerPos = grid.pixelsToPos(grid_pos);
        } // if
    } // updateCenterPos
    
    // initialise our own pan handler
    args.panHandler = function(x, y) {
        if (caller_pan_handler) {
            caller_pan_handler(x, y);
        } // if
    }; // 
    
    // initialise our own tap handler
    args.tapHandler = function(absPos, relPos) {
        var grid = self.getGrid();
        var tap_bounds = null;
        
        if (grid) {
            var grid_pos = self.viewPixToGridPix(new SLICK.Vector(relPos.x, relPos.y));

            // create a min xy and a max xy using a tap extent
            var min_pos = grid.pixelsToPos(grid_pos.offset(-args.tapExtent, args.tapExtent));
            var max_pos = grid.pixelsToPos(grid_pos.offset(args.tapExtent, -args.tapExtent));
            
            // turn that into a bounds object
            tap_bounds = new SLICK.Geo.BoundingBox(min_pos.toString(), max_pos.toString());
            
            GRUNT.Log.info("tap position = " + relPos.x + ", " + relPos.y);
            GRUNT.Log.info("grid pos = " + grid_pos);
            GRUNT.Log.info("tap bounds = " + tap_bounds);
        } // if
        
        if (caller_tap_handler) {
            caller_tap_handler(absPos, relPos, tap_bounds); 
        } // if
    }; // tapHandler
    
    args.doubleTapHandler = function(absPos, relPos) {
        var grid = self.getGrid();
        if (grid) {
            var grid_pos = self.viewPixToGridPix(new SLICK.Vector(relPos.x, relPos.y));

            // create a min xy and a max xy using a tap extent
            self.gotoPosition(grid.pixelsToPos(grid_pos.offset(-args.tapExtent, args.tapExtent)), zoom_level + 1);
        } // if
    }; // doubleTapHandler
    
    args.zoomHandler = function(scaleAmount) {
        var zoomChange = 0;
        
        if (scaleAmount < 1) {
            zoomChange = -(1 / scaleAmount);
        }
        else if (scaleAmount > 1) {
            zoomChange = scaleAmount;
        } // if..else
        
        // get the updated center position
        updateCenterPos();

        GRUNT.Log.info("adjust zoom by: " + zoomChange);
        self.gotoPosition(centerPos, zoom_level + Math.round(zoomChange));
    }; // zoomHandler
    
    args.onDraw = function(context) {
        // get the offset
        var offset = self.pannable ? self.getOffset() : new SLICK.Vector();;
        var grid = self.getGrid();

        // draw each of the pins
        for (var pin_id in pins) {
            if (pins[pin_id] && grid) {
                // get the offset for the position
                // TODO: optimize this (eg. var xy = self.gridPixToViewPix(pins[pin_id].mercXY);)
                var xy = self.gridPixToViewPix(grid.getGridXYForPosition(pins[pin_id].poi.pos));
                pins[pin_id].drawToContext(context, xy.x, xy.y, function() {
                    self.invalidate();
                });
            } // if
        } // for
        
        if (args.drawCenter) {
            var dimensions = self.getDimensions();
            drawCenter(context, dimensions.width, dimensions.height);
        } // if
    }; // onDraw
    
    // create the base tiler
    var parent = new SLICK.Tiler(args);
    
    // initialise self
    var self = GRUNT.extend({}, parent, {
        getBoundingBox: function(buffer_size) {
            var fnresult = new SLICK.Geo.BoundingBox();
            var grid = self.getGrid();
            var offset = self.getOffset();
            var dimensions = self.getDimensions();
            
            if (grid) {
                fnresult = grid.getBoundingBox(offset.x, offset.y, dimensions.width, dimensions.height);
            } // if
            
            return fnresult;
        },
        
        getCenterPosition: function() {
            // TODO: detect and retrieve the center position
            return centerPos;
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
                GRUNT.Log.info(String.format("created tile grid {0} x {1}", tile_grid.columns, tile_grid.rows));
                self.setGrid(tile_grid);
                
                self.panToPosition(position, callback);
                
                centerPos = position;
            });
        },
        
        panToPosition: function(position, callback) {
            var grid = self.getGrid();
            if (grid) {
                // determine the tile offset for the requested position
                var center_xy = grid.getGridXYForPosition(position);
                var dimensions = self.getDimensions();
            
                // determine the actual pan amount, by calculating the center of the viewport
                center_xy.x -= (dimensions.width * 0.5);
                center_xy.y -= (dimensions.height * 0.5);
            
                // pan the required amount
                GRUNT.Log.info(String.format("need to apply pan vector of ({0}) to correctly center", center_xy));
                GRUNT.Log.info("offset before pan = " + self.getOffset());
                self.pan(center_xy.x, center_xy.y);
                GRUNT.Log.info("offset after pan = " + self.getOffset());
            
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
        
        zoomIn: function() {
            self.setZoomLevel(zoom_level + 1);
        },
        
        zoomOut: function() {
            self.setZoomLevel(zoom_level - 1);
        },
        
        /* poi methods */
        
        addPOI: function(poi) {
            var grid = self.getGrid();
            
            if (grid && poi && poi.id && poi.pos) {
                // create the pin
                pins[poi.id] = new SLICK.Geo.POIPin({
                    poi: poi
                    // mercXY: grid.getGridXYForPosition(poi.pos)
                });
                self.invalidate();
            }
            else {
                throw new Error("Unable to add POI: " + (grid ? "Insufficient POI details" : "Mapping Grid not defined"));
            }
        },
        
        removePOI: function(poi) {
            // GRUNT.Log.info("removing poi: " + poi);
            if (poi && poi.id) {
                pins[poi.id] = null;
                self.invalidate();
            } // if
        }
    }, parent);
    
    return self;
}; // MapTiler
