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
//= require <interact/src/interact>

T5 = (function() {
    //= require "js/math"
    //= require "js/core"
    //= require "js/device"
    //= require "js/images"
    //= require "js/generator"
    //= require "js/zoomable"
    
    //= require "js/graphics/style"
    //= require "js/graphics/viewstate"
    //= require "js/graphics/view"
    //= require "js/graphics/viewlayer"
    //= require "js/graphics/imagelayer"
    
    //= require "js/graphics/marker"
    //= require "js/graphics/imagemarker"
    //= require "js/graphics/markerlayer"
    
    //= require "js/graphics/pathlayer"
    //= require "js/graphics/animatedpathlayer"
    
    //= require "js/graphics/shapes"
    //= require "js/graphics/shapelayer"
    
    //= require "js/tiling/core"
    //= require "js/tiling/tilegenerator"
    
    var exports = {
        ex: COG.extend,
        ticks: ticks,
        getConfig: getConfig,
        userMessage: userMessage,
        
        XY: XY,
        XYRect: XYRect,
        Dimensions: Dimensions,
        Vector: Vector,
        
        // TODO: [0.9.7] REMOVE
        D: Dimensions,
        
        Images: Images,
        
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
        
        // markers
        Marker: Marker,
        ImageMarker: ImageMarker,
        MarkerLayer: MarkerLayer,
        
        // paths
        PathLayer: PathLayer,
        AnimatedPathLayer: AnimatedPathLayer,
        
        // shapes
        Shape: Shape,
        Arc: Arc,
        Poly: Poly,
        ShapeLayer: ShapeLayer,
        
        // tiling
        Tiling: Tiling,
        TileGenerator: TileGenerator
    };
    
    // make T5 observable
    COG.observable(exports);
    
    //= require "tile5.variant"
    
    return exports;
})();