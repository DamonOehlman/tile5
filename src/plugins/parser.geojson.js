T5.Registry.register('parser', 'geojson', function() {
    // define some constants
    var FEATURE_TYPE_COLLECTION = 'featurecollection',
        FEATURE_TYPE_FEATURE = 'feature',
        DEFAULT_FEATUREDEF = {
            processor: null,
            group: 'shapes',
            layerType: 'draw'
        };

    // initialise feature definitions
    var featureDefinitions = {
            point: T5.ex({}, DEFAULT_FEATUREDEF, {
                processor: processPoint,
                group: 'markers',
                layerType: 'draw'
            }),

            linestring: T5.ex({}, DEFAULT_FEATUREDEF, {
                processor: processLineString
            }),
            multilinestring: T5.ex({}, DEFAULT_FEATUREDEF, {
                processor: processMultiLineString
            }),

            polygon: T5.ex({}, DEFAULT_FEATUREDEF, {
                processor: processPolygon
            }),
            multipolygon: T5.ex({}, DEFAULT_FEATUREDEF, {
                processor: processMultiPolygon
            })
        };

    /* feature processor utilities */

    function createShape(layer, coordinates, options, builder) {
        var vectors = readVectors(coordinates);
        builder(layer, vectors, options);

        return vectors.length;
    } // createShape

    function readVectors(coordinates) {
        var count = coordinates ? coordinates.length : 0,
            positions = new Array(count);

        for (var ii = count; ii--; ) {
            positions[ii] = new T5.Pos(coordinates[ii][1], coordinates[ii][0]);
        } // for
        
        return positions;
    } // getLineStringVectors

    /* feature processor functions */

    function processLineString(layer, featureData, options, builders) {
        // TODO: check this is ok...
        var vectors = readVectors(featureData && featureData.coordinates ? featureData.coordinates : []);

        return createShape(layer, vectors, options, builders.line);
    } // processLineString

    function processMultiLineString(layer, featureData, options, builders) {
        var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [],
            pointsProcessed = 0;

        for (var ii = coordinates.length; ii--; ) {
            pointsProcessed += createShape(layer, coordinates[ii], options, builders.line);
        } // for

        return pointsProcessed;
    } // processMultiLineString

    function processPoint(layer, featureData, options, builders) {
        var points = readVectors([featureData.coordinates]);

        if (points.length > 0) {
            var marker = builders.marker(points[0], options);

            if (marker) {
                layer.add(marker);
                return points.length;
            } // if
        } // if
    } // processPoint

    function processPolygon(layer, featureData, options, builders) {
        var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [];
        if (coordinates.length > 0) {
            return createShape(layer, coordinates[0], options, builders.poly);
        } // if

        return 0;
    } // processPolygon

    function processMultiPolygon(layer, featureData, options, builders) {
        var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [],
            pointsProcessed = 0;

        for (var ii = 0; ii < coordinates.length; ii++) {
            pointsProcessed += createShape(layer, coordinates[ii][0], options, builders.poly);
        } // for

        return pointsProcessed;
    } // processMultiPolygon

    /* define the GeoJSON parser */

    function parseGeoJSON(view, data, callback, options, builders) {
        // initialise the options
        options = T5.ex({
            rowPreParse: null,
            simplify: false,
            layerPrefix: 'geojson-'
        }, options);

        // initialise the builders
        builders = T5.ex({
            marker: function(layer, xy, builderOpts) {
                return layer.create('marker', {
                    xy: xy
                });
            },

            line: function(layer, vectors, builderOpts) {
                return layer.create('line', T5.ex({
                    points: vectors
                }, options, builderOpts));
            },

            poly: function(layer, vectors, builderOpts) {
                return layer.create('poly', T5.ex({
                    points: vectors
                }, options, builderOpts));
            }
        }, builders);

        // initialise constants and variables
        var VECTORS_PER_CYCLE = 500,
            rowPreParse = options.rowPreParse,
            layerPrefix = options.layerPrefix,
            featureIndex = 0,
            totalFeatures = 0,
            childCount = 0,
            childrenActive = 0,
            layers = {};

        // if we have no data, then exit
        if (! data) {
            return;
        } // if

        // check that the data is in an array, if not, then make one
        if (! T5.is(data, 'array')) {
            data = [data];
        } // if

        /* parser functions */

        function addFeature(definition, featureInfo) {
            var processor = definition.processor, 
                layerId = layerPrefix + definition.group,
                featureOpts = T5.ex({}, definition, options, {
                    properties: featureInfo.properties
                });

            if (processor) {
                return processor(
                    getLayer(layerId, definition.layerType), 
                    featureInfo.data, 
                    featureOpts,
                    builders);
            } // if

            return 0;
        } // addFeature

        function extractFeatureInfo(featureData, properties) {
            var featureType = featureData && featureData.type ? featureData.type.toLowerCase() : null;

            if (featureType && featureType === FEATURE_TYPE_FEATURE) {
                return extractFeatureInfo(featureData.geometry, featureData.properties);
            }
            else {
                return {
                    type: featureType,
                    isCollection: (featureType ? featureType === FEATURE_TYPE_COLLECTION : false),
                    definition: featureDefinitions[featureType],
                    data: featureData,
                    properties: properties ? properties : featureData.properties
                };
            } // if..else
        } // extractFeatureInfo

        function featureToPoly(feature, callback) {
        } // featureToPrimitives

        function getLayer(layerId, layerType) {
            var layer = layers[layerId];

            if (! layer) {
                layers[layerId] = layer = view.layer(layerId, layerType, { visible: false });
            } // if

            return layer;
        } // getLayer

        function parseComplete(evt) {
            if (callback) {
                callback(layers);
            } // if
        } // parseComplete

        function processData(tickCount) {
            var cycleCount = 0,
                childOpts = T5.ex({}, options),
                ii = featureIndex;

            // initialise the tick count if it isn't already defined
            // not all browsers pass through the ticks with the requestAnimationFrame :/
            tickCount = tickCount ? tickCount : new Date().getTime();

            // _log('processing data, featureIndex = ' + featureIndex + ', total features = ' + totalFeatures);
            for (; ii < totalFeatures; ii++) {
                // get the feature data
                // if a row preparser is defined, then use that
                var featureInfo = extractFeatureInfo(rowPreParse ? rowPreParse(data[ii]) : data[ii]),
                    processedCount = null;

                // if we have a collection, then create the child worker to process the features
                if (featureInfo.isCollection) {
                    childOpts.layerPrefix = layerPrefix + (childCount++) + '-';

                    // create the worker
                    childrenActive++;
                    parseGeoJSON(
                        view,
                        featureInfo.data.features, 
                        function(childLayers) {
                            childrenActive--;

                            // copy the child layers back
                            for (var layerId in childLayers) {
                                layers[layerId] = childLayers[layerId];
                            } // for

                            if (featureIndex >= totalFeatures) {
                                parseComplete();
                            } // if
                        }, childOpts);

                    processedCount += 1;
                }
                // if the processor is defined, then run it
                else if (featureInfo.definition) {
                    processedCount = addFeature(featureInfo.definition, featureInfo);
                } // if..else

                // increment the cycle count
                cycleCount += processedCount ? processedCount : 1;

                // increase the cycle counter and check that we haven't processed too many
                if (cycleCount >= VECTORS_PER_CYCLE) {
                    break;
                } // if
            } // for

            // increment the feature index to the next feature after this loop
            featureIndex = ii + 1;

            // if we have finished, then tell the worker we are done
            if (childrenActive || featureIndex < totalFeatures) {
                setTimeout(processData, 0);
            }
            else {
                parseComplete();
            }
        } // processData

        /* run the parser */

        // save the total feature count
        totalFeatures = data.length;
        setTimeout(processData, 0);
    };
    
    return parseGeoJSON;
});