(function() {
    // internals
    var ui,
        drawLayer,
        sample = {
            type: 'marker',
            rotation: 0,
            scale: 1,
            selection: null,
            
            selectAll: selectAll
        };
        
    function handleTap(evt, absXY, relXY, projectedXY, hits) {
        var drawable = drawLayer.create(sample.type, {
            draggable: true,
            xy: projectedXY
        });

        // set scale and rotation
        drawable.scale(sample.scale, false, true);
        drawable.rotate(sample.rotation, false, true);

        // update the selection
        sample.selection = [drawable];

        // invalidate the map
        map.invalidate();
    } // handleTap
    
    function rotateSelection(value) {
        for (var ii = sample.selection.length; ii--; ) {
            sample.selection[ii].rotate(value, false, true);
        } // for
        
        map.invalidate();
    } // rotateSelection
    
    function scaleSelection(value) {
        for (var ii = sample.selection.length; ii--; ) {
            sample.selection[ii].scale(value, false, true);
        } // for
        
        map.invalidate();
    } // scaleSelection
    
    function selectAll() {
        sample.selection = drawLayer.find();
    } // selectAll
        
    // make a simple map
    DEMO.makeMap();

    // create the draw layer
    drawLayer = map.layer('shapes', 'draw');
    
    // bind the tap event to create objects
    map.bind('tap', handleTap);
    
    ui = DEMO.makeSampleUI();
    ui.gui.add(sample, 'type').options('marker', 'line', 'poly');
    ui.gui.add(sample, 'rotation', 0, 360, 1).onChange(rotateSelection);
    ui.gui.add(sample, 'scale', 0.25, 4).onChange(scaleSelection);
    ui.gui.add(sample, 'selectAll').name('Select All');
    ui.done();
})();