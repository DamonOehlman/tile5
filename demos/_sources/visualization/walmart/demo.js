var storeIndex = 0,
    yearTimeout = 0,
    glowMarker,
    inactiveMarker,
    sample = {
        animated: false,
        year: 0,
        markers: 0,
        run: run
    },
    hslaFormatter = T5.formatter('hsla({0}, {1}%, {2}%, {3})');

function createGlowMarker(size, stopFn) {
    // create the glow marker as a new canvas
    var marker = document.createElement('canvas');
        stopPoints = [0, 0.1, 1];
        
    // initialise the marker with and height
    marker.width = marker.height = size;

    // get the canvas context
    var context = marker.getContext('2d'),
        halfSize = size / 2,
        radGrad = context.createRadialGradient(halfSize, halfSize, 0, halfSize, halfSize, halfSize);

    for (var ii = 0; ii < stopPoints.length; ii++) {
        var stopVal = stopPoints[ii],
            alpha = 0.4 - (0.4 * Math.sqrt(stopVal));

        radGrad.addColorStop(stopVal, stopFn(stopVal, alpha));
    } // for

    // draw the glow marker
    context.beginPath();
    context.arc(halfSize, halfSize, halfSize, 0, Math.PI * 2, false);
    context.fillStyle = radGrad;              
    context.fill();

    return marker;
} // createGlowMarker

function displayStores(year) {
    sample.year = year;
    sample.markers = storeIndex;

    var store = walmarts[storeIndex];

    if (! store) {
        return;
    } // if

    while (store && year >= parseInt(store.opening_date, 10)) {
        pinStore(store);
        storeIndex += 1;
        store = walmarts[storeIndex];
    } // while
    
    map.invalidate();
    yearTimeout = setTimeout(function() {
        displayStores(year + 1);
    }, 250);
} // displayStores

function pinStore(store) {
    var storePos = new GeoJS.Pos(store.latitude, store.longitude),
        marker = map.layer('markers').create('marker', {
            xy: new T5.GeoXY(storePos),
            markerType: 'image',
            image: glowMarker,
            name: store.name,
            opening_date: store.opening_date,
            size: 20
        });
        
    if (sample.animated) {
        marker.scale(2, {
            easing: 'back.out', 
            duration: 300,
            complete: function() {
                marker.scale(1, {
                    easing: 'sine.out',
                    duration: 300
                }, true);
            }
        });
    } // if
} // pinStore

function run() {
    // reset the run state
    map.layer('markers').clear();
    clearTimeout(yearTimeout);
    storeIndex = 0;
    displayStores(parseInt(walmarts[0].opening_date, 10));
} // reset

// create the glow marker
glowMarker = createGlowMarker(8, function(stopVal, alpha) {
    var hue = ~~(150 + 70 * stopVal),
        saturation = 80 + ~~((1 - stopVal / 1) * 20),
        lightness = 50;

    return hslaFormatter(hue, saturation, lightness, alpha);
});

inactiveMarker = createGlowMarker(8, function(stopVal, alpha) {
    var hue = ~~(50 + 20 * stopVal),
        saturation = 60 + ~~((1 - stopVal / 1) * 20),
        lightness = 50;

    return hslaFormatter(hue, saturation, lightness, alpha);
});

map.center('37.16 -96.68').zoom(4);

setTimeout(run, 50);

/*
// create the ui
var ui = DEMO.makeSampleUI();
ui.gui.add(sample, 'animated');
ui.gui.add(sample, 'year').name('Year').listen();
ui.gui.add(sample, 'markers').name('Marker Count').listen();
ui.gui.add(sample, 'run');
ui.done();
*/