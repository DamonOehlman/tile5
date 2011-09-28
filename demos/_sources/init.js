// create the map
var map = new T5.Map('mapContainer', {
    renderer: settings.renderer || 'canvas',
    drawOnMove: settings.drawOnMove,
    drawOnTween: settings.drawOnTween
});

map.layer('tiles', 'tile', {
    generator: 'osm.cloudmade',
    // demo api key, register for an API key at http://dev.cloudmade.com/
    apikey: '7960daaf55f84bfdb166014d0b9f8d41',
    styleid: settings.mapstyle
});

map.zoom(8).center('-27.469 153.020');