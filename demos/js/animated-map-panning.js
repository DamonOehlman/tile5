(function() {
    // initialise geonames url
    var cities = [{
        name: 'Moscow',
        pos: '55.7522222 37.6155556',
        population: 10381222
    }, {
        name: 'London',
        pos: '51.508528775862885 -0.12574195861816406',
        population: 7556900
        
    }, {
        name: 'Baghdad',
        pos: '33.340582 44.400876',
        population: 5672513
    }, {
        name: 'Ankara',
        pos: '39.9198743755027 32.8542709350586',
        population: 3517182
        
    }, {
        name: 'Berlin',
        pos: '52.524368165134284 13.410530090332031',
        population: 3426354
    }, {
        name: 'Madrid',
        pos: '40.4165020941502 -3.70256423950195',
        population: 3255944
    }, {
        name: 'Roma',
        pos: '41.8947384616695 12.4839019775391',
        population: 2563241
    }, {
        name: 'Paris',
        pos: '48.85341 2.3488',
        population: 2138551
    }];

    // initialise variables
    var easingEffect = 'sine.out',
        cityIndex = 0;

    /* define some internal functions */

    function nextCity() {
        var cityData = cities[cityIndex++];
        
        console.log(cityData);
            
        // clear the map markers and add one for the new city
        // pan to the next city position
        map.center(cityData.pos, null, {
            easing: easingEffect,
            duration: 2500,
            complete: nextCity
        });
                    
        if (cityIndex >= cities.length) {
            cityIndex = 0;
        } // if
    }
    
    map = new T5.Map('mapContainer', {
		renderer: DEMO.getRenderer(),
		padding: 'auto',
		noDrawOnTween: false
	});
	
	map.layer('tiles', 'tile', {
		generator: 'osm.cloudmade',
        // demo api key, register for an API key at http://dev.cloudmade.com/
        apikey: '7960daaf55f84bfdb166014d0b9f8d41'
	});
	
	map.center(cities[cities.length - 1].pos).zoom(6);
    
    // add the map markers
    for (var ii = cities.length; ii--; ) {
        map.layer('markers').create('marker', {
            xy: cities[ii].pos
        });
    } // for
    
    setTimeout(nextCity, 1000);

    /*
    $("#demoControls button.anitype").unbind().click(function() {
        easingEffect = this.innerText;
    });
    
    $('#btnNextCity').unbind().click(nextCity);
    */
})();