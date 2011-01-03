/**
# T5.Geo
The Geo module contains classes and functionality to support geospatial 
operations and calculations that are required when drawing maps, routes, etc.

## Functions
*/
var Geo = exports.Geo = (function() {
    //= require "js/geo/constants"
    //= require "js/geo/functions"
    
    //= require "js/geo/types/position"
    //= require "js/geo/types/boundingbox"
    //= require "js/geo/types/radius"
    //= require "js/geo/types/address"
    //= require "js/geo/types/geoxy"
    
    //= require "js/geo/types/engine"
    
    //= require "js/geo/search/search"
    //= require "js/geo/search/searchresult"
    //= require "js/geo/search/geolocation"
    
    //= require "js/geo/routing"
    
    //= require "js/geo/geojson"

    //= require "js/geo/ui/map"
    //= require "js/geo/ui/maptilegenerator"
    //= require "js/geo/ui/geopoly"
    //= require "js/geo/ui/routeoverlay"
    //= require "js/geo/ui/locationoverlay"
    
    return {
        distanceToString: distanceToString,
        dist2rad: dist2rad,
        getEngine: getEngine,

        lat2pix: lat2pix,
        lon2pix: lon2pix,
        pix2lat: pix2lat,
        pix2lon: pix2lon,

        radsPerPixel: radsPerPixel,

        Position: Position,
        BoundingBox: BoundingBox,
        Radius: Radius,
        
        Address: Address,
        A: addrTools,
        
        // TODO: probably need to include local support for addressing, but really don't want to bulk out T5 :/

        GeocodeFieldWeights: {
            streetDetails: 50,
            location: 50
        },

        AddressCompareFns: {
        },
                
        Engine: GeoEngine,
        
        Search: Search,
        GeoSearchResult: GeoSearchResult,
        LocationSearch: LocationSearch,
        
        Routing: Routing
    };
})();