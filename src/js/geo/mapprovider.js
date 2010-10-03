/**
# Geo.MapProvider

The MapProvider class is the base class from which all map providers are implemented.
The class provides a number of common functions that can be expected in most 
implementations of a GIS map provider.

## Properties

- `zoomLevel`

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

