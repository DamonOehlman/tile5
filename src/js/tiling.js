TILE5.Tiling = (function() {
    TileStore = function(params) {
        // initialise the parameters with the defaults
        params = GRUNT.extend({
            tileSize: null,
            gridSize: 25,
            center: new TILE5.Vector(),
            onPopulate: null
        }, params);
        
        if (! params.tileSize) {
            throw new Error("Cannot create TileStore with an empty tile size");
        } // if
        
        // initialise the storage array
        var storage = new Array(Math.pow(params.gridSize, 2)),
            gridHalfWidth = Math.ceil(params.gridSize >> 1),
            topLeftOffset = TILE5.V.offset(params.center, -gridHalfWidth),
            lastTileCreator = null,
            tileShift = new TILE5.Vector(),
            lastNotifyListener = null;
        
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
                return TILE5.V.add(new TILE5.Vector(col, row), TILE5.V.invert(topLeftOffset), tileShift);
            },
            
            getTileShift: function() {
                return TILE5.V.copy(tileShift);
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
                    tileIndex = 0,
                    gridSize = params.gridSize,
                    tileSize = params.tileSize,
                    centerPos = new TILE5.Vector(gridSize / 2, gridSize / 2);
                
                if (tileCreator) {
                    GRUNT.Log.info("populating grid, x shift = " + tileShift.x + ", y shift = " + tileShift.y);
                    
                    for (var row = 0; row < gridSize; row++) {
                        for (var col = 0; col < gridSize; col++) {
                            if (! storage[tileIndex]) {
                                var tile = tileCreator(col, row, topLeftOffset, gridSize);
                                
                                // set the tile grid x and grid y position
                                tile.gridX = (col * tileSize) - tileShift.x;
                                tile.gridY = (row * tileSize) - tileShift.y;

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
                    shiftDelta = new TILE5.Vector();
                    
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
                GRUNT.Log.info("need to shift tile store grid, " + shiftDelta.x + " cols and " + shiftDelta.y + " rows.");

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
                    topLeftOffset = TILE5.V.add(topLeftOffset, shiftDelta);
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
                    topLeftOffset = TILE5.V.offset(new TILE5.Vector(col, row), -tileHalfWidth);
                }
                else {
                    shiftOrigin(col, row);
                } // if..else
            }
        };
        
        GRUNT.WaterCooler.listen("imagecache.cleared", function(args) {
            // reset all the tiles loaded state
            for (var ii = storage.length; ii--; ) {
                if (storage[ii]) {
                    storage[ii].loaded = false;
                } // if
            } // for
        });
        
        GRUNT.WaterCooler.listen("tiler.repaint", function(args) {
            for (var ii = storage.length; ii--; ) {
                if (storage[ii]) {
                    storage[ii].x = null;
                    storage[ii].y = null;
                } // if
            } // for
        });
        
        return self;
    };

    // initialise variables
    var emptyTile = null,
        panningTile = null;
    
    function getEmptyTile() {
        if (! emptyTile) {
            emptyTile = TILE5.newCanvas(module.Config.TILESIZE, module.Config.TILESIZE);
            
            var tileContext = emptyTile.getContext('2d');
            
            tileContext.fillStyle = "rgba(150, 150, 150, 0.025)";
            tileContext.fillRect(0, 0, emptyTile.width, emptyTile.height);
        } // if
        
        return emptyTile;
    } // getEmptyTile
    
    function getPanningTile() {
        
        function getPattern() {
            var patternSize = 32,
                halfSize = patternSize / 2,
                patternCanvas = TILE5.newCanvas(patternSize, patternSize);
            
            // get the canvas context
            var context = patternCanvas.getContext("2d");
            
            // fill the canvas
            context.fillStyle = "#BBBBBB";
            context.fillRect(0, 0, patternSize, patternSize);
            
            // now draw two smaller rectangles
            context.fillStyle = "#C3C3C3";
            context.fillRect(0, 0, halfSize, halfSize);
            context.fillRect(halfSize, halfSize, halfSize, halfSize);

            return patternCanvas;
        } // getPattern
        
        if (! panningTile) {
            panningTile = TILE5.newCanvas(module.Config.TILESIZE, module.Config.TILESIZE);
            
            var tileContext = panningTile.getContext('2d');

            // fill the panning tile with the pattern
            tileContext.fillStyle = tileContext.createPattern(getPattern(), "repeat");
            tileContext.fillRect(0, 0, panningTile.width, panningTile.height);
        } // if
        
        return panningTile;
    } // getLoadingTile
    
    // define the module
    var module = {
        // define the tiler config
        Config: {
            TILESIZE: 256,
            // TODO: put some logic in to determine optimal buffer size based on connection speed...
            TILEBUFFER: 1,
            TILEBUFFER_LOADNEW: 0.2
        },
        
        Tile: function(params) {
            params = GRUNT.extend({
                x: 0,
                y: 0,
                gridX: 0,
                gridY: 0,
                size: 256
            }, params);
            
            return params;
        },
        
        ImageTile: function(params) {
            // initialise parameters with defaults
            params = GRUNT.extend({
                url: "",
                sessionParamRegex: null,
                loaded: false
            }, params);
            
            return new module.Tile(params);
        },
        
        TileGrid: function(params) {
            // extend the params with the defaults
            params = GRUNT.extend({
                tileSize: TILE5.Tiling.Config.TILESIZE,
                drawGrid: false,
                center: new TILE5.Vector(),
                shiftOrigin: null,
                supportFastDraw: true
            }, params);
            
            // create the tile store
            var tileStore = new TileStore(GRUNT.extend({
                tileSize: params.tileSize,
                onPopulate: function() {
                    gridDirty = true;
                    self.wakeParent();
                }
            }, params));
            
            // initialise varibles
            var halfTileSize = Math.round(params.tileSize / 2),
                invTileSize = params.tileSize ? 1 / params.tileSize : 0,
                gridDirty = false,
                active = true,
                tileDrawQueue = null,
                loadedTileCount = 0,
                fullRedraw = false,
                lastTilesDrawn = false,
                lastCheckOffset = new TILE5.Vector(),
                shiftDelta = new TILE5.Vector(),
                tileShift = new TILE5.Vector(),
                repaintDistance = TILE5.Device.getConfig().repaintDistance,
                reloadTimeout = 0,
                gridHeightWidth = tileStore.getGridSize() * params.tileSize,
                tileCols, tileRows, centerPos;
            
            function updateDrawQueue(offset, state) {
                if (! centerPos) { return; }
                
                var tile, tmpQueue = [],
                    tileStart = new TILE5.Vector(
                                    Math.floor((offset.x + tileShift.x) * invTileSize), 
                                    Math.floor((offset.y + tileShift.y) * invTileSize));

                // reset the tile draw queue
                tilesNeeded = false;

                // right, let's draw some tiles (draw rows first)
                for (var yy = tileRows; yy--; ) {
                    // iterate through the columns and draw the tiles
                    for (var xx = tileCols; xx--; ) {
                        // get the tile
                        tile = tileStore.getTile(xx + tileStart.x, yy + tileStart.y);
                        var centerDiff = new TILE5.Vector(xx - centerPos.x, yy - centerPos.y);

                        if (! tile) {
                            shiftDelta = tileStore.getShiftDelta(tileStart.x, tileStart.y, tileCols, tileRows);
                        } // if

                        // add the tile and position to the tile draw queue
                        tmpQueue.push({
                            tile: tile,
                            centerness: TILE5.V.absSize(centerDiff)
                        });
                    } // for
                } // for

                // sort the tile queue by "centerness"
                tmpQueue.sort(function(itemA, itemB) {
                    return itemB.centerness - itemA.centerness;
                });
                
                if (! tileDrawQueue) {
                    tileDrawQueue = new Array(tmpQueue.length);
                } // if
                
                // copy the temporary queue item to the draw queue
                for (var ii = tmpQueue.length; ii--; ) {
                    tileDrawQueue[ii] = tmpQueue[ii].tile;
                    self.prepTile(tileDrawQueue[ii], state);
                } // for
            } // updateDrawQueue
            
            // initialise self
            var self = GRUNT.extend(new TILE5.Graphics.ViewLayer(params), {
                gridDimensions: new TILE5.Dimensions(gridHeightWidth, gridHeightWidth),
                
                cycle: function(tickCount, offset, state) {
                    var needTiles = shiftDelta.x + shiftDelta.y !== 0,
                        changeCount = 0;

                    if (needTiles) {
                        tileStore.shift(shiftDelta, params.shiftOrigin);
                        tileShift = tileStore.getTileShift();

                        // reset the delta
                        shiftDelta = new TILE5.Vector();
                        
                        // things need to happen
                        changeCount++;
                    } // if
                    
                    if (state !== TILE5.Graphics.DisplayState.PINCHZOOM) {
                        updateDrawQueue(offset, state);
                    } // if
                    
                    // if the grid is dirty let the calling view know
                    return changeCount + gridDirty ? 1 : 0;
                },
                
                deactivate: function() {
                    active = false;
                },
                
                prepTile: function(tile, state) {
                },
                
                drawTile: function(context, tile, x, y, state) {
                    return false;
                },
                
                draw: function(context, offset, dimensions, state, view) {
                    if (! active) { return; }
                    
                    // initialise variables
                    var startTicks = new Date().getTime(),
                        xShift = offset.x,
                        yShift = offset.y,
                        tilesDrawn = true,
                        redraw = fullRedraw || (state === TILE5.Graphics.DisplayState.PINCHZOOM) || TILE5.Animation.isTweening();
                        
                    if (! centerPos) {
                        tileCols = Math.ceil(dimensions.width * invTileSize) + 1;
                        tileRows = Math.ceil(dimensions.height * invTileSize) + 1;
                        centerPos = new TILE5.Vector(Math.floor((tileCols-1) / 2), Math.floor((tileRows-1) / 2));
                    } // if
                        
                    // if we don't have a draq queue return
                    if (! tileDrawQueue) { return; }
                    
                    // set the context stroke style for the border
                    if (params.drawGrid) {
                        context.strokeStyle = "rgba(50, 50, 50, 0.3)";
                    } // if

                    // begin the path for the tile borders
                    context.beginPath();

                    // iterate through the tiles in the draw queue
                    for (var ii = tileDrawQueue.length; ii--; ) {
                        var tile = tileDrawQueue[ii];

                        // if the tile is loaded, then draw, otherwise load
                        if (tile) {
                            var x = tile.gridX - xShift,
                                y = tile.gridY - yShift,
                                drawn = redraw ? false : (tile.x === x) && (tile.y === y);

                            // draw the tile
                            tilesDrawn = (drawn ? true : self.drawTile(context, tile, x, y, state)) && tilesDrawn;
                        } 
                        else {
                            tilesDrawn = false;
                        } // if..else

                        // if we are drawing borders, then draw that now
                        if (params.drawGrid) {
                            context.rect(x, y, params.tileSize, params.tileSize);
                        } // if
                    } // for

                    // draw the borders if we have them...
                    context.stroke();
                    GRUNT.Log.trace("drawn tiles", startTicks);
                    
                    // if the tiles have been drawn and previously haven't then fire the tiles drawn event
                    if (tilesDrawn && (! lastTilesDrawn)) {
                        view.trigger("tileDrawComplete");
                    } // if
                    
                    // flag the grid as not dirty
                    lastTilesDrawn = tilesDrawn;
                    gridDirty = false;
                    fullRedraw = false;
                },
                
                getTileVirtualXY: function(col, row, getCenter) {
                    // get the normalized position from the tile store
                    var pos = tileStore.getNormalizedPos(col, row),
                        fnresult = new TILE5.Vector(pos.x * params.tileSize, pos.y * params.tileSize);
                    
                    if (getCenter) {
                        fnresult.x += halfTileSize;
                        fnresult.y += halfTileSize;
                    } // if
                    
                    return fnresult;
                },
                
                populate: function(tileCreator) {
                    tileStore.populate(tileCreator, function(tile) {
                    });
                }
            });
            
            // listen for tiles loading
            GRUNT.WaterCooler.listen("tile.loaded", function(args) {
                gridDirty = true;
                self.wakeParent();
            });
            
            // listen for other layers requesting a full redraw
            GRUNT.WaterCooler.listen("grid.invalidate", function(args) {
                fullRedraw = true;
            });
            
            return self;
        },
        
        ImageTileGrid: function(params) {
            params = GRUNT.extend({
                
            }, params);
            
            function handleImageLoad(loadedImage, fromCache) {
                GRUNT.WaterCooler.say("tile.loaded");
            } // handleImageLoad
            
            // initialise variables
            var emptyTile = getEmptyTile(),
                panningTile = getPanningTile(),
                stateActive = TILE5.Graphics.DisplayState.ACTIVE,
                statePan = TILE5.Graphics.DisplayState.PAN,
                fastDraw = TILE5.Device.getConfig().requireFastDraw;
                
            var self = GRUNT.extend(new module.TileGrid(params), {
                drawTile: function(context, tile, x, y, state) {
                    var image = TILE5.Resources.getImage(tile.url),
                        drawn = false;
                        
                    if (image && image.complete && (image.width > 0)) {
                        context.drawImage(image, x, y);
                        drawn = true;
                        
                        tile.x = x;
                        tile.y = y;
                    }
                    else if (state === statePan) {
                        context.drawImage(panningTile, x, y);
                    }
                    else {
                        context.drawImage(emptyTile, x, y);
                    } // if..else
                    
                    return drawn;
                },
                
                prepTile: function(tile, state) {
                    if (tile && ((! fastDraw) || (state === stateActive))) {
                        var image = TILE5.Resources.getImage(tile.url);
                        if (! image) {
                            TILE5.Resources.loadImage(tile.url, handleImageLoad);
                        } // if
                    } // if
                }
            });
            
            return self;
        },
        
        Tiler: function(params) {
            params = GRUNT.extend({
                container: "",
                drawCenter: false,
                datasources: {},
                tileLoadThreshold: "first"
            }, params);
            
            // initialise layers
            var gridIndex = 0;
            var lastTileLayerLoaded = "";
            var actualTileLoadThreshold = 0;
            
            // create the parent
            var self = new TILE5.Graphics.View(GRUNT.extend({}, params, {
                // define panning and scaling properties
                pannable: true,
                scalable: true,
                scaleDamping: true
            }));
            
            // initialise self
            GRUNT.extend(self, {
                getTileLayer: function() {
                    return self.getLayer("grid" + gridIndex);
                },

                setTileLayer: function(value) {
                    self.setLayer("grid" + gridIndex, value);
                    
                    // update the tile load threshold
                    GRUNT.WaterCooler.say("grid.updated", { id: "grid" + gridIndex });
                },

                viewPixToGridPix: function(vector) {
                    var offset = self.getOffset();
                    return new TILE5.Vector(vector.x + offset.x, vector.y + offset.y);
                },
                
                cleanup: function() {
                    self.removeLayer("grid" + gridIndex);
                },
                
                repaint: function() {
                    // flag to the tile store to reset the image positions
                    GRUNT.WaterCooler.say("tiler.repaint");
                    
                    // tell the view to repaint itself 
                    GRUNT.WaterCooler.say("view.wake", { id: self.id });
                }
            }); // self

            return self;
        } // Tiler
    };
    
    return module;
    
})();