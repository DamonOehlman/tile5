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
//= require <cog/src/cog>
//= require <cog/src/timelord>
//= require <cog/src/objectstore>
//= require <cani/src/cani>
//= require <interact/src/interact>

var T5 = {};
(function(exports) {
    //= require "js/animframe"
    
    //= require "js/shorts"
    //= require "js/core"
    //= require "js/imageloader"
    //= require "js/canvasmaker"
    //= require "js/generator"
    
    //= require "js/graphics/renderers/base"
    //= require "js/graphics/renderers/canvas"
    //= require "js/graphics/renderers/dom"
    
    //= require "js/graphics/style"
    //= require "js/graphics/viewstate"
    //= require "js/graphics/view"
    
    //= require "js/graphics/drawables/core"
    //= require "js/graphics/drawables/animation"
    //= require "js/graphics/drawables/helpers"
    //= require "js/graphics/drawables/marker"
    //= require "js/graphics/drawables/poly"
    //= require "js/graphics/drawables/line"
    //= require "js/graphics/drawables/image"
    //= require "js/graphics/drawables/imagemarker"

    //= require "js/graphics/imagegenerator"
    //= require "js/graphics/layers/viewlayer"
    //= require "js/graphics/layers/imagelayer"
    //= require "js/graphics/layers/drawlayer"
    //= require "js/graphics/layers/shapelayer"
    
    COG.extend(exports, {
        ex: COG.extend,
        is: isType,
        ticks: ticks,
        userMessage: userMessage,
        
        XY: XY,
        XYRect: XYRect,
        Dimensions: Dimensions,
        Vector: Vector,
        Hits: Hits,
        
        Generator: Generator,
        
        // animation functions and modules
        tween: COG.tween,
        tweenValue: COG.tweenValue,
        easing: COG.easing,
        Tween: COG.Tween,
        
        // core graphics modules
        viewState: viewState,
        View: View,
        ViewLayer: ViewLayer,
        ImageLayer: ImageLayer,
        ImageGenerator: ImageGenerator,
        
        // shapes
        Drawable: Drawable,
        Marker: Marker,
        Poly: Poly,
        Line: Line,
        ImageDrawable: ImageDrawable,
        ImageMarker: ImageMarker,
        
        DrawLayer: DrawLayer,
        ShapeLayer: ShapeLayer
    });
    
    // make T5 observable
    COG.observable(exports);
    
    //= require "tile5.variant"
})(T5);