(function() {
    var arcRadius = 500, // distance in km
        angle = 0,
        cycleSpeed = 5000,
        startPosition,
        planeStart,
        lastTickCount = 0,
        TWO_PI = Math.PI * 2,
        map,
        plane;

    function getPlaneScale() {
        return (map.getZoomLevel() / 16) * 0.7;
    } // getPlaneScale

    function movePlane(evt, tickCount) {
        // if we have a last tick count we can perform some animation
        if (lastTickCount) {
            var deltaChange = (tickCount - lastTickCount) / cycleSpeed,
                newPosition;

            angle = (angle + (TWO_PI * deltaChange)) % TWO_PI;
            newPosition = statePosition.offset(
                arcRadius * Math.sin(angle),
                arcRadius * Math.cos(angle)
            );
            
            T5.GeoXY.updatePos(plane.xy, newPosition);

            plane.rotate(TWO_PI - angle);
            // map.panToPosition(newPosition);
            map.invalidate();
        }

        lastTickCount = tickCount;
        // map.invalidate();
    } // movePlane


    startPosition = DEMO.getHomePosition();
    planeStart = startPosition.offset(0, -arcRadius);

    // initialise the map
    map = Tile5('mapContainer', {
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
        xy: T5.GeoXY.init(planeStart),
        markerType: 'image',
        size: 100,
        imageUrl: '/img/fly/plane.png'
    });

    // make the plane transformable
    plane.scale(getPlaneScale());

    // handle the draw complete
    map.bind('enterFrame', movePlane);

    // handle zoom level changes
    map.bind('zoomLevelChange', function(evt, zoomLevel) {
        plane.scale = getPlaneScale();
    });

    // handle tapping markers
    map.bind('tapHit', function(evt, elements, absXY, relXY, offsetXY) {
        DEMO.status('tapped the plane', 1200);
    });
    
    T5.Animator.
})();