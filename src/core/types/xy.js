/**
# T5.XY 
The internal XY class is currently created by making a call to `T5.XY.init` rather than `new T5.XY`.
This will seem strange, and it is strange, and is a result of migrating from a closure based pattern
to a prototypal pattern in areas of the Tile5 library.

## Methods
*/
function XY(p1, p2) {
    // initialise the mercator x and y
    this.mercX = null;
    this.mercY = null;
    
    // if the first parameter is a string, then parse
    if (_is(p1, typeString)) {
        Parser.parseXY(p1, this);
    }
    // otherwise if the first parameter is a position
    else if (p1 && p1.toPixels) {
        var pix = p1.toPixels();
        this.mercX = pix.x;
        this.mercY = pix.y;
    }
    // otherwise assign to the x and y values
    else {
        this.x = p1 || 0;
        this.y = p2 || 0;
    } // if..else
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
    },
    
    /**
    ### offset(x, y)
    Return a new T5.XY object which is offset from the current xy by the specified arguments.
    */
    offset: function(x, y) {
        return new XY(this.x + x, this.y + y);
    },
    
    /**
    ### sync(rpp)
    */
    sync: function(rpp, reverse) {
        if (reverse) {
            this.mercX = this.x * rpp - Math.PI;
            this.mercY = Math.PI - this.y * rpp;
        }
        else if (this.mercX || this.mercY) {
            this.x = round((this.mercX + Math.PI) / rpp);
            this.y = round((Math.PI - this.mercY) / rpp);
        } // if
        
        return this;
    },
    
    /**
    ### toPos()
    */
    toPos: function() {
        return new Pos(pix2lat(this.mercY), pix2lon(this.mercX));
    },
    
    /**
    ### toString()
    */
    toString: function() {
        return this.x + ', ' + this.y;
    }
};