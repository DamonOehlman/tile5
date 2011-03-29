var SpatialStore = function(cellsize) {
    cellsize = cellsize || 128;
    
    /* internals */
    
    var buckets = [],
        lookup = {};
        
    /* internals */
    
    function getBucket(x, y) {
        var colBuckets = buckets[x],
            rowBucket;
        
        // if the colbucket has not been created, then initialize
        if (! colBuckets) {
            colBuckets = buckets[x] = [];
        } // if
        
        // get the row bucket
        rowBucket = colBuckets[y];
        
        // if the row bucket has not been created, then initialize
        if (! rowBucket) {
            rowBucket = colBuckets[y] = [];
        } // if
        
        return rowBucket;
    } // getBuckets
    
    /* exports */
    
    function insert(rect, data, id) {
        var minX = rect.x / cellsize | 0,
            minY = rect.y / cellsize | 0,
            maxX = (rect.x + rect.w) / cellsize | 0,
            maxY = (rect.y + rect.h) / cellsize | 0;
            
        // if the id is not defined, look for an id within the data
        id = id || data.id || COG.objId('spatial');
            
        // add the data to the lookup
        lookup[id] = data;

        // add the id to the appropriate buckets
        for (var xx = minX; xx <= maxX; xx++) {
            for (var yy = minY; yy <= maxY; yy++) {
                getBucket(xx, yy).push(id);
            } // for
        } // for
    } // insert
    
    function remove(rect, data, id) {
        var minX = rect.x / cellsize | 0,
            minY = rect.y / cellsize | 0,
            maxX = (rect.x + rect.w) / cellsize | 0,
            maxY = (rect.y + rect.h) / cellsize | 0;
            
        // if the id is not defined, look for an id within the data
        id = id || data.id;
        
        // if we have the id, then remove it from the lookup
        delete lookup[id];
        
        // now remove from the spatial store
        for (var xx = minX; xx <= maxX; xx++) {
            for (var yy = minY; yy <= maxY; yy++) {
                var bucket = getBucket(xx, yy),
                    itemIndex = indexOf.call(bucket, id);
                
                // if the item was in the bucket, then splice it out
                if (itemIndex >= 0) {
                    bucket.splice(itemIndex, 1);
                } // if
            } // for
        } // for
    } // remove
    
    function search(rect) {
        var minX = rect.x / cellsize | 0,
            minY = rect.y / cellsize | 0,
            maxX = (rect.x + rect.w) / cellsize | 0,
            maxY = (rect.y + rect.h) / cellsize | 0,
            ids = [],
            results = [];
            
        // get objects from the various buckets
        for (var xx = minX; xx <= maxX; xx++) {
            for (var yy = minY; yy <= maxY; yy++) {
                ids = ids.concat(getBucket(xx, yy));
            } // for
        } // for
        
        // sort the ids
        ids.sort();
        
        // iterate over the ids and get the appropriate objects
        for (var ii = ids.length; ii--; ) {
            var currentId = ids[ii],
                target = lookup[currentId];
                
            // if the target is defined, then add to the results    
            if (target) {
                results[results.length] = target;
            } // if
            
            // now skip ids 
            while (ii > 0 && ids[ii-1] == currentId) { 
                ii--;
            }
        } // for
        
        return results;
    } // search
    
    return {
        insert: insert,
        remove: remove,
        search: search
    };
};