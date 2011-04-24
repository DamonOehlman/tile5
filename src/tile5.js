/*!
 * Sidelab Tile5 Javascript Library v<%= T5_VERSION %>
 * http://tile5.org/
 *
 * Copyright 2010, <%= T5_AUTHOR %>
 * Licensed under the MIT licence
 * https://github.com/sidelab/tile5/blob/master/LICENSE.mdown
 *
 * Build Date: @DATE
 */
 
/*jslint white: true, safe: true, onevar: true, undef: true, nomen: true, eqeqeq: true, newcap: true, immed: true, strict: true */

// TODO: replace with a github dependency once getjs is done

(function(exports) {
    //= require <cani/src/cani>
    //= require <cog/cogs/animframe>
    //= require <cog/cogs/extend>
    //= require <cog/cogs/log>
    //= require <cog/cogs/stringtools>
    //= require <cog/cogs/tween>
    //= require <cog/cogs/observable>
    //= require <cog/cogs/arraytools>
    //= require <cog/cogs/typetools>
    //= require <cog/cogs/jsonp>
    //= require <interact/src/interact>
    
    // define the tile5 namespace
    var T5 = {
        // expose some cog functions
        ex: _extend,
        log: _log,
        observable: _observable,
        formatter: _formatter,
        wordExists: _wordExists,
        is: _is,
        indexOf: _indexOf
    };
    
    // make T5 observable
    _observable(T5);
    
    //= require "core/registry"
    //= require "core/messages"
    //= require "core/functions"
    //= require "core/shorts"
    //= require "core/canvasmaker"
    //= require "core/service"
    
    //= require "core/dom"
    //= require "core/xy"
    //= require "core/rect"
    //= require "core/xyfns"
    //= require "core/vector"
    //= require "core/xyrect"
    //= require "core/hits"
    //= require "core/spatialstore"
    
    //= require "core/images/loader"
    //= require "core/images/tile"
    
    //= require "core/graphics/renderers/base"
    //= require "core/graphics/renderers/canvas"
    //= require "core/graphics/renderers/dom"
    
    //= require "core/graphics/style"
    
    //= require "core/graphics/views/view"
    //= require "core/graphics/views/map"
    
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
    
    //= require "core/geo/pos"
    //= require "core/geo/geoxy"
    
    _extend(T5, {
        ticks: ticks,
        userMessage: userMessage,
        
        Registry: Registry,
        DOM: DOM,
        Rect: Rect,
        XY: XYFns,
        XYRect: XYRect,
        Vector: Vector,
        Hits: Hits,
        
        Service: Service,
        
        // animation functions and modules
        tweenValue: _tweenValue,
        easing: _easing,
        
        // images
        Tile: Tile,
        getImage: getImage,
        
        // some of the geo types starting to move up...
        GeoXY: GeoXY,
        Pos: Pos
    });
    
    //= require "core/geo/constants"
    //= require "core/geo/functions"

    //= require "core/geo/position"
    //= require "core/geo/boundingbox"
    //= require "core/geo/address"
    
    //= require "core/geo/osm"
    //= require "core/geo/geojson"

    // define the geo functionality
    T5.Geo = {
        Address: Address,
        A: addrTools,
        
        GeoJSON: GeoJSON
    };
    
    //= require "core/factory"
    exports.T5 = T5;
    exports.Tile5 = Tile5;
})(window);