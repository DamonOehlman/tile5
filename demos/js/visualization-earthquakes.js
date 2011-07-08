(function() {
    var TIME_INCREMENT = 60000,
        DAY_MILLIS = 86400000,
        HOUR_MILLIS = 3600000,
        ZOOMLEVEL_DEFAULT = 6,
        zoomLevelScaling = 1,
        reDate = /(\d{4})\/(\d{2})\/(\d{2})\s(\d{2})\:(\d{2}).*/,
        quakes = [],
        quakeIdx = 0,
        runId = 0,
        sample = {
            startDate: '2011/03/11 05:00',
            clock: '',
            quakes: 0,
            
            run: run
        },
        currentTime;
        
    /* internal functions */
    
    function handleHoverHit(evt, elements, absXY, relXY, offsetXY) {
        for (var ii = elements.length; ii--; ) {
            var quake = elements[ii].target;
            if (quake.animations === 0) {
                quake.scale(1, {
                    duration: 300,
                    easing: 'back.out'
                }, true);
            } // if
        } // for
    } // handleHit

    function handleHoverOut(evt, elements, absXY, relXY, offsetXY) {
        for (var ii = elements.length; ii--; ) {
            var quake = elements[ii].target;
            quake.scale(0.05, true, true);
        } // for
    } // handleHoverOut

    
    function parseData(results) {
        var events = results.events.event;
        
        // add the quakes in chronoligical order (feed returns them in reverse)
        for (var ii = events.length; ii--; ) {
            var quakePos = new GeoJS.Pos(events[ii].lat, events[ii].lng),
                quakeMag = parseFloat(events[ii].mag),
                quake = {
                    // standard drawable properties
                    xy: new T5.GeoXY(quakePos),
                    fill: true,
                    size: Math.pow(2, quakeMag) | 0,

                    // custom quake properties
                    dt: parseDate(events[ii].date),
                    mag: quakeMag,
                    dkm: parseFloat(events[ii].dkm)
                };
            
            quakes[quakes.length] = quake;
        } // for
        
        quakeIdx = 0;
        while (quakeIdx < quakes.length && quakes[quakeIdx].dt < currentTime) {
            quakeIdx++;
        } // while
    } // if
    
    function parseDate(inputStr) {
        var matches = reDate.exec(inputStr);
        if (matches) {
            return new Date(Date.UTC(
                matches[1], // year
                matches[2] - 1, // month
                matches[3], // minutes
                matches[4], // hours
                matches[5]  // minutes
            ));
        } // if

        return null;
    } // parseDate    
    
    function runClock() {
        // update the current time
        sample.clock = currentTime.toString();
        
        // while the quake time is less than the current display and goto the next
        while (quakeIdx < quakes.length && quakes[quakeIdx].dt < currentTime) {
            showQuake(quakes[quakeIdx]);
            quakeIdx++;
            sample.quakes++;
        } // while
        
        // increment the current time by five minutes
        currentTime = new Date(currentTime.getTime() + TIME_INCREMENT);
        if (quakeIdx >= quakes.length) {
            DEMO.status('End of Data');
        } // if
        
        map.invalidate();
    } // runClock
    
    function run() {
        // clear the timeout
        map.layer('markers').clear();
        
        // initialise the current time
        currentTime = parseDate(sample.startDate);
        sample.quakes = 0;
        
        // parse the data
        parseData(cachedQuakes.query.results);
        
        // update the display on draw complete
        map.bind('drawComplete', runClock);
    } // start
    
    function showQuake(quakeData) {
        var quake = map.layer('markers').create('arc', quakeData);
        
        quake.scale(0.1, false, true).scale(1, {
            duration: 500,
            complete: function() {
                quake.scale(0.05, {
                    easing: 'sine.in',
                    duration: 1000
                });
            }
        }, true);
        
        /*
        // animate the marker
        quakeMarker.scale(0.1);
        quakeMarker.animate('scale', [0.01], [1], {
            duration: 500,
            complete: function() {
                quakeMarker.animate('scale', [1], [0.05], {
                    easing: 'sine.in',
                    duration: 1000,
                    complete: function() {
                        quakeMarker.past = true;
                    }
                });
            }
        });
        
        // add the marker
        map.markers.add(quakeMarker, true);
        
        */
    } // showQuake
    
    map = new T5.Map('mapContainer', {
        renderer: DEMO.getRenderer()
    });

    map.layer('tiles', 'tile', {
        generator: 'osm.cloudmade',
        // demo api key, register for an API key at http://dev.cloudmade.com/
        styleid: 997,
        apikey: '7960daaf55f84bfdb166014d0b9f8d41'
    });
    
    map.bind('zoomLevelChange', function(evt, zoomLevel) {
        zoomLevelScaling = zoomLevel / ZOOMLEVEL_DEFAULT;
    });

    map.center('38, 139.22').zoom(ZOOMLEVEL_DEFAULT);
    
    // map.bind('tapHit', handleTap);
    map.bind('hoverHit', handleHoverHit);
    map.bind('hoverOut', handleHoverOut);
    
    var ui = DEMO.makeSampleUI();
    ui.gui.add(sample, 'clock').listen();
    ui.gui.add(sample, 'quakes').listen();
    ui.gui.add(sample, 'run');
    ui.done();
})();
