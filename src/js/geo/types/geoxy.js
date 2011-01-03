/**
# T5.GeoXY

The GeoXY class is used to convert a position (T5.Geo.Position) into a
composite xy that can be used to draw on the various T5.ViewLayer implementations.
This class provides the necessary mechanism that allows the view layers to 
assume operation using a simple vector (containing an x and y) with no need
geospatial awareness built in.  

Layers are aware that particular events may require vector resynchronization 
which is facilitated by the `syncXY` method of the T5.Map. 

## Functions
*/
var GeoXY = exports.GeoXY = (function() {

    /* internal functions */

    /* exports */

    /**
    ### init(pos, rpp)
    */
    function init(pos, rpp) {
        var xy = XY.init();

        // update the position
        updatePos(xy, pos, rpp);

        return xy;
    } // init

    /**
    ### sync(xy, rpp)
    */
    function sync(xy, rpp) {
        // if the xy parameter is an array then process as such
        if (xy.length) {
            var minX, minY, maxX, maxY;

            for (var ii = xy.length; ii--; ) {
                sync(xy[ii], rpp);

                // update the min x and min y
                minX = (typeof minX === 'undefined') || xy.x < minX ? xy.x : minX;
                minY = (typeof minY === 'undefined') || xy.y < minY ? xy.y : minY;

                // update the max x and max y
                maxX = (typeof maxX === 'undefined') || xy.x > maxX ? xy.x : maxX;
                maxY = (typeof maxY === 'undefined') || xy.y > maxY ? xy.y : maxY;
            } // for

            return XYRect.init(minX, minY, maxY, maxY);
        }
        else if (xy.mercXY) {
            var mercXY = xy.mercXY;

            // calculate the x and y
            xy.x = ~~(mercXY.x / rpp);
            xy.y = ~~((Math.PI - mercXY.y) / rpp);

            // update the rads per pixel
            xy.rpp = rpp;
        }
        else {
            COG.Log.warn('Attempted to sync an XY composite, not a GeoXY');
        } // if..else

        return xy;
    } // setRadsPerPixel
    
    function toPos(xy, rpp) {
        rpp = rpp ? rpp : self.rpp;

        return Position.fromMercatorPixels(xy.x * rpp, Math.PI - xy.y * rpp);
    } // toPos
    
    function updatePos(xy, pos, rpp) {
        // update the position
        xy.pos = pos;
        xy.mercXY = Position.toMercatorPixels(pos);
        
        // allow for using the xy of the rads per pixel if not supplied
        rpp = typeof rpp !== 'undefined' ? rpp : xy.rpp;

        if (rpp) {
            sync(xy, rpp);
        } // if
    } // updatePos

    /* create the module */

    return {
        init: init,
        sync: sync,
        toPos: toPos,
        updatePos: updatePos
    };
})();

/**
# T5.Geo.GeoVector
__deprecated__


please use the T5.Geo.GeoXY instead
*/
exports.GeoVector = function(position) {
    COG.Log.warn('The T5.Geo.GeoVector class has been deprecated, please use T5.GeoXY.init instead');

    return GeoXY.init(position);
}; // Vector