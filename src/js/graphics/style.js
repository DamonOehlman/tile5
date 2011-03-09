/**
# T5.Style
The T5.Style module is used to define and apply styles.

## Functions 
*/
var Style = (function() {
    
    // define variables
    var previousStyles = {},
        styles = {};
    
    /* internal functions */
    
    /* exports */
    
    /** 
    ### apply(context, styleId)
    */
    function apply(context, styleId) {
        var style = styles[styleId] ? styles[styleId] : styles.basic,
            previousStyle;
            
        // if we have a context and context canvas, then update the previous style info
        if (context && context.canvas) {
            previousStyle = previousStyles[context.canvas.id];
            previousStyles[context.canvas.id] = styleId;
        } // if

        // apply the style
        style.applyToContext(context);

        // return the previously selected style
        return previousStyle;
    } // apply
    
    /** 
    ### define(styleId, data)
    */
    function define(styleId, data) {
        styles[styleId] = init(data);
        
        return styleId;
    } // define
    
    /**
    ### defineMany(data)
    */
    function defineMany(data) {
        for (var styleId in data) {
            define(styleId, data[styleId]);
        } // for
    } // defineMany
    
    function get(styleId) {
        return styles[styleId];
    } // get
    
    /**
    ### init(params)
    */
    function init(params) {
        params = COG.extend({
            // line styles
            lineWidth: undefined,
            lineCap: undefined,
            lineJoin: undefined,
            miterLimit: undefined,
            lineStyle: undefined,

            // fill styles
            fillStyle: undefined,

            // context globals
            globalAlpha: undefined,
            globalCompositeOperation: undefined
        }, params);

        // initialise variables
        var mods = [];

        /* internal functions */

        function fillMods(keyName) {
            var paramVal = params[keyName];

            if (typeof paramVal !== 'undefined') {
                mods.push(function(context) {
                    context[keyName] = paramVal;
                });
            } // if
        } // fillMods
        
        function reloadMods() {
            mods = [];
            
            for (var keyName in params) {
                fillMods(keyName);
            } // for
        } // reloadMods
        
        /* exports */
        
        function update(keyName, keyVal) {
            params[keyName] = keyVal;
            reloadMods();
        } // update

        /* define _self */

        var _self = {
            applyToContext: function(context) {
                // iterate through the mods and apply to the context
                for (var ii = mods.length; ii--; ) {
                    mods[ii](context);
                } // for
            },
            
            update: update
        };

        /* initialize */

        reloadMods();
        return _self;        
    } // init
    
    /**
    ### load(path, callback)
    */
    function load(path, callback) {
        COG.jsonp(path, function(data) {
            defineMany(data);
        });
    } // load
    
    /* module definition */
    
    var module = {
        apply: apply,
        define: define,
        defineMany: defineMany,
        get: get,
        init: init,
        load: load
    };
    
    // define the core styles
    defineMany({
        basic: {
            lineWidth: 1,
            strokeStyle: '#000',
            fillStyle: '#fff'
        },
        
        waypoints: {
            lineWidth: 4,
            strokeStyle: 'rgba(0, 51, 119, 0.9)',
            fillStyle: '#FFF'
        },

        waypointsHover: {
            lineWidth: 4,
            strokeStyle: '#f00',
            fillStyle: '#FFF'
        }        
    });
    
    return module;
})();
