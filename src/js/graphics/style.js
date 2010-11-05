/**
# Style

*/
T5.Style = function(params) {
    params = T5.ex({
        // line styles
        lineWidth: undefined,
        lineCap: undefined,
        lineJoin: undefined,
        miterLimit: undefined,
        lineStyle: undefined,

        // fill styles
        fillStyle: undefined
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
};

/* define the apply style function */

T5.applyStyle = function(context, styleId) {
    COG.Log.info('applying style: ' + styleId);
    var style = T5.styles[styleId] ? T5.styles[styleId] : T5.styles.basic;

    // apply the style
    style.applyToContext(context);
};

/* define the style library */

T5.styles = (function() {
    
    var basicStyle = new T5.Style({
            lineWidth: 1,
            strokeStyle: '#000',
            fillStyle: '#fff'
        }),
        
        grassStyle = new T5.Style({
            lineWidth: 1,
            strokeStyle: 'rgb(0, 255, 0)',
            fillStyle: 'rgba(0, 255, 0, 0.3)'
        });
    
    return {
        basic: basicStyle,
        grass: grassStyle
    };
})();