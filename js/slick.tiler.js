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
    TILEBUFFER: 6,
    TILEBUFFER_LOADNEW: 1,
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
    var DEFAULT_ARGS = {
        width: 800,
        height: 600,
        tilesize: SLICK.TilerConfig.TILESIZE
    }; // DEFAULT_ARGS
    
    // check the tile size is not equal to 0
    if (tile_size == 0) {
        throw new Exception("Cannot create new TileGrid: Tile size cannot be 0");
    } // if
    
    // extend the args with the default args
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
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
    var x_offset = 0;
    var y_offset = 0;
    var redraw_timeout = 0;
    var queued_tiles = [];
    var queued_load_timeout = 0;
    var updating_tile_canvas = false;
    
    // ensure that both column and row count are odd, so we have a center tile
    // TODO: perhaps this should be optional...
    col_count = col_count % 2 == 0 ? col_count + 1 : col_count;
    row_count = row_count % 2 == 0 ? row_count + 1 : row_count;
    
    // create the offscreen buffer
    var tile_canvas = document.createElement("canvas");
    tile_canvas.width = col_count * tile_size;
    tile_canvas.height = row_count * tile_size;
    
    // initialise the tile array
    var tiles = new Array(col_count * row_count);
    
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
            top: y_offset - tile_size,
            left: x_offset,
            bottom: y_offset + (row_count * tile_size),
            right: x_offset + (col_count * tile_size)
        }; 
        var borders_required = 0;
        var count_delta = {
            cols: 0,
            rows: 0
        };
        var offset_delta = {
            cols: 0,
            rows: 0
        };
        
        // check the y tolerances
        if (tile_size + display_rect.top >= 0) {
            count_delta.rows = 1;
            offset_delta.rows = -1;
        }
        else if (display_rect.bottom - height <= tile_size) {
            count_delta.rows = 1;
        } // if..else
        
        // check the x tolerances
        if (tile_size + display_rect.left >= 0) {
            count_delta.cols = 1;
            offset_delta.cols = -1;
        }
        else if (display_rect.right - width <= tile_size) {
            count_delta.cols = 1;
        } // if..else
        
        // if things have changed then we need to change them
        if ((count_delta.cols || count_delta.rows) && self.onNeedTiles) {
            needTiles(count_delta, offset_delta);
        } // if
    } // checkTileBuffers
    
    function drawTile(tile, col, row) {
        // get the offscreen context
        var tile_context = tile_canvas.getContext("2d");
        
        // draw the tile ot the canvas
        LOGGER.info(String.format("drawing {0} at ({1}, {2})", tile.src, col, row));
        tile_context.drawImage(tile, col * tile_size, row * tile_size, tile_size, tile_size);
    } // drawTile
    
    function monitorTile(monitor_tile, init_col, init_row) {
        if (! monitor_tile.complete) {
            // add the tile to the queued tiles array
            queued_tiles.push({
                tile: monitor_tile,
                col: init_col,
                row: init_row
            });
        
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
                                    drawTile(queued_tiles[ii].tile, queued_tiles[ii].col, queued_tiles[ii].row);
                    
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
    
    function needTiles(count_delta, offset_delta) {
        // LOGGER.info("TILES NEEDED: " + count_delta + ", " + offset_delta);
        
        /*
        TODO: make this work, will probably need some matrix operations :(
        // transpose the tiles
        transposeTiles(col_count + count_delta.cols, row_count + count_delta.rows, offset_delta);
        
        // update the offset
        x_offset += tile_size * offset_delta.cols;
        y_offset += tile_size * offset_delta.rows;

        // fire the on need tiles event
        if (self.onNeedTiles) {
            self.onNeedTiles(tiles, count_delta, offset_delta);
        } // if
        */
    } // loadTiles
    
    function prepTileCanvas() {
        // get the tile context
        var tile_context = tile_canvas.getContext("2d");
        
        // set the context line color and style
        tile_context.strokeStyle = "rgb(180, 180, 180)";
        tile_context.lineWidth = 0.5;

        for (var xx = 0; xx < tile_canvas.width; xx += GRID_LINE_SPACING) {
            // draw the column lines
            tile_context.beginPath();
            tile_context.moveTo(xx, 0);
            tile_context.lineTo(xx, tile_canvas.height);
            tile_context.stroke();
            tile_context.closePath();

            for (var yy = 0; yy < tile_canvas.height; yy += GRID_LINE_SPACING) {
                // draw the row lines
                tile_context.beginPath();
                tile_context.moveTo(0, yy);
                tile_context.lineTo(tile_canvas.width, yy);
                tile_context.stroke();
                tile_context.closePath();
            } // for
        } // for        
    }
    
    function transposeTiles(new_colcount, new_rowcount, offset_delta) {
        // initialise the new tile array
        var tmp_tiles = new Array(new_colcount * new_rowcount);
        
        // initialise start positions
        // TODO: make this work for positive offsets as well
        var start_x = Math.abs(offset_delta.cols);
        var start_y = Math.abs(offset_delta.rows);
        
        // iterate through the new tile array, and load in existing tiles
        for (var xx = start_x; xx < new_colcount; xx++) {
            for (var yy = start_y; yy < new_rowcount; yy++) {
                tmp_tiles[(yy * new_rowcount) + xx] = self.getTile(xx + offset_delta.cols, yy + offset_delta.rows);
            } // for
        } // for
        
        // update the col count and row count to the new values
        col_count = new_colcount;
        row_count = new_rowcount;
        
        // update the tiles array
        tiles = tmp_tiles;
        LOGGER.info(String.format("tiles transposed into array length ({0}), new col count = {1}, new row count = {2}", tiles.length, new_colcount, new_rowcount));
    } // transposeTiles
    
    function queueRedrawToContext(context) {
        if (redraw_timeout) {
            clearTimeout(redraw_timeout);
        } // if
        
        redraw_timeout = setTimeout(function() {
            self.drawToContext(context);
        }, REDRAW_DELAY);
    } // queueRedrawToContext
    
    // initialise self
    var self = {
        customdata: {},
        columns: col_count,
        rows: row_count,
        centerTile: { 
            col: Math.ceil(col_count * 0.5),
            row: Math.ceil(row_count * 0.5)
        },
        
        drawToContext: function(context) {
            context.fillStyle = "rgb(200, 200, 200)";
            context.fillRect(0, 0, width, height);
            
            // draw the sliced tile grid to the canvas
            context.drawImage(
                tile_canvas, // the source canvas
                x_offset, // the source x, y, width and height
                y_offset, 
                width,
                height,
                0, // the dest x, y, width and height
                0,
                width,
                height);
        },
        
        pan: function(x, y) {
            x_offset = Math.min(Math.max(x_offset - x, 0), (col_count * tile_size) - width);
            y_offset = Math.min(Math.max(y_offset - y, 0), (row_count * tile_size) - height);
            
            // check the tile buffers
            checkTileBuffers();
        },
        
        getTile: function(col, row) {
            if ((col < col_count) && (col >= 0) && (row < row_count) && (row >= 0)) {
                return tiles[(row * row_count) + col];
            } // if
            
            // otherwise, return null
            return null;
        },
        
        setTile: function(col, row, tile) {
            tiles[(row * row_count) + col] = tile;
            
            // draw the tile if valid
            if (tile && tile.src) {
                monitorTile(tile, col, row);
            } // if
        },
        
        // event handlers templates
        
        onNeedTiles: function(grid, count_delta, offset_delta) {
            
        }
    };
    
    // calculate the offsets
    x_offset = Math.round(((col_count * tile_size) - width) / 2);
    y_offset = Math.round(((row_count * tile_size) - height) / 2);
    
    // prep the tile canvas
    prepTileCanvas();
    
    return self;
}; // SLICK.TileGrid

SLICK.Tiler = function(args) {
    // define default args
    var DEFAULT_ARGS = {
        container: "",
        panHandler: null
    }; 
    
    // TODO: add some error detection here
    
    // apply touch functionality
    jQuery(args.container).canTouchThis({
        moveHandler: function(x, y) {
            self.pan(x, y);
        }
    });
    
    // get the container context
    var canvas = jQuery(args.container).get(0);
    var context = null;
    if (canvas) {
        context = canvas.getContext('2d');
    } // if
    var redraw_timer = 0;
    
    
    // initialise layers
    var grid = null;
    
    // initialise self
    var self = {
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
        
        invalidate: function() {
            /*
            // TODO: set a timer or something to reduce repainting overheads
            if (context && grid && (redraw_timer === 0)) {
                redraw_timer = setTimeout(function() {
                    grid.drawToContext(context);
                    
                    redraw_timer = 0;
                }, 40); // this redraw time equates to approx 25FPS
            } // if
            */
            
            if (context && grid) {
                grid.drawToContext(context);
            } // if
        },
        
        getGrid: function() {
            return grid;
        },
        
        setGrid: function(value) {
            grid = value;
            self.invalidate();
        },
        
        pan: function(x, y) {
            if (grid) {
                grid.pan(x, y);
                self.invalidate();
                
                // if we have a pan handler defined, then call it
                if (self.args.panHandler) {
                    self.args.panHandler(x, y);
                } // if
            } // if
        }
    }; // self
    
    return self;
}; // Tiler