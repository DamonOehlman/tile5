SLICK.Tiling = (function() {
    TileStore = function(params) {
        // initialise defaults
        var DEFAULT_PARAMS = {
            gridSize: 50,
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
    
    // define the module
    var module = {
        // define the tiler config
        Config: {
            TILESIZE: 256,
            // TODO: put some logic in to determine optimal buffer size based on connection speed...
            TILEBUFFER: 1,
            TILEBUFFER_LOADNEW: 0.2,
            // TODO: change this to a real default value
            EMPTYTILE: "/public/images/tile.png"
        },
        
        Tile: function(params) {
            params = GRUNT.extend({
            }, params);
            
            // initialise self
            var self = GRUNT.extend(new SLICK.Graphics.Sprite(params), {
            });
            
            return self;
        },
        
        ImageTile: function(params) {
            // initialise parameters with defaults
            params = GRUNT.extend({
                url: "",
                sessionParamRegex: null
            }, params);
            
            // initialise parent
            var parent = new module.Tile(params);
            var image = null;
            
            // initialise self
            var self = GRUNT.extend({}, parent, {
                draw: function(context, x, y) {
                    if (image && image.complete) {
                        context.drawImage(image, x, y);
                    } // if
                },
                
                load: function(callback) {
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
                                
                                // if we have a callback method, then call that
                                if (callback) {
                                    callback();
                                } // if
                                
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
            var parent = new SLICK.Graphics.Sprite(params);
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

                tile_context.beginPath();
                
                for (var xx = 0; xx < buffer.width; xx += params.gridLineSpacing) {
                    // draw the column lines
                    tile_context.moveTo(xx, 0);
                    tile_context.lineTo(xx, buffer.height);

                    for (var yy = 0; yy < buffer.height; yy += params.gridLineSpacing) {
                        // draw the row lines
                        tile_context.moveTo(0, yy);
                        tile_context.lineTo(buffer.width, yy);
                    } // for
                } // for    
                
                tile_context.stroke();
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
        
        TileGridBackground: function(params) {
            params = GRUNT.extend({
                lineDist: 16,
                fillStyle: "rgb(200, 200, 200)",
                strokeStyle: "rgb(180, 180, 180)",
                zindex: -1,
                draw: drawTileBackground
            });
            
            var gridSection = document.createElement('canvas');
            gridSection.width = params.lineDist;
            gridSection.height = params.lineDist;
            
            var sectionContext = gridSection.getContext("2d");
            sectionContext.fillStyle = params.fillStyle;
            sectionContext.strokeStyle = params.strokeStyle;

            // initialise the grid pattern
            var gridPattern = null;
            
            function drawTileBackground(drawArgs) {
                var lineX = params.lineDist - Math.abs(drawArgs.offset.x % params.lineDist);
                var lineY = Math.abs(drawArgs.offset.y % params.lineDist);
                
                // GRUNT.Log.info("line x = " + lineX + ", line y = " + lineY);
                
                // if the grid pattern is not defined, then do that now
                sectionContext.fillRect(0, 0, gridSection.width, gridSection.height);
                
                sectionContext.beginPath();
                sectionContext.moveTo(lineX, 0);
                sectionContext.lineTo(lineX, params.lineDist);
                sectionContext.moveTo(0, lineY);
                sectionContext.lineTo(params.lineDist, lineY);
                sectionContext.stroke();
                
                // if the scale factor is not equal to 1, then scale the context
                if (drawArgs.scaleFactor !== 1) {
                    gridPattern = drawArgs.context.createPattern(SLICK.Graphics.scaleCanvas(gridSection, drawArgs.scaleFactor), 'repeat');
                }
                else {
                    gridPattern = drawArgs.context.createPattern(gridSection, 'repeat');
                } // if..else
                
                drawArgs.context.fillStyle = gridPattern;
                drawArgs.context.fillRect(0, 0, drawArgs.dimensions.width, drawArgs.dimensions.height);
            } // drawTileBackground
            
            return new SLICK.Graphics.ViewLayer(params);
        },
        
        TileGrid: function(params) {
            // extend the params with the defaults
            params = GRUNT.extend({
                emptyTileImage: null,
                tileSize: SLICK.Tiling.Config.TILESIZE,
                drawGrid: false,
                center: new SLICK.Vector(),
                drawBuffer: drawTiles
            }, params);
            
            // initialise varibles
            var halfTileSize = Math.round(params.tileSize * 0.5);
            var listeners = [];
            var invTileSize = params.tileSize ? 1 / params.tileSize : 0;
            var loadedTileCount = 0;
            
            // create the tile store
            var tileStore = new TileStore(params);
            
            // create the offscreen buffer
            var buffer = null;
            
            function notifyListeners(eventType, tile) {
                for (var ii = 0; ii < listeners.length; ii++) {
                    listeners[ii](eventType, tile);
                } // for
            } // notifyListeners
            
            function drawTiles(context, offset, dimensions, invalidating) {
                // find the tile for the specified position
                var tileStart = new SLICK.Vector(Math.floor(offset.x * invTileSize), Math.floor(offset.y * invTileSize));
                var tileCols = Math.ceil(dimensions.width * invTileSize) + 1;
                var tileRows = Math.ceil(dimensions.height * invTileSize) + 1;
                var tileOffset = new SLICK.Vector(
                    (tileStart.x * params.tileSize) - offset.x,
                    (tileStart.y * params.tileSize) - offset.y);

                // set the context stroke style for the border
                if (params.drawGrid) {
                    context.strokeStyle = "rgba(50, 50, 50, 0.3)";
                } // if
                
                // begin the path for the tile borders
                context.beginPath();

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
                        else if (tile) {
                            // load the tile (if the layer is not frozen, otherwise, no real point)
                            if ((! invalidating) && (self.getStatus() !== SLICK.Graphics.LayerStatus.FROZEN)) {
                                // load the image
                                tile.load(function() {
                                    loadedTileCount++;
                                    notifyListeners("load", tile);
                                });
                            } // if
                            
                            context.clearRect(xPos, yPos, params.tileSize, params.tileSize);
                        } // if..else

                        // if we are drawing borders, then draw that now
                        if (params.drawGrid) {
                            context.rect(xPos, yPos, params.tileSize, params.tileSize);
                        } // if
                    } // for
                } // for
                
                // draw the borders if we have them...
                context.stroke();
            } // drawTiles            
            
            // initialise self
            var self = new SLICK.Graphics.ViewLayer(params);
            
            // add the additional functionality
            GRUNT.extend(self, {
                addTile: function(col, row, tile) {
                    // update the tile store 
                    tileStore.setTile(col, row, tile);
                    
                    if (tile) {
                        tile.setSize(params.tileSize);
                        
                        // when the tile changes, flag updates
                        tile.requestUpdates(function(tile) {
                            notifyListeners("updated", tile);
                        });
                    }
                },
                
                getLoadedTileCount: function() {
                    return loadedTileCount;
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
                
                /*
                Get the virtual dimensions of the tile grid 
                */
                getDimensions: function() {
                    var widthHeight = tileStore.getGridSize() * params.tileSize;
                    return new SLICK.Dimensions(widthHeight, widthHeight);
                },

                populate: function(tileCreator) {
                    tileStore.populate(tileCreator, function(tile) {
                        notifyListeners("created", tile);
                    });
                }, 
                
                requestUpdates: function(callback) {
                    listeners.push(callback);
                }
            });
            
            return self;
        },
        
        Tiler: function(params) {
            params = GRUNT.extend({
                container: "",
                drawCenter: false,
                panHandler: null,
                tapHandler: null,
                doubleTapHandler: null,
                zoomHandler: null,
                onDraw: null,
                tileLoadThreshold: 1
            }, params);
            
            // initialise layers
            var grid = null;
            var overlays = [];

            // create the empty tile
            var emptyTile = new SLICK.Tiling.EmptyGridTile();
            var tileSize = emptyTile.getTileSize();
            var gridIndex = 0;
            var lastTileLayerLoaded = "";
            
            // handle tap and double tap events
            SLICK.Touch.TouchEnable(document.getElementById(params.container), params);
            
            function monitorLayerLoad(layerId, layer) {
                // monitor tile loads for the layer
                layer.requestUpdates(function(eventType, tile) {
                    if (eventType == "load") {
                        if ((layerId != lastTileLayerLoaded) && (layer.getLoadedTileCount() >= params.tileLoadThreshold)) {
                            // remove the previous tile layer
                            self.removeLayer("grid" + (parseInt(layerId.replace(/^grid(\d+)/, "$1"), 10) - 1));

                            // trigger the layer listeners
                            self.notifyLayerListeners("load", layerId, layer);
                            lastTileLayerLoaded = layerId;
                        } // if 
                    } // if
                });
            } // monitorLayerLoad
            
            // create the parent
            var self = new SLICK.Graphics.View(GRUNT.extend({}, params, {
                pannable: true,
                scalable: true,
                scaleDamping: true,
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
                    if (params.onDraw) {
                        params.onDraw(context);
                    } // if
                }
            }));
            
            // initialise self
            GRUNT.extend(self, {
                newTileLayer: function() {
                    // queue the current grid layer for deletion
                    self.setLayerStatus("grid" + gridIndex, SLICK.Graphics.LayerStatus.FROZEN);
                    
                    // increment the grid index
                    gridIndex++;
                },
                
                getTileLayer: function() {
                    return self.getLayer("grid" + gridIndex);
                },

                setTileLayer: function(value) {
                    monitorLayerLoad("grid" + gridIndex, value);
                    self.setLayer("grid" + gridIndex, value);
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
            
            // add the background
            self.setLayer("background", new module.TileGridBackground());

            return self;
        } // Tiler
    };
    
    return module;
    
})();