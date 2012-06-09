/**
# T5.XY 
The internal XY class is currently created by making a call to `T5.XY.init` rather than `new T5.XY`.
This will seem strange, and it is strange, and is a result of migrating from a closure based pattern
to a prototypal pattern in areas of the Tile5 library.

## Methods
*/
function XY(p1, p2) {
    // if the first parameter is a string, then parse
    if (sniff(p1) == 'string') {
        var xyVals = p1.split(reDelimitedSplit);
        
        this.x = parseFloat(xyVals[0]);
        this.y = parseFloat(xyVals[1]);
    }
    // or, if we have been passed an xy composite
    else if (p1 && p1.x) {
        this.x = p1.x;
        this.y = p1.y;
    }
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
        
        return this.copy(sumX, sumY);
    }, // add
    
    /**
    ### copy(x, y)
    */
    copy: function(x, y) {
        var copy = cog.extend({}, this);
        
        // override the x and y positions with the updated values
        copy.x = x || copy.x;
        copy.y = y || copy.y;
        
        return copy;
    },
    
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
        return this.copy(this.x + x, this.y + y);
    },
    
    /**
    ### relative(view)
    This method is used to return xy coordinates that are relative to the view, rather
    than to the current view frame.
    */
    relative: function(view) {
        // get the viewport
        var viewport = view.viewport();
        
        return this.copy(
            this.x - viewport.x - viewport.padding.x, 
            this.y - viewport.y - viewport.padding.y
        );
    },
    
    /**
    ### rotate(angle, around)
    This function is used to determine the xy position if the current xy element
    was rotated by `theta` around xy position `origin`.
    
    The code was written after dissecting [James Coglan's](http://jcoglan.com/) excellent
    library [Sylvester](http://sylvester.jcoglan.com/).
    */
    rotate: function(theta, origin) {
        // initialise around to a default of 0, 0 if not defined
        origin = origin || new XY(0, 0);
        
        // initialise the x and y positions
        var x = this.x - origin.x,
            y = this.y - origin.y;
            
        return new XY(
            origin.x + cos(theta) * x + -sin(theta) * y,
            origin.y + sin(theta) * x +  cos(theta) * y
        );
    },
    
    /**
    ### scale(scaleFactor)
    */
    scale: function(scaleFactor, origin) {
        origin = origin || new XY(0, 0);
        
        var x = this.x - origin.x,
            y = this.y - origin.y;
        
        return new XY(
            origin.x + x * scaleFactor, 
            origin.y + y * scaleFactor
        );
    },
    
    /**
    ### sync(view, reverse)
    */
    sync: function(view, reverse) {
        return this;
    },
    
    /**
    ### toString()
    */
    toString: function() {
        return this.x + ', ' + this.y;
    }
};