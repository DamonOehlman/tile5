/**
# T5.GeoPoly
_extends:_ T5.Poly


This is a special type of T5.Poly that will take positions for the first
argument of the constructor rather than vectors.  If the initialization
parameter `autoParse` is set to true (which it is by default), this will 
parsed by the T5.Geo.Position.parse function and converted into a GeoXY.

## Constructor
`new T5.GeoPoly(positions, params);`

### Initialization Parameters
- autoParse (boolean, default = true) - whether or not the values in the 
positions array that is the first constructor argument should be run through
the T5.Geo.Position.parse function or not.  Note that this function is capable of 
handling both string and T5.Geo.Position values as position values are
simply passed straight through.

*/
var GeoPoly = exports.GeoPoly = function(positions, params) {
    params = COG.extend({
        autoParse: true
    }, params);
    
    // initialise variables
    var vectors = new Array(positions.length),
        autoParse = params.autoParse,
        parse = T5.Geo.Position.parse;

    // iterate through the vectors and convert to geovectors
    for (var ii = positions.length; ii--; ) {
        vectors[ii] = T5.GeoXY.init(
            autoParse ? parse(positions[ii]) : positions[ii]
        );
    } // for
    
    return new T5.Poly(vectors, params);
};