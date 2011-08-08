var map = new T5.Map('mapContainer');

map.layer('tiles', 'tile', {
    generator: 'osm.cloudmade',
    // demo api key, register for an API key at http://dev.cloudmade.com/
    apikey: '7960daaf55f84bfdb166014d0b9f8d41'
});

map.zoom(8).center('-27.4695 153.0201');

// add a marker at the center of the map
map.layer('markers').create('marker', {
    xy: '-27.4695 153.0201',
    imageUrl: 'img/square-marker.png',
    markerType: 'image'
});