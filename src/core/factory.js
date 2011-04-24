/**
# Tile5(target, settings, viewId)
*/
function Tile5(target, settings, viewId) {
    settings = _extend({
        type: 'map',
        renderer: 'canvas',
        starpos: null,
        zoom: 1,
        fastpan: false,
        drawOnScale: true,
        zoombar: {}
    }, settings);
    
    // create the view
    var view = regCreate('view', settings.type, settings);
    
    // initialise the view id
    view.id = viewId || _objId('view');
    
    // return the newly created view
    return view;
} // Tile5