/* internals */

var styleRegistry = {};

/**
### createStyle(params)
*/
function createStyle(params) {
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

        if (! isType(paramVal, typeUndefined)) {
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
} // createStyle
    
/* exports */

/**
# T5.defineStyle(id, data)
*/
var defineStyle = exports.defineStyle = function(id, data) {
    styleRegistry[id] = createStyle(data);
    
    return id;
};

/**
# T5.defineStyles(data)
*/
var defineStyles = exports.defineStyles = function(data) {
    for (var styleId in data) {
        defineStyle(styleId, data[styleId]);
    } // for
};

/**
# T5.getStyle(id)
*/
var getStyle = exports.getStyle = function(id) {
    return styleRegistry[id];
}; // getStyle

/**
# T5.loadStyles(path, callback)
*/
var loadStyles = exports.loadStyles = function(path) {
    COG.jsonp(path, function(data) {
        defineStyles(data);
    });
}; // loadStyles

    
// define the core styles
defineStyles({
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