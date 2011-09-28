var SEARCH_URL = 'http://ws.geonames.org/searchJSON?country=AU&fcode=PPL&maxRows=100',
    minRotate = 0,
    maxRotate = Math.PI / 2,
    clusterer,
    sample = {
        createMarkers: createMarkers,
        easing: 'sine.out'
    };
    
function animateMarkers(easingType) {
    var aniOpts,
        markers = map.layer('markers').find(),
        marker;

    // iterate through the markers
    for (var ii = markers.length; ii--; ) {
        marker = markers[ii];

        // initialise the animation opts
        aniOpts = {
            easing: sample.easing,
            duration: Math.random() * 1000 + 500 | 0
        };

        marker.scale(4).scale(1, aniOpts, true);
        marker.translate(0, -400).translate(0, 400, aniOpts);
    } // for
}        
    
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
            size: 15
        });
    } // for
    
    animateMarkers();

    // DEMO.status('TIP: Hover over markers to highlight, tap to get info.', 1200);
    map.invalidate();
} // loadData

function tapMarker(marker) {
    marker.rotate(90, {
        easing: 'bounce.out'
    });
} // tapMarker

function handleHoverHit(evt, elements, absXY, relXY, offsetXY) {
    updateMarkerImages(elements, 'img/square-marker-highlight.png');
} // handleHoverHit

function handleHoverOut(evt, elements, absXY, relXY, offsetXY) {
    updateMarkerImages(elements, 'img/square-marker.png');
} // handleHoverOut

function handleTap(evt, elements, absXY, relXY, offsetXY) {
    var tappedNames = [],
        markers = [],
        ii, jj;
        
    T5.log('captured tap: hit ' + elements.length + ' elements');

    for (ii = elements.length; ii--; ) {
        var marker = elements[ii].target;
        
        // check for a cluster
        if (marker.children) {
            for (jj = marker.children.length; jj--; ) {
                markers[markers.length] = marker.children[jj];
            } // for
        }
        else {
            markers[markers.length] = marker;
        }

        if (marker) {
            tapMarker(marker);
        } // if
    } // for
    
    // iterate through the markers and add the names
    for (ii = markers.length; ii--; ) {
        tappedNames.push(markers[ii].name);
    } // for

    // DEMO.status('tapped: ' + tappedNames.join(', '), 1200);
} // handleTap

function loadEasingTypes() {
    var types = [],
        items = '';
    
    for (var ii = 0; ii < types.length; ii++) {
        items += '<a href="#">' + types[ii] + '</a>\n';
    } // for
    
    $('#easing-types').html(items).bind('click', function(evt) {
        animateMarkers(evt.target.innerText);
        
        return false;
    });
} // loadEasingTypes

function updateMarkerImages(elements, imageUrl) {
    for (var ii = elements.length; ii--; ) {
        var marker = elements[ii].target;
        
        marker.reset = true;
        marker.imageUrl = imageUrl;
    } // for
    
    map.invalidate();
} // updateMarkerImages

/* exports */

map.zoom(3).center('20.760000598852155 -46.23046875');

map.bind('tapHit', handleTap);
map.bind('hoverHit', handleHoverHit);
map.bind('hoverOut', handleHoverOut);

// Initiate a request using GRUNTS jsonp call and send the returned information to loadData();
// DEMO.status('Loading City Data from Geonames');

// load the easing types
loadEasingTypes();

/*
DEMO.createMarkers = createMarkers;

var ui = DEMO.makeSampleUI();
ui.gui.add(sample, 'easing').options('sine.out', 'sine.in', 'quad.in', 'bounce.out', 'linear');
ui.gui.add(sample, 'createMarkers').name('Drop Markers');
ui.done();
*/

// create the markers
createMarkers();