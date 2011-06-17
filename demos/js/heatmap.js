map = new T5.Map('mapContainer', {
	renderer: 'canvas',
	padding: 'auto'
});

map.layer('tiles', 'tile', {
	generator: 'osm.cloudmade',
	renderer: 'canvas',
    // demo api key, register for an API key at http://dev.cloudmade.com/
    apikey: '7960daaf55f84bfdb166014d0b9f8d41'
});

map.center('25 -110').zoom(4);
map.layer('heatmap', 'heatcanvas');