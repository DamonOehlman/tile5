/**
# LAYER: cluster (plugin)
*/
T5.Registry.register('layer', 'cluster', function(view, params) {
    params = T5.ex({
        dist: 32,
        source: null
    }, params);

    /* internals */
    
    var sourceLayer = view.layer(params.source),
        bucketSize = params.dist,
        clusterCheckTimeout = 0;
        
    function calcAverageXY(markers, syncer) {

        function avg() {
            var sum = 0;
            for (var ii = arguments.length; ii--; ) {
                sum += arguments[ii];
            } // for

            return sum / arguments.length | 0;
        } // avg

        // iterate through the markers and determine the average x and y
        var xValues = [],
            yValues = [];

        // push the x and y values into separate arrays
        for (var ii = markers.length; ii--; ) {
            xValues[ii] = markers[ii].xy.x;
            yValues[ii] = markers[ii].xy.y;
        } // for

        // return the new xy position
        return new T5.XY(avg.apply(null, xValues), avg.apply(null, yValues));
    } // calcAverageXY        
        
    function findBroadClusters() {
        var testMarkers = [],
            // TODO: actually implement the layer searching :)
            drawables = sourceLayer.find({
                typeName: 'Marker'
            }),
            layerHash = {},
            ii;

        // check the drawables of the cluster
        for (ii = drawables.length; ii--; ) {
            // get the x and y of the drawable
            var xy = drawables[ii].xy,
                bucketX = xy.x / bucketSize | 0,
                bucketY = xy.y / bucketSize | 0,
                bucketId = bucketX + '_' + bucketY,
                bucket = layerHash[bucketId];

            // if the bucket doesn't yet exist then create it
            if (! bucket) {
                bucket = layerHash[bucketId] = [];
            } // if

            // add the drawable to the bucket
            bucket[bucket.length] = drawables[ii];
        } // for

        return layerHash;
    } // findClusters
    
    function findNearestCluster(targetX, targetY) {
        var clusters = _self.find(),
            nearestCluster = null,
            minDist = Infinity;
        
        // iterate through the markers on the cluster layer
        for (var ii = clusters.length; ii--; ) {
            var testX = clusters[ii].xy.x,
                testY = clusters[ii].xy.y,
                xDiff = targetX - testX,
                yDiff = targetY - testY,
                dist = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
                
            // if the dist is less than the min dist, then update the nearest cluster and min dist
            if (dist < minDist) {
                nearestCluster = clusters[ii];
                minDist = dist;
            } // if
        } // for
        
        return minDist <= bucketSize ? nearestCluster : null;
    } // findNearestCluster
        
    function handleMarkerAdded(evt, marker) {
        clearTimeout(clusterCheckTimeout);
        clusterCheckTimeout = setTimeout(rebuild, 100);
    } // handlerMarkerAdded
    
    function handleMarkersCleared(evt) {
        // clear the markers
    } // handleMarkersCleared
    
    function rebuild() {
        T5.log('marker(s) added, need to check for cluster changes');
        var hash = findBroadClusters(),
            markers = sourceLayer.find({
                typeName: 'Marker'
            });

        // iterate through the markers and look for markers without a cluster
        for (var ii = markers.length; ii--; ) {
            if (! markers[ii].cluster) {
                var markerXY = markers[ii].xy,
                    cluster = findNearestCluster(markerXY.x, markerXY.y);

                // if we didn't find a cluster, then create a new one
                if (! cluster) {
                    cluster = _self.create('marker', T5.ex({}, markers[ii], {
                        children: []
                    }));
                } // if

                // add the marker to the cluster node
                cluster.children.push(markers[ii]);
                cluster.size += 1;

                // set the markers cluster
                markers[ii].cluster = cluster;
            } // if
        } // for        
    } // rebuild
    
    function shouldCluster(hash) {
        var shouldCluster = false;
        
        // check for multiple markers in a cluster
        for (var quad in hash) {
            shouldCluster = shouldCluster || hash[quad].length > 1;
        } // for
        
        return shouldCluster;
    } // processClusters

    /* exports */
    
    var _self = T5.Registry.create('layer', 'draw', view, params);
    
    if (sourceLayer) {
        sourceLayer.bind('markerAdded', handleMarkerAdded);
        sourceLayer.bind('cleared', handleMarkersCleared);
        
        // set the source layer to invisible
        sourceLayer.visible = false;
    }
    // if the source layer is not defined, then warn
    else {
        T5.log('No source matching source layer, won\'t be clustering much today folks...', 'warn');
    } // if..else
    
    return _self;
});