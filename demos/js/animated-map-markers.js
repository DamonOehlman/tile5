(function() {
    var arcRadius = 500, // distance in km
        angle = 0,
        sample = {
            speed: 2
        },
        startPosition,
        planeStart,
        lastTickCount = 0,
        TWO_PI = Math.PI * 2,
        plane;

    function getPlaneScale() {
        return (map.zoom() / 16) * 0.7;
    } // getPlaneScale

    function movePlane(evt, viewport, tickCount) {
        // if we have a last tick count we can perform some animation
        if (lastTickCount) {
            var deltaChange = (tickCount - lastTickCount) / (10000 / sample.speed),
                newPosition;

            // calculate the angle
            angle = (angle + (TWO_PI * deltaChange)) % TWO_PI;
            newPosition = startPosition.offset(
                arcRadius * Math.sin(angle),
                arcRadius * Math.cos(angle)
            );
            
            // update the plane's position
            plane.xy = new T5.GeoXY(newPosition).sync(map);

            // rotate the plane
            plane.rotate(deltaChange * -360);
            map.invalidate();
        }

        lastTickCount = tickCount;
        // map.invalidate();
    } // movePlane


    startPosition = DEMO.getHomePosition();
    planeStart = startPosition.offset(0, -arcRadius);

    // initialise the map
    map = new T5.Map('mapContainer', {
		renderer: 'canvas',
		padding: 'auto'
	});
	
	map.layer('tiles', 'tile', {
		generator: 'osm.cloudmade',
        // demo api key, register for an API key at http://dev.cloudmade.com/
        apikey: '7960daaf55f84bfdb166014d0b9f8d41'
	});
	
	map.center(startPosition).zoom(5);

    plane = map.layer('markers').create('marker', {
        xy: new T5.GeoXY(planeStart),
        markerType: 'image',
        size: 100,
        imageUrl: 'img/plane.png'
    });

    // make the plane transformable
    plane.scale(getPlaneScale());

    // handle the draw complete
    map.bind('drawComplete', movePlane);

    // handle zoom level changes
    map.bind('zoomLevelChange', function(evt, zoomLevel) {
        plane.scale = getPlaneScale();
    });

    // handle tapping markers
    map.bind('tapHit', function(evt, elements, absXY, relXY, offsetXY) {
        DEMO.status('tapped the plane', 1200);
    });
    
    var ui = DEMO.makeSampleUI();
    ui.gui.add(sample, 'speed', 1, 10);
    ui.done();
})();