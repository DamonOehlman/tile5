T5.TileGrid = function(params) {
    // extend the params with the defaults
    params = T5.ex({
        tileSize: T5.tileSize,
        center: new T5.Vector(),
        gridSize: 25,
        shiftOrigin: null,
        supportFastDraw: true,
        allowShift: true
    }, params);
    
    // initialise tile store related information
    var storage = new Array(Math.pow(params.gridSize, 2)),
        gridSize = params.gridSize,
        tileSize = params.tileSize,
        gridHalfWidth = Math.ceil(params.gridSize >> 1),
        topLeftOffset = T5.V.offset(params.center, -gridHalfWidth),
        lastTileCreator = null,
        tileShift = new T5.Vector(),
        isTweening = false,
        lastNotifyListener = null,
        halfTileSize = Math.round(tileSize / 2),
        invTileSize = tileSize ? 1 / tileSize : 0,
        active = true,
        tileDrawQueue = null,
        loadedTileCount = 0,
        lastTilesDrawn = false,
        lastQueueUpdate = 0,
        lastCheckOffset = new T5.Vector(),
        shiftDelta = new T5.Vector(),
        repaintDistance = T5.getConfig().repaintDistance,
        reloadTimeout = 0,
        gridHeightWidth = gridSize * tileSize,
        tileCols, tileRows, centerPos;
        
    /* event handlers */
    
    function handleResize(evt, width, height) {
        COG.Log.info('captured resize');
        centerPos = null;
    } // handleResize
        
    /* internal functions */
        
    function copyStorage(dst, src, delta) {
        // set the length of the destination to match the source
        dst.length = src.length;

        for (var xx = 0; xx < gridSize; xx++) {
            for (var yy = 0; yy < gridSize; yy++) {
                dst[getTileIndex(xx, yy)] = getTile(xx + delta.x, yy + delta.y);
            } // for
        } // for
    } // copyStorage

    function createTempTile(col, row) {
        var gridXY = getGridXY(col, row);
        return new T5.EmptyTile({
            gridX: gridXY.x,
            gridY: gridXY.y,
            empty: true
        });
    } // createTempTile
    
    function findTile(matcher) {
        if (! matcher) { return null; }
        
        for (var ii = storage.length; ii--; ) {
            var tile = storage[ii];
            if (tile && matcher(tile)) {
                return tile;
            } // if
        } // for
        
        return null;
    } // findTile
    
    function getGridXY(col, row) {
        return T5.Vector(
            col * tileSize - tileShift.x,
            row * tileSize - tileShift.y);
    } // getGridXY
    
    function getNormalizedPos(col, row) {
        return T5.V.add(new T5.Vector(col, row), T5.V.invert(topLeftOffset), tileShift);
    } // getNormalizedPos
    
    function getShiftDelta(topLeftX, topLeftY, cols, rows) {
        // initialise variables
        var shiftAmount = gridSize * 0.2 >> 0,
            shiftDelta = new T5.Vector();
            
        // test the x
        if (topLeftX < 0 || topLeftX + cols > gridSize) {
            shiftDelta.x = topLeftX < 0 ? -shiftAmount : shiftAmount;
        } // if

        // test the y
        if (topLeftY < 0 || topLeftY + rows > gridSize) {
            shiftDelta.y = topLeftY < 0 ? -shiftAmount : shiftAmount;
        } // if
        
        return shiftDelta;
    } // getShiftDelta
    
    function getTile(col, row) {
        return (col >= 0 && col < gridSize) ? storage[getTileIndex(col, row)] : null;
    } // getTile
    
    function setTile(col, row, tile) {
        storage[getTileIndex(col, row)] = tile;
    } // setTile
    
    function getTileIndex(col, row) {
        return (row * gridSize) + col;
    } // getTileIndex
    
    /*
    What a cool function this is.  Basically, this goes through the tile
    grid and creates each of the tiles required at that position of the grid.
    The tileCreator is a callback function that takes a two parameters (col, row) and
    can do whatever it likes but should return a Tile object or null for the specified
    column and row.
    */
    function populate(tileCreator, notifyListener, resetStorage) {
        // take a tick count as we want to time this
        var startTicks = COG.Log.getTraceTicks(),
            tileIndex = 0,
            centerPos = new T5.Vector(gridSize / 2, gridSize / 2);
            
        // if the storage is to be reset, then do that now
        if (resetStorage) {
            storage = [];
        } // if
        
        if (tileCreator) {
            // COG.Log.info("populating grid, size = " + gridSize + ", x shift = " + tileShift.x + ", y shift = " + tileShift.y);
            
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
        COG.Log.trace("tile grid populated", startTicks);
        
        // if we have an onpopulate listener defined, let them know
        self.wakeParent();
    } // populate
    
    function shift(shiftDelta, shiftOriginCallback) {
        // if the shift delta x and the shift delta y are both 0, then return
        if ((! params.allowShift) || ((shiftDelta.x === 0) && (shiftDelta.y === 0))) { return; }
        
        var ii, startTicks = COG.Log.getTraceTicks();
        // COG.Log.info("need to shift tile store grid, " + shiftDelta.x + " cols and " + shiftDelta.y + " rows.");

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
            topLeftOffset = T5.V.add(topLeftOffset, shiftDelta);
        } // if..else

        // create the tile shift offset
        tileShift.x += (-shiftDelta.x * tileSize);
        tileShift.y += (-shiftDelta.y * tileSize);
        COG.Log.trace("tile storage shifted", startTicks);

        // populate with the last tile creator (crazy talk)
        populate(lastTileCreator, lastNotifyListener);
    } // shift
    
    function updateDrawQueue(offset, state, fullRedraw, tickCount) {
        var tile, tmpQueue = [],
            dirtyTiles = false,
            tileStart = new T5.Vector(
                            (offset.x + tileShift.x) * invTileSize >> 0, 
                            (offset.y + tileShift.y) * invTileSize >> 0);

        // reset the tile draw queue
        tilesNeeded = false;
        
        if (! centerPos) {
            var dimensions = self.getParent().getDimensions();

            tileCols = Math.ceil(dimensions.width * invTileSize) + 1;
            tileRows = Math.ceil(dimensions.height * invTileSize) + 1;
            centerPos = new T5.Vector((tileCols-1) / 2 >> 0, (tileRows-1) / 2 >> 0);
        } // if

        // right, let's draw some tiles (draw rows first)
        for (var yy = tileRows; yy--; ) {
            // iterate through the columns and draw the tiles
            for (var xx = tileCols; xx--; ) {
                // get the tile
                tile = getTile(xx + tileStart.x, yy + tileStart.y);
                var centerDiff = new T5.Vector(xx - centerPos.x, yy - centerPos.y);

                if (! tile) {
                    shiftDelta = getShiftDelta(tileStart.x, tileStart.y, tileCols, tileRows);
                    
                    // TODO: replace the tile with a temporary draw tile here
                    tile = createTempTile(xx + tileStart.x, yy + tileStart.y);
                } // if
                
                // update the tile dirty state
                dirtyTiles = tile ? ((tile.dirty = fullRedraw || tile.dirty) || dirtyTiles) : dirtyTiles;
                
                // add the tile and position to the tile draw queue
                tmpQueue[tmpQueue.length] = {
                    tile: tile,
                    centerness: T5.V.absSize(centerDiff)
                };
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
        
        lastQueueUpdate = tickCount;
        return dirtyTiles;
    } // updateDrawQueue
    
    /* external object definition */
    
    // initialise self
    var self = T5.ex(new T5.ViewLayer(params), {
        gridDimensions: new T5.Dimensions(gridHeightWidth, gridHeightWidth),
        
        cycle: function(tickCount, offset, state, redraw) {
            var needTiles = shiftDelta.x !== 0 || shiftDelta.y !== 0,
                xShift = offset.x,
                yShift = offset.y,
                haveDirtyTiles = false,
                tileSize = T5.tileSize;

            if (needTiles) {
                shift(shiftDelta, params.shiftOrigin);

                // reset the delta
                shiftDelta = new T5.Vector();
                
                // we need to do a complete redraw
                redraw = true;
            } // if
            
            if (state !== T5.viewState('PINCH')) {
                haveDirtyTiles = updateDrawQueue(offset, state, redraw, tickCount);
            } // if
            
            // update the tweening flag
            isTweening = T5.isTweening();
            
            return haveDirtyTiles;
        },
        
        deactivate: function() {
            active = false;
        },
        
        find: findTile,
        
        prepTile: function(tile, state) {
        },
        
        drawTile: function(context, tile, x, y, state) {
            return false;
        },
        
        // TODO: convert to a configurable implementation
        getTileSize: function() {
            return tileSize;
        },
        
        clearTileRect: function(context, x, y, tileSize, state) {
            context.clearRect(x, y, tileSize, tileSize);
        },
        
        draw: function(context, offset, dimensions, state, view, redraw, tickCount) {
            if (! active) { return; }
            
            // initialise variables
            var xShift = offset.x,
                yShift = offset.y,
                minX = dimensions.width,
                minY = dimensions.height,
                tilesDrawn = true;
                
            // if we don't have a draq queue return
            if (! tileDrawQueue) { return; }
            
            if (! redraw) {
                context.beginPath();
            } // if
            
            // iterate through the tiles in the draw queue
            for (var ii = tileDrawQueue.length; ii--; ) {
                var tile = tileDrawQueue[ii],
                    x = tile.gridX - xShift,
                    y = tile.gridY - yShift;

                if (! redraw) {
                    context.rect(x, y, tileSize, tileSize);
                } // if

                // update the tile x and y
                tile.x = x;
                tile.y = y;

                // if the tile is loaded, then draw, otherwise load
                if (! tile.empty) {
                    // draw the tile
                    if (redraw || tile.dirty) {
                        // if the interface is tweening, then clear the tile rect first
                        if (isTweening) {
                            self.clearTileRect(context, x, y, tileSize, state);
                        } // if
                        
                        // draw the tile
                        tilesDrawn = self.drawTile(context, tile, x, y, state) && tilesDrawn;
                    } // if
                } 
                else {
                    COG.Log.info("empty tile @ x: " + x + ", y: " + y);
                    self.clearTileRect(context, x, y, tileSize, state);
                    tilesDrawn = false;
                } // if..else
                
                // update the minx and miny
                minX = x < minX ? x : minX;
                minY = y < minY ? y : minY;
            } // for
            
            // clip the context to only draw where the tiles have been drawn
            if (! redraw) {
                context.clip();
            } // if
            
            /* clean the display where required */
            
            if (minX > 0) {
                context.clearRect(0, 0, minX, dimensions.height);
            } // if
            
            if (minY > 0) {
                context.clearRect(0, 0, dimensions.width, minY);
            } // if
            
            // draw the borders if we have them...
            // COG.Log.trace("drew tiles at x: " + offset.x + ", y: " + offset.y, startTicks);
            
            // if the tiles have been drawn and previously haven't then fire the tiles drawn event
            if (tilesDrawn && (! lastTilesDrawn)) {
                view.trigger("tileDrawComplete");
            } // if
            
            // flag the grid as not dirty
            lastTilesDrawn = tilesDrawn;
        },
        
        getTileAtXY: function(x, y) {
            var queueLength = tileDrawQueue ? tileDrawQueue.length : 0,
                locatedTile = null;
            
            for (var ii = queueLength; ii--; ) {
                var tile = tileDrawQueue[ii];
                
                if (tile && (x >= tile.x) && (y >= tile.y)) {
                    if ((x <= tile.x + tileSize) && (y <= tile.y + tileSize)) {
                        locatedTile = tile;
                        break; 
                    } // if
                } // if
            } // for
            
            COG.Log.info("looking for tile @ x: " + x + ", y: " + y + ', found: ' + locatedTile);
            return locatedTile;
        },
        
        getTileVirtualXY: function(col, row, getCenter) {
            // get the normalized position from the tile store
            var pos = getNormalizedPos(col, row),
                fnresult = new T5.Vector(pos.x * tileSize, pos.y * tileSize);
            
            if (getCenter) {
                fnresult.x += halfTileSize;
                fnresult.y += halfTileSize;
            } // if
            
            return fnresult;
        },
        
        populate: function(tileCreator) {
            populate(tileCreator, null, true);
        }
    });
    
    // bind to events
    self.bind('resize', handleResize);
    
    COG.listen("imagecache.cleared", function(args) {
        // reset all the tiles loaded state
        for (var ii = storage.length; ii--; ) {
            if (storage[ii]) {
                storage[ii].loaded = false;
            } // if
        } // for
    });
    
    COG.listen("tiler.repaint", function(args) {
        for (var ii = storage.length; ii--; ) {
            if (storage[ii]) {
                storage[ii].x = null;
                storage[ii].y = null;
            } // if
        } // for
    });

    return self;
}; // T5.TileGrid
