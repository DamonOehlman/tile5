/**
# MarkerLayer

## Events

- `markerUpdate`
- `markerTap`
*/
T5.MarkerLayer = function(params) {
    params = T5.ex({
        zindex: 100
    }, params);
    
    var markers = [],
        animating = false;
        
    /* event handlers */
        
    function handleGridUpdate(evt, grid) {
        // iterate through the markers and fire the callback
        for (var ii = markers.length; ii--; ) {
            grid.syncVectors([markers[ii].xy]);
        } // for
    } // handleGridUpdate
        
    function handleTap(evt, absXY, relXY, gridXY) {
        var tappedMarkers = [];
        
        // iterate through the markers and look for matches
        for (var ii = markers.length; ii--; ) {
            if (markers[ii].hitTest(gridXY)) {
                tappedMarkers[tappedMarkers.length] = markers[ii];
            } // if
        } // for
        
        // COG.Log.info('testing for tapped markers, tap count = ' + tappedMarkers.length);
        
        // if we have tapped markers, then cancel the tap event
        if (tappedMarkers.length > 0) {
            evt.cancel = self.trigger('markerTap', absXY, relXY, tappedMarkers).cancel;
        } // if
    } // handleTap
    
    /* internal functions */

    /*
    This function is used to provide updates when the markers have changed. This 
    involves informing other waking the parent view and having a redraw occur and 
    additionally, firing the markers changed event
    */
    function markerUpdate() {
        var grid = self.getParent().getTileLayer();
        if (grid) {
            handleGridUpdate(null, grid);
        } // if
        
        // trigger the markers changed event
        self.trigger('markerUpdate', markers);
        
        // wake and invalidate the parent
        self.wakeParent(true);
    } // markerUpdate
    
    /* exports */
    
    function add(newItems) {
        // if annotation is an array, then iterate through and add them
        if (newItems && (typeof newItems.length !== 'undefined')) {
            for (var ii = newItems.length; ii--; ) {
                if (newItems[ii]) {
                    markers[markers.length] = newItems[ii];
                } // if
            } // for
        }
        else if (newItems) {
            markers[markers.length] = newItems;
        } // if..else
        
        markerUpdate();
    } // add
    
    function clear(testCallback) {
        // if we have a test callback, then iterate through the markers and 
        // only remove ones that match the requirements
        if (testCallback) {
            for (var ii = 0; ii < markers.length; ii++) {
                if (testCallback(markers[ii])) {
                    markers.splice(ii, 1);
                } // if
            } // for
        }
        // otherwise, reset the markers
        else {
            markers = [];
        } // if..else
        
        markerUpdate();
    } // clear

    // create the view layer the we will draw the view
    var self = T5.ex(new T5.ViewLayer(params), {
        cycle: function(tickCount, offset, state, redraw) {
            return animating;
        },
        
        draw: function(context, offset, dimensions, state, view) {
            // reset animating to false
            animating = false;
        
            // iterate through the markers and draw them
            for (var ii = markers.length; ii--; ) {
                markers[ii].draw(
                    context, 
                    offset, 
                    state, 
                    self, 
                    view);
                    
                animating = animating || markers[ii].isAnimating();
            } // for

            return animating ? 1 : 0;
        },
        
        add: add,
        clear: clear
    });
    
    // handle tap events
    self.bind('tap', handleTap);
    self.bind('gridUpdate', handleGridUpdate);
    
    return self;
};
