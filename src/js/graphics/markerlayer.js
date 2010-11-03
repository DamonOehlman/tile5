/**
# MarkerLayer

## Events

- `markersChanged`
- `markersTapped`
*/
T5.MarkerLayer = function(params) {
    params = T5.ex({
        zindex: 100
    }, params);
    
    var markers = [],
        animating = false;
        
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
            evt.cancel = self.trigger('markersTapped', absXY, relXY, tappedMarkers).cancel;
        } // if
    } // handleTap

    /*
    This function is used to provide updates when the markers have changed. This 
    involves informing other waking the parent view and having a redraw occur and 
    additionally, firing the markers changed event
    */
    function markersChanged() {
        // trigger the markers changed event
        self.trigger('markersChanged', markers);
        
        // wake and invalidate the parent
        self.wakeParent(true);
    } // markersChanged

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
        
        add: function(newItems) {
            // if annotation is an array, then iterate through and add them
            if (newItems && newItems.length) {
                for (var ii = newItems.length; ii--; ) {
                    markers[markers.length] = newItems[ii];
                } // for
            }
            else if (newItems) {
                markers[markers.length] = newItems;
            } // if..else
            
            markersChanged();
        },
        
        clear: function() {
            // reset the markers
            markers = [];
            markersChanged();
        }
    });
    
    // handle tap events
    self.bind('tap', handleTap);
    self.bind('gridUpdate', handleGridUpdate);
    
    return self;
};
