/**
# T5.zoomable(view, params)
This mixin is used to make an object support integer zoom levels which are 
implemented when the view scales
*/
T5.zoomable = function(view, params) {
    params = T5.ex({
        initial: 0,
        min: 0,
        max: null,
        zoomAnimation: T5.easing('quad.out')
    }, params);

    // initialise variables
    var zoomLevel = params.initial;
    
    /* internal functions */
    
    function handleDoubleTap(evt, absXY, relXY) {
        if (view.scalable()) {
            // cancel any current animations
            T5.cancelAnimation();
            
            // animate the scaling
            view.animate(2, 
                T5.D.getCenter(view.getDimensions()), 
                T5.XY.init(relXY.x, relXY.y), 
                params.zoomAnimation);
        } // if
    } // handleDoubleTap
    
    function handleScale(evt, scaleAmount, zoomXY) {
        var zoomChange = 0;

        // damp the scale amount
        scaleAmount = Math.sqrt(scaleAmount);

        if (scaleAmount < 1) {
            zoomChange = -(0.5 / scaleAmount);
        }
        else if (scaleAmount > 1) {
            zoomChange = scaleAmount;
        } // if..else
        
        // cancel any current animations
        // TODO: review if there is a better place to do this
        T5.cancelAnimation();
        
        setZoomLevel(zoomLevel + zoomChange >> 0, zoomXY);
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
            // update the zoom level
            zoomLevel = value;
            
            // trigger the zoom level change
            view.triggerAll('zoomLevelChange', zoomLevel, zoomXY);
        } // if
    } // setZoomLevel
    
    /**
    ### zoomIn()
    Zoom in one zoom level
    */
    function zoomIn() {
        if (! view.scale(2, T5.easing('sine.out'))) {
            view.setZoomLevel(zoomLevel + 1);
        } // if
    } // zoomIn

    /**
    ### zoomOut()
    Zoom out one zoom level
    */
    function zoomOut() {
        if (! view.scale(0.5, T5.easing('sine.out'))) {
            view.setZoomLevel(zoomLevel - 1);
        } // if
    } // zoomOut

    // apply the mixin
    T5.ex(view, {
        getZoomLevel: getZoomLevel,
        setZoomLevel: setZoomLevel,
        
        zoomIn: zoomIn,
        zoomOut: zoomOut
    });
    
    // handle scale events
    view.bind('scale', handleScale);
    view.bind('doubleTap', handleDoubleTap);
};
