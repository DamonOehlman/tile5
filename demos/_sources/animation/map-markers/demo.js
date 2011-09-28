var arcRadius = 500, // distance in km
    angle = 0,
    sample = {
        speed: 2
    },
    startPosition = map.center(),
    planeStart = map.center().offset(0, -arcRadius),
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
    // DEMORUNNER.status('tapped the plane', 1200);
});

/*
var ui = DEMO.makeSampleUI();
ui.gui.add(sample, 'speed', 1, 10);
ui.done();
*/