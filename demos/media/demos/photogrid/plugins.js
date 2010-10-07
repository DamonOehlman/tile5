(function() {
    var populatedTiles;
    
    function findPopulatedTiles(photogrid, tileGrid) {
        populatedTiles = [];
        
        tileGrid.find(function(tile) {
            if (tile.photoIndex && photogrid.getPhotoData(tile.photoIndex)) {
                populatedTiles.push(tile);
            } // if
            
            // don't return anything, and we will iterate through all non null tiles :)
        });
    } // findPopulatedTiles
    
    new T5.Dispatcher.Action({
        id: 'rando',
        title: 'Random',
        execute: function(photogrid, tiler, tileGrid) {
            var selectedTile = null,
                counter = 0;
                
            if (tileGrid) {
                findPopulatedTiles(photogrid, tileGrid);
                
                if (populatedTiles.length > 0) {
                    selectedTile = populatedTiles[Math.floor(Math.random() * populatedTiles.length)];
                } // if
                
                if (selectedTile) {
                    tiler.centerOn(selectedTile, T5.easing('quad.inout'), 1200, function() {
                        // tiler.select(selectedTile);
                    });
                } // if
            } // if
        }
    });
})();