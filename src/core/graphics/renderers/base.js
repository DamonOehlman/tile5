/**
# T5.Renderer

## Events
Renderers fire the following events:

### detach

### predraw

### render

### reset

*/
var Renderer = function(view, container, outer, params) {
    
    /* internals */
    
    /* exports */
    
    var _this = {
        fastpan: true,
        
        /**
        ### applyStyle(style: T5.Style): string
        */
        applyStyle: function(style) {
        },
        
        /**
        ### applyTransform(drawable: T5.Drawable, offsetX: int, offsetY: int)
        */
        applyTransform: function(drawable, offsetX, offsetY) {
            return {
                restore: null,
                x: offsetX,
                y: offsetY
            };
        },
        
        checkSize: function() {
        },

        /**
        ### getDimensions()
        */
        getDimensions: function() {
            return {
                width: 0,
                height: 0
            };
        },

        /**
        ### getOffset()
        */
        getOffset: function() {
            return new XY();
        },

        /**
        ### getViewport()
        */
        getViewport: function() {
        },

        /**
        ### hitTest(drawData, hitX, hitY): boolean
        */
        hitTest: function(drawData, hitX, hitY) {
            return false;
        },
        
        /**
        ### prepare(layers, tickCount, hitData)
        */
        prepare: function(layers, tickCount, hitData) {
        },
        
        /**
        ### projectXY(srcX, srcY)
        This function is optionally implemented by a renderer to manually take
        care of projecting an x and y coordinate to the target drawing area. 
        */
        projectXY: null,

        /**
        ### reset()
        */
        reset: function() {
        }
    };
    
    return _observable(_this);
};

/**
# T5.attachRenderer(id, view, container, params)
*/
var attachRenderer = T5.attachRenderer = function(id, view, container, outer, params) {
    // split the id on slashes as multiple renderers may have been requested
    var ids = id.split('/'),
        renderer = new Renderer(view, container, outer, params);
    
    // iterate through the renderers and create the resulting renderer
    for (var ii = 0; ii < ids.length; ii++) {
        renderer = regCreate('renderer', ids[ii], view, container, outer, params, renderer);
    } // for
    
    // return the result of combining each of the renderers in order
    return renderer;
};