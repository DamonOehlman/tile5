/**
# T5.Style
*/
var Style = (function() {
    
    /* internals */
    
    var styles = {};
    
    function define(p1, p2) {
        if (_is(p1, typeString)) {
            _self.trigger('defined', p1, styles[p1] = p2);
            
            return p1;
        }
        else {
            var ids = [];
            
            for (var styleId in p1) {
                ids[ids.length] = define(styleId, p1[styleId]);
            } // for            
            
            return ids;
        } // if..else
    } // define
    
    function get(id) {
        return styles[id];
    } // get
    
    var _self = _observable({
        get: get,
        define: define
    });
    
    // define the core styles
    define({
        basic: {
            fill: '#ffffff'
        },

        highlight: {
            fill: '#ff0000'
        },

        waypoints: {
            lineWidth: 4,
            stroke: '#003377',
            fill: '#ffffff'
        },

        waypointsHover: {
            lineWidth: 4,
            stroke: '#ff0000',
            fill: '#ffffff'
        }       
    });    
    
    return _self;
})();