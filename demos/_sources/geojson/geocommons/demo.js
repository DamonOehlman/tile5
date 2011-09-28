(function() {
    // define constants
    var urlFormatter = T5.formatter('http://geocommons.com/overlays/{0}/features.json?geojson=1'),
        parser = new T5.GeoJSONParser({ generalizer: GeoJS.generalize }),
        REQUEST_TIMEOUT = 15000;
    
    // initialise variables
    var loading = false,
        layerData = {},
        sample = {
            allowCached: true,
            layerId: 2646,
            run: run
        },
        ui,
        sequenceCounter = 0;
        
    /* internal functions */
    
    function displayOverlay(overlayId, data) {
        // create the layer
        var layer = map.layer(overlayId, 'draw', {
            style: 'area.parkland'
        });
        
        parser.unbind().bind('*', function(evt, data) {
            layer.create(evt.name, data);
        });
        
        parser.run(data);
    } // displayOverlay
    
    function loadLayerData(layerId, callback, sequenceId) {
        if (layerData[layerId]) {
            callback(layerData[layerId]);
        }
        else {
            var ajaxOpts = {
                    url: urlFormatter(layerId),
                    dataType: 'jsonp',
                    success: function(data, textStatus, raw) {
                        T5.log('received response');
                        layerData[layerId] = data;
                        callback(data);
                    
                    },
                    error: function(raw, textStatus, errorThrown) {
                        T5.log('error triggered');
                        DEMO.status();
                    },
                    complete: function(raw, textStatus) {
                        T5.log('complete triggered');
                        if (! layerData[layerId]) {
                            DEMO.status();
                        } // if
                    }
                };
                
            if (sample.allowCached) {
                ajaxOpts = $.extend(ajaxOpts, {
                    cache: true,
                    jsonpCallback: 'callback' + layerId
                });
            } // if
            
            DEMO.status('Retrieving Layer (#' + layerId + ') Data');
            
            $.ajax(ajaxOpts);
        } // if..else
    } // loadLayerData
    
    function run() {
        var sequenceId,
            layerId = sample.layerId;
        
        // increment sequence counter and assign
        sequenceCounter += 1;
        sequenceId = sequenceCounter;
        
        // load the layer data
        loadLayerData(layerId, function(data) {
            // if this request is still valid then process
            if (sequenceId === sequenceCounter) {
                displayOverlay(layerId, data);
            } // if
        }, sequenceId);
    } // loadOverlay
    
    /* module definition */
    
    // create the ui
    ui = DEMO.makeSampleUI();
    ui.gui.add(sample, 'layerId').name('Layer ID');
    ui.gui.add(sample, 'allowCached').name('Allow cached');
    ui.gui.add(sample, 'run');
    ui.done();

    // make a map at the default location
    DEMO.makeMap(5);
})();