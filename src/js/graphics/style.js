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
};

(function() {
    
    // define variables
    var previousStyles = {};
    
    /* define the core styles */
    
    var coreStyles = {
        basic: new T5.Style({
            lineWidth: 1,
            strokeStyle: '#000',
            fillStyle: '#fff'
        }),
        
        waypoints: new T5.Style({
            lineWidth: 4,
            strokeStyle: 'rgba(0, 51, 119, 0.9)',
            fillStyle: '#FFF'
        })        
    };
    
    /* define the apply style function */

    T5.applyStyle = function(context, styleId) {
        var style = T5.styles[styleId] ? T5.styles[styleId] : T5.styles.basic,
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
    };

    T5.loadStyles = function(path, callback) {
        COG.jsonp(path, function(data) {
            T5.resetStyles(data);
        });
    };

    T5.resetStyles = function(data) {
        // initialise variables 
        // NOTE: I'm not calling this a stylesheet on purpose
        var styleGroup = {};

        // iterate through each of the items defined in the retured style definition and create
        // T5 styles
        for (var styleId in data) {
            styleGroup[styleId] = new T5.Style(data[styleId]);
        } // for

        // we have made it this far, so replace the T5.styles object
        T5.styles = T5.ex({}, coreStyles, styleGroup);
    };

    // export the core styles as the styles object (to start with)
    T5.styles = coreStyles;
})();

