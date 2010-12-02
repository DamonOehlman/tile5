/** 
# T5.Tiler
_extends:_ T5.View


The T5.Tiler is the base class upon which tiling views are built.

## Constructor
`new T5.Tiler(params);`

## Events

### selectTile
This event is triggered when a tile in the tiler has been selected, which is
triggered by a tap.

<pre>
tiler.bind('selectTile', function(tile) {
});
</pre>

### gridUpdate
The gridUpdate event is trigger with then tiler layer has been update through the 
use of the `setTileLayer` method.  This event is also triggered on any T5.ViewLayer 
that is a current child of the view.

<pre>
tiler.bind('gridUpdate', function(grid) {
});
</pre>

## Methods
*/
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
    
    function handleTap(evt, absXY, relXY) {
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
        /**
        ### getTileLayer
        */
        getTileLayer: function() {
            return self.getLayer("grid" + gridIndex);
        },

        /**
        ### setTileLayer(value)
        */
        setTileLayer: function(value) {
            self.setLayer("grid" + gridIndex, value);
            self.trigger('gridUpdate', value);
            
            // iterate through the other layers and let them know
            self.eachLayer(function(layer) {
                layer.trigger('gridUpdate', value);
            });
        },

        /**
        ### viewPixToGridPix(vector)
        */
        viewPixToGridPix: function(vector) {
            var offset = self.getOffset();
            return new T5.Vector(vector.x + offset.x, vector.y + offset.y);
        },
        
        /**
        ### centerPos(tile, easing, duration, callback)
        */
        centerOn: function(tile, easing, duration, callback) {
            var grid = self.getTileLayer(),
                dimensions = self.getDimensions(),
                tileSize = grid ? grid.getTileSize() : 0;
                
            if (tileSize) {
                self.updateOffset(
                    tile.gridX - (dimensions.width - tileSize) * 0.5 >> 0, 
                    tile.gridY - (dimensions.height - tileSize) * 0.5 >> 0,
                    easing,
                    duration,
                    callback);
            } // if
        },
        
        /**
        ### cleanup()
        */
        cleanup: function() {
            self.removeLayer("grid" + gridIndex);
        },
        
        repaint: function() {
            // flag to the tile store to reset the image positions
            COG.say("tiler.repaint");
            
            self.trigger("wake");
        },
        
        /**
        ### select(tile)
        Manually select the specified `tile`
        */
        select: function(tile) {
            selectTile(tile);
        }
    }); // self
    
    self.bind("tap", handleTap);

    return self;
}; // Tiler
