/*
File:  slick.tiler.js
This file is used to define the tiler and supporting classes for creating a scrolling
tilable grid using the HTML canvas.  At this stage, the Tiler is designed primarily for
mobile devices, however, if the demand is there it could be tweaked to also support other
HTML5 compatible browsers

Section: Version History
21/05/2010 (DJO) - Created File
*/

// define the tiler config
SLICK.TilerConfig = {
    TILESIZE: 128,
    // TODO: put some logic in to determine optimal buffer size based on connection speed...
    TILEBUFFER: 1,
    TILEBUFFER_LOADNEW: 0.2,
    // TODO: change this to a real default value
    EMPTYTILE: "/public/images/tile.png"
}; // TilerConfig

// define the slick tile borders
SLICK.Border = {
    NONE: 0,
    TOP: 1,
    RIGHT: 2,
    BOTTOM: 3,
    LEFT: 4
}; // Border

SLICK.TileGrid = function(args) {
    // initialise defaults
    var BUFFER_COUNT = 2;
    var DEFAULT_ARGS = {
        tilesize: SLICK.TilerConfig.TILESIZE,
        width: 800,
        height: 600,
        onNeedTiles: null
    }; // DEFAULT_ARGS
    
    var DEFAULT_BG = "rgb(200, 200, 200)";
    
    // check the tile size is not equal to 0
    if (tile_size == 0) {
        throw new Exception("Cannot create new TileGrid: Tile size cannot be 0");
    } // if
    
    // extend the args with the default args
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    LOGGER.info("Creating a tiler with tilesize " + args.tilesize);
    
    // define constants
    var REDRAW_DELAY = 50;
    var GRID_LINE_SPACING = 16;
    var QUEUE_REDRAW_DELAY = 200;
    
    // calculate the col and row count
    var tile_size = args.tilesize;
    var col_count = Math.ceil(args.width / tile_size) + SLICK.TilerConfig.TILEBUFFER;
    var row_count = Math.ceil(args.height / tile_size) + SLICK.TilerConfig.TILEBUFFER;
    var redraw_timeout = 0;
    var queued_tiles = [];
    var queued_load_timeout = 0;
    var updating_tile_canvas = false;
    var update_listeners = [];
    var checkbuffers_timer = 0;
    
    // ensure that both column and row count are odd, so we have a center tile
    // TODO: perhaps this should be optional...
    col_count = col_count % 2 == 0 ? col_count + 1 : col_count;
    row_count = row_count % 2 == 0 ? row_count + 1 : row_count;
    
    // calculate the layer width
    args.width = col_count * tile_size;
    args.height = row_count * tile_size;
    
    // create placeholder canvas
    var placeholder_tile = document.createElement("canvas");
    placeholder_tile.width = tile_size;
    placeholder_tile.height = tile_size;
    prepCanvas(placeholder_tile);
    
    // initialise the tile array
    var tiles = new Array(col_count * row_count);
    
    function drawTile(tile, col, row) {
        // get the offscreen context
        var tile_context = self.getContext();
        
        // draw the tile ot the canvas
        tile_context.drawImage(tile, col * tile_size, row * tile_size, tile_size, tile_size);
        
        // let the update listeners know we have loaded
        for (var ii = 0; ii < update_listeners.length; ii++) {
            update_listeners[ii]();
        } // for
    } // drawTile
    
    function monitorTile(monitor_tile, init_col, init_row) {
        if (monitor_tile.src && (! monitor_tile.complete)) {
            // add the tile to the queued tiles array
            queued_tiles.push({
                tile: monitor_tile,
                col: init_col,
                row: init_row
            });
            
            // draw the placeholder to the column and row
            drawTile(placeholder_tile, init_col, init_row);
        
            monitor_tile.onload = function() {
                if (! updating_tile_canvas) {
                    clearTimeout(queued_load_timeout);
                    queued_load_timeout = setTimeout(function() {
                        // flag the we are updating the tile canvas
                        updating_tile_canvas = true;
                        try {
                            // iterate through the tiles in the queued tiles and if they are loaded, then draw them
                            var ii = 0;
                            while (ii < queued_tiles.length) {
                                if (queued_tiles[ii].tile.complete) {
                                    drawTile(
                                        queued_tiles[ii].tile, 
                                        queued_tiles[ii].col, 
                                        queued_tiles[ii].row);
                    
                                    // splice the current tile out of the array
                                    queued_tiles.splice(ii, 1);
                                }
                                else {
                                    ii++;
                                } // if..else
                            } // while
                        } 
                        catch (e) {
                            LOGGER.exception(e);
                        }
                        finally {
                            updating_tile_canvas = false;
                        } // try..finally
                    }, QUEUE_REDRAW_DELAY);
                } // if
            };
        }
        else {
            drawTile(monitor_tile, init_col, init_row);
        } // if..else
    } // monitorTile
    
    function needTiles(offset, offset_delta) {
        // initialise the return offset
        var fnresult = new SLICK.Vector(offset.x, offset.y);
        
        // fire the on need tiles event
        if (args.onNeedTiles) {
            queued_tiles = [];
            args.onNeedTiles(offset_delta);
            
            // shift the canvas by the required amount
            // shiftCanvas(offset_delta);
            
            /*
            // shift the queued tiles
            for (var ii = 0; ii < queued_tiles.length; ii++) {
                queued_tiles[ii].col += offset_delta.cols;
                queued_tiles[ii].row += offset_delta.rows;
            } // for
            
            */
            
            fnresult.x += tile_size * offset_delta.cols;
            fnresult.y += tile_size * offset_delta.rows;
        } // if
        
        return fnresult;
    } // loadTiles
    
    function prepCanvas(prep_canvas) {
        // if the canvas is not defined, then log a warning and return
        if (! prep_canvas) {
            LOGGER.warn("Cannot prep canvas - not supplied");
            return;
        } // if
        
        // get the tile context
        var tile_context = prep_canvas.getContext("2d");
        
        tile_context.fillStyle = "rgb(200, 200, 200)";
        tile_context.fillRect(0, 0, prep_canvas.width, prep_canvas.height);
        
        // set the context line color and style
        tile_context.strokeStyle = "rgb(180, 180, 180)";
        tile_context.lineWidth = 0.5;

        for (var xx = 0; xx < prep_canvas.width; xx += GRID_LINE_SPACING) {
            // draw the column lines
            tile_context.beginPath();
            tile_context.moveTo(xx, 0);
            tile_context.lineTo(xx, prep_canvas.height);
            tile_context.stroke();
            tile_context.closePath();

            for (var yy = 0; yy < prep_canvas.height; yy += GRID_LINE_SPACING) {
                // draw the row lines
                tile_context.beginPath();
                tile_context.moveTo(0, yy);
                tile_context.lineTo(prep_canvas.width, yy);
                tile_context.stroke();
                tile_context.closePath();
            } // for
        } // for        
    }
    
    // initialise the parent
    var parent = new SLICK.OffscreenCanvas(args);
    
    // initialise self
    var self = jQuery.extend({}, parent, {
        customdata: {},
        columns: col_count,
        rows: row_count,
        centerTile: { 
            col: Math.ceil(col_count * 0.5),
            row: Math.ceil(row_count * 0.5)
        },
        
        /*
        This function is used to determine whether we have sufficient tiles, or whether additional
        tiles need to be loaded due to panning.  Note that tile buffers should not be examined or 
        re-evaluated when scaling as it would just be silly...
        */
        checkTileBuffers: function(view, buffer_required) {
            // if the buffer required is not defined, then set to the default
            if (! buffer_required) {
                buffer_required = SLICK.TilerConfig.TILEBUFFER_LOADNEW;
            } // if
            
            // get the offset and dimensions
            var offset = view.pannable ? view.getOffset() : new Vector();
            var dimensions = view.getDimensions();
            
            // calculate the current display rect
            var display_rect = {
                top: offset.y,
                left: offset.x,
                bottom: offset.y + dimensions.height,
                right: offset.x + dimensions.width
            }; 
            var offset_delta = {
                cols: 0,
                rows: 0
            };
            
            LOGGER.info(String.format("CHECKING TILE BUFFERS, display rect = (top: {0}, left: {1}, bottom: {2}, right: {3})", display_rect.top, display_rect.left, display_rect.bottom, display_rect.right));

            // check the y tolerances
            if (display_rect.top <= (tile_size * buffer_required)) {
                offset_delta.rows = Math.abs(Math.floor(display_rect.top / tile_size)) + 1;
            }
            else if (display_rect.bottom + (tile_size * buffer_required) >= self.height) {
                offset_delta.rows = -(Math.floor((display_rect.bottom - self.height) / tile_size) + 1);
            } // if..else

            // check the x tolerances
            if (display_rect.left <= (tile_size * buffer_required)) {
                offset_delta.cols = Math.abs(Math.floor(display_rect.left / tile_size)) + 1;
            }
            else if (display_rect.right + (tile_size * buffer_required) >= self.width) {
                offset_delta.cols = -(Math.floor((display_rect.right - self.width) / tile_size) + 1);
            } // if..else

            // if things have changed then we need to change them
            if ((offset_delta.rows !== 0) || (offset_delta.cols !== 0)) {
                updated_offset = needTiles(offset, offset_delta);
                view.updateOffset(updated_offset.x, updated_offset.y);
            } // if
        },
        
        requestUpdates: function(listener) {
            update_listeners.push(listener);
        },
        
        getGridHeight: function() {
            return row_count * tile_size;
        },
        
        getGridWidth: function() {
            return col_count * tile_size;
        },
        
        getTile: function(col, row) {
            if ((col < col_count) && (col >= 0) && (row < row_count) && (row >= 0)) {
                return tiles[(row * row_count) + col];
            } // if
            
            // otherwise, return null
            return null;
        },
        
        setTile: function(col, row, tile) {
            tile = tile ? tile : placeholder_tile;
            
            // update the tile in the arrah
            tiles[(row * row_count) + col] = tile;
            
            // draw the tile if valid
            if (tile) {
                monitorTile(tile, col, row);
            } // if
        },
        
        getTileSize: function() {
            return tile_size;
        }
    });
    
    return self;
}; // SLICK.TileGrid

SLICK.Tiler = function(args) {
    // define default args
    var DEFAULT_ARGS = {
        container: "",
        panHandler: null,
        tapHandler: null,
        onDraw: null
    }; 
    
    // TODO: add some error detection here
    
    // apply touch functionality
    jQuery(args.container).canTouchThis({
        touchStartHandler: function(x, y) {
            // reset the scale to 0
            self.scale(0);
        },

        tapHandler: function(x, y) {
            if (self.args.tapHandler) {
                self.args.tapHandler(x, y);
            } // if
        }
    });
    
    // initialise layers
    var grid = null;
    var overlays = [];
    
    // create the parent
    var view = new SLICK.View(jQuery.extend({}, args, {
        onDraw: function(context) {
            if (grid) {
                grid.drawToView(view);
                
                // iterate through the overlays and draw them to the view also
                for (var ii = 0; ii < overlays.length; ii++) {
                    overlays[ii].drawToView(view);
                } // for
            } // if
            
            // if we have been passed an onDraw handler, then call that too
            if (self.args.onDraw) {
                self.args.onDraw(context);
            } // if
        }
    }));
    
    // create some behaviour mixins
    var pannable = new SLICK.Pannable({
        container: args.container,
        /*
        checkOffset: function(offset) {
            if (grid) {
                // get the dimensions of the tiler
                var dimensions = self.getDimensions();
                
                LOGGER.info("offset before check: " + offset);
                offset.x = Math.min(Math.max(offset.x, 0), grid.width - dimensions.width);
                offset.y = Math.min(Math.max(offset.y, 0), grid.height - dimensions.height);
                LOGGER.info("offset after check:  " + offset);
            } // if
            
            return offset;
        },
        */
        onPan: function(x, y) {
            if (grid) {
                self.invalidate(true);
                
                // get the grid to check tile buffers
                grid.checkTileBuffers(self);
                
                // if we have a pan handler defined, then call it
                if (self.args.panHandler) {
                    self.args.panHandler(x, y);
                } // if
            } // if
        }
    }); // pannable
    
    var scalable = new SLICK.Scalable({
        container: args.container,
        onScale: function(scale_amount) {
            if (grid) {
                self.invalidate(true);
            } // if
        }
    }); // scalable
    
    // initialise self
    var self = jQuery.extend(view, pannable, scalable, {
        args: jQuery.extend({}, DEFAULT_ARGS, args),
        
        getGrid: function() {
            return grid;
        },
        
        setGrid: function(value) {
            grid = value;
            self.invalidate();
            
            grid.requestUpdates(function() {
                self.invalidate();
            });
        },
        
        gridPixToViewPix: function(vector) {
            var offset = self.getOffset();
            return new SLICK.Vector(vector.x - offset.x, vector.y - offset.y);
        },
        
        viewPixToGridPix: function(vector) {
            var offset = self.getOffset();
            LOGGER.info("Offset = " + offset);
            return new SLICK.Vector(vector.x + offset.x, vector.y + offset.y);
        }
    }); // self
    
    return self;
}; // Tiler
