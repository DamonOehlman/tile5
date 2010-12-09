/**
# T5.Geo.JSON
_module_


This module provides GeoJSON support for Tile5.
*/
T5.Geo.JSON = (function() {
    
    // define some constants
    var FEATURE_TYPE_COLLECTION = 'featurecollection',
        FEATURE_TYPE_FEATURE = 'feature',
        VECTORIZE_OPTIONS = {
            async: false
        };
    
    // define the feature processors
    // TODO: think about the most efficient way to handle points...
    var featureProcessors = {
        linestring: processLineString,
        multilinestring: processMultiLineString,
        polygon: processPolygon,
        multipolygon: processMultiPolygon
    };
    
    /* feature processor utilities */
    
    function createLine(layer, coordinates, options) {
        var vectors = readVectors(coordinates);
        
        layer.add(new T5.Poly(vectors, options));
        return vectors.length;
    } // createLine
    
    function createPoly(layer, coordinates, options) {
        // TODO: check this is ok...
        var vectors = readVectors(coordinates);
        layer.add(new T5.Poly(vectors, T5.ex({
            fill: true
        }, options)));
        
        return vectors.length;
    } // createPoly
    
    function readVectors(coordinates) {
        var count = coordinates ? coordinates.length : 0,
            positions = new Array(count);
            
        for (var ii = count; ii--; ) {
            positions[ii] = new T5.Geo.Position(coordinates[ii][1], coordinates[ii][0]);
        } // for

        return T5.Geo.P.vectorize(positions, VECTORIZE_OPTIONS);
    } // getLineStringVectors
    
    /* feature processor functions */
    
    function processLineString(layer, featureData, options) {
        // TODO: check this is ok...
        var vectors = readVectors(featureData && featureData.coordinates ? featureData.coordinates : []);
        
        layer.add(new T5.Poly(vectors));
        
        return vectors.length;
    } // processLineString
    
    function processMultiLineString(layer, featureData, options) {
        var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [],
            pointsProcessed = 0;
        
        for (var ii = coordinates.length; ii--; ) {
            pointsProcessed += createLine(layer, coordinates[ii], options);
        } // for
        
        return pointsProcessed;
    } // processMultiLineString
    
    function processPolygon(layer, featureData, options) {
        var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [];
        if (coordinates.length > 0) {
            return createPoly(layer, coordinates[0], options);
        } // if
        
        return 0;
    } // processPolygon
    
    function processMultiPolygon(layer, featureData, options) {
        var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [],
            pointsProcessed = 0;
        
        for (var ii = 0; ii < coordinates.length; ii++) {
            pointsProcessed += createPoly(layer, coordinates[ii][0], options);
        } // for
        
        return pointsProcessed;
    } // processMultiPolygon
    
    /* define the GeoJSON parser */
    
    var GeoJSONParser = function(data, callback, options) {
        options = T5.ex({
            vectorsPerCycle: T5.Geo.VECTORIZE_PER_CYCLE,
            rowPreParse: null,
            targetLayer: null,
            simplify: false
        }, options);
        
        // initialise variables
        var vectorsPerCycle = options.vectorsPerCycle,
            targetLayer = options.targetLayer,
            rowPreParse = options.rowPreParse,
            featureIndex = 0,
            totalFeatures = 0,
            childParser = null,
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
        
        function extractFeatureInfo(featureData) {
            var featureType = featureData && featureData.type ? featureData.type.toLowerCase() : null;
            
            if (featureType && featureType === FEATURE_TYPE_FEATURE) {
                return extractFeatureInfo(featureData.geometry);
            }
            else {
                return {
                    type: featureType,
                    isCollection: (featureType ? featureType === FEATURE_TYPE_COLLECTION : false),
                    processor: featureProcessors[featureType],
                    data: featureData
                };
            } // if..else
        } // extractFeatureInfo
        
        function featureToPoly(feature, callback) {
        } // featureToPrimitives

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
                    // create the worker
                    childParser = parse(
                        featureInfo.data.features, 
                        function(layer) {
                            childParser = null;
                        }, {
                            targetLayer: targetLayer
                        });
                        
                    processedCount = 1;
                }
                // if the processor is defined, then run it
                else if (featureInfo.processor) {
                    // COG.Log.info('processing feature, data = ', featureInfo.data);
                    processedCount = featureInfo.processor(targetLayer, featureInfo.data, options);
                } // if
                
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
                worker.trigger('complete');
            } // if
        } // processData
        
        /* run the parser */
        
        // save the total feature count
        totalFeatures = data.length;
        
        // if we don't have a target layer, then create one
        // COG.Log.info('geojson parser initialized - target layer = ' + targetLayer + ', feature count = ' + totalFeatures);
        if (! targetLayer) {
            targetLayer = new T5.PolyLayer();
        } // if
        
        // create the worker
        worker = COG.Loopage.join({
            frequency: 10,
            execute: processData
        });
        
        // when the worker has completed, fire the callback
        worker.bind('complete', function(evt) {
            if (callback) {
                callback(targetLayer);
            } // if
        });
        
        return worker;
    };
    
    /* exported functions */
    
    function parse(data, callback, options) {
        return new GeoJSONParser(data, callback, options);
    } // parse
    
    /* module definition */
    
    var module = {
        parse: parse
    };
    
    return module;
})();

