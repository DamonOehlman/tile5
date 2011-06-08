(function() {
    var parser = T5.Registry.create('parser', 'geojson'),
        container = $('#mapContainer')[0];

    map = new T5.Map('mapContainer', {
    	renderer: 'canvas',
    	padding: 'auto'
    });

    map.layer('tiles', 'tile', {
    	generator: 'osm.cloudmade',
        // demo api key, register for an API key at http://dev.cloudmade.com/
        apikey: '7960daaf55f84bfdb166014d0b9f8d41'
    });

    map.center(DEMO.getHomePosition()).zoom(4);
     
    container.addEventListener("dragover", function (evt) {
        evt.preventDefault();
    }, false);

    // Handle dropped image file - only Firefox and Google Chrome
    container.addEventListener("drop", function (evt) {
        var files = evt.dataTransfer.files;
        if (files.length > 0) {
            var file = files[0];
            if (typeof FileReader !== "undefined") {
                var reader = new FileReader();
                // Note: addEventListener doesn't work in Google Chrome for this event
                reader.onload = function (evt) {
                    parser(map, JSON.parse(evt.target.result), function(layers) {
                        for (var key in layers) {
                            layers[key].visible = true;
                        } // for
                        
                        map.invalidate();
                    });
                };
                reader.readAsText(file);
            }
        }
        evt.preventDefault();
    }, false);
})();