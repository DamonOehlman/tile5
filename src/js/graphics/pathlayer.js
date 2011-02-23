/**
# T5.PathLayer
_extends:_ T5.ViewLayer


The T5.PathLayer is used to display a single path on a T5.View
*/
var PathLayer = function(params) {
    params = COG.extend({
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
    
    function resyncPath() {
        var parent = self.getParent();
        if (parent && parent.syncXY) {
            // update the vectors
            parent.syncXY(rawCoords);
            if (rawMarkers) {
                parent.syncXY(rawMarkers);
            } // if

            self.trigger('tidy');
        } // if
    } // resyncPath
    
    // create the view layer the we will draw the view
    var self = COG.extend(new ViewLayer(params), {
        getAnimation: function(easingFn, duration, drawCallback, autoCenter) {
            // define the layer id
            var layerId = 'pathAnimation' + pathAnimationCounter++;
            spawnedAnimations.push(layerId);

            // create a new animation layer based on the coordinates
            return new AnimatedPathLayer({
                id: layerId,
                path: coordinates,
                zindex: params.zindex + 1,
                easing: easingFn ? easingFn : COG.easing('sine.inout'),
                duration: duration ? duration : 5000,
                drawIndicator: drawCallback,
                autoCenter: autoCenter ? autoCenter : false
            });
        },
        
        cycle: function(tickCount, viewRect, state, redraw) {
            return redraw;
        },

        draw: function(context, viewRect, state, view) {
            var ii,
                coordLength = coordinates.length;
                
            context.save();
            try {
                Style.apply(context, params.style);
                
                if (coordLength > 0) {
                    // start drawing the path
                    context.beginPath();
                    context.moveTo(
                        coordinates[coordLength - 1].x, 
                        coordinates[coordLength - 1].y);

                    for (ii = coordLength; ii--; ) {
                        context.lineTo(
                            coordinates[ii].x,
                            coordinates[ii].y);
                    } // for

                    context.stroke();

                    // if we have marker coordinates draw those also
                    if (markerCoordinates) {
                        context.fillStyle = params.waypointFillStyle;

                        // draw the instruction coordinates
                        for (ii = markerCoordinates.length; ii--; ) {
                            context.beginPath();
                            context.arc(
                                markerCoordinates[ii].x, 
                                markerCoordinates[ii].y,
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
            // update the coordinates
            rawCoords = coords;
            rawMarkers = markerCoords;
            
            resyncPath();
        }
    });
    
    self.bind('tidy', function(evt) {
        coordinates = XY.simplify(rawCoords, params.pixelGeneralization);
        markerCoordinates = XY.simplify(rawMarkers, params.pixelGeneralization);

        // wake the parent
        redraw = true;
        self.changed();
    });
    
    self.bind('resync', resyncPath);
    
    return self;
};
