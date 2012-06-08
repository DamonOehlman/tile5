/**
# Tile5(target, settings, viewId)
*/
function Tile5(target, settings) {
    settings = cog.extend({
        container: target,
        type: 'map',
        renderer: 'canvas',
        starpos: null,
        zoom: 1,
        fastpan: false,
        drawOnScale: true,
        zoombar: {}
    }, settings);
    
    // create the view
    return regCreate('view', settings.type, settings);
} // Tile5