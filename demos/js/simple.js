map = Tile5('mapContainer', {
	renderer: 'canvas',
	padding: 'auto'
});

map.layer('tiles', 'tile', {
	generator: 'osm.cloudmade',
    // demo api key, register for an API key at http://dev.cloudmade.com/
    apikey: '7960daaf55f84bfdb166014d0b9f8d41'
});

map.center(DEMO.getHomePosition()).zoom(8);