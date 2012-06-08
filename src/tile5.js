/*jslint white: true, safe: true, onevar: true, undef: true, nomen: true, eqeqeq: true, newcap: true, immed: true, strict: true */

// req: shim[js#Array.forEach]
// req: cog[fn#extend, fn#easing, fn#log, fn#observable, fn#configurable]
// req: sniff, formatter, interact, geojs

//= cog!jsonp

// define T5
var T5 = this.T5 = cog.observable({});

//= core/registry
//= core/messages
//= core/functions
//= core/constants
//= core/shorts
//= core/animator
//= core/parser
//= core/dom
//= core/runner

//= core/geo/projections/default
//= core/types/xy
//= core/types/line
//= core/types/geoxy
//= core/types/rect

//= core/hits
//= core/spatialstore

//= core/images/loader
//= core/images/tile

//= core/renderers/base
//= core/renderers/canvas
//= core/renderers/dom

//= core/graphics/style
//= core/graphics/view
//= core/graphics/map
//= core/graphics/tweener

//= core/graphics/drawables/core
//= core/graphics/drawables/marker
//= core/graphics/drawables/poly
//= core/graphics/drawables/line
//= core/graphics/drawables/image
//= core/graphics/drawables/arc

//= core/graphics/layers/viewlayer
//= core/graphics/layers/tilelayer
//= core/graphics/layers/drawlayer

//= core/controls/base
//= core/controls/zoombar
//= core/controls/copyright

/**
# T5

## Methods
*/
cog.extend(T5, {
    // expose some cog functions
    ex: cog.extend,
    log: _log,
    observable: _observable,
    configurable: _configurable,
    wordExists: _wordExists,
    is: _is,
    indexOf: _indexOf,
    
    /**
    ### fn(name)
    */
    fn: function(name) {
        return regGet('fn', name);
    },
    
    project: _project,
    unproject: _unproject,
    
    getImage: getImage,
    
    Registry: Registry,
    Style: Style,
    DOM: DOM,
    Rect: Rect,
    XY: XY,
    GeoXY: GeoXY,
    Line: Line,
    Hits: Hits,
    
    Control: Control,
    Tile: Tile,
    Tweener: Tweener,

    ViewLayer: ViewLayer,
    View: View,
    Map: Map
});

// support commonJS exports
if (typeof module != 'undefined' && module.exports) {
    module.exports = T5;
} // if

//= core/factory