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
    
    //= require "js/math"
    //= require "js/core"
    //= require "js/device"
    //= require "js/imageloader"
    //= require "js/canvasmaker"
    //= require "js/generator"
    
    //= require "js/graphics/style"
    //= require "js/graphics/viewstate"
    //= require "js/graphics/view"
    //= require "js/graphics/viewlayer"
    //= require "js/graphics/imagelayer"
    //= require "js/graphics/imagegenerator"
    
    //= require "js/graphics/drawable"
    //= require "js/graphics/drawables/helpers"
    //= require "js/graphics/drawables/marker"
    //= require "js/graphics/drawables/poly"
    //= require "js/graphics/drawables/line"
    //= require "js/graphics/drawables/image"
    //= require "js/graphics/drawables/imagemarker"

    //= require "js/graphics/drawlayer"
    //= require "js/graphics/shapelayer"
    
    //= require "js/tiling/core"
    
    COG.extend(exports, {
        ex: COG.extend,
        ticks: ticks,
        getConfig: getConfig,
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
        Style: Style,
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
        ShapeLayer: ShapeLayer,
        
        // mixins
        transformable: transformable,
        
        // tiling
        Tiling: Tiling
    });
    
    // make T5 observable
    COG.observable(exports);
    
    //= require "tile5.variant"
})(T5);