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
    params = _extend({
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

    function calcAverageXY(markers, syncer) {

        function avg() {
            var sum = 0;
            for (var ii = arguments.length; ii--; ) {
                sum += arguments[ii];
            } // for

            return sum / arguments.length | 0;
        } // avg

        var xValues = [],
            yValues = [];

        for (var ii = markers.length; ii--; ) {
            xValues[ii] = markers[ii].xy.x;
            yValues[ii] = markers[ii].xy.y;
        } // for

        return new T5.XY(avg.apply(null, xValues), avg.apply(null, yValues));
    } // calcAverageXY

    function checkForClusters() {
        var layers = view.layer();

        _log('checking for clusters');

        for (var ii = layers.length; ii--; ) {
            var layer = layers[ii];
            if (! T5.is(layer.itemCount, 'undefined')) {
                var clusterLayer = checkLayer(layer, true);
                layer.visible = !clusterLayer;
            } // if

            layerCounts[layer.id] = layer.itemCount;
        } // for
    } // checkForClusters

    function checkClusterLayer(layer, clusterLayer, hash) {
        var markers = layer.find({
            typeName: 'Marker'
        });

        for (var ii = markers.length; ii--; ) {
            if (! markers[ii].cluster) {
                var cluster = findNearestCluster(clusterLayer);

                if (! cluster) {
                    cluster = new T5.Marker(_extend({}, markers[ii], {
                        children: []
                    }));

                    clusterLayer.add(cluster);
                } // if

                cluster.children.push(markers[ii]);
                cluster.size += 1;

                markers[ii].cluster = cluster;
            } // if
        } // for
    } // checkClusterLayer

    function checkForChanges(checkRequired) {
        var checkLayers = [],
            layers = view.layer();

        for (var ii = layers.length; ii--; ) {
            var layer = layers[ii];

            checkRequired = checkRequired || (
                layer.id.indexOf(CLUSTER_LAYER_PREFIX) < 0 &&
                layer.itemCount && layer.itemCount !== layerCounts[layer.id]
            );
        } // for


        if (checkRequired) {
            checkForClusters();
        }
    } // checkForChanges

    function createClusterLayer(hash, layer, clusterLayerId) {

        var clusterLayer = clusterLayers[clusterLayerId] = new T5.DrawLayer({
                id: clusterLayerId
            });

        for (var quad in hash) {
            var childMarkers = hash[quad],
                markerXY = calcAverageXY(childMarkers, view || layer.view),
                clusterMarker = new T5.Marker(_extend({}, childMarkers[0], {
                    xy: markerXY,
                    size: childMarkers[0].size + childMarkers.length,
                    children: childMarkers
                }));

            for (var ii = childMarkers.length; ii--; ) {
                childMarkers[ii].cluster = clusterMarker;
            } // for

            clusterLayer.add(clusterMarker);
        } // for

        return clusterLayer;
    } // createClusterLayer

    function findBroadClusters(layer) {
        var testMarkers = [],
            drawables = layer.find({
                typeName: 'Marker'
            }),
            layerHash = {},
            ii;

        for (ii = drawables.length; ii--; ) {
            var xy = drawables[ii].xy,
                bucketX = xy.x / bucketSize | 0,
                bucketY = xy.y / bucketSize | 0,
                bucketId = bucketX + '_' + bucketY,
                bucket = layerHash[bucketId];

            if (! bucket) {
                bucket = layerHash[bucketId] = [];
            } // if

            bucket[bucket.length] = drawables[ii];
        } // for

        return layerHash;
    } // findClusters

    function findNearestCluster(clusterLayer, targetX, targetY) {
        var clusters = clusterLayer.find(),
            nearestCluster = null,
            minDist = Infinity;

        for (var ii = clusters.length; ii--; ) {
            var testX = clusters[ii].xy.x,
                testY = clusters[ii].xy.y,
                xDiff = targetX - testX,
                yDiff = targetY - testY,
                dist = Math.sqrt(xDiff * xDiff + yDiff * yDiff);

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

            lastCheck = tickCount;
        } // if
    } // handleDrawComplete

    function handleLayerChange(evt, targetView, layer) {
        delete clusterLayers[CLUSTER_LAYER_PREFIX + layer.id];

        checkForChanges(true);
    } // handleLayerChange

    function handleZoomLevelChange(evt) {
        for (var layerId in clusterLayers) {
            view.removeLayer(layerId);
        } // for

        layerCounts = {};
        clusterLayers = {};
    } // handleZoomLevelchange

    function shouldCluster(hash) {
        var shouldCluster = false;

        for (var quad in hash) {
            shouldCluster = shouldCluster || hash[quad].length > 1;
        } // for

        return shouldCluster;
    } // processClusters

    /* exports */

    function checkLayer(layer, useExisting) {
        var hash = findBroadClusters(layer),
            cluster = shouldCluster(hash),
            clusterLayerId = CLUSTER_LAYER_PREFIX + layer.id,
            clusterLayer = useExisting ? clusterLayers[clusterLayerId] : null;

        if (cluster) {
            if (! clusterLayer) {
                clusterLayer = createClusterLayer(hash, layer, clusterLayerId);

                if (view) {
                    view.setLayer(clusterLayerId, clusterLayer);
                    view.invalidate();
                } // if
            }
            else {
                checkClusterLayer(layer, clusterLayer, hash);
            }
        }
        else if (clusterLayer) {
            delete clusterLayers[clusterLayerId];

            if (view) {
                view.removeLayer(clusterLayerId);
                view.invalidate();
            } // if
        } // if

        return clusterLayer;
    } // checkLayer

    function uncluster() {
        layerCounts = {};

        for (var layerId in clusterLayers) {
            var originalLayer = view.getLayer(layerId.slice(CLUSTER_LAYER_PREFIX.length));
            if (originalLayer) {
                originalLayer.visible = true;
            } // if

            view.removeLayer(layerId);
        } // for

        view.invalidate();
    } // uncluster

    /* initialization */

    if (view) {
        view.bind('drawComplete', handleDrawComplete);
        view.bind('layerChange', handleLayerChange);
        view.bind('layerRemove', handleLayerChange);
        view.bind('zoom', handleZoomLevelChange);
    } // if

    return {
        checkLayer: checkLayer,
        uncluster: uncluster
    };
};
