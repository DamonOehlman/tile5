/**
# PathLayer

## TODO

Consider how to effectively convert this use a poly layer under the hood...
*/
T5.PathLayer = function(params) {
    params = T5.ex({
        style: 'waypoints',
        pixelGeneralization: 8,
        zindex: 50
    }, params);
    
    // initialise variables
    var redraw = false,
        coordinates = [],
        markerCoordinates = null,
        rawCoords = [],
        rawMarkers = null,
        pathAnimationCounter = 0,
        spawnedAnimations = [];
        
    /* private internal functions */
    
    function handleGridUpdate(evt, grid) {
        resyncPath(grid);
        
        // tell all the spawned animations to remove themselves
        for (var ii = spawnedAnimations.length; ii--; ) {
            COG.say(
                'layer.remove', { id: spawnedAnimations[ii] });
        } // for
        
        // reset the spawned animations array
        spawnedAnimations = [];
    };
        
    function resyncPath(grid) {
        // update the vectors
        grid.syncVectors(rawCoords);
        if (rawMarkers) {
            grid.syncVectors(rawMarkers);
        } // if

        self.trigger('tidy');
    } // resyncPath
    
    // create the view layer the we will draw the view
    var self = T5.ex(new T5.ViewLayer(params), {
        getAnimation: function(easingFn, duration, drawCallback, autoCenter) {
            // define the layer id
            var layerId = 'pathAnimation' + pathAnimationCounter++;
            spawnedAnimations.push(layerId);

            // create a new animation layer based on the coordinates
            return new T5.AnimatedPathLayer({
                id: layerId,
                path: coordinates,
                zindex: params.zindex + 1,
                easing: easingFn ? easingFn : T5.easing('sine.inout'),
                duration: duration ? duration : 5000,
                drawIndicator: drawCallback,
                autoCenter: autoCenter ? autoCenter : false
            });
        },
        
        cycle: function(tickCount, offset, state, redraw) {
            return redraw;
        },

        draw: function(context, offset, dimensions, state, view) {
            var ii,
                coordLength = coordinates.length;
                
            context.save();
            try {
                T5.applyStyle(context, params.style);
                
                if (coordLength > 0) {
                    // start drawing the path
                    context.beginPath();
                    context.moveTo(
                        coordinates[coordLength - 1].x - offset.x, 
                        coordinates[coordLength - 1].y - offset.y);

                    for (ii = coordLength; ii--; ) {
                        context.lineTo(
                            coordinates[ii].x - offset.x,
                            coordinates[ii].y - offset.y);
                    } // for

                    context.stroke();

                    // if we have marker coordinates draw those also
                    if (markerCoordinates) {
                        context.fillStyle = params.waypointFillStyle;

                        // draw the instruction coordinates
                        for (ii = markerCoordinates.length; ii--; ) {
                            context.beginPath();
                            context.arc(
                                markerCoordinates[ii].x - offset.x, 
                                markerCoordinates[ii].y - offset.y,
                                2,
                                0,
                                Math.PI * 2,
                                false);

                            context.stroke();
                            context.fill();
                        } // for
                    } // if
                } // if
            }
            finally {
                context.restore();
            }
            
            redraw = false;
        },
        
        updateCoordinates: function(coords, markerCoords) {
            var parent = self.getParent(),
                grid = parent ? parent.getTileLayer() : null;
            
            // update the coordinates
            rawCoords = coords;
            rawMarkers = markerCoords;
            
            // if we have a grid, then update
            COG.Log.info('updating coordinates, grid = ' + grid);
            if (grid) {
                resyncPath(grid);
            } // if
        }
    });
    
    self.bind('gridUpdate', handleGridUpdate);
    self.bind('tidy', function(evt) {
        coordinates = T5.V.simplify(rawCoords, params.pixelGeneralization);
        markerCoordinates = T5.V.simplify(rawMarkers, params.pixelGeneralization);

        // wake the parent
        redraw = true;
        self.wakeParent(true);
    });
    
    return self;
};
