T5.Tiler = function(params) {
    params = T5.ex({
        container: "",
        drawCenter: false,
        datasources: {},
        tileLoadThreshold: "first"
    }, params);
    
    // initialise layers
    var gridIndex = 0,
        lastTileLayerLoaded = "",
        actualTileLoadThreshold = 0;
        
    /* private methods */
    
    function selectTile(tile) {
        self.trigger("selectTile", tile);
    } // selectTile
    
    /* event handlers */
    
    function handleTap(absXY, relXY) {
        var grid = self.getTileLayer();
        if (grid) {
            var tile = grid.getTileAtXY(relXY.x, relXY.y);
            if (tile) {
                selectTile(tile);
            }
        } // grid
    } // handleTap
    
    /* object definition */
    
    // initialise self
    var self = T5.ex(new T5.View(params), {
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
            return new T5.Vector(vector.x + offset.x, vector.y + offset.y);
        },
        
        centerOn: function(tile, easing, duration, callback) {
            var grid = self.getTileLayer(),
                dimensions = self.getDimensions(),
                tileSize = grid ? grid.getTileSize() : 0;
                
            if (tileSize) {
                self.updateOffset(
                    tile.gridX - Math.floor((dimensions.width - tileSize) * 0.5), 
                    tile.gridY - Math.floor((dimensions.height - tileSize) * 0.5),
                    easing,
                    duration,
                    callback);
            } // if
        },
        
        cleanup: function() {
            self.removeLayer("grid" + gridIndex);
        },
        
        repaint: function() {
            // flag to the tile store to reset the image positions
            GRUNT.WaterCooler.say("tiler.repaint");
            
            self.trigger("wake");
        },
        
        select: function(tile) {
            selectTile(tile);
        }
    }); // self
    
    self.bind("tap", handleTap);

    return self;
}; // Tiler
