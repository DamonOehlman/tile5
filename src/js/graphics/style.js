/**
# T5.Style
The T5.Style module is used to define and apply styles.

## Functions 
*/
T5.Style = (function() {
    
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
    
    /**
    ### init(params)
    */
    function init(params) {
        params = T5.ex({
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

        /* define self */

        var self = {
            applyToContext: function(context) {
                // iterate through the mods and apply to the context
                for (var ii = mods.length; ii--; ) {
                    mods[ii](context);
                } // for
            }
        };

        /* initialize */

        for (var keyName in params) {
            fillMods(keyName);
        } // for


        return self;        
    } // init
    
    /**
    ### load(path, callback)
    */
    function load(path, callback) {
        COG.jsonp(path, function(data) {
            T5.resetStyles(data);
        });
    } // load
    
    /* module definition */
    
    var module = {
        apply: apply,
        define: define,
        defineMany: defineMany,
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
        }        
    });
    
    return module;
})();
