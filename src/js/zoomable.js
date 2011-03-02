/**
# T5.zoomable(view, params)
This mixin is used to make an object support integer zoom levels which are 
implemented when the view scales
*/
function zoomable(view, params) {
    params = COG.extend({
        initial: 1,
        minZoom: 1,
        maxZoom: 16
    }, params);

    // initialise variables
    var zoomLevel = null,
        minZoom = params.minZoom,
        maxZoom = params.maxZoom;
    
    /* internal functions */
    
    function handleScale(evt, scaleAmount, zoomXY) {
        var zoomChange = Math.log(scaleAmount) / Math.LN2;

        setZoomLevel(zoomLevel + zoomChange, zoomXY);
        view.updateOffset(zoomXY.x * scaleAmount, zoomXY.y * scaleAmount);
    } // handleScale
    
    /* exports */
    
    /**
    ### getZoomLevel()
    Get the current zoom level for the map
    */
    function getZoomLevel() {
        return zoomLevel;
    } // getZoomLevel
    
    /**
    ### setZoomLevel(value)
    Update the map's zoom level to the specified zoom level
    */
    function setZoomLevel(value, zoomXY) {
        value = value ? max(min(value, maxZoom), minZoom) : minZoom;
        
        // update the zoom level
        if (value != zoomLevel) {
            zoomLevel = value;
            view.triggerAll('zoomLevelChange', value, zoomXY);
        } // if
    } // setZoomLevel
    
    // apply the mixin
    COG.extend(view, {
        getZoomLevel: getZoomLevel,
        setZoomLevel: setZoomLevel
    });
    
    // handle scale events
    view.bind('scale', handleScale);
};
