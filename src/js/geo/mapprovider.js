/**
# T5.Geo.MapProvider
The MapProvider class is the base class from which all map providers are implemented.
The class provides a number of common functions that can be expected in most 
implementations of a GIS map provider.

## Constructor
`new T5.Geo.MapProvider();`

While the constructor of the map provider takes no initialization parameters it is 
expected that a derivative MapProvider will implement parameters, and some of these
are part of a common set that are read and acted upon when creating the T5.ImageTileGrid
that will hold the map tiles in the grid.

## Methods
*/
T5.Geo.MapProvider = function() {
    var zoomMin = 1,
        zoomMax = 20;
    
    // initailise self
    var self = {
        zoomLevel: 0,
        
        /**
        - `checkZoomLevel(zoomLevel)`
        
        Return the passed in zoom level if valid for the map provider, otherwise
        return a zoom level that is valid
        */
        checkZoomLevel: function(zoomLevel) {
            return Math.min(Math.max(zoomLevel, zoomMin), zoomMax);
        },
        
        /**
        - `getCopyright()`
        
        Return the copyright message for this map provider
        */
        getCopyright: function() {
        },
        
        /**
        - `getLogoUrl()`
        
        Return the url for an image logo that can be used with this map provider
        */
        getLogoUrl: function() {
        },

        /**
        - `getMapTiles(tiler, position, callback)`
        
        This is the engine room of a map provider.  An implementation of a map
        provider will provide an implementation of this method to fill a grid
        of map tiles for the specified tiler at the specified position.  The _callback_
        that is supplied to the function will be called once a Geo.GeoTileGrid has been 
        created from the map provider and that tilegrid will be passed through as the 
        only parameter to the callback
        */
        getMapTiles: function(tiler, position, callback) {

        },

        /**
        - `getZoomRange()`
        
        Return an object containing the .min and .max for the zoom of the map provider
        */
        getZoomRange: function() {
            return {
                min: zoomMin,
                max: zoomMax
            };
        },
        
        /**
        ### prepTileGridArgs(width, height, tileSize, center, args)
        This method is used by derivative map providers to prepare arguments for a tile
        grid that it creates when populating the map tiles.
        */
        prepTileGridArgs: function(width, height, tileSize, center, args) {
            var background = null;
            
            // if a tilebackground color has been specified, then create a background canvas 
            if (args.tileBackgroundColor) {
                background = T5.Images.newCanvas(tileSize, tileSize);
                
                var context = background.getContext('2d');
                context.fillStyle = args.tileBackgroundColor;
                context.fillRect(0, 0, tileSize, tileSize);
            } // if
            
            // initialise the tile draw args
            var tileDrawArgs = {
                background: background
            };
            
            return T5.ex({
                tileSize: tileSize,
                width: width,
                height: height,
                center: center,
                tileDrawArgs: tileDrawArgs
            }, args);
        },
        
        /**
        - `setZoomRange(min, max)`
        
        Set the min and max zoom range
        */
        setZoomRange: function(min, max) {
            zoomMin = min;
            zoomMax = max;
        }
    };

    return self;
}; // MapProvider

