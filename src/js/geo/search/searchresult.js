/**
# T5.Geo.GeoSearchResult

TODO
*/
var GeoSearchResult = function(params) {
    params = COG.extend({
        id: null,
        caption: "",
        resultType: "",
        data: null,
        pos: null,
        matchWeight: 0
    }, params);
    
    return COG.extend(params, {
        toString: function() {
            return params.caption + (params.matchWeight ? " (" + params.matchWeight + ")" : "");
        }
    });
};