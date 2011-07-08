DAT.GUI.autoPlace = false;

// define the map and gui globals for simplicities sake
var map, gui = new DAT.GUI();

DEMO = (function() {
    
    /* internals */
    
    
    
    // define the demos
    var sampleGui,
        demo = {
            sample: 'Simple',
            renderer: 'canvas'
        },
        reTitle = /(?:^|\-)(\w)(\w+)/g,
        demoData = {
            'geojson-world': {
                title: 'GeoJSON World',
                deps: [
                    '../dist/plugins/parser.geojson.js',
                    '../dist/style/map-overlays.js',
                    'data/world.js'
                ]
            },
            
            'marker-hit-test': {
                deps: [
                    'data/heatmap-data.js'
                ]                
            },
            
            'heatcanvas': {
                deps: [
                    'lib/heatcanvas.js',
                    '../dist/plugins/layers/heatcanvas.js',
                    'data/heatmap-data.js'
                ]
            },
            
            'visualization-walmart': {
                deps: ['data/walmarts.js']
            },
            
            'visualization-earthquakes': {
                deps: ['data/cached-quakes.js']
            }
        },
        demos = [
            'simple',
            'geojson-world',
            'animated-map-panning',
            'animated-map-markers',
            'marker-hit-test',
            // 'geojson-pdxapi',
            'visualization-walmart',
            'visualization-earthquakes',
            'heatcanvas'
        ],
        startLat = -27.469592089206213,
        startLon = 153.0201530456543;
        
    /* internals */
    
    function buildUI() {
        var options = [],
            sampleField = gui.add(demo, 'sample'),
            ii;
            
        loadDemoData();
        
        // iterate through the demos
        for (ii = 0; ii < demos.length; ii++) {
            if (! demos[ii].disabled) {
                options.push(demos[ii].title);
            } // if
        } // for
        
        // add the demos
        sampleField.options.apply(sampleField, options);
        sampleField.onChange(load);
        sampleField.listen();

        // add the renderer control
        gui.add(demo, 'renderer')
            .options('canvas', 'raphael/dom', 'dom', 'three:webgl')
            .onChange(function(newRenderer) {
                map.renderer(newRenderer);
            });
            
        gui.domElement.style.position = 'absolute';
        gui.domElement.style.top = '10px';
        gui.domElement.style.left = '10px';
        gui.domElement.style['z-index'] = 1001;
        
        document.body.appendChild(gui.domElement);
        $('.guidat-controllers').height('auto');
        $('.guidat-toggle').hide();
        
        // load the demo
        load(location.hash);
    } // buildUI
    
    function genTitle(id) {
        var title = '',
            match;
            
        // clean up the status text
        reTitle.lastIndex = 0;
        match = reTitle.exec(id);
        while (match) {
            title += match[1].toUpperCase() + match[2] + ' ';
            match = reTitle.exec(id);
        } // while
        
        return title.trim();
    } // genTitle
    
    function handleMainShow(evt, ui) {
        var mapContainer = $('#mapContainer'),
            usedHeight = 0;
        
        mapContainer.siblings().each(function() {
            usedHeight += $(this).outerHeight();
        });
        
        mapContainer.height(mapContainer.parent().height() - usedHeight);
    } // handleMainShow
    
    function loadDemoData() {
        for (var ii = 0; ii < demos.length; ii++) {
            var demoId = demos[ii];
            
            // replace the demo with the demo data
            demos[ii] = demoData[demoId] || {};
            demos[ii].id = '#' + demoId;
            
            // if we don't have a title, generate one from the id
            if (! demos[ii].title) {
                demos[ii].title = genTitle(demoId);
            } // if
            
            demos[ii].script = 'js/' + demoId + '.js';
        } // for
    } // loadDemoData
        
    /* exports */
    
    function getHomePosition() {
        return new GeoJS.Pos(startLat, startLon);
    } // getHomePosition
    
    function load(demoTitle) {
        var selectedDemo,
            loaderChain = $LAB;
        
        if (map) {
            map.detach();
            $('#mapContainer').html('');
        } // if
        
        if (sampleGui && sampleGui.domElement.parentNode) {
            document.body.removeChild(sampleGui.domElement);
            sampleGui = null;
        } // if
        
        // set the demo title to the first demo if not specified
        demoTitle = demoTitle || demos[0].title;
        
        // iterate through the demos, look for the requested demo
        for (var ii = 0; ii < demos.length; ii++) {
            var matchingDemo = 
                demos[ii].title.toLowerCase() === demoTitle.toLowerCase() || 
                demos[ii].id === demoTitle;
            
            if (matchingDemo) {
                selectedDemo = demos[ii];
                break;
            }
        } // for

        // default to the first demo if we don't have a proper demo
        selectedDemo = selectedDemo || demos[0];
        
        status('loading demo: ' + selectedDemo.title);
        demo.sample = selectedDemo.title;
        location.hash = selectedDemo.id;
        
        // add the scripts to the body
        for (var depIdx = 0; selectedDemo.deps && depIdx < selectedDemo.deps.length; depIdx++) {
            loaderChain = loaderChain.script(selectedDemo.deps[depIdx]);
        } // for
        
        loaderChain.wait(function() {
            $LAB.script(selectedDemo.script + '?ticks=' + new Date().getTime());
        });
    } // load
    
    function makeSampleUI() {
        if (sampleGui && sampleGui.domElement.parentNode) {
            document.body.removeChild(sampleGui.domElement);
        } // if
        
        // create a new sampleUI
        sampleGui = new DAT.GUI();
        
        return {
            gui:sampleGui,
            done: function() {
                sampleGui.domElement.style.position = 'absolute';
                sampleGui.domElement.style.top = '80px';
                sampleGui.domElement.style.left = '10px';
                sampleGui.domElement.style['z-index'] = 1001;

                document.body.appendChild(sampleGui.domElement);
                
                $('.guidat-controllers').height('auto');
                $('.guidat-toggle').hide();
            }
        };
    } // makeSampleUI
    
    function rotate() {
        map.rotate(360, { 
            duration: 30000,
            complete: function() {
                setTimeout(DEMO.rotate, 10000);
            }
        });
    }
    
    function status(message) {
        T5.log(message);
    } // status
    
    $(document).ready(buildUI);
        
    return T5.ex(demo, {
        getRenderer: function() {
            return demo.renderer;
        },
        
        getHomePosition: getHomePosition,
        
        load: load,
        makeSampleUI: makeSampleUI,
        rotate: rotate,
        status: status
    });
})();