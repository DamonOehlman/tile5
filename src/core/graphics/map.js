/**
# VIEW: map
The Map class is the entry point for creating a tiling map.  Creating a 
map is quite simple and requires two things to operate.  A containing HTML5 canvas
that will be used to display the map and a T5.Geo.MapProvider that will populate 
the map.

## Example Usage: Creating a Map
    
<pre lang='javascript'>
// create the map
map = new T5.Map({
    container: 'mapContainer'
});
</pre>

Like all View descendants the map supports features such as intertial scrolling and
the like and is configurable through implementing the configurable interface. For 
more information on view level features check out the View documentation.

## Events

### zoom
This event is triggered when the zoom level has been updated

<pre>
map.bind('zoom', function(evt, newZoomLevel) {
});
</pre>

### boundsChange
This event is triggered when the bounds of the map have changed

<pre>
map.bind('boundsChange', function(evt, bounds) {
});
</pre>

## Methods
*/
reg('view', 'map', function(params) {
    params = _extend({
        zoomLevel: 1,
        minZoom: 1,
        maxZoom: 18,
        pannable: true,
        scalable: true
    }, params);

    // initialise variables
    var lastBoundsChangeOffset = new XY(),
        initialized = false,
        tappedPOIs = [],
        annotations = null, // annotations layer
        guideOffset = null,
        initialTrackingUpdate = true,
        rpp = 0,
        tapExtent = params.tapExtent;
        
    /* internal functions */
    
    /* event handlers */
    
    function handleTap(evt, absXY, relXY, offsetXY) {
        var tapPos = offsetXY.toPos(rpp),
            minPos = offsetXY.offset(-tapExtent, tapExtent).toPos(rpp),
            maxPos = offsetXY.offset(tapExtent, -tapExtent).toPos(rpp);
                
        _self.trigger(
            'geotap', 
            absXY, 
            relXY, 
            tapPos,
            new BBox(minPos, maxPos)
        );
    } // handleTap
    
    function handleRefresh(evt, view, viewport) {
        // check the offset has changed (refreshes can happen for other reasons)
        if (lastBoundsChangeOffset.x != viewport.x || lastBoundsChangeOffset.y != viewport.y) {
            // trigger the event
            _self.trigger('boundsChange', _self.getBoundingBox());
            
            // update the last bounds change offset
            lastBoundsChangeOffset.x = viewport.x;
            lastBoundsChangeOffset.y = viewport.y;
        } // if
    } // handleWork
    
    function handleZoomLevelChange(evt, zoomLevel) {
        var gridSize;
        
        // update the rads per pixel to reflect the zoom level change
        rpp = _self.rpp = radsPerPixel(zoomLevel);
        
        // calculate the grid size
        gridSize = TWO_PI / rpp | 0;
        _self.setMaxOffset(gridSize, gridSize, true, false);
        
        // remove the grid layer
        // Images.cancelLoad();
        
        // reset scaling and resync the map
        _self.resetScale();
        _self.triggerAll('resync');
    } // handleZoomLevel
    
    /* internal functions */
    
    function getLayerScaling(oldZoom, newZoom) {
        return radsPerPixel(oldZoom) / radsPerPixel(newZoom);
    } // getLayerScaling
    
    /* public methods */
    
    /** 
    ### getBoundingBox()
    
    Return a boundingbox for the current map view area
    */
    function getBoundingBox() {
        var viewport = _self.getViewport();
        
        return viewport ? 
            new BBox(
                new XY(viewport.x, viewport.y2).toPos(rpp),
                new XY(viewport.x2, viewport.y).toPos(rpp)) : 
            null;
    } // getBoundingBox

    /**
    ### getCenterPosition()`
    Return a T5.XY composite for the center position of the map
    */
    function getCenterPosition() {
        var viewport = _self.getViewport();
        if (viewport) {
            return new XY(viewport.x + (viewport.w >> 1), viewport.y + (viewport.h >> 1)).toPos(rpp);
        } // if
        
        return null;
    } // getCenterPosition
    
    /**
    ### gotoBounds(bounds, callback)
    Calculates the optimal display bounds for the specified boundingbox and
    then goes to the center position and zoom level best suited.
    */
    function gotoBounds(bounds, callback) {
        // goto the center position of the bounding box 
        // with the calculated zoom level
        gotoPosition(
            bounds.center(),
            bounds.bestZoomLevel(_self.getViewport()), 
            callback);
    } // gotoBounds
    
    /**
    ### gotoPosition(position, newZoomLevel, callback)
    This function is used to tell the map to go to the specified position.  The 
    newZoomLevel parameter is optional and updates the map zoom level if supplied.
    An optional callback argument is provided to receieve a notification once
    the position of the map has been updated.
    */
    function gotoPosition(position, newZoomLevel, callback) {
        // update the zoom level
        _self.zoom(newZoomLevel);
        
        // pan to Position
        panToPosition(position, callback);
    } // gotoPosition
    
    /**
    ### panToPosition(position)
    This method is used to tell the map to pan (not zoom) to the specified position
    */
    function panToPosition(position, callback, easingFn, easingDuration) {
        // determine the tile offset for the 
        // requested position
        var centerXY = new XY(position);
        centerXY.sync(radsPerPixel(_self.zoom()));
        
        _self.center(centerXY.x, centerXY.y, easingFn, easingDuration, function() {
            // if a callback is defined, then pass that on
            if (callback) {
                callback(_self); 
            } // if
        });
    } // panToPosition
    
    /* public object definition */
    
    // provide the tiler (and view) an adjust scale factor handler
    params.adjustScaleFactor = function(scaleFactor) {
        var roundFn = scaleFactor < 1 ? Math.floor : Math.ceil;
        return Math.pow(2, roundFn(Math.log(scaleFactor)));
    };
    
    // initialise _self
    var _self = _extend(regCreate('view', 'simple', params), {
        
        getBoundingBox: getBoundingBox,
        getCenterPosition: getCenterPosition,

        gotoBounds: gotoBounds,
        gotoPosition: gotoPosition,
        panToPosition: panToPosition
    });
    
    // bind some event handlers
    _self.bind('tap', handleTap);
    
    // listen for the view idling
    _self.bind('refresh', handleRefresh);
    
    // listen for zoom level changes
    _self.bind('zoom', handleZoomLevelChange);

    return _self;
});
