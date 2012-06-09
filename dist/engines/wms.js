T5.Generator.register('osm.wms', function(params) {
    params = cog.extend({ 
        extent: [-90, -180, 90, 180], 
        mapurl: "" 
    }, params);
    
    /* internals */
    
    var minLat = params.extent[0] || -90,
        minLon = params.extent[1] || -180,
        maxLat = params.extent[2] || 90,
        maxLon = params.extent[3] || 180,
        dlat = maxLat - minLat,
        dlon = maxLon - minLon; 

    function tileToExtent(x, y, zoomLevel, numTiles) {
        var ddlat = dlat / numTiles,
            ddlon = dlon / numTiles,
            llat = ddlon * x + minLat,
            tlon = maxLon - y * ddlon,
            tlat = llat + ddlon,
            llon = tlon - ddlon;

        return llat + "," + llon + "," + tlat + "," + tlon; 
    } // tileToExtend

    return cog.extend(new T5.Geo.OSM.Generator(params), { 
        buildTileUrl: function(tileX, tileY, zoomLevel, numTiles) { 
            return params.mapurl + "&BBOX=" + tileToExtent(tileX, tileY, zoomLevel, numTiles); 
        } 
    }); 
});