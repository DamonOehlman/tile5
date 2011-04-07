/**
# T5.Pos (internal class)
The T5.Pos class is a currently an internal class that is used by the `T5.Geo.Position` module.
This is currently a little obscure and is due to a change in the way Tile5 is structured internally.
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
    
    toString: function(delimiter) {
        return this.lat + (delimiter || ' ') + this.lon;
    }
};