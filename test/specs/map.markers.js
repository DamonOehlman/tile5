describe('map.markers', function() {
    it('should be able to clear a draw layer', function() {
        map.layer('markers').clear();
        expect(map.layer('markers').find().length).toEqual(0);
    });
    
    it('should be able to drop a marker at the center of the map', function() {
        map.layer('markers').create('marker', {
            xy: map.center(),
            markerStyle: 'image',
            imageUrl: 'img/square-marker.png'
        });

        var marker = map.layer('markers').find()[0];
        expect(marker.xy.equals(map.center())).toBeTruthy();
    });
});