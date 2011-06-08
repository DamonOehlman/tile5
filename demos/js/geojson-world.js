(function() {
    var parser = T5.Registry.create('parser', 'geojson');

    function animate() {
        var layers = map.layer();
        
        for (var ii = 0; ii < layers.length; ii++) {
            animateLayer(layers[ii]);
        } // for
    }

    function animateLayer(layer) {
        var shapes = layer.find(),
            aniDuration,
            startX, startY,
            aniOpts;

        // animate the shapes (just because)
        for (var ii = shapes.length; ii--; ) {
            aniDuration = (Math.random() * 1000 + 500) | 0;
            startX = (Math.random() * 4000 - 2000) | 0;
            startY = (Math.random() * 4000 - 2000) | 0;

            aniOpts = {
                easing: 'sine.out',
                duration: aniDuration
            };

            shapes[ii].translate(startX, startY).translate(0, 0, aniOpts, true);
            shapes[ii].scale(0.1).scale(1, aniOpts, true);
            shapes[ii].rotate(360, aniOpts, true);
        } // for
        
        layer.visible = true;
    } // animateLayer
    
    function animateElements(elements) {
        for (var ii = elements.length; ii--; ) {
            var target = elements[ii].target;
            if (target) {
                target.style = 'area.highlight';
                target.zindex = 10;
                
                target.scale(0.75, {
                    easing: 'back.out',
                    duration: 500,
                    complete: function() {
                        target.scale(1, { 
                            complete: function() {
                                target.style = 'area.simple';
                                target.zindex = 0;
                            },
                            duration: 500 
                        }, true);
                    }
                }, true);
            }
        } // for
    }

    function displayFirstElement(elements, hideDelay) {
        if (elements.length > 0) {
            var props = elements[0].target ? elements[0].target.properties : null;
            if (props) {
                DEMO.status(props.name, hideDelay);
            } // if
        } // if
    } 
    
    $('#animate').click(animate);

	map = new T5.Map('mapContainer', {
		renderer: 'canvas'
	});
	
	/*
	map.layer('tiles', 'tile', {
		generator: 'osm.cloudmade',
        // demo api key, register for an API key at http://dev.cloudmade.com/
        apikey: '7960daaf55f84bfdb166014d0b9f8d41'
	});
	*/
	
	map.center('20 0').zoom(3);

    map.bind('hoverHit', function(evt, elements, absXY, relXY, offsetXY) {
        animateElements(elements); // displayFirstElement(elements);
    });

    map.bind('tapHit', function(evt, elements, absXY, relXY, offsetXY) {
        animateElements(elements);
    });

    /*
    map.bind('hoverOut', function(evt, elements, absXY, relXY, offsetXY) {
        displayFirstElement(elements, 100);
    });
    */

    DEMO.status('Parsing GeoJSON');
    parser(map, worldData, function(layers) {
        for (var layerId in layers) {
            // initialise the layer styles
            layers[layerId].style = 'area.simple';
            //layers[layerId].hoverStyle = 'area.highlight';
            //layers[layerId].downStyle = 'area.highlight';
        } // for

        DEMO.status();
        
        animate();
    });
})();