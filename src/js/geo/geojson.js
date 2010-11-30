/**
# T5.Geo.JSON
_module_


This module provides GeoJSON support for Tile5.
*/
T5.Geo.JSON = (function() {
    
    // define some constants
    var FEATURE_TYPE_COLLECTION = 'geometrycollection',
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
    
    /* feature processor functions */
    // TODO: consider supporting continuations here...
    
    function processLineString(layer, coordinates) {
        // TODO: check this is ok...
        var vectors = readVectors(coordinates);
        
        layer.add(new T5.Poly(vectors));        
    } // processLineString
    
    function processMultiLineString(layer, coordinates) {
        for (var ii = 0; ii < coordinates.length; ii++) {
            processLineString(layer, coordinates[ii]);
        } // for
    } // processMultiLineString
    
    function processPolygon(layer, coordinates) {
        // TODO: check this is ok...
        var vectors = readVectors(coordinates[0]);
        layer.add(new T5.Poly(vectors, {
            fill: true
        }));
    } // processPolygon
    
    function processMultiPolygon(layer, coordinates) {
        for (var ii = 0; ii < coordinates.length; ii++) {
            processPolygon(layer, coordinates[ii]);
        } // for
    } // processMultiPolygon
    
    /* other module level functions */
    
    function readVectors(coordinates) {
        // iterate through the coordinates and create a vector array
        var positions = readCoordinates(coordinates);
        
        return T5.Geo.P.vectorize(positions, VECTORIZE_OPTIONS);
    } // getLineStringVectors
    
    function readCoordinates(coordinates) {
        var count = coordinates.length,
            positions = new Array(count);
            
        // COG.Log.info('read ' + count + ' positions');
            
        for (var ii = count; ii--; ) {
            positions[ii] = new T5.Geo.Position(coordinates[ii][1], coordinates[ii][0]);
        } // for
        
        return positions;
    } // coordinates
    
    /* define the GeoJSON parser */
    
    var GeoJSONParser = function(data, callback, options) {
        options = T5.ex({
            vectorsPerCycle: T5.Geo.VECTORIZE_PER_CYCLE,
            rowPreParse: null,
            targetLayer: null
        }, options);
        
        // initialise variables
        var vectorsPerCycle = options.vectorsPerCycle,
            targetLayer = options.targetLayer,
            rowPreParse = options.rowPreParse,
            featureIndex = 0,
            totalFeatures = 0,
            childWorker = null,
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
        
        function featureToPoly(feature, callback) {
        } // featureToPrimitives

        function processData(tickCount, worker) {
            var cycleCount = 0,
                ii = featureIndex;
                
            // if we have a child worker active, then don't do anything in this worker
            if (childWorker) {
                return;
            }
            
            // COG.Log.info('processing data, featureIndex = ' + featureIndex + ', total features = ' + totalFeatures);
            for (; ii < totalFeatures; ii++) {
                // get the feature data
                // if a row preparser is defined, then use that
                var featureData = rowPreParse ? 
                        rowPreParse(data[ii]) : 
                        data[ii],
                    featureType = featureData.type ? featureData.type.toLowerCase() : null,
                    isCollection = featureType ? 
                        featureType === FEATURE_TYPE_COLLECTION :
                        false,
                    processor = featureProcessors[featureType],
                    processedCount = null;
                
                // COG.Log.info('processing feature ' + ii + ', type = ' + featureData.type + ', id = ' + featureData.id);
                
                // if the processor is defined, then run it
                if (processor) {
                    processedCount = processor(targetLayer, featureData.coordinates);
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
            if (featureIndex >= totalFeatures) {
                worker.trigger('complete');
            } // if
        } // processData
        
        /* run the parser */
        
        // save the total feature count
        totalFeatures = data.length;
        
        // if we don't have a target layer, then create one
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

