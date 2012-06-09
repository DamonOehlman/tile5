"use strict"

// req: shim[js#Array.indexOf]
// req: cog[fn#extend, fn#easing, fn#log, fn#observable, fn#configurable, fn#jsonp]
// req: eve, sniff, formatter, interact, geojs

/**
# T5(target, settings, viewId)
*/
function T5(target, settings) {
    settings = cog.extend({
        container: target,
        type: 'map',
        renderer: 'canvas',
        starpos: null,
        zoom: 1,
        fastpan: false,
        drawOnScale: true,
        zoombar: {}
    }, settings);
    
    // create the view
    return regCreate('view', settings.type, settings);
} // Tile5

// define T5
cog.observable(T5);

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

//= engines/osm

/**
# T5

## Methods
*/
cog.extend(T5, cog, {
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
    
    Control: Control,
    Tile: Tile,
    Tweener: Tweener,

    ViewLayer: ViewLayer,
    View: View,
    Map: Map
});