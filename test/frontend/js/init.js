var map = null;
var positions = [
        T5.Geo.P.parse('-27.465898569311843, 153.0260968208313'),
        T5.Geo.P.parse('-33.86034874303215, 151.20997309684753'),
        T5.Geo.P.parse('51.80982867245479, -0.025277137756347656'),
        T5.Geo.P.parse('-17.53864183136249, -149.82810974121094')
    ],
    posIndex = 0;

function nextPos() {
    var position = positions[posIndex++];
    
    map.gotoPosition(position, 6);
    map.markers.add(new T5.Marker({
        xy: T5.GeoXY.init(position)
    }));

    posIndex = posIndex % positions.length;
} // nextPos

window.addEventListener("load", function() {
    // create the application 
    map = new T5.Map({
        container: "tiler"
    });
    
    map.setLayer('tiles', new T5.ImageLayer('osm.cloudmade', {
        apikey: "7960daaf55f84bfdb166014d0b9f8d41"
    }));
    
    
    nextPos();
    // setInterval(nextPos, 5000);
}, false);
