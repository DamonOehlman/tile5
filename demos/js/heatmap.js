(function() {
    function createMarkers() {
        var markers = map.layer('markers');
        
        // clear any existing markers
        markers.clear();

        // create the markers
        for (ii = 0 ; ii < data.length; ii++) {
            markers.create('marker', {
                xy: new T5.GeoXY(new GeoJS.Pos(data[ii][0], data[ii][1])),
                markerType: 'image',
                imageUrl: 'img/square-marker.png',
                size: 15,
                value: data[ii][2]
            });
        } // for
    } // loadData    
    
    map = new T5.Map('mapContainer', {
    	renderer: DEMO.getRenderer(),
    	padding: 'auto'
    });

    map.layer('tiles', 'tile', {
    	generator: 'osm.cloudmade',
    	renderer: 'canvas',
        // demo api key, register for an API key at http://dev.cloudmade.com/
        apikey: '7960daaf55f84bfdb166014d0b9f8d41'
    });

    // set the map center
    map.center('25 -110').zoom(3);
    
    // add the heatmap layer
    map.layer('heatmap', 'heatcanvas');

    // create some markers
    createMarkers();
})();
