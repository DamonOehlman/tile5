/**
# T5.Clusterer
__PLUGIN__: `plugins/clusterer.js`

The clusterer plugin can be used to implement client side marker
clustering for markers that are contained within a T5.DrawLayer.  Markers
will be clustered on a per draw layer basis (i.e. markers on different
draw layers will never be clustered together).

To implement clustering do the following:

1 - include the clusterer.js plugin into your project

2 - Attach a clusterer to the T5.View (or T5.Map) that you want to 
have the clustering operate on:

    var clusterer = new T5.Clusterer(view);

*/
T5.Clusterer = function(view, params) {
    params = COG.extend({
        dist: 32,
        checkInterval: 100
    }, params);
    
    /* internals */
    
    var CLUSTER_LAYER_PREFIX = 'cluster_',
        lastCheck = 0,
        checkInterval = params.checkInterval,
        layerCounts = {},
        layerMarkers = {},
        clusterLayers = {},
        bucketSize = params.dist;
        
    function calcAverageXY(markers) {
        
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

        return T5.XY.init(avg.apply(null, xValues), avg.apply(null, yValues));
    } // calcAverageXY
        
    function checkForClusters() {
        COG.info('checking for clusters');
        
        // iterate through the layers and check for markers
        view.eachLayer(function(layer) {
            if (! T5.is(layer.itemCount, 'undefined')) {
                var hash = findBroadClusters(layer),
                    cluster = shouldCluster(hash),
                    clusterLayerId = CLUSTER_LAYER_PREFIX + layer.id,
                    clusterLayer = clusterLayers[clusterLayerId];
                    
                // if we should cluster, then create the cluster layer if required
                if (cluster) {
                    // if the cluster layer has not been created, then create it now
                    if (! clusterLayer) {
                        clusterLayer = createClusterLayer(hash, layer, clusterLayerId);
                    }
                    else {
                        checkClusterLayer(layer, clusterLayer, hash);
                    }
                }
                else if (clusterLayer) {
                    // remove the cluster
                    delete clusterLayers[clusterLayerId];
                    view.removeLayer(clusterLayerId);
                    view.invalidate();
                } // if

                // if this layer is clustering, then hide it as the cluster layer will do the job
                layer.visible = !cluster;
            } // if
            
            layerCounts[layer.id] = layer.itemCount;
        });
    } // checkForClusters
    
    function checkClusterLayer(layer, clusterLayer, hash) {
        var markers = layer.find({
            typeName: 'Marker'
        });
        
        // iterate through the markers and look for markers without a cluster
        for (var ii = markers.length; ii--; ) {
            if (! markers[ii].cluster) {
                var cluster = findNearestCluster(clusterLayer);
                
                // if we didn't find a cluster, then create a new one
                if (! cluster) {
                    cluster = new T5.Marker(COG.extend({}, markers[ii], {
                        children: []
                    }));
                    
                    clusterLayer.add(cluster);
                } // if
                
                // add the marker to the cluster node
                cluster.children.push(markers[ii]);
                cluster.size += 1;
                
                // set the markers cluster
                markers[ii].cluster = cluster;
            } // if
        } // for
    } // checkClusterLayer
    
    function checkForChanges(checkRequired) {
        var checkLayers = [];
        
        // look for draw layers
        view.eachLayer(function(layer) {
            checkRequired = checkRequired || (
                layer.id.indexOf(CLUSTER_LAYER_PREFIX) < 0 && 
                layer.itemCount && layer.itemCount !== layerCounts[layer.id]
            );
        });
        
        if (checkRequired) {
            checkForClusters();
        } 
    } // checkForChanges
    
    function createClusterLayer(hash, layer, clusterLayerId) {
        
        var clusterLayer = clusterLayers[clusterLayerId] = new T5.DrawLayer({
                id: clusterLayerId
            });
            
        // iterate through the hash clusters and create the cluster markers
        for (var quad in hash) {
            var childMarkers = hash[quad],
                markerXY = calcAverageXY(childMarkers),
                clusterMarker = new T5.Marker(COG.extend({}, childMarkers[0], {
                    xy: markerXY,
                    size: childMarkers[0].size + childMarkers.length,
                    children: childMarkers
                }));
                
            // iterate through the child markers and set the cluster
            for (var ii = childMarkers.length; ii--; ) {
                childMarkers[ii].cluster = clusterMarker;
            } // for
                
            // create the cluster marker
            clusterLayer.add(clusterMarker);
        } // for

        // add the cluster markers to the cluster layer
        view.setLayer(clusterLayerId, clusterLayer);
        view.invalidate();
        
        return clusterLayer;
    } // createClusterLayer
    
    function findBroadClusters(layer) {
        var testMarkers = [],
            // TODO: actually implement the layer searching :)
            drawables = layer.find({
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
    
    function findNearestCluster(clusterLayer, targetX, targetY) {
        var clusters = clusterLayer.find(),
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
    
    function handleDrawComplete(evt, viewport, tickCount) {
        if (tickCount - lastCheck >= checkInterval) {
            checkForChanges();
            
            // update the last check time
            lastCheck = tickCount;
        } // if
    } // handleDrawComplete
    
    function handleLayerChange(evt, targetView, layer) {
        // if we have a cluster layer for the specified layer, then remove it
        delete clusterLayers[CLUSTER_LAYER_PREFIX + layer.id];
        
        // check for changes 
        checkForChanges(true);
    } // handleLayerChange
    
    function handleZoomLevelChange(evt) {
        // remove the cluster layers from the view
        for (var layerId in clusterLayers) {
            view.removeLayer(layerId);
        } // for
        
        // reset the layer counts
        layerCounts = {};
        clusterLayers = {};
    } // handleZoomLevelchange
    
    function shouldCluster(hash) {
        var shouldCluster = false;
        
        // check for multiple markers in a cluster
        for (var quad in hash) {
            shouldCluster = shouldCluster || hash[quad].length > 1;
        } // for
        
        return shouldCluster;
    } // processClusters
    
    /* exports */
    
    function uncluster() {
        // reset the layer counts
        layerCounts = {};
        
        // remove the cluster layers from the view
        for (var layerId in clusterLayers) {
            // find the original layer
            var originalLayer = view.getLayer(layerId.slice(CLUSTER_LAYER_PREFIX.length));
            if (originalLayer) {
                originalLayer.visible = true;
            } // if
            
            // remove the cluster layer
            view.removeLayer(layerId);
        } // for
        
        view.invalidate();
    } // uncluster
    
    /* initialization */
    
    // attach to the specified view
    view.bind('drawComplete', handleDrawComplete);
    view.bind('layerChange', handleLayerChange);
    view.bind('layerRemove', handleLayerChange);
    view.bind('zoomLevelChange', handleZoomLevelChange);
    
    return {
        uncluster: uncluster
    };
};