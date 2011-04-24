/**
# T5.Map
_extends:_ T5.Tiler


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

### zoomLevelChange
This event is triggered when the zoom level has been updated

<pre>
map.bind('zoomLevelChange', function(evt, newZoomLevel) {
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
var Map = function(params) {
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
        var tapPos = GeoXY.toPos(offsetXY, rpp),
            minPos = GeoXY.toPos(
                XYFns.offset(offsetXY, -tapExtent, tapExtent),
                rpp),
            maxPos = GeoXY.toPos(
                XYFns.offset(offsetXY, tapExtent, -tapExtent),
                rpp);
                
        _self.trigger(
            'geotap', 
            absXY, 
            relXY, 
            tapPos,
            BoundingBox.init(minPos, maxPos)
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
    
    function handleProviderUpdate(name, value) {
        _self.cleanup();
        initialized = false;
    } // handleProviderUpdate
    
    function handleZoomLevelChange(evt, zoomLevel) {
        var gridSize;
        
        // update the rads per pixel to reflect the zoom level change
        rpp = radsPerPixel(zoomLevel);
        
        // calculate the grid size
        gridSize = TWO_PI / rpp | 0;
        _self.setMaxOffset(gridSize, gridSize, true, false);
        
        // remove the grid layer
        // Images.cancelLoad();
        
        // reset scaling and resync the map
        _self.resetScale();
        _self.triggerAll('resync', _self);
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
            BoundingBox.init(
                GeoXY.toPos(new XY(viewport.x, viewport.y2), rpp),
                GeoXY.toPos(new XY(viewport.x2, viewport.y), rpp)) : 
            null;
    } // getBoundingBox

    /**
    ### getCenterPosition()`
    Return a T5.GeoXY composite for the center position of the map
    */
    function getCenterPosition() {
        var viewport = _self.getViewport();
        if (viewport) {
            var xy = new XY(viewport.x + (viewport.w >> 1), viewport.y + (viewport.h >> 1));
            return GeoXY.toPos(xy, rpp);
        } // if
        
        return null;
    } // getCenterPosition
    
    /**
    ### gotoBounds(bounds, callback)
    Calculates the optimal display bounds for the specified boundingbox and
    then goes to the center position and zoom level best suited.
    */
    function gotoBounds(bounds, callback) {
        // calculate the zoom level required for the 
        // specified bounds
        var zoomLevel = BoundingBox.getZoomLevel(
                            bounds, 
                            _self.getViewport());
        
        // goto the center position of the bounding box 
        // with the calculated zoom level
        gotoPosition(
            BoundingBox.getCenter(bounds), 
            zoomLevel, 
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
        _self.setZoomLevel(newZoomLevel);
        
        // pan to Position
        panToPosition(position, callback);
    } // gotoPosition
    
    /**
    ### panToPosition(position)
    This method is used to tell the map to pan (not zoom) to the specified 
    T5.GeoXY. 
    
    __NOTE:__ callback, easingFn & easingDuration parameters removed
    */
    function panToPosition(position, callback, easingFn, easingDuration) {
        // determine the tile offset for the 
        // requested position
        var centerXY = GeoXY.init(position, radsPerPixel(_self.getZoomLevel())),
            viewport = _self.getViewport(),
            offsetX = centerXY.x - (viewport.w >> 1),
            offsetY = centerXY.y - (viewport.h >> 1);
            
        // _log('panning to center xy: ', centerXY);
        _self.updateOffset(offsetX, offsetY, easingFn, easingDuration, function() {
            // if a callback is defined, then pass that on
            if (callback) {
                callback(_self); 
            } // if
        });
    } // panToPosition
    
    /**
    ### syncXY(points)
    This function iterates through the specified vectors and if they are
    of type GeoXY composite they are provided the rads per pixel of the
    grid so they can perform their calculations
    */
    function syncXY(points, reverse) {
        return (reverse ? GeoXY.syncPos : GeoXY.sync)(points, rpp);
    } // syncXY
    
    /* public object definition */
    
    // provide the tiler (and view) an adjust scale factor handler
    params.adjustScaleFactor = function(scaleFactor) {
        var roundFn = scaleFactor < 1 ? Math.floor : Math.ceil;
        return Math.pow(2, roundFn(Math.log(scaleFactor)));
    };
    
    // initialise _self
    var _self = _extend(new View(params), {
        
        getBoundingBox: getBoundingBox,
        getCenterPosition: getCenterPosition,

        gotoBounds: gotoBounds,
        gotoPosition: gotoPosition,
        panToPosition: panToPosition,
        syncXY: syncXY
    });
    
    // bind some event handlers
    _self.bind('tap', handleTap);
    
    // listen for the view idling
    _self.bind('refresh', handleRefresh);
    
    // listen for zoom level changes
    _self.bind('zoomLevelChange', handleZoomLevelChange);

    return _self;
}; // T5.Map
