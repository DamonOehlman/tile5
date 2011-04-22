/**
# T5.XY (Internal Class)
The internal XY class is currently created by making a call to `T5.XY.init` rather than `new T5.XY`.
This will seem strange, and it is strange, and is a result of migrating from a closure based pattern
to a prototypal pattern in areas of the Tile5 library.

## Methods
*/
function XY(x, y) {
    this.x = x || 0;
    this.y = y || 0;
} // XY constructor

XY.prototype = {
    constructor: XY,
    
    /**
    ### add(xy*)
    Return a __new__ xy composite that is adds the current value of this xy value with the other xy 
    values that have been passed to the function.  The actual value of this XY value remain unchanged.
    */
    add: function() {
        var sumX = this.x, 
            sumY = this.y;
            
        for (var ii = arguments.length; ii--; ) {
            sumX += arguments[ii].x;
            sumY += arguments[ii].y;
        } // for
        
        return new XY(sumX, sumY);
    }, // add    
    
    /**
    ### equals(xy)
    Return true if the two points are equal, false otherwise.  __NOTE:__ This function
    does not automatically floor the values so if the point values are floating point
    then floating point precision errors will likely occur.
    */
    equals: function(xy) {
        return this.x === xy.x && this.y === xy.y;
    }
};