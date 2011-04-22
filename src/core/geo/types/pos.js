/**
# T5.Pos (internal class)
The T5.Pos class is a currently an internal class that is used by the `T5.Geo.Position` module.
This is currently a little obscure and is due to a change in the way Tile5 is structured internally.

# Methods
*/
function Pos(p1, p2) {
    // if the first parameter is a string, then parse the value
    if (p1 && p1.split) {
        var coords = p1.split(reDelimitedSplit);
        
        if (coords.length > 1) {
            p1 = coords[0];
            p2 = coords[1];
        } // if
    }
    // otherwise if a position has been passed to the position, then 
    // we will create a new position as a copy of that position
    else if (p1 && p1.lat) {
        p2 = p1.lon;
        p1 = p1.lat;
    } // if..else
    
    // initialise the position
    this.lat = parseFloat(p1 || 0);
    this.lon = parseFloat(p2 || 0);
} // Pos constructor

Pos.prototype = {
    constructor: Pos,
    
    /**
    ### offset(latOffset, lonOffset)
    Return a new T5.Geo.Position which is the original `pos` offset by
    the specified `latOffset` and `lonOffset` (which are specified in 
    km distance)
    */
    offset: function(latOffset, lonOffset) {
        var radOffsetLat = latOffset / KM_PER_RAD,
            radOffsetLon = lonOffset / KM_PER_RAD,
            radLat = this.lat * DEGREES_TO_RADIANS,
            radLon = this.lon * DEGREES_TO_RADIANS,
            newLat = radLat + radOffsetLat,
            deltaLon = asin(sin(radOffsetLon) / cos(radLat)),
            newLon = radLon + deltaLon;
           
        // if the new latitude has wrapped, then update
        newLat = ((newLat + HALF_PI) % Math.PI) - HALF_PI;
        newLon = newLon % TWO_PI;
        
        return new Pos(newLat * RADIANS_TO_DEGREES, newLon * RADIANS_TO_DEGREES);
    },
    
    toString: function(delimiter) {
        return this.lat + (delimiter || ' ') + this.lon;
    }
};