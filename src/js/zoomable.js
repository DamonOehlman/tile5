/**
# T5.zoomable(view, params)
This mixin is used to make an object support integer zoom levels which are 
implemented when the view scales
*/
function zoomable(view, params) {
    params = COG.extend({
        initial: 1,
        min: 0,
        max: null
    }, params);

    // initialise variables
    var zoomLevel = params.initial;
    
    /* internal functions */
    
    function handleScale(evt, scaleAmount, zoomXY) {
        var zoomChange = Math.log(scaleAmount) / Math.LN2;

        // cancel any current animations
        // TODO: review if there is a better place to do this
        COG.endTweens(function(tweenInstance) {
            return tweenInstance.cancelOnInteract;
        });
        
        evt.cancel = ! setZoomLevel(zoomLevel + zoomChange, zoomXY);
        if (! evt.cancel) {
            view.updateOffset(zoomXY.x * scaleAmount, zoomXY.y * scaleAmount);
        } // if
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
        if (value && (zoomLevel !== value)) {
            // trigger the zoom level change
            var zoomOK = view.triggerAll('zoomLevelChange', value, zoomXY);

            // update the zoom level
            if (zoomOK) {
                zoomLevel = value;
            } // if
            
            return zoomOK;
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
