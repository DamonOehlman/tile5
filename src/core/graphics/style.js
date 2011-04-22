var styleRegistry = T5.styles = {};

/**
# T5.defineStyle(id, data)
*/
var defineStyle = T5.defineStyle = function(id, data) {
    styleRegistry[id] = data;
    
    // fire the define style event
    T5.trigger('styleDefined', id, styleRegistry[id]);
    
    return id;
};

/**
# T5.defineStyles(data)
*/
var defineStyles = T5.defineStyles = function(data) {
    for (var styleId in data) {
        defineStyle(styleId, data[styleId]);
    } // for
};

/**
# T5.getStyle(id)
*/
var getStyle = T5.getStyle = function(id) {
    return styleRegistry[id];
}; // getStyle

/**
# T5.loadStyles(path, callback)
*/
var loadStyles = T5.loadStyles = function(path) {
    _jsonp(path, function(data) {
        defineStyles(data);
    });
}; // loadStyles

    
// define the core styles
defineStyles({
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