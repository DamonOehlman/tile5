/**
# T5.Marker
This is a generic marker that can be applied via a T5.MarkerLayer
to any T5.View, but is commonly used in a T5.Map.  An marker is able to 
be animated and examples of this can be seen in the [Tile5 Sandbox](http://sandbox.tile5.org)

## Constructor
`new T5.Marker(params);`

### Initialization Parameters

- `xy` (T5.Vector) - a vector that specifies the grid position of the marker. When
working with Geo data, the T5.Geo.GeoVector provides a simple way to specify this
position.

- `offset` (boolean, default = true) - whether or not the `xy` vector is relative to the 
current grid offset.  In the case where you wish to create a marker that is relative to the
view and not the grid, set this parameter to false.

- `tweenIn` (easing function, default = null) - the easing function that is used to 
animate the entry of the annotation.  When not provided, the annotation is simply
displayed statically.

- `animationSpeed` (int, default = 0) - the speed that the annotation should be animated
in at.  Used in combination with the `tweenIn` parameter.


## Methods

*/
T5.Marker = function(params) {
    params = T5.ex({
        xy: T5.XY.init(),
        offset: true,
        tweenIn: null,
        animationSpeed: null
    }, params);
    
    // initialise defaults
    var MARKER_SIZE = 4,
        animating = false,
        boundsX = 0,
        boundsY = 0,
        boundsWidth = 0,
        boundsHeight = 0,
        isOffset = params.offset;
        
    function updateBounds(newX, newY, newWidth, newHeight) {
        boundsX = newX;
        boundsY = newY;
        boundsWidth = newWidth;
        boundsHeight = newHeight;
        
        // COG.Log.info('bounds: x = ' + boundsX + ', y = ' + boundsY + ', width = ' + boundsWidth + ', height = ' + boundsHeight);
    } // updateBounds
    
    var self = T5.ex(params, {
        isNew: true,
        
        /* 
        ### isAnimating()
        Return true if we are currently animating the marker, false otherwise
        */
        isAnimating: function() {
            return animating;
        },
        
        /**
        ### draw(context, offset, state, overlay, view)
        The draw method is called by the T5.ViewLayer that contains the annotation
        and is used to draw the annotation to the specified context.  When creating
        a custom marker, you should provide a custom implementation of the `drawMarker`
        method rather than this method.
        */
        draw: function(context, viewRect, state, overlay, view) {
            if (self.isNew && (params.tweenIn)) {
                // get the end value and update the y value
                var endValue = self.xy.y;

                // set the y to offscreen
                self.xy.y = viewRect.y1 - 20;
                
                // animate the annotation
                animating = true;
                
                T5.tween(
                    self.xy, 
                    'y',
                    endValue, 
                    params.tweenIn, 
                    function() {
                        self.xy.y = endValue;
                        animating = false;
                    }, 
                    params.animationSpeed ? 
                        params.animationSpeed : 
                        250 + (Math.random() * 500)
                );
            } // if
            
            // draw ther marker
            self.drawMarker(
                context, 
                viewRect, 
                self.xy.x, 
                self.xy.y,
                state, 
                overlay, 
                view);
            
            self.isNew = false;
        },
        
        /**
        ### drawMarker(context, offset, x, y, state, overlay, view)
        The `drawMarker` method is the place holder implementation for drawing
        markers.  In the case of a T5.Annotation a simple circle is drawn, but
        extensions of T5.Annotation would normally replace this implementation
        with their own modified implementation (such as T5.ImageAnnotation does).
        */
        drawMarker: function(context, viewRect, x, y, state, overlay, view) {
            context.beginPath();
            context.arc(
                x, 
                y,
                MARKER_SIZE,
                0,
                Math.PI * 2,
                false);                    
            context.fill();
            
            // update the marker bounds
            updateBounds(x - MARKER_SIZE, y  - MARKER_SIZE, 
                MARKER_SIZE*2, MARKER_SIZE*2);
        },
        
        /**
        ### hitTest(testX, testY)
        This method is used to determine if the marker is located  at the specified 
        x and y position.
        */
        hitTest: function(testX, testY) {
            return (testX >= boundsX) && (testX <= boundsX + boundsWidth) &&
                (testY >= boundsY) && (testY <= boundsY + boundsHeight);
        },
        
        updateBounds: updateBounds
    }); // self
    
    // make a marker capable of triggering events
    COG.observable(self);
    
    return self;
};
