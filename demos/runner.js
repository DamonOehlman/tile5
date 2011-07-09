DAT.GUI.autoPlace = false;

// define the map and gui globals for simplicities sake
var map, gui = new DAT.GUI();

DEMO = (function() {
    
    /* internals */
    
    
    
    // define the demos
    var sampleGui,
        demo = {
            group: 'main',
            sample: 'Simple',
            renderer: 'canvas'
        },
        reTitle = /(?:^|\-)(\w)(\w+)/g,
        reGroup = /^(.*?)\/(.*)$/,
        groups = {},
        groupNames = [],
        sampleField,
        demoData = {
            'geojson/world': {
                deps: ['data/world.js']
            },
            
            'basic/marker-hit-test': {
                deps: [
                    'data/heatmap-data.js'
                ]                
            },
            
            'plugins/heatmap': {
                deps: [
                    'lib/heatcanvas.js',
                    '../dist/plugins/layers/heatcanvas.js',
                    'data/heatmap-data.js'
                ]
            },
            
            'visualization/walmart': {
                deps: ['data/walmarts.js']
            },
            
            'visualization/earthquakes': {
                deps: ['data/cached-quakes.js']
            }
        },
        demos = [
            'basic/simple-map',
            'geojson/world',
            'animation/map-panning',
            'animation/map-markers',
            'basic/marker-hit-test',
            'geojson/pdxapi',
            'geojson/geocommons',
            'visualization/walmart',
            'visualization/earthquakes',
            'drawing/creator',
            'plugins/heatmap'
        ],
        startLat = -27.469592089206213,
        startLon = 153.0201530456543;
        
    /* internals */
    
    function buildUI() {
        var groupField = gui.add(demo, 'group');
        
        // initialise the groups
        loadDemoData();
        
        // initialise the group field
        groupField.onChange(selectGroup).options.apply(groupField, groupNames).listen();
        
        // add the demos
        sampleField = gui.add(demo, 'sample');
        sampleField.onChange(load);
        sampleField.listen();

        // add the renderer control
        gui.add(demo, 'renderer')
            .options('canvas', 'canvas/dom (beta)', 'raphael/dom (beta)', 'dom (beta)', 'three:webgl (alpha)')
            .onChange(function(newRenderer) {
                map.renderer(newRenderer.replace(/\((alpha|beta)\)/, '').trim());
            });
            
        gui.domElement.style.position = 'absolute';
        gui.domElement.style.top = '10px';
        gui.domElement.style.left = '10px';
        gui.domElement.style['z-index'] = 1001;
        
        // select the group
        selectGroup(demo.group, location.hash);
        
        document.body.appendChild(gui.domElement);
        $('.guidat-controllers').height('auto');
        $('.guidat-toggle').hide();
    } // buildUI
    
    function genTitle(id) {
        var title = '',
            match;
            
        // clean up the status text
        reTitle.lastIndex = 0;
        match = reTitle.exec(id.replace(reGroup, '$2'));
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
            var demoId = demos[ii],
                group = reGroup.test(demoId) ? demoId.replace(reGroup, '$1') : 'main';
                
            // replace the demo with the demo data
            demos[ii] = demoData[demoId] || {};
            demos[ii].id = '#' + demoId;
            demos[ii].group = group;
            
            // if we don't have a title, generate one from the id
            if (! demos[ii].title) {
                demos[ii].title = genTitle(demoId);
            } // if
            
            demos[ii].script = 'js/' + demoId + '/demo.js';
            
            // create the group if not created
            if (! groups[group]) {
                groups[group] = [];
                groupNames[groupNames.length] = group;
            } // if
            
            // add to the group
            groups[group].push(demos[ii]);
        } // for
    } // loadDemoData
    
    function selectGroup(groupName, targetDemo, preventLoad) {
        var options = [],
            groupDemos = groups[groupName] || [];
        
        // iterate through the group demos and fill the options
        for (var ii = 0; ii < groupDemos.length; ii++) {
            options[options.length] = groupDemos[ii].title;
        } // for
        
        // update the sample field
        sampleField.options.apply(sampleField, options);
        
        // if the prevent load parameter is supplied, then exit
        if (preventLoad) {
            return;
        }
        
        // load the first demo in the options
        load(targetDemo || options[0] || '#simple');
    }
        
    /* exports */
    
    function getHomePosition() {
        return new GeoJS.Pos(startLat, startLon);
    } // getHomePosition
    
    function getRenderer() {
        return demo.renderer.replace(/\((alpha|beta)\)/, '').trim();
    } // getRenderer
    
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
        
        demo.sample = selectedDemo.title;
        selectGroup(demo.group = selectedDemo.group, null, true);
        location.hash = selectedDemo.id;
        
        // add the scripts to the body
        for (var depIdx = 0; selectedDemo.deps && depIdx < selectedDemo.deps.length; depIdx++) {
            loaderChain = loaderChain.script(selectedDemo.deps[depIdx]);
        } // for
        
        loaderChain.wait(function() {
            $LAB.script(selectedDemo.script + '?ticks=' + new Date().getTime());
        });
    } // load
    
    function makeMap(zoomLevel, startPos, options) {
        // create the map
        map = new T5.Map('mapContainer', T5.ex({
            renderer: getRenderer()
        }, options));

        map.layer('tiles', 'tile', {
            generator: 'osm.cloudmade',
            // demo api key, register for an API key at http://dev.cloudmade.com/
            apikey: '7960daaf55f84bfdb166014d0b9f8d41'
        });

        map.zoom(zoomLevel || 8).center(startPos || getHomePosition());
        return map;
    } // makeMap
    
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
                sampleGui.domElement.style.top = '115px';
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
        getRenderer: getRenderer,
        getHomePosition: getHomePosition,
        
        load: load,
        
        makeMap: makeMap,
        makeSampleUI: makeSampleUI,
        rotate: rotate,
        status: status
    });
})();