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
        width: 800,
        height: 600,
        tilesize: SLICK.TilerConfig.TILESIZE,
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
    var width = args.width;
    var height = args.height;
    var tile_size = args.tilesize;
    var col_count = Math.ceil(width / tile_size) + SLICK.TilerConfig.TILEBUFFER;
    var row_count = Math.ceil(height / tile_size) + SLICK.TilerConfig.TILEBUFFER;
    var scale_amount = 0;
    var inv_tile_aspect_ratio = 0;
    var inv_screen_aspect_ratio = 0;
    var redraw_timeout = 0;
    var queued_tiles = [];
    var queued_load_timeout = 0;
    var updating_tile_canvas = false;
    var update_listeners = [];
    var checkbuffers_timer = 0;
    var buffer_index = 0;
    
    // ensure that both column and row count are odd, so we have a center tile
    // TODO: perhaps this should be optional...
    col_count = col_count % 2 == 0 ? col_count + 1 : col_count;
    row_count = row_count % 2 == 0 ? row_count + 1 : row_count;
    
    // calculate the initial x and y offsets
    var x_offset = ((col_count * tile_size) - width) * 0.5;
    var y_offset = ((row_count * tile_size) - height) * 0.5;
    LOGGER.info(String.format("offsets = x: {0}, y: {1}", x_offset, y_offset));
    
    var buffers = null;
    createBuffers(BUFFER_COUNT);
    
    // create placeholder canvas
    var placeholder_tile = document.createElement("canvas");
    placeholder_tile.width = tile_size;
    placeholder_tile.height = tile_size;
    prepCanvas(placeholder_tile);
    
    // initialise the tile array
    var tiles = new Array(col_count * row_count);
    
    function createBuffers(buffer_count) {
        // initialise the buffers
        buffers = [];
        
        for (var ii = 0; ii < buffer_count; ii++) {
            // create the canvas
            var buffer_canvas = document.createElement("canvas");
            
            // initialise the canvas size
            buffer_canvas.width = col_count * tile_size;
            buffer_canvas.height = row_count * tile_size;
            
            // add the buffer
            buffers.push(buffer_canvas);
        } // for
        
        // calculate the inverse aspect ratio
        inv_tile_aspect_ratio = row_count / col_count;
        inv_screen_aspect_ratio = height / width;
    } // createBuffers
    
    /*
    This function is used to determine whether we have sufficient tiles, or whether additional
    tiles need to be loaded due to panning.  Note that tile buffers should not be examined or 
    re-evaluated when scaling as it would just be silly...
    */
    function checkTileBuffers(buffer_required) {
        // if the buffer required is not defined, then set to the default
        if (! buffer_required) {
            buffer_required = SLICK.TilerConfig.TILEBUFFER_LOADNEW;
        } // if
        
        // calculate the current display rect
        var display_rect = {
            top: y_offset,
            left: x_offset,
            bottom: y_offset + height,
            right: x_offset + width
        }; 
        var offset_delta = {
            cols: 0,
            rows: 0
        };
        
        // check the y tolerances
        if (display_rect.top <= (tile_size * buffer_required)) {
            offset_delta.rows = 1;
        }
        else if (display_rect.bottom + (tile_size * buffer_required) >= getTileCanvas().height) {
            offset_delta.rows = -1;
        } // if..else
        
        // check the x tolerances
        if (display_rect.left <= (tile_size * buffer_required)) {
            offset_delta.cols = 1;
        }
        else if (display_rect.right + (tile_size * buffer_required) >= getTileCanvas().width) {
            offset_delta.cols = -1;
        } // if..else
        
        // if things have changed then we need to change them
        if ((offset_delta.rows !== 0) || (offset_delta.cols !== 0)) {
            needTiles(offset_delta);
        } // if
    } // checkTileBuffers
    
    function drawTile(tile, col, row, page_index) {
        // get the offscreen context
        var tile_context = getTileCanvas(page_index).getContext("2d");
        
        // draw the tile ot the canvas
        tile_context.drawImage(tile, col * tile_size, row * tile_size, tile_size, tile_size);
        
        // let the update listeners know we have loaded
        for (var ii = 0; ii < update_listeners.length; ii++) {
            update_listeners[ii]();
        } // for
    } // drawTile
    
    function getTileCanvas(index) {
        return buffers[index ? index : buffer_index];
    } // getTileCanvas
    
    function monitorTile(monitor_tile, init_col, init_row) {
        if (monitor_tile.src && (! monitor_tile.complete)) {
            // add the tile to the queued tiles array
            queued_tiles.push({
                tile: monitor_tile,
                col: init_col,
                row: init_row,
                page_index: buffer_index
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
                                        queued_tiles[ii].row, 
                                        queued_tiles[ii].page_index);
                    
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
    
    function needTiles(offset_delta) {
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
            
            // update the offset
            // TODO: the offset calculation amount may need to be provided by the on need tiles function
            x_offset = Math.min(Math.max(x_offset + (tile_size * offset_delta.cols), 0), (col_count * tile_size) - width);
            y_offset = Math.min(Math.max(y_offset + (tile_size * offset_delta.rows), 0), (row_count * tile_size) - height);        
        } // if
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
        tile_context.fillRect(0, 0, width, height);
        
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
    var parent = new SLICK.DrawLayer(args);
    
    // initialise self
    var self = jQuery.extend({}, parent, {
        customdata: {},
        columns: col_count,
        rows: row_count,
        centerTile: { 
            col: Math.ceil(col_count * 0.5),
            row: Math.ceil(row_count * 0.5)
        },
        
        drawToContext: function(context) {
            // get the tile canvas
            var tile_canvas = getTileCanvas();
            
            // fill the background
            context.fillStyle = "rgb(200, 200, 200)";
            context.fillRect(0, 0, width, height);
            
            var dst_x = 0;
            var dst_y = 0;
            var dst_width = width;
            var dst_height = height;
            
            // determine the x_offset and y_offset taking into account the scale
            var src_x = x_offset + scale_amount;
            var src_y = y_offset + scale_amount;
            var src_width = width - (scale_amount * 2);
            var src_height = src_width * inv_screen_aspect_ratio;
            
            if (src_x < 0 || src_x + src_width > tile_canvas.width || src_y < 0 || src_y + src_height > tile_canvas.height) {
                src_x = Math.min(Math.max(src_x, 0), tile_canvas.width);
                src_y = Math.min(Math.max(src_y, 0), tile_canvas.height);
                src_width = Math.min(src_width, tile_canvas.width - src_x);
                src_height = src_width * inv_screen_aspect_ratio;
                
                // check the src height
                if (src_y + src_height > tile_canvas.height) {
                    src_height = tile_canvas.height - src_y;
                    src_width = src_height * (width / height);
                } // if
                
                // determine the destination positions and height
                dst_width = Math.max(Math.min(width + (scale_amount * 2), width), 200);
                dst_height = dst_width * inv_screen_aspect_ratio;
                dst_x = (width - dst_width) * 0.5;
                dst_y = (height - dst_height) * 0.5;
            } // if
            
            // draw the sliced tile grid to the canvas
            context.drawImage(
                tile_canvas, // the source canvas
                src_x, // the source x, y, width and height
                src_y, 
                src_width,
                src_height,
                dst_x, // the dest x, y, width and height
                dst_y,
                dst_width,
                dst_height);
                
            /*
            // draw the sliced tile grid to the canvas
            context.drawImage(
                getTileCanvas(buffer_index ? 0 : 1), // the source canvas
                x_offset, // the source x, y, width and height
                y_offset, 
                width,
                height,
                0, // the dest x, y, width and height
                0,
                width,
                height);
            */
        },
        
        pan: function(x, y) {
            x_offset = Math.min(Math.max(x_offset - x, 0), (col_count * tile_size) - width);
            y_offset = Math.min(Math.max(y_offset - y, 0), (row_count * tile_size) - height);
            
            checkTileBuffers();
        },
        
        scale: function(amount) {
            scale_amount = amount * 0.5;
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
        }
    });
    
    // calculate the offsets
    x_offset = Math.round(((col_count * tile_size) - width) / 2);
    y_offset = Math.round(((row_count * tile_size) - height) / 2);
    
    return self;
}; // SLICK.TileGrid

SLICK.Tiler = function(args) {
    // define default args
    var DEFAULT_ARGS = {
        container: "",
        panHandler: null,
        tapHandler: null
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
    
    // get the container context
    var canvas = jQuery(args.container).get(0);
    var context = null;
    if (canvas) {
        try {
            context = canvas.getContext('2d');
        } 
        catch (e) {
            LOGGER.exception(e);
            throw "Could not initialise canvas on specified tiler element";
        }
    } // if
    var redraw_timer = 0;
    
    // initialise layers
    var grid = null;
    
    // create some behaviour mixins
    var pannable = new SLICK.Pannable({
        container: args.container,
        onPan: function(x, y) {
            if (grid) {
                grid.pan(x, y);
                self.invalidate(true);
                
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
                grid.scale(scale_amount);
                self.invalidate(true);
            } // if
        }
    }); // scalable
    
    // initialise self
    var self = jQuery.extend({}, pannable, scalable, {
        args: jQuery.extend({}, DEFAULT_ARGS, args),
        
        getDimensions: function() {
            // get the jquery wrapper
            var jq_container = jQuery(canvas);
            
            // initialise variables
            var w = jq_container.width();
            var h = jq_container.height();
            
            return {
                width: w,
                height: h,
                center: {
                    x: Math.round(w * 0.5),
                    y: Math.round(h * 0.5)
                }
            }; 
        },
        
        invalidate: function(force) {
            if (force && context && grid) {
                grid.drawToContext(context);
            }
            else if (context && grid && (redraw_timer === 0)) {
                redraw_timer = setTimeout(function() {
                    grid.drawToContext(context);
                    
                    redraw_timer = 0;
                }, 40); // this redraw time equates to approx 25FPS
            } // if
        },
        
        getGrid: function() {
            return grid;
        },
        
        setGrid: function(value) {
            grid = value;
            self.invalidate();
            
            grid.requestUpdates(function() {
                self.invalidate();
            });
        }
    }); // self
    
    return self;
}; // Tiler