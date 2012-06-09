T5.GeoJSONParser = function(params) {
    params = T5.ex({
        generalizer: null
    }, params);
    
    // internals
    
    var generalizer = params.generalizer,
        reMulti = /^multi(.*)$/i,
        handlers = {
            linestring: line,
            point: point,
            polygon: poly
        };

    function asPositions(coords) {
        var positions = [];
        
        for (var ii = coords.length; ii--; ) {
            positions[ii] = new GeoJS.Pos(coords[ii][1], coords[ii][0]);
        } // for
        
        return generalizer ? generalizer(positions) : positions;
    } // asPoints
    
    function line(coordinates, properties) {
        _this.trigger('line', T5.ex({
            points: asPositions(coordinates)
        }, properties));
    } // line
    
    function point(coordinates, properties) {
        _this.trigger('marker', T5.ex({
            xy: new T5.GeoXY(new GeoJS.Pos(coordinates[1], coordinates[0]))
        }, properties));
    } // point

    // TODO: properly handle multiple linearrings
    function poly(coordinates, properties) {
        _this.trigger('poly', T5.ex({
            points: asPositions(coordinates[0])
        }, properties));
    } // poly
    
    // exports
    
    function run(data) {
        var ii;
        
        if (!data || !data.type) {
            return;
        } // if
        
        switch (data.type.toLowerCase()) {
            case 'featurecollection': {
                var features = data.features || [];
                for (ii = features.length; ii--; ) {
                    run(features[ii]);
                } // for
            } // featurecollection
            
            default: {
                if (! data.geometry) {
                    return;
                } // if
                
                var geomType = (data.geometry.type || '').toLowerCase(),
                    multiMatch = reMulti.exec(geomType),
                    coordinates = data.geometry.coordinates || [],
                    handler = handlers[geomType];
                    
                if (multiMatch) {
                    handler = handlers[multiMatch[1]];
                    
                    for (ii = coordinates.length; handler && ii--; ) {
                        handler(coordinates[ii], data.properties);
                    } // for
                }
                else if (handler) {
                    handler(coordinates, data.properties);
                } // if..else
            }
        } // switch
    } // run
    
    var _this = {
        run: run
    };
    
    return T5.observable(_this);
};