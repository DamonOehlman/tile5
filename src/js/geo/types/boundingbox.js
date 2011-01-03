/**
# T5.Geo.BoundingBox

A collection of utilities that are primarily designed to help with working 
with Geo.BoundingBox objects.  The functions are implemented here rather 
than with the actual object itself to ensure that the object remains lightweight.

## Functions
*/
var BoundingBox = (function() {
    
    /* exports */
    
    /**
    ### calcSize(min, max, normalize)
    The calcSize function is used to determine the size of a Geo.BoundingBox given 
    a minimum position (relates to the bottom-left / south-western corner) and 
    maximum position (top-right / north-eastern corner) of the bounding box.  
    The 3rd parameter specifies whether the size calculations should normalize the 
    calculation in cases where the bounding box crosses the 360 degree boundary.
    */
    function calcSize(min, max, normalize) {
        var size = T5.XY.init(0, max.lat - min.lat);
        if (typeof normalize === 'undefined') {
            normalize = true;
        } // if

        if (normalize && (min.lon > max.lon)) {
            size.x = 360 - min.lon + max.lon;
        }
        else {
            size.x = max.lon - min.lon;
        } // if..else

        return size;
    } // calcSize 
    
    /**
    ### createBoundsFromCenter(centerPos, distance)
    This function is very useful for creating a Geo.BoundingBox given a 
    center position and a radial distance (specified in KM) from the center 
    position.  Basically, imagine a circle is drawn around the center 
    position with a radius of distance from the center position, and then 
    a box is drawn to surround that circle.  Adapted from the [functions written 
    in Java by Jan Philip Matuschek](http://janmatuschek.de/LatitudeLongitudeBoundingCoordinates)
    */
    function createBoundsFromCenter(centerPos, distance) {
        var radDist = distance / KM_PER_RAD,
            radLat = centerPos.lat * DEGREES_TO_RADIANS,
            radLon = centerPos.lon * DEGREES_TO_RADIANS,
            minLat = radLat - radDist,
            maxLat = radLat + radDist,
            minLon, maxLon;
            
        // COG.Log.info("rad distance = " + radDist);
        // COG.Log.info("rad lat = " + radLat + ", lon = " + radLon);
        // COG.Log.info("min lat = " + minLat + ", max lat = " + maxLat);
            
        if ((minLat > MIN_LAT) && (maxLat < MAX_LAT)) {
            var deltaLon = Math.asin(Math.sin(radDist) / Math.cos(radLat));
            
            // determine the min longitude
            minLon = radLon - deltaLon;
            if (minLon < MIN_LON) {
                minLon += 2 * Math.PI;
            } // if
            
            // determine the max longitude
            maxLon = radLon + deltaLon;
            if (maxLon > MAX_LON) {
                maxLon -= 2 * Math.PI;
            } // if
        }
        else {
            minLat = Math.max(minLat, MIN_LAT);
            maxLat = Math.min(maxLat, MAX_LAT);
            minLon = MIN_LON;
            maxLon = MAX_LON;
        } // if..else
        
        return BoundingBox.init(
            Position.init(minLat * RADIANS_TO_DEGREES, minLon * RADIANS_TO_DEGREES), 
            Position.init(maxLat * RADIANS_TO_DEGREES, maxLon * RADIANS_TO_DEGREES));
    } // createBoundsFromCenter
    
    /**
    ### expand(bounds, amount)
    A simple function that is used to expand a Geo.BoundingBox 
    by the specified amount (in degrees).
    */
    function expand(bounds, amount) {
        return BoundingBox.init(
            Position.init(bounds.min.lat - amount, bounds.min.lon - amount % 360),
            Position.init(bounds.max.lat + amount, bounds.max.lon + amount % 360));
    } // expand
    
    /**
    ### forPositions(positions, padding)

    This function is very useful when you need to create a 
    Geo.BoundingBox to contain an array of T5.Geo.Position.  
    The optional second parameter allows you to specify an amount of 
    padding (in degrees) to apply to the bounding box that is created.
    */
    function forPositions(positions, padding) {
        var bounds = null,
            startTicks = T5.ticks();

        // if padding is not specified, then set to auto
        if (! padding) {
            padding = "auto";
        } // if

        for (var ii = positions.length; ii--; ) {
            if (! bounds) {
                bounds = init(positions[ii], positions[ii]);
            }
            else {
                var minDiff = calcSize(bounds.min, positions[ii], false),
                    maxDiff = calcSize(positions[ii], bounds.max, false);

                if (minDiff.x < 0) { bounds.min.lon = positions[ii].lon; }
                if (minDiff.y < 0) { bounds.min.lat = positions[ii].lat; }
                if (maxDiff.x < 0) { bounds.max.lon = positions[ii].lon; }
                if (maxDiff.y < 0) { bounds.max.lat = positions[ii].lat; }
            } // if..else
        } // for

        // expand the bounds to give us some padding
        if (padding) {
            if (padding == "auto") {
                var size = calcSize(bounds.min, bounds.max);

                // update padding to be a third of the max size
                padding = Math.max(size.x, size.y) * 0.3;
            } // if

            bounds = expand(bounds, padding);
        } // if

        COG.Log.trace("calculated bounds for " + positions.length + " positions", startTicks);
        return bounds;
    } // forPositions
    
    /**
    ### getCenter(bounds)
    Returns a Geo.Position for the center position of the bounding box.
    */
    function getCenter(bounds) {
        // calculate the bounds size
        var size = calcSize(bounds.min, bounds.max);
        
        // create a new position offset from the current min
        return Position.init(bounds.min.lat + (size.y / 2), bounds.min.lon + (size.x / 2));
    } // getCenter
    
        
    /**
    ### getGeohash(bounds)
    To be completed
    */
    function getGeoHash(bounds) {
        var minHash = T5.Geo.GeoHash.encode(bounds.min.lat, bounds.min.lon),
            maxHash = T5.Geo.GeoHash.encode(bounds.max.lat, bounds.max.lon);
            
        COG.Log.info("min hash = " + minHash + ", max hash = " + maxHash);
    } // getGeoHash
    
    /** 
    ### getZoomLevel(bounds, displaySize)

    This function is used to return the zoom level (seems consistent across 
    mapping providers at this stage) that is required to properly display 
    the specified T5.Geo.BoundingBox given the screen dimensions (specified as 
    a Dimensions object) of the map display. Adapted from 
    [this code](http://groups.google.com/group/google-maps-js-api-v3/browse_thread/thread/43958790eafe037f/66e889029c555bee)
    */
    function getZoomLevel(bounds, displaySize) {
        // get the constant index for the center of the bounds
        var boundsCenter = getCenter(bounds),
            maxZoom = 1000,
            variabilityIndex = Math.min(Math.round(Math.abs(boundsCenter.lat) * 0.05), LAT_VARIABILITIES.length),
            variability = LAT_VARIABILITIES[variabilityIndex],
            delta = calcSize(bounds.min, bounds.max),
            // interestingly, the original article had the variability included, when in actual reality it isn't, 
            // however a constant value is required. must find out exactly what it is.  At present, though this
            // works fine.
            bestZoomH = Math.ceil(Math.log(LAT_VARIABILITIES[3] * displaySize.height / delta.y) / Math.log(2)),
            bestZoomW = Math.ceil(Math.log(variability * displaySize.width / delta.x) / Math.log(2));

        // COG.Log.info("constant index for bbox: " + bounds + " (center = " + boundsCenter + ") is " + variabilityIndex);
        // COG.Log.info("distances  = " + delta);
        // COG.Log.info("optimal zoom levels: height = " + bestZoomH + ", width = " + bestZoomW);

        // return the lower of the two zoom levels
        return Math.min(isNaN(bestZoomH) ? maxZoom : bestZoomH, isNaN(bestZoomW) ? maxZoom : bestZoomW);
    } // getZoomLevel
    
    function init(initMin, initMax) {
        return {
            min: Position.parse(initMin),
            max: Position.parse(initMax)
        };
    } // init
    
    /**
    ### isEmpty(bounds)
    Returns true if the specified T5.Geo.BoundingBox is empty.
    */
    function isEmpty(bounds) {
        return (! bounds) || Position.empty(bounds.min) || Position.empty(bounds.max);
    } // isEmpty
    
    /**
    ### toString(bounds)
    Returns a string representation of a Geo.BoundingBox
    */
    function toString(bounds) {
        return "min: " + Position.toString(bounds.min) + ", max: " + Position.toString(bounds.max);
    } // toString

    return {
        calcSize: calcSize,
        createBoundsFromCenter: createBoundsFromCenter,
        expand: expand,
        forPositions: forPositions,
        getCenter: getCenter,
        getGeoHash: getGeoHash,
        getZoomLevel: getZoomLevel,
        init: init,
        isEmpty: isEmpty,
        toString: toString
    };
})();