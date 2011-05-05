/*jslint white: true, safe: true, onevar: true, undef: true, nomen: true, eqeqeq: true, newcap: true, immed: true, strict: true */

//= require <cog/cogs/extend>
//= require <cog/cogs/log>
//= require <cog/cogs/stringtools>
//= require <cog/cogs/easing>
//= require <cog/cogs/observable>
//= require <cog/cogs/configurable>
//= require <cog/cogs/arraytools>
//= require <cog/cogs/typetools>
//= require <cog/cogs/jsonp>
//= require <interact/src/interact>

// define T5
var T5 = _observable({});

//= require "core/registry"
//= require "core/messages"
//= require "core/functions"
//= require "core/constants"
//= require "core/shorts"
//= require "core/animator"
//= require "core/parser"
//= require "core/dom"
//= require "core/runner"

//= require "core/geo/projections/default"
//= require "core/types/xy"
//= require "core/types/line"
//= require "core/types/geoxy"
//= require "core/types/rect"

//= require "core/hits"
//= require "core/spatialstore"

//= require "core/images/loader"
//= require "core/images/tile"

//= require "core/renderers/base"
//= require "core/renderers/canvas"
//= require "core/renderers/dom"

//= require "core/graphics/style"
//= require "core/graphics/view"
//= require "core/graphics/map"
//= require "core/graphics/tweener"

//= require "core/graphics/drawables/core"
//= require "core/graphics/drawables/marker"
//= require "core/graphics/drawables/poly"
//= require "core/graphics/drawables/line"
//= require "core/graphics/drawables/image"
//= require "core/graphics/drawables/arc"

//= require "core/graphics/layers/viewlayer"
//= require "core/graphics/layers/tilelayer"
//= require "core/graphics/layers/drawlayer"

//= require "core/controls/base"
//= require "core/controls/zoombar"

//= require "core/geo/pos"
//= require "core/geo/posfns"
//= require "core/geo/bbox"
//= require "core/geo/distance"

/**
# T5

## Methods
*/
_extend(T5, {
    // expose some cog functions
    ex: _extend,
    log: _log,
    observable: _observable,
    configurable: _configurable,
    formatter: _formatter,
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
    userMessage: userMessage,
    
    Registry: Registry,
    Style: Style,
    DOM: DOM,
    Rect: Rect,
    XY: XY,
    Line: Line,
    Pos: Pos,
    BBox: BBox,
    Distance: Distance,
    Hits: Hits,
    
    Control: Control,
    Tile: Tile,
    Tweener: Tweener
});

//= require "core/factory"