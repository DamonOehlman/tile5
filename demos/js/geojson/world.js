(function() {
    var parser = new T5.GeoJSONParser(),
        worldLayer,
        ui,
        sample = {
            animate: function() {
                animateLayer(worldLayer);
            }
        };

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
    
    function hideElements(elements) {
        for (var ii = elements.length; ii--; ) {
            if (elements[ii].target) {
                elements[ii].target.visible = false;
            } // if
        } // for
        
        map.invalidate();
    } // hideElements

    function displayFirstElement(elements, hideDelay) {
        if (elements.length > 0) {
            var props = elements[0].target ? elements[0].target.properties : null;
            if (props) {
                DEMO.status(props.name, hideDelay);
            } // if
        } // if
    } 
    
	map = new T5.Map('mapContainer', {
		renderer: DEMO.getRenderer()
	});

	map.layer('tiles', 'tile', {
		generator: 'osm.cloudmade',
        // demo api key, register for an API key at http://dev.cloudmade.com/
        apikey: '7960daaf55f84bfdb166014d0b9f8d41'
	});
	
	map.center('20 0').zoom(3);

    map.bind('tapHit', function(evt, elements, absXY, relXY, offsetXY) {
        hideElements(elements);
    });
    
    ui = DEMO.makeSampleUI();
    ui.gui.add(sample, 'animate');
    ui.done();

    // create the world layer
    worldLayer = map.layer('world', 'draw');
    worldLayer.hoverStyle = 'area.highlight';
    
    parser.bind('poly', function(evt, data) {
        var item = worldLayer.create('poly', data);
        item.style = 'area.simple';
    });

    parser.run(worldData);
})();