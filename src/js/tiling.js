SLICK.Tiling = (function() {
    TileStore = function(params) {
        // initialise the parameters with the defaults
        params = GRUNT.extend({
            gridSize: 20,
            center: new SLICK.Vector(),
            onPopulate: null
        }, params);
        
        // initialise the storage array
        var storage = new Array(Math.pow(params.gridSize, 2)),
            gridHalfWidth = Math.ceil(params.gridSize >> 1),
            topLeftOffset = params.center.offset(-gridHalfWidth, -gridHalfWidth),
            lastTileCreator = null,
            tileShift = new SLICK.Vector(),
            lastNotifyListener = null;
        
        GRUNT.Log.info("created tile store with tl offset = " + topLeftOffset);
        
        function getTileIndex(col, row) {
            return (row * params.gridSize) + col;
        } // getTileIndex
        
        function copyStorage(dst, src, delta) {
            // set the length of the destination to match the source
            dst.length = src.length;

            for (var xx = 0; xx < params.gridSize; xx++) {
                for (var yy = 0; yy < params.gridSize; yy++) {
                    dst[getTileIndex(xx, yy)] = self.getTile(xx + delta.x, yy + delta.y);
                } // for
            } // for
        } // copyStorage
        
        // initialise self
        var self = {
            getGridSize: function() {
                return params.gridSize;
            },
            
            getNormalizedPos: function(col, row) {
                return new SLICK.Vector(col, row).add(topLeftOffset.invert()).add(tileShift);
            },
            
            getTileShift: function() {
                return tileShift.duplicate();
            },
            
            getTile: function(col, row) {
                return (col >= 0 && col < params.gridSize) ? storage[getTileIndex(col, row)] : null;
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
                var startTicks = GRUNT.Log.getTraceTicks(),
                    tileIndex = 0;
                
                GRUNT.Log.info("poulating grid, top left offset = " + topLeftOffset);

                if (tileCreator) {
                    for (var row = 0; row < params.gridSize; row++) {
                        for (var col = 0; col < params.gridSize; col++) {
                            if (! storage[tileIndex]) {
                                var tile = tileCreator(col, row, topLeftOffset, params.gridSize);
                        
                                // if the tile was created and we have a notify listener request updates
                                if (tile && notifyListener) {
                                    tile.requestUpdates(notifyListener);
                                } // if
                        
                                // add the tile to storage
                                storage[tileIndex] = tile;
                            } // if
                            
                            // increment the tile index
                            tileIndex++;
                        } // for
                    } // for
                } // if
                
                // save the last tile creator
                lastTileCreator = tileCreator;
                lastNotifyListener = notifyListener;

                // log how long it took
                GRUNT.Log.trace("tile grid populated", startTicks);
                
                // if we have an onpopulate listener defined, let them know
                if (params.onPopulate) {
                    params.onPopulate();
                } // if
            },
            
            getShiftDelta: function(topLeftX, topLeftY, cols, rows) {
                // initialise variables
                var shiftAmount = Math.floor(params.gridSize * 0.2),
                    shiftDelta = new SLICK.Vector();
                    
                // test the x
                if (topLeftX < 0 || topLeftX + cols > params.gridSize) {
                    shiftDelta.x = topLeftX < 0 ? -shiftAmount : shiftAmount;
                } // if

                // test the y
                if (topLeftY < 0 || topLeftY + rows > params.gridSize) {
                    shiftDelta.y = topLeftY < 0 ? -shiftAmount : shiftAmount;
                } // if
                
                return shiftDelta;
            },
            
            
            shift: function(shiftDelta, shiftOriginCallback) {
                // if the shift delta x and the shift delta y are both 0, then return
                if ((shiftDelta.x === 0) && (shiftDelta.y === 0)) { return; }
                
                var ii, startTicks = GRUNT.Log.getTraceTicks();
                // GRUNT.Log.info("need to shift tile store grid, " + shiftDelta.x + " cols and " + shiftDelta.y + " rows.");

                // create new storage
                var newStorage = Array(storage.length);

                // copy the storage from given the various offsets
                copyStorage(newStorage, storage, shiftDelta);

                // update the storage and top left offset
                storage = newStorage;

                // TODO: check whether this is right or not
                if (shiftOriginCallback) {
                    topLeftOffset = shiftOriginCallback(topLeftOffset, shiftDelta);
                }
                else {
                    topLeftOffset.add(shiftDelta);
                } // if..else

                // create the tile shift offset
                tileShift.x += (-shiftDelta.x * params.tileSize);
                tileShift.y += (-shiftDelta.y * params.tileSize);
                GRUNT.Log.trace("tile storage shifted", startTicks);

                // populate with the last tile creator (crazy talk)
                self.populate(lastTileCreator, lastNotifyListener);
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
                loaded: false,
                
                draw: function(context, x, y) {
                    if (image && image.complete) {
                        context.drawImage(image, x, y);
                    }
                },
                
                load: function(callback, loadFromCacheOnly) {
                    
                    function flagLoaded() {
                        // if we have a callback method, then call that
                        if (callback) {
                            callback();
                        } // if
                        
                        self.loaded = true;
                        self.changed(self);
                    } // flagLoaded
                    
                    if ((! image)  && params.url) {
                        // create the image
                        image = null; 
                        if (! loadFromCacheOnly) {
                            SLICK.Resources.loadImage(params.url, function(loadedImage) {
                                image = loadedImage;
                                flagLoaded();
                            });
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
                draw: function(context, x, y) {
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
                lineWidth: 1,
                fillStyle: "rgb(200, 200, 200)",
                strokeStyle: "rgb(180, 180, 180)",
                zindex: -1,
                validStates: SLICK.Graphics.GENCACHE
            });
            
            var gridSection = document.createElement('canvas'),
                sectionContext = gridSection.getContext("2d"),
                gridPattern = null;
            

            // initialise the section size
            gridSection.width = params.lineDist;
            gridSection.height = params.lineDist;

            // initialise the fill style
            sectionContext.fillStyle = params.fillStyle;
            sectionContext.strokeStyle = params.strokeStyle;
            sectionContext.fillRect(0, 0, gridSection.width, gridSection.height);
            
            // draw the lines
            sectionContext.lineWidth = params.lineWidth;
            sectionContext.beginPath();
            sectionContext.moveTo(0, 0);
            sectionContext.lineTo(0, params.lineDist);
            sectionContext.moveTo(0, 0);
            sectionContext.lineTo(params.lineDist, 0);
            sectionContext.stroke();
            
            return GRUNT.extend(new SLICK.Graphics.ViewLayer(params), {
                draw: function(context, offset, dimensions, view) {
                    var startTicks = GRUNT.Log.getTraceTicks(),
                        translateX = Math.abs(offset.x % params.lineDist),
                        translateY = Math.abs(offset.y % params.lineDist);
                    
                    // create the grid pattern
                    if (! gridPattern) {
                        gridPattern = context.createPattern(gridSection, 'repeat');
                    } // if

                    context.save();
                    try {
                        context.translate(-translateX, -translateY);
                        context.fillStyle = gridPattern;
                        context.fillRect(0, 0, dimensions.width + translateX, dimensions.height + translateY);
                    }
                    finally {
                        context.restore();
                    } // try..finally
                    
                    GRUNT.Log.trace("tile background drawn", startTicks);
                }
            });
        },
        
        TileGrid: function(params) {
            // extend the params with the defaults
            params = GRUNT.extend({
                emptyTileImage: null,
                tileSize: SLICK.Tiling.Config.TILESIZE,
                drawGrid: false,
                center: new SLICK.Vector(),
                shiftOrigin: null,
                checkChange: 100,
                validStates: SLICK.Graphics.DisplayState.GENCACHE | SLICK.Graphics.DisplayState.SNAPSHOT
            }, params);
            
            // initialise varibles
            var halfTileSize = Math.round(params.tileSize >> 1),
                listeners = [],
                active = true,
                invTileSize = params.tileSize ? 1 / params.tileSize : 0,
                lastOffset = null,
                gridDirty = false,
                tileDrawQueue = [],
                loadedTileCount = 0,
                empty = new module.EmptyGridTile(),
                lastCheckOffset = new SLICK.Vector(),
                shiftDelta = new SLICK.Vector(),
                reloadTimeout = 0,
                halfBuffer = params.bufferSize >> 1;
            
            // create the tile store
            var tileStore = new TileStore(GRUNT.extend({
                onPopulate: function() {
                    gridDirty = true;
                    self.wakeParent();
                }
            }, params));
            
            // create the offscreen buffer
            var buffer = null;
            
            function notifyListeners(eventType, tile) {
                for (var ii = 0; ii < listeners.length; ii++) {
                    listeners[ii](eventType, tile);
                } // for
            } // notifyListeners
            
            function updateDrawQueue(context, offset, dimensions, view) {
                // OPTIMIZE: shift this functionality to the tile store
                // find the tile for the specified position
                var tile, tileShift = tileStore.getTileShift(),
                    tileStart = new SLICK.Vector(
                                    Math.floor((offset.x + tileShift.x) * invTileSize), 
                                    Math.floor((offset.y + tileShift.y) * invTileSize)),
                    tileCols = Math.ceil(dimensions.width * invTileSize) + 1,
                    tileRows = Math.ceil(dimensions.height * invTileSize) + 1,
                    tileOffset = new SLICK.Vector((tileStart.x * params.tileSize), (tileStart.y * params.tileSize)),
                    viewAnimating = view.isAnimating();
                    
                    
                // reset the tile draw queue
                tileDrawQueue = [];
                tilesNeeded = false;
                
                // right, let's draw some tiles (draw rows first)
                for (var yy = 0; yy < tileRows; yy++) {
                    // initialise the y position
                    var yPos = yy * params.tileSize + tileOffset.y;

                    // iterate through the columns and draw the tiles
                    for (var xx = 0; xx < tileCols; xx++) {
                        // get the tile
                        tile = tileStore.getTile(xx + tileStart.x, yy + tileStart.y);
                        var xPos = xx * params.tileSize + tileOffset.x;
                        
                        if (! tile) {
                            shiftDelta = tileStore.getShiftDelta(tileStart.x, tileStart.y, tileCols, tileRows);
                        } // if
                        
                        // add the tile and position to the tile draw queue
                        tileDrawQueue.push({
                            tile: tile,
                            coordinates: new SLICK.Vector(xPos, yPos)
                        });
                    } // for
                } // for
                
                // check that the tiles are loaded
                for (var ii = tileDrawQueue.length; ii--; ) {
                    tile = tileDrawQueue[ii].tile;

                    if (tile && (! tile.loaded)) {
                        // load the image
                        tile.load(function() {
                            if (active) {
                                loadedTileCount++;
                                gridDirty = true;

                                self.wakeParent();
                                notifyListeners("load", tile);
                            } // if
                        }, viewAnimating);
                    } // if
                } // for
            } // fileTileDrawQueue
            
            // initialise self
            var self = GRUNT.extend(new SLICK.Graphics.ViewLayer(params), {
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
                
                cycle: function(tickCount, offset) {
                    var needTiles = shiftDelta.x + shiftDelta.y !== 0,
                        changeCount = 0;

                    if (needTiles) {
                        tileStore.shift(shiftDelta, params.shiftOrigin);

                        // reset the delta
                        shiftDelta = new SLICK.Vector();
                        
                        // things need to happen
                        changeCount++;
                    } // if
                    
                    // if the grid is dirty let the calling view know
                    return changeCount + gridDirty ? 1 : 0;
                },
                
                draw: function(context, offset, dimensions, view) {
                    if (active) {
                        // initialise variables
                        var startTicks = GRUNT.Log.getTraceTicks(),
                            tileShift = tileStore.getTileShift(),
                            xShift = offset.x + tileShift.x,
                            yShift = offset.y + tileShift.y;

                        updateDrawQueue(context, offset, dimensions, view);
                        GRUNT.Log.trace("updated draw queue", startTicks);

                        // set the context stroke style for the border
                        if (params.drawGrid) {
                            context.strokeStyle = "rgba(50, 50, 50, 0.3)";
                        } // if

                        // begin the path for the tile borders
                        context.beginPath();

                        // iterate through the tiles in the draw queue
                        for (var ii = tileDrawQueue.length; ii--; ) {
                            var tile = tileDrawQueue[ii].tile,
                                x = tileDrawQueue[ii].coordinates.x - xShift,
                                y = tileDrawQueue[ii].coordinates.y - yShift;

                            // if the tile is loaded, then draw, otherwise load
                            if (tile && tile.loaded) {
                                tile.draw(context, x, y);
                            } // if

                            // if we are drawing borders, then draw that now
                            if (params.drawGrid) {
                                context.rect(x, y, params.tileSize, params.tileSize);
                            } // if                    
                        } // for

                        // draw the borders if we have them...
                        context.stroke();

                        GRUNT.Log.trace("drawn tiles", startTicks);                        
                    } // if
                    
                    // flag the grid as not dirty
                    gridDirty = false;
                },
                
                getLoadedTileCount: function() {
                    return loadedTileCount;
                },
                
                getVisibleTileCount: function(dimensions) {
                    // get the dimensions
                    if (params.tileSize !== 0) {
                        return Math.ceil(dimensions.width / params.tileSize) + Math.ceil(dimensions.height / params.tileSize);
                    } // if
                    
                    return 0;
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
                    var midIndex = Math.ceil(tileStore.getGridSize() >> 1);
                    
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
            
            // listen for the parent view scaling
            GRUNT.WaterCooler.listen("view.scale", function(args) {
                if (args.id == self.getParent().id) {
                    active = false;
                } // if
            });
            
            return self;
        },
        
        DataLayer: function(params) {
            
        },
        
        Tiler: function(params) {
            params = GRUNT.extend({
                container: "",
                drawCenter: false,
                onPan: null,
                onPanEnd: null,
                tapHandler: null,
                doubleTapHandler: null,
                zoomHandler: null,
                onDraw: null,
                datasources: {},
                tileLoadThreshold: "first"
            }, params);
            
            // initialise layers
            var grid = null;
            var overlays = [];

            // create the empty tile
            var emptyTile = new SLICK.Tiling.EmptyGridTile();
            var tileSize = emptyTile.getTileSize();
            var gridIndex = 0;
            var lastTileLayerLoaded = "";
            var actualTileLoadThreshold = 0;
            
            var tileCountLoaderFns = {
                first: function(tileCount) {
                    return 1;
                },
                auto: function(tileCount) {
                    return tileCount >> 1;
                },
                
                all: function(tileCount) {
                    return tileCount;
                }
            };
            
            // handle tap and double tap events
            SLICK.Touch.captureTouch(document.getElementById(params.container), params);
            
            function monitorLayerLoad(layerId, layer) {
                // monitor tile loads for the layer
                layer.requestUpdates(function(eventType, tile) {
                    if (eventType == "load") {
                        if ((layerId != lastTileLayerLoaded) && (layer.getLoadedTileCount() >= actualTileLoadThreshold)) {
                            // remove the previous tile layer
                            self.notifyLayerListeners("load", layerId, layer);

                            // update the last layer loaded id
                            lastTileLayerLoaded = layerId;
                        } // if 
                    } // if
                });
            } // monitorLayerLoad
            
            function updateTileLoadThreshold(layer) {
                var tileCount = layer.getVisibleTileCount(self.getDimensions());

                if (tileCountLoaderFns[params.tileLoadThreshold]) {
                    actualTileLoadThreshold = tileCountLoaderFns[params.tileLoadThreshold](tileCount);
                }
                else {
                    actualTileLoadThreshold = parseInt(params.tileLoadThreshold, 10);
                } // if..else
            } // updateTileLoadThreshold
            
            // create the parent
            var self = new SLICK.Graphics.View(GRUNT.extend({}, params, {
                // define panning and scaling properties
                pannable: true,
                scalable: true,
                scaleDamping: true,
                
                // define data layer properties
                datasources: params.datasources,
                
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
                getTileLayer: function() {
                    return self.getLayer("grid" + gridIndex);
                },

                setTileLayer: function(value) {
                    // watch the layer
                    monitorLayerLoad("grid" + gridIndex, value);
                    self.setLayer("grid" + gridIndex, value);
                    
                    // update the tile load threshold
                    updateTileLoadThreshold(value);
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