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
                minX = isType(minX, typeUndefined) || xy.x < minX ? xy.x : minX;
                minY = isType(minY, typeUndefined) || xy.y < minY ? xy.y : minY;

                // update the max x and max y
                maxX = isType(maxX, typeUndefined) || xy.x > maxX ? xy.x : maxX;
                maxY = isType(maxY, typeUndefined) || xy.y > maxY ? xy.y : maxY;
            } // for

            return XYRect.init(minX, minY, maxY, maxY);
        }
        else if (xy.mercXY) {
            var mercXY = xy.mercXY;

            // calculate the x and y
            xy.x = (mercXY.x + Math.PI) / rpp | 0;
            xy.y = (Math.PI - mercXY.y) / rpp | 0;

            // update the rads per pixel
            xy.rpp = rpp;
        }
        else {
            COG.warn('Attempted to sync an XY composite, not a GeoXY');
        } // if..else

        return xy;
    } // setRadsPerPixel
    
    function syncPos(xy, rpp) {
        // if the xy parameter is an array then process as such
        if (xy.length) {
            for (var ii = xy.length; ii--; ) {
                syncPos(xy[ii], rpp);
            } // for
        }
        else {
            xy.mercXY = XY.init(xy.x * rpp - Math.PI, Math.PI - xy.y * rpp);
            xy.pos = Position.fromMercatorPixels(xy.mercXY.x, xy.mercXY.y);
        } // if..else

        return xy;
    } // syncPos
    
    function toPos(xy, rpp) {
        rpp = rpp || xy.rpp;

        return Position.fromMercatorPixels(xy.x * rpp - Math.PI, Math.PI - xy.y * rpp);
    } // toPos
    
    function updatePos(xy, pos, rpp) {
        // update the position
        xy.pos = pos;
        xy.mercXY = Position.toMercatorPixels(pos);
        
        // allow for using the xy of the rads per pixel if not supplied
        rpp = isType(rpp, typeNumber) ? rpp : xy.rpp;

        if (rpp) {
            sync(xy, rpp);
        } // if
    } // updatePos

    /* create the module */

    return {
        init: init,
        sync: sync,
        syncPos: syncPos,
        toPos: toPos,
        updatePos: updatePos
    };
})();