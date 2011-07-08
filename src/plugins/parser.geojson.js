T5.Registry.register('parser', 'geojson', function() {
    // define some constants
    var DEFAULT_FEATUREDEF = {
            processor: null,
            group: 'shapes'
        };

    // initialise feature definitions
    var featureDefinitions = {
            point: T5.ex({}, DEFAULT_FEATUREDEF, {
                processor: processPoint,
                group: 'markers'
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

    function createShape(layer, coordinates, options, shapeType) {
        var vectors = readVectors(coordinates, options);
        
        layer.create(shapeType || 'poly', T5.ex({}, {
            points: vectors
        }, options));

        return vectors.length;
    } // createShape

    function readVectors(coordinates, options) {
        var count = coordinates ? coordinates.length : 0,
            positions = [];
            
        for (var ii = count; ii--; ) {
            positions[ii] = new GeoJS.Pos(coordinates[ii][1], coordinates[ii][0]);
        } // for
        
        // if we are to simplify the positions then generalize via GeoJS
        return options.simplify ? GeoJS.generalize(positions) : positions;
    } // getLineStringVectors

    /* feature processor functions */

    function processLineString(layer, featureData, options) {
        // TODO: check this is ok...
        var vectors = featureData && featureData.coordinates ? featureData.coordinates : [];

        return createShape(layer, vectors, options, 'line');
    } // processLineString

    function processMultiLineString(layer, featureData, options) {
        var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [],
            pointsProcessed = 0;

        for (var ii = coordinates.length; ii--; ) {
            pointsProcessed += createShape(layer, coordinates[ii], options, 'line');
        } // for

        return pointsProcessed;
    } // processMultiLineString

    function processPoint(layer, featureData, options) {
        var points = readVectors([featureData.coordinates]);

        if (points.length > 0) {
            layer.create('marker', options);
        } // if
        
        return points.length;
    } // processPoint

    function processPolygon(layer, featureData, options) {
        var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [];
        if (coordinates.length > 0) {
            return createShape(layer, coordinates[0], options);
        } // if

        return 0;
    } // processPolygon

    function processMultiPolygon(layer, featureData, options) {
        var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [],
            pointsProcessed = 0;

        for (var ii = 0; ii < coordinates.length; ii++) {
            pointsProcessed += createShape(layer, coordinates[ii][0], options);
        } // for

        return pointsProcessed;
    } // processMultiPolygon

    /* define the GeoJSON parser */

    function parseGeoJSON(view, data, callback, options) {
        // initialise the options
        options = T5.ex({
            rowPreParse: null,
            simplify: false,
            layerPrefix: 'geojson-'
        }, options);

        // initialise constants and variables
        var rowPreParse = options.rowPreParse,
            layerPrefix = options.layerPrefix,
            featureIndex = 0,
            totalFeatures = 0,
            childCount = 0,
            childrenActive = 0,
            layers = {},
            topLevelProps;

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
                    getLayer(layerId), 
                    featureInfo.data, 
                    featureOpts);
            } // if

            return 0;
        } // addFeature

        function extractFeatureInfo(featureData, properties) {
            var featureType = featureData && featureData.type ? featureData.type.toLowerCase() : null;

            if (featureType === 'feature') {
                return extractFeatureInfo(featureData.geometry, featureData.properties);
            }
            else {
                return {
                    type: featureType,
                    isCollection: (featureType ? featureType === 'featurecollection' : false),
                    definition: featureDefinitions[featureType],
                    data: featureData,
                    properties: properties ? properties : featureData.properties
                };
            } // if..else
        } // extractFeatureInfo

        function getLayer(layerId) {
            var layer = view.layer(layerId);

            if (! layer) {
                layers[layerId] = layer = view.layer(layerId, 'draw', { visible: false });
            } // if

            return layer;
        } // getLayer

        function processData(tickCount) {
            var childOpts = T5.ex({}, options),
                ii = featureIndex;

            // initialise the tick count if it isn't already defined
            // not all browsers pass through the ticks with the requestAnimationFrame :/
            tickCount = tickCount ? tickCount : new Date().getTime();

            // _log('processing data, featureIndex = ' + featureIndex + ', total features = ' + totalFeatures);
            for (; ii < totalFeatures; ii++) {
                // get the feature data
                // if a row preparser is defined, then use that
                var featureInfo = extractFeatureInfo(rowPreParse ? rowPreParse(data[ii]) : data[ii]);

                // if we have a collection, then create the child worker to process the features
                if (featureInfo.isCollection) {
                    // update the top level properties
                    topLevelProps = topLevelProps || featureInfo.properties;
                    
                    // create the child layer prefix
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
                        }, childOpts);
                }
                // if the processor is defined, then run it
                else if (featureInfo.definition) {
                    addFeature(featureInfo.definition, featureInfo);
                } // if..else
            } // for

            // increment the feature index to the next feature after this loop
            featureIndex = ii + 1;

            // if we have finished, then tell the worker we are done
            if (childrenActive || featureIndex < totalFeatures) {
                setTimeout(processData, 0);
            }
            else if (callback) {
                callback(layers, topLevelProps);
            } // if..else
        } // processData

        /* run the parser */

        // save the total feature count
        totalFeatures = data.length;
        setTimeout(processData, 0);
    };
    
    return parseGeoJSON;
});