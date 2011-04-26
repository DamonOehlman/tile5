/*jslint white: true, safe: true, onevar: true, undef: true, nomen: true, eqeqeq: true, newcap: true, immed: true, strict: true */

//= require <cani/src/cani>
//= require <cog/cogs/animframe>
//= require <cog/cogs/extend>
//= require <cog/cogs/log>
//= require <cog/cogs/stringtools>
//= require <cog/cogs/tween>
//= require <cog/cogs/observable>
//= require <cog/cogs/configurable>
//= require <cog/cogs/arraytools>
//= require <cog/cogs/typetools>
//= require <cog/cogs/jsonp>
//= require <interact/src/interact>

//= require "core/registry"
//= require "core/messages"
//= require "core/functions"
//= require "core/constants"
//= require "core/shorts"
//= require "core/animator"
//= require "core/parser"
//= require "core/dom"

//= require "core/geo/projections/default"
//= require "core/types/xy"
//= require "core/types/geoxy"
//= require "core/types/rect"

//= require "core/xyfns"
//= require "core/hits"
//= require "core/spatialstore"

//= require "core/images/loader"
//= require "core/images/tile"

//= require "core/renderers/base"
//= require "core/renderers/canvas"
//= require "core/renderers/dom"

//= require "core/graphics/style"
//= require "core/graphics/map"

//= require "core/graphics/drawables/core"
//= require "core/graphics/drawables/animation"
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

// define the tile5 namespace
var T5 = {
    // expose some cog functions
    ex: _extend,
    log: _log,
    observable: _observable,
    formatter: _formatter,
    wordExists: _wordExists,
    is: _is,
    indexOf: _indexOf,
    
    project: _project,
    unproject: _unproject,
    
    userMessage: userMessage,
    
    Registry: Registry,
    Style: Style,
    DOM: DOM,
    Rect: Rect,
    XY: XY,
    Hits: Hits,
    
    // animation functions and modules
    tweenValue: _tweenValue,
    easing: _easing,

    Control: Control,
    Tile: Tile,
    getImage: getImage,
    
    // some of the geo types starting to move up...
    Pos: Pos,
    PosFns: PosFns,
    BBox: BBox    
};

// make T5 observable
_observable(T5);

//= require "core/factory"