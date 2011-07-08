(function() {
    // define constants
    var pdxApiFormatter = T5.formatter('http://pdxapi.com/{0}/geojson?bbox={1},{2},{3},{4}'),
        parser = new T5.GeoJSONParser(),
        MAXDIST = 40;
    
    // initialise variables
    var lastUrl = '',
        seqCounter = 0,
        datasources = {},
        layerZ = 800,
        ui,
        sample = {},
        currentDataset = '';
        
    function defineLayer(dsid, styleId) {
        // add the datasource to the list of datasources
        datasources[dsid] = {
            style: styleId ? styleId : null,
            requestActive: false,
            zindex: layerZ--
        };
        
        // set the datasource active flag to false
        sample[dsid] = false;
        ui.gui.add(sample, dsid).onChange(function(active) {
            toggleLayer(dsid);
        });
    } // defineLayer
    
    function initLayers() {
        // defineLayer('bicycle_network', 'path.bike');
        defineLayer('bridges');
        // defineLayer('business_associations');
        // defineLayer('buslines');
        // defineLayer('council');
        // defineLayer('counties');
        defineLayer('guardrails');
        defineLayer('neighborhoods', 'area.general');
        defineLayer('parks', 'area.parkland');
        // defineLayer('parks_taxlots');
        // defineLayer('parks_trails');
        // defineLayer('pavement_moratorium');
        defineLayer('pedestrian_districts', 'area.general');        
        // defineLayer('schools');
        // defineLayer('redline_1938');
        // defineLayer('zipcode');
    } // initLayers
        
    function retrieveData(dsid, bounds) {
        var requestId, 
            dsUrl = pdxApiFormatter(
                dsid,
                bounds.min.lon,
                bounds.min.lat,
                bounds.max.lon,
                bounds.max.lat
            );
                
        if (datasources[dsid].requestActive) {
            return;
        } // if

        $('#' + dsid + '_title').addClass('loader');
        
        datasources[dsid].requestActive = true;

        $.ajax({
            url: dsUrl,
            dataType: 'jsonp',
            success: function(data) {
                updateData(dsid, data);
            }
        });
        
        lastUrl = dsUrl;
    } // retrieveData
    
    function showMessage(msg, msgClass, autohide) {
        var messageContainer = $('#status');
        
        messageContainer
            .removeClass('error info')
            .html(msg)
            .addClass(msgClass ? msgClass : 'info')
            .slideDown();
        
        if (autohide) {
            setTimeout(function() {
                messageContainer.slideUp();
            }, autohide);
        } // if
    } // showMessage
    
    function toggleLayer(dsid) {
        var layerDetails = datasources[dsid],
            layer = map.layer(dsid);

        if (layer) {
            layer.remove();
        }
        else {
            retrieveData(dsid, map.bounds());
        } // if..else
    } // toggleLayer
    
    function updateData(dsid, data) {
        var layer = map.layer(dsid, 'draw', datasources[dsid]);
        
        // unbind previous handlers
        parser.unbind();
        parser.bind('*', function(evt, data) {
            layer.create(evt.name, data);
        });
        
        for (var ii = data.rows.length; ii--; ) {
            parser.run({
                type: 'Feature',
                geometry: data.rows[ii].geometry
            });
        } // for
    } // updateData
    
    function updateLayers(bounds) {
        for (var dsid in datasources) {
            if (datasources[dsid].enabled) {
                retrieveData(dsid, bounds);
            } // if
        } // for
    } // updateLayers
    
    ui = DEMO.makeSampleUI();
    initLayers();
    ui.done();

	map = new T5.Map('mapContainer', {
		renderer: DEMO.getRenderer()
	});

	// create the tile layer
    map.layer('tiles', 'tile', {
    	generator: 'osm.cloudmade',
        // demo api key, register for an API key at http://dev.cloudmade.com/
        apikey: '7960daaf55f84bfdb166014d0b9f8d41'
    });
    
    map.zoom(15).center('45.52615953236141 -122.67342567443849');
})();