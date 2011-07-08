T5.GeoJSONParser = function() {

    function asPositions(coords) {
        var positions = [];

        for (var ii = coords.length; ii--; ) {
            positions[ii] = new GeoJS.Pos(coords[ii][1], coords[ii][0]);
        } // for

        return positions;
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

    function poly(coordinates, properties) {
        _this.trigger('poly', T5.ex({
            points: asPositions(coordinates[0])
        }, properties));
    } // poly


    function run(data) {
        var ii;

        if (! data.type) {
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
                    coordinates = data.geometry.coordinates || [];

                switch (geomType) {
                    case 'point': {
                        point(coordinates, data.properties);
                    }

                    case 'linestring': {
                        line(coordinates, data.properties);
                    } // line

                    case 'polygon': {
                        poly(coordinates, data.properties);
                    }

                    case 'multipoint': {
                        for (ii = coordinates.length; ii--; ) {
                            point(coordinates[ii], data.properties);
                        } // for
                    } // multipoint

                    case 'multilinestring': {
                        for (ii = coordinates.length; ii--; ) {
                            line(coordinates[ii], data.properties);
                        } // for
                    }

                    case 'multipolygon': {
                        for (ii = coordinates.length; ii--; ) {
                            poly(coordinates[ii], data.properties);
                        } // for
                    }
                } // switch
            }
        } // switch
    } // run

    var _this = {
        run: run
    };

    return T5.observable(_this);
};
