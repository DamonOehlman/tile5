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
    TILESIZE: 256,
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

SLICK.Graphics = (function() {
    TileStore = function(params) {
        // initialise defaults
        var DEFAULT_PARAMS = {
            gridSize: 70,
            center: new SLICK.Vector()
        };
        
        // initialise the parameters with the defaults
        params = GRUNT.extend({}, DEFAULT_PARAMS, params);
        
        // initialise the storage array
        var storage = new Array(Math.pow(params.gridSize, 2));
        var gridHalfWidth = Math.ceil(params.gridSize * 0.5);
        var topLeftOffset = params.center.offset(-gridHalfWidth, -gridHalfWidth);
        
        GRUNT.Log.info("created tile store with tl offset = " + topLeftOffset);
        
        function getTileIndex(col, row) {
            return (row * params.gridSize) + col;
        } // getTileIndex
        
        function shiftOrigin(col, row) {
            // TODO: move the tiles around
        } // shiftOrigin
        
        // initialise self
        var self = {
            getGridSize: function() {
                return params.gridSize;
            },
            
            getNormalizedPos: function(col, row) {
                return new SLICK.Vector(col, row).add(topLeftOffset.invert());
            },
            
            getTile: function(col, row) {
                return storage[getTileIndex(col, row)];
            },
            
            setTile: function(col, row, tile) {
                storage[getTileIndex(col, row)] = tile;
            },
            
            /*
            What a cool function this is.  Basically, this goes through the tile
            grid and creates each of the tiles required at that position of the grid.
            The tileCreator is a callback function that takes a two parameters (col, row) and
            can do whatever it likes but should return a Tile object or null for the specified
            column and row.
            */
            populate: function(tileCreator, notifyListener) {
                // take a tick count as we want to time this
                var startTicks = new Date().getTime();
                var tileIndex = 0;
                
                GRUNT.Log.info("poulating grid, top left offset = " + topLeftOffset);

                if (tileCreator) {
                    for (var row = 0; row < params.gridSize; row++) {
                        for (var col = 0; col < params.gridSize; col++) {
                            var tile = tileCreator(col, row, topLeftOffset, params.gridSize);
                        
                            // if the tile was created and we have a notify listener request updates
                            if (tile && notifyListener) {
                                tile.requestUpdates(notifyListener);
                            } // if
                        
                            // add the tile to storage
                            storage[tileIndex++] = tile;
                        } // for
                    } // for
                } // if

                // log how long it took
                GRUNT.Log.info("tile grid populated with " + tileIndex + " tiles in " + (new Date().getTime() - startTicks) + " ms");
            },
            
            /*
            The setOrigin method is used to tell the tile store the position of the center tile in the grid
            */
            setOrigin: function(col, row) {
                if (! tileOrigin) {
                    topLeftOffset = new SLICK.Vector(col, row).offset(-tileHalfWidth, -tileHalfWidth);
                }
                else {
                    shiftOrigin(col, row);
                } // if..else
            }
        };
        
        return self;
    };
    
    var module = {
        // define module requirements
        requires: ["Resources"],
        
        View: function(params) {
            // initialise defaults
            params = GRUNT.extend({
                container: "",
                fillBackground: null,
                // TODO: reimplement the gutter size at a later time
                gutterSize: 0,
                fps: 20
            }, params);

            // get the container context
            // TODO: attach a resize event to the canvas...
            var canvas = jQuery(params.container).get(0);
            var main_context = null;
            if (canvas) {
                try {
                    main_context = canvas.getContext('2d');
                } 
                catch (e) {
                    GRUNT.Log.exception(e);
                    throw "Could not initialise canvas on specified tiler element";
                }
            } // if

            var redraw_timer = 0;
            var redraw_sleep = Math.floor(1000 / params.fps);

            // TODO: at some stage make the buffer canvas centered (i.e. gutter both sides)
            var buffer_canvas = document.createElement("canvas");
            buffer_canvas.height = canvas.height + params.gutterSize;
            buffer_canvas.width = canvas.width + params.gutterSize;
            
            // calculate the buffer canvas aspect ratio
            var bufferCanvasAR = buffer_canvas.width !== 0 ? buffer_canvas.height / buffer_canvas.width : 1;

            // get the cached context
            var buffer_context = buffer_canvas.getContext("2d");
            var buffer_offset = new SLICK.Vector();

            function defaultBackgroundFill(context, x, y, width, height) {
                context.fillStyle = "rgb(180, 180, 180)";
                context.fillRect(0, 0, width, height);
            } // defaultBackgroundFill

            function drawToBuffer() {
                // capture the offset at this particular point in time
                if (params.onDraw) {
                    params.onDraw(buffer_context, buffer_canvas.width, buffer_canvas.height);
                } // if

                buffer_offset = self.pannable ? self.getOffset() : new SLICK.Vector();
            } // drawToCache

            function drawBufferToMain() {
                // get the current offset
                var currentOffset = self.pannable ? self.getOffset() : new SLICK.Vector();

                if (main_context) {
                    var topX = buffer_offset.x - currentOffset.x;
                    var topY = buffer_offset.y - currentOffset.y;
                    var drawWidth = buffer_canvas.width - Math.abs(topX); // , canvas.width - Math.abs(topX));
                    var drawHeight = buffer_canvas.height - Math.abs(topY); // , canvas.height - Math.abs(topX));

                    if ((drawWidth > 0) && (drawHeight > 0)) {
                        // fill the background
                        params.fillBackground ? 
                            params.fillBackground(main_context, topX, topY, buffer_canvas.width, buffer_canvas.height) : 
                            defaultFillBackground(main_context, topX, topY, buffer_canvas.width, buffer_canvas.height);
                            
                        // if we are scalable and scaling, then pinch and zoom
                        if (self.scalable && self.getScaling()) {
                            drawScaledBuffer();
                        }
                        else {
                            main_context.drawImage(
                                buffer_canvas, // the source canvas
                                topX < 0 ? Math.abs(topX) : 0, // the source x, y, width and height
                                topY < 0 ? Math.abs(topY) : 0, 
                                drawWidth,
                                drawHeight,
                                topX > 0 ? topX : 0, // the dest x, y, width and height
                                topY > 0 ? topY : 0,
                                drawWidth,
                                drawHeight);                            
                        }
                    } // if
                } // if
            } // drawBufferToMain
            
            function drawScaledBuffer() {
                // get the scaling rects
                var startRect = self.getStartRect();
                var endRect = self.getEndRect();
                var startRectSize = startRect.getSize();
                var endRectSize = endRect.getSize();

                // if we are scaling down, then
                // TODO: expand the start and end rects so the displays fill the screen
                if (startRectSize > endRectSize) {
                }
                // otherwise
                else {
                
                } // if..else
                
                if (startRect && endRect) {
                    main_context.drawImage(
                        buffer_canvas,
                        startRect.origin.x, 
                        startRect.origin.y,
                        startRect.dimensions.width,
                        startRect.dimensions.height,
                        endRect.origin.x,
                        endRect.origin.y,
                        endRect.dimensions.width,
                        endRect.dimensions.height);
                } // if
            } // drawScaledBuffer

            // initialise self
            var self = {
                getContext: function() {
                    return buffer_context;
                },

                getDimensions: function() {
                    // get the jquery wrapper
                    var jq_container = jQuery(canvas);

                    return new SLICK.Dimensions(jq_container.width(), jq_container.height()); 
                },

                invalidate: function(args) {
                    args = GRUNT.extend({
                        force: false
                    }, args);

                    if (args.force) {
                        drawToBuffer();
                    } 
                    else {
                        if (redraw_timer) {
                            clearTimeout(redraw_timer);
                        } // if

                        redraw_timer = setTimeout(function() {
                            drawToBuffer();
                            drawBufferToMain(params.scale);
                            redraw_timer = 0;
                        }, redraw_sleep); // this redraw time equates to approx 25FPS
                    } // if

                    // draw the cached_context to the 
                    drawBufferToMain();
                }
            };

            return self;            
        },
        
        // FIXME: Good idea, but doesn't work - security exceptions in chrome...
        // some good information here:
        // http://stackoverflow.com/questions/2888812/save-html-5-canvas-to-a-file-in-chrome
        // looks like implementing this isn't going to fly without some support from a device-side
        ImageCache: (function() {
            // initialise variables
            var storageCanvas = null;
            
            function getStorageContext(image) {
                if (! storageCanvas) {
                    storageCanvas = document.createElement('canvas');
                }  // if

                // update the canvas to the correct width
                storageCanvas.width = image.width;
                storageCanvas.height = image.height;
                
                return storageCanvas.getContext('2d');
            }
            
            function imageToCanvas(image) {
                // get the storage context
                var context = getStorageContext(image);
                
                // draw the image to the context
                context.drawImage(image, 0, 0);
                
                // return the canvas
                return storageCanvas;
            }
            
            // initialise self
            var self = {
                // TODO: use this method to return an image from the key value local storage 
                getImage: function(url, sessionParamRegex) {
                    // ask the resources module to get the cacheable key for the url
                    var cacheKey = SLICK.Resources.Cache.getUrlCacheKey(url, sessionParamRegex);
                    
                    return null;
                },
                
                cacheImage: function(url, sessionParamRegex, image) {
                    // get the cache key
                    var cacheKey = SLICK.Resources.Cache.getUrlCacheKey(url, sessionParamRegex);
                    
                    // if we have local storage then save it
                    if (image) {
                        SLICK.Resources.Cache.write(cacheKey, imageToCanvas(image).toDataURL('image/png'));
                    } // if
                }
            };
            
            return self;
        })(),

        Sprite: function(params) {
            // initailise variables
            var listeners = [];
            
            // initialise self
            var self = {
                loaded: false,
                
                changed: function(tile) {
                    for (var ii = 0; ii < listeners.length; ii++) {
                        listeners[ii](tile);
                    } // for
                },
                
                draw: function(context, x, y) {
                    
                },
                
                load: function() {
                },
                
                requestUpdates: function(callback) {
                    listeners.push(callback);
                }
            };
            
            return self;
        },
        
        ImageTile: function(params) {
            // initialise parameters with defaults
            params = GRUNT.extend({
                url: "",
                sessionParamRegex: null
            }, params);
            
            // initialise parent
            var parent = new module.Sprite(params);
            var image = null;
            
            // initialise self
            var self = GRUNT.extend({}, parent, {
                draw: function(context, x, y) {
                    if (image && image.complete) {
                        // TODO: handle scaling
                        context.drawImage(image, x, y);
                    } // if
                },
                
                load: function() {
                    if ((! image)  && params.url) {
                        // create the image
                        image = null; // module.ImageCache.getImage(params.url, params.sessionParamRegex);
                        
                        // if we didn't get an image from the cache, then load it
                        if (! image) {
                            image = new Image();
                            image.src = params.url;

                            // watch for the image load
                            image.onload = function() {                                
                                // module.ImageCache.cacheImage(params.url, params.sessionParamRegex, image);
                                
                                self.loaded = true;
                                self.changed(self);
                            }; // onload
                            
                        } // if
                    }
                }
            }); 
            
            return self;
        },
        
        EmptyGridTile: function(params) {
            // initialise parameters with defaults
            params = GRUNT.extend({
                tileSize: 256,
                gridLineSpacing: 16
            }, params);
            
            // initialise the parent
            var parent = new module.Sprite(params);
            var buffer = null;
            
            function prepBuffer() {
                // if the buffer has not beem created, then create it
                if (! buffer) {
                    buffer = document.createElement("canvas");
                    buffer.width = params.tileSize;
                    buffer.height = params.tileSize;
                } // if
                
                // get the tile context
                var tile_context = buffer.getContext("2d");

                tile_context.fillStyle = "rgb(200, 200, 200)";
                tile_context.fillRect(0, 0, buffer.width, buffer.height);

                // set the context line color and style
                tile_context.strokeStyle = "rgb(180, 180, 180)";
                tile_context.lineWidth = 0.5;

                for (var xx = 0; xx < buffer.width; xx += params.gridLineSpacing) {
                    // draw the column lines
                    tile_context.beginPath();
                    tile_context.moveTo(xx, 0);
                    tile_context.lineTo(xx, buffer.height);
                    tile_context.stroke();
                    tile_context.closePath();

                    for (var yy = 0; yy < buffer.height; yy += params.gridLineSpacing) {
                        // draw the row lines
                        tile_context.beginPath();
                        tile_context.moveTo(0, yy);
                        tile_context.lineTo(buffer.width, yy);
                        tile_context.stroke();
                        tile_context.closePath();
                    } // for
                } // for        
            } // prepBuffer
            
            // initialise self
            var self = GRUNT.extend({}, parent, {
                draw: function(context, x, y, scale) {
                    // draw the buffer to the context
                    // TODO: handle scaling
                    context.drawImage(buffer, x, y);
                },
                
                getBuffer: function() {
                    return buffer;
                },
                
                getTileSize: function() {
                    return params.tileSize;
                }
            });
            
            // prep the buffer
            prepBuffer();
            
            return self;
        },
        
        TileGrid: function(params) {
            // initialise default params
            var DEFAULT_PARAMS = {
                emptyTileImage: null,
                tileSize: SLICK.TilerConfig.TILESIZE,
                emptyTile: null,
                center: new SLICK.Vector()
            };
            
            // extend the params with the defaults
            params = GRUNT.extend({}, DEFAULT_PARAMS, params);
            
            // initialise varibles
            var halfTileSize = Math.round(params.tileSize * 0.5);
            var listeners = [];
            var invTileSize = params.tileSize ? 1 / params.tileSize : 0;
            
            // create the tile store
            var tileStore = new TileStore(params);
            
            // create the offscreen buffer
            var buffer = null;
            
            function notifyListeners(tile) {
                for (var ii = 0; ii < listeners.length; ii++) {
                    listeners[ii](tile);
                } // for
            } // notifyListeners
            
            // initialise self
            var self = {
                addTile: function(col, row, tile) {
                    // update the tile store 
                    tileStore.setTile(col, row, tile);
                    
                    if (tile) {
                        // when the tile changes, flag updates
                        tile.requestUpdates(function(tile) {
                            notifyListeners(tile);
                        });
                    }
                },
                
                getTileSize: function() {
                    return params.tileSize;
                },
                
                getTileVirtualXY: function(col, row, getCenter) {
                    // get the normalized position from the tile store
                    var pos = tileStore.getNormalizedPos(col, row);
                    
                    GRUNT.Log.info("normalised pos = " + pos);
                    var fnresult = new SLICK.Vector(pos.x * params.tileSize, pos.y * params.tileSize);
                    
                    if (getCenter) {
                        fnresult.x += halfTileSize;
                        fnresult.y += halfTileSize;
                    }
                    
                    return fnresult;
                },
                
                getCenterXY: function() {
                    // get the center column and row index
                    var midIndex = Math.ceil(tileStore.getGridSize() * 0.5);
                    
                    return self.getTileVirtualXY(midIndex, midIndex, true);
                },
                
                draw: function(context, offsetX, offsetY, width, height) {
                    // find the tile for the specified position
                    var tileStart = new SLICK.Vector(Math.floor(offsetX * invTileSize), Math.floor(offsetY * invTileSize));
                    var tileCols = Math.ceil(width * invTileSize) + 1;
                    var tileRows = Math.ceil(height * invTileSize) + 1;
                    var tileOffset = new SLICK.Vector(
                        (tileStart.x * params.tileSize) - offsetX,
                        (tileStart.y * params.tileSize) - offsetY);
                    
                    // right, let's draw some tiles (draw rows first)
                    for (var yy = 0; yy < tileRows; yy++) {
                        // initialise the y position
                        var yPos = yy * params.tileSize + tileOffset.y;
                        
                        // iterate through the columns and draw the tiles
                        for (var xx = 0; xx < tileCols; xx++) {
                            // get the tile
                            var tile = tileStore.getTile(xx + tileStart.x, yy + tileStart.y);
                            var xPos = xx * params.tileSize + tileOffset.x;
                            
                            // if the tile is loaded, then draw, otherwise load
                            if (tile && tile.loaded) {
                                tile.draw(context, xPos, yPos);
                            }
                            else {
                                if (params.emptyTile) {
                                    params.emptyTile.draw(context, xPos, yPos);
                                }
                                
                                if (tile) {
                                    tile.load();
                                } // if
                            } // if..else
                        } // for
                    } // for
                },
                
                /*
                Get the virtual dimensions of the tile grid 
                */
                getDimensions: function() {
                    var widthHeight = tileStore.getGridSize() * params.tileSize;
                    return new SLICK.Dimensions(widthHeight, widthHeight);
                },

                populate: function(tileCreator) {
                    tileStore.populate(tileCreator, function(tile) {
                        notifyListeners(tile);
                    });
                },
                
                requestUpdates: function(callback) {
                    listeners.push(callback);
                }
            };
            
            return self;
        }
    }; 
    
    return module;
})();

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
            // self.scale(1);
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
    
    // create the empty tile
    var emptyTile = new SLICK.Graphics.EmptyGridTile();
    var tileSize = emptyTile.getTileSize();
    
    // create the parent
    var view = new SLICK.Graphics.View(GRUNT.extend({}, args, {
        fillBackground: function(context, x, y, width, height) {
            var gradient = context.createLinearGradient(x, 0, x, height);
            gradient.addColorStop(0, "rgb(170, 170, 170)");
            gradient.addColorStop(1, "rgb(210, 210, 210)");
            
            context.fillStyle = gradient; 
            context.fillRect(0, 0, width, height);
        },
        
        onDraw: function(context, width, height) {
            // get the offset
            var offset = self.getOffset();
            
            if (grid) {
                grid.draw(context, offset.x, offset.y, width, height);
                
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

        onPan: function(x, y) {
            if (grid) {
                self.invalidate();
                
                // if we have a pan handler defined, then call it
                if (self.args.panHandler) {
                    self.args.panHandler(x, y);
                } // if
            } // if
        }
    }); // pannable
    
    var scalable = new SLICK.Scalable({
        container: args.container,
        onPinchZoom: function() {
            if (grid) {
                self.invalidate();
            } // if
        },
        
        onScale: function() {
            GRUNT.Log.info("** SCALING COMPLETE **");
        }
    }); // scalable
    
    // initialise self
    var self = GRUNT.extend(view, pannable, scalable, {
        args: GRUNT.extend({}, DEFAULT_ARGS, args),
        
        getGrid: function() {
            return grid;
        },
        
        setGrid: function(value) {
            grid = value;
            
            if (grid) {
                /* 
                REMOVED: as this calculation is done when panning to position
                var offset = grid.getCenterOffset();
                self.updateOffset(offset.x, offset.y);
                */
                
                self.updateOffset(0, 0);
                
                // request updates
                grid.requestUpdates(function(tile) {
                    self.invalidate();
                });
                
                
                self.invalidate();
            } // if
        },
        
        gridPixToViewPix: function(vector) {
            var offset = self.getOffset();
            return new SLICK.Vector(vector.x - offset.x, vector.y - offset.y);
        },
        
        viewPixToGridPix: function(vector) {
            var offset = self.getOffset();
            GRUNT.Log.info("Offset = " + offset);
            return new SLICK.Vector(vector.x + offset.x, vector.y + offset.y);
        }
    }); // self
    
    return self;
}; // Tiler
