/**
# T5.Style

## Methods
*/
var Style = (function() {
    
    /* internals */
    
    var styles = {};
    
    /**
    ### define()
    
    The define method can be used in two ways.  Firstly, you can use the
    method to define a single new style:
    
    ```js
    var styleId = T5.Style.define('new-style', {
        fill: '#FF0000',
        opacity: 0.8
    });
    ```
    
    Additionally, instead of passing through a single style definition you 
    can pass through multiple definitions in a single hit:
    
    ```js
    T5.Style.define({
        blueStyle: {
            fill: '#0000FF'
        },
        greenStyle: {
            fill: '#00FF00'
        }
    });
    */
    function define(p1, p2) {
        if (sniff(p1) == 'string') {
            T5.trigger('styleDefined', p1, styles[p1] = p2);
            
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
    
    /**
    ### each(callback)
    */
    function each(callback) {
        for (var id in styles) {
            callback(id, styles[id]);
        } // for
    } // each
    
    /** 
    ### get(id)
    */
    function get(id) {
        return styles[id];
    } // get
    
    // define the core styles
    define({
        reset: {
            fill: '#ffffff',
            opacity: 1.0
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
    
    return {
        resetStyle: STYLE_RESET,
        
        each: each,
        get: get,
        define: define
    };
})();