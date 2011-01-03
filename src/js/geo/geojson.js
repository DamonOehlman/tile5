// define some constants
var FEATURE_TYPE_COLLECTION = 'featurecollection',
    FEATURE_TYPE_FEATURE = 'feature',
    VECTORIZE_OPTIONS = {
        async: false
    },
    
    DEFAULT_FEATUREDEF = {
        processor: null,
        group: 'shapes',
        layerClass: ShapeLayer
    };

// initialise feature definitions
var featureDefinitions = {
    
    point: COG.extend({}, DEFAULT_FEATUREDEF, {
        processor: processPoint,
        group: 'markers',
        layerClass: MarkerLayer
    }),
    
    linestring: COG.extend({}, DEFAULT_FEATUREDEF, {
        processor: processLineString
    }),
    multilinestring: COG.extend({}, DEFAULT_FEATUREDEF, {
        processor: processMultiLineString
    }),
    
    polygon: COG.extend({}, DEFAULT_FEATUREDEF, {
        processor: processPolygon
    }),
    multipolygon: COG.extend({}, DEFAULT_FEATUREDEF, {
        processor: processMultiPolygon
    })
};

/* feature processor utilities */

function createLine(layer, coordinates, options, builders) {
    var vectors = readVectors(coordinates);
    
    layer.add(builders.line(vectors, options));
    return vectors.length;
} // createLine

function createPoly(layer, coordinates, options, builders) {
    // TODO: check this is ok...
    var vectors = readVectors(coordinates);
    layer.add(builders.poly(vectors, options));
    
    return vectors.length;
} // createPoly

function readVectors(coordinates) {
    var count = coordinates ? coordinates.length : 0,
        positions = new Array(count);
        
    for (var ii = count; ii--; ) {
        positions[ii] = Geo.Position.init(coordinates[ii][1], coordinates[ii][0]);
    } // for

    return Geo.Position.vectorize(positions, VECTORIZE_OPTIONS);
} // getLineStringVectors

/* feature processor functions */

function processLineString(layer, featureData, options, builders) {
    // TODO: check this is ok...
    var vectors = readVectors(featureData && featureData.coordinates ? featureData.coordinates : []);
    
    return createLine(layer, vectors, options, builders);
} // processLineString

function processMultiLineString(layer, featureData, options, builders) {
    var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [],
        pointsProcessed = 0;
    
    for (var ii = coordinates.length; ii--; ) {
        pointsProcessed += createLine(layer, coordinates[ii], options, builders);
    } // for
    
    return pointsProcessed;
} // processMultiLineString

function processPoint(layer, featureData, options, builders) {
    var points = readVectors([featureData.coordinates], VECTORIZE_OPTIONS);

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
        return createPoly(layer, coordinates[0], options, builders);
    } // if
    
    return 0;
} // processPolygon

function processMultiPolygon(layer, featureData, options, builders) {
    var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [],
        pointsProcessed = 0;
    
    for (var ii = 0; ii < coordinates.length; ii++) {
        pointsProcessed += createPoly(layer, coordinates[ii][0], options, builders);
    } // for
    
    return pointsProcessed;
} // processMultiPolygon

/* define the GeoJSON parser */

var GeoJSONParser = function(data, callback, options, builders) {
    // initialise the options
    options = COG.extend({
        vectorsPerCycle: Geo.VECTORIZE_PER_CYCLE,
        rowPreParse: null,
        simplify: false,
        layerPrefix: 'geojson-'
    }, options);
    
    // initialise the builders
    builders = COG.extend({
        marker: function(xy, options) {
            return new Marker({
                xy: xy
            });
        },
        
        line: function(vectors, options) {
            return new Poly(vectors, options);
        },
        
        poly: function(vectors, options) {
            return new Poly(vectors, COG.extend({
                fill: true
            }, options));
        }
    }, builders);
    
    // initialise variables
    var vectorsPerCycle = options.vectorsPerCycle,
        rowPreParse = options.rowPreParse,
        layerPrefix = options.layerPrefix,
        featureIndex = 0,
        totalFeatures = 0,
        childParser = null,
        childCount = 0,
        layers = {},
        worker;

    // if we have no data, then exit
    if (! data) {
        return null;
    } // if
    
    // check that the data is in an array, if not, then make one
    if (typeof data.length === 'undefined') {
        data = [data];
    } // if
        
    /* parser functions */
    
    function addFeature(definition, featureInfo) {
        var processor = definition.processor, 
            layerId = layerPrefix + definition.group,
            featureOpts = COG.extend({}, definition, options, {
                properties: featureInfo.properties
            });
            
        if (processor) {
            return processor(
                getLayer(layerId, definition.layerClass), 
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
    
    function getLayer(layerId, layerClass) {
        var layer = layers[layerId];
        
        if (! layer) {
            layer = new layerClass({
                id: layerId
            });
            
            layers[layerId] = layer;
        } // if
        
        globalLayers = layers;
        return layer;
    } // getLayer
    
    function handleParseComplete(evt) {
        if (callback) {
            callback(layers);
        } // if
    } // handleParseComplete

    function processData(tickCount, worker) {
        var cycleCount = 0,
            ii = featureIndex;
            
        // if we have a child worker active, then don't do anything in this worker
        if (childParser) {
            return;
        }
        
        // COG.Log.info('processing data, featureIndex = ' + featureIndex + ', total features = ' + totalFeatures);
        for (; ii < totalFeatures; ii++) {
            // get the feature data
            // if a row preparser is defined, then use that
            var featureInfo = extractFeatureInfo(rowPreParse ? rowPreParse(data[ii]) : data[ii]),
                processedCount = null;
                
            // if we have a collection, then create the child worker to process the features
            if (featureInfo.isCollection) {
                childCount += 1;
                
                // create the worker
                childParser = parse(
                    featureInfo.data.features, 
                    function(childLayers) {
                        childParser = null;
                        
                        // copy the child layers back
                        for (var layerId in childLayers) {
                            layers[layerId] = childLayers[layerId];
                        } // for
                    }, {
                        layerPrefix: layerPrefix + childCount + '-'
                    });
                    
                processedCount += 1;
            }
            // if the processor is defined, then run it
            else if (featureInfo.definition) {
                processedCount = addFeature(featureInfo.definition, featureInfo);
            } // if..else
            
            // increment the cycle count
            cycleCount += processedCount ? processedCount : 1;
            
            // increase the cycle counter and check that we haven't processed too many
            if (cycleCount >= vectorsPerCycle) {
                break;
            } // if
        } // for
        
        // increment the feature index to the next feature after this loop
        featureIndex = ii + 1;
        
        // if we have finished, then tell the worker we are done
        if ((! childParser) && (featureIndex >= totalFeatures)) {
            // TODO: add a sort step to sort the shapes from largest (at the back) to smallest at the front
            worker.trigger('complete');
        } // if
    } // processData
    
    /* run the parser */
    
    // save the total feature count
    totalFeatures = data.length;
    
    // create the worker
    worker = COG.Loopage.join({
        frequency: 10,
        execute: processData
    });
    
    // when the worker has completed, fire the callback
    worker.bind('complete', handleParseComplete);
    
    return worker;
};

/* exports */

function parse(data, callback, options) {
    return new GeoJSONParser(data, callback, options);
} // parse

var GeoJSON = exports.GeoJSON = (function() {
    return {
        parse: parse
    }; 
})();