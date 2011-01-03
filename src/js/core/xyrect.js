/**
# T5.XYRect
This module provides helper functions for working with an object literal that represents a set of xy
values that represent the top-left and bottom-right corners of a rectangle respectively.

## XYRect Object Literal Format
An XYRect object literal has the following properties.

- `x1` - The x value for the top left corner
- `y1` - The y value for the top left corner
- `x2` - The x value for the bottom right corner
- `y2` - The y value for the bottom right corner
- `width` - The width of the rect
- `height` - The height of the rect

## Functions
*/
var XYRect = (function() {
    
    /* exports */
    
    /**
    ### center(rect)
    Return a xy composite for the center of the rect
    */
    function center(rect) {
        return XY.init(rect.x1 + rect.width/2, rect.y1 + rect.height/2);
    } // center
    
    /**
    ### copy(rect)
    Return a duplicate of the XYRect
    */
    function copy(rect) {
        return init(rect.x1, rect.y1, rect.x2, rect.y2);
    } // copy
    
    /**
    ### diagonalSize(rect)
    */
    function diagonalSize(rect) {
        return Math.sqrt(rect.width * rect.width + rect.height * rect.height);
    } // diagonalSize
    
    /**
    ### fromCenter(centerX, centerY, width, height)
    */
    function fromCenter(centerX, centerY, width, height) {
        var halfWidth = ~~(width / 2),
            halfHeight = ~~(height / 2);
        
        return init(
            centerX - halfWidth, 
            centerY - halfHeight,
            centerX + halfWidth,
            centerY + halfHeight);
    } // fromCenter
    
    /**
    ### init(x1, y1, x2, y2)
    Create a new XYRect composite object
    */
    function init(x1, y1, x2, y2) {
        // default the xy and y1 to 0 if not specified
        x1 = x1 ? x1 : 0;
        y1 = y1 ? y1 : 0;
        x2 = typeof x2 !== 'undefined' ? x2 : x1;
        y2 = typeof y2 !== 'undefined '? y2 : y2;
        
        return {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
        
            width: x2 - x1,
            height: y2 - y1
        };
    } // init
    
    /**
    ### intersect(rect1, rect2)
    Returns the intersecting rect between the two specified XYRect composites
    */
    function intersect(rect1, rect2) {
        var x1 = Math.max(rect1.x1, rect2.x1),
            y1 = Math.max(rect1.y1, rect2.y1),
            x2 = Math.min(rect1.x2, rect2.x2),
            y2 = Math.min(rect1.y2, rect2.y2),
            r = init(x1, y1, x2, y2);
            
        return ((r.width > 0) && (r.height > 0)) ? r : null;
    } // intersect
    
    /**
    ### union(rect1, rect2)
    */
    function union(rect1, rect2) {
        if (rect1.width === 0 || rect1.height === 0) {
            return copy(rect2);
        }
        else if (rect2.width === 0 || rect2.height === 0) {
            return copy(rect1);
        }
        else {
            var x1 = Math.min(rect1.x1, rect2.x1),
                y1 = Math.min(rect1.y1, rect2.y1),
                x2 = Math.max(rect1.x2, rect2.x2),
                y2 = Math.max(rect1.y2, rect2.y2),
                r = init(x1, y1, x2, y2);

            return ((r.width > 0) && (r.height > 0)) ? r : null;
        } // if..else
    } // union
    
    /* module definition */
    
    return {
        center: center,
        copy: copy,
        diagonalSize: diagonalSize,
        fromCenter: fromCenter,
        init: init,
        intersect: intersect,
        union: union
    };
})();