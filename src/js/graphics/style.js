var styleRegistry = exports.styles = {};

/**
# T5.defineStyle(id, data)
*/
var defineStyle = exports.defineStyle = function(id, data) {
    styleRegistry[id] = data;
    
    // fire the define style event
    exports.trigger('styleDefined', id, styleRegistry[id]);
    
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
        fill: '#000000'
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