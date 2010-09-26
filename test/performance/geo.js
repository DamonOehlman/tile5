(function() {
    var TEST_RADS_PER_PIXEL = 0.000023968449810713143;
    
    var position,
        geohash,
        encodeFn = T5.Geo.GeoHash.encode,
        screenX, screenY;
    
    
    function parsePosition() {
        position = T5.Geo.P.parse('-27.468 153.028');
    } // testParsePosition
    
    
    function geohashPosition() {
        geohash = T5.Geo.GeoHash.encode(position);
    }
    
    function geohashPositionFnPointer() {
        geohash = encodeFn(position);
    }
    
    function decodeGeohash() {
        T5.Geo.GeoHash.decode(geohash);
    }
    
    function positionToPixels() {
        screenX = T5.Geo.lat2pix(position.lat) / TEST_RADS_PER_PIXEL;
        screenY = T5.Geo.lon2pix(position.lon) / TEST_RADS_PER_PIXEL;
    }
    
    function pixelsToPos() {
        position = new T5.Geo.Position(
            T5.Geo.pix2lat(screenY * TEST_RADS_PER_PIXEL), 
            T5.Geo.pix2lon(screenX * TEST_RADS_PER_PIXEL));
    }
    
    JSLitmus.test('Parse position', parsePosition);
    JSLitmus.test('Geohash parsed position', geohashPosition);
    JSLitmus.test('Geohash parsed position (fn pointer)', geohashPositionFnPointer);
    JSLitmus.test('Decode geohash', decodeGeohash);
    JSLitmus.test('Position to Pixels', positionToPixels);
    JSLitmus.test('Pixels to Position', pixelsToPos);
})();