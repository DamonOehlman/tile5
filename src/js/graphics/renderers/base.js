/**
# T5.Renderer
*/
var Renderer = function(view, container, params) {
    
    /* internals */
    
    /* exports */
    
    return {
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
        ### hitTest(drawData, hitX, hitY): boolean
        */
        hitTest: function(drawData, hitX, hitY) {
            return false;
        },

        /**
        ### restore(): void
        Used to restore the rendering context back to the previous state
        */
        restore: function() {
        },
        
        /**
        ### save(): void
        Used to save the current renderer state to a stack
        */
        save: function() {
        }
    };
};

var rendererRegistry = {};

/**
# T5.registerRenderer(id, creatorFn)
*/
var registerRenderer = exports.registerRenderer = function(id, creatorFn) {
    rendererRegistry[id] = creatorFn;
};

/**
# T5.attachRenderer(id, view, container, params)
*/
var attachRenderer = exports.attachRenderer = function(id, view, container, params) {
    // split the id on slashes as multiple renderers may have been requested
    var ids = id.split('/'),
        renderer = new Renderer(view, container, params);
    
    // iterate through the renderers and create the resulting renderer
    for (var ii = 0; ii < ids.length; ii++) {
        var rClass = rendererRegistry[ids[ii]];
        if (rClass) {
            renderer = new rClass(view, container, params, renderer);
        } // if
    } // for
    
    // return the result of combining each of the renderers in order
    return renderer;
};