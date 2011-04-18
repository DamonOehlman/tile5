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
    // make T5 observable
    COG.observable(exports);
    
    //= require "js/animframe"
    
    //= require "js/functions"
    //= require "js/shorts"
    //= require "js/canvasmaker"
    //= require "js/generator"
    //= require "js/service"
    
    //= require "js/core/xy"
    //= require "js/core/rect"
    //= require "js/core/xyfns"
    //= require "js/core/vector"
    //= require "js/core/xyrect"
    //= require "js/core/hits"
    //= require "js/core/spatialstore"
    //= require "js/core/domtools"
    
    //= require "js/images/loader"
    //= require "js/images/tile"
    
    //= require "js/graphics/renderers/base"
    //= require "js/graphics/renderers/canvas"
    //= require "js/graphics/renderers/dom"
    
    //= require "js/graphics/style"
    //= require "js/graphics/viewstate"
    //= require "js/graphics/view"
    //= require "js/graphics/map"
    
    //= require "js/graphics/drawables/core"
    //= require "js/graphics/drawables/animation"
    //= require "js/graphics/drawables/marker"
    //= require "js/graphics/drawables/poly"
    //= require "js/graphics/drawables/line"
    //= require "js/graphics/drawables/image"
    //= require "js/graphics/drawables/imagemarker"
    //= require "js/graphics/drawables/arc"

    //= require "js/graphics/layers/viewlayer"
    //= require "js/graphics/layers/tilelayer"
    //= require "js/graphics/layers/drawlayer"
    //= require "js/graphics/layers/shapelayer"
    
    //= require "js/geo/types/pos"
    
    COG.extend(exports, {
        ex: COG.extend,
        is: isType,
        ticks: ticks,
        userMessage: userMessage,
        indexOf: indexOf,
        
        Rect: Rect,
        XY: XYFns,
        XYRect: XYRect,
        Vector: Vector,
        Hits: Hits,
        
        Generator: Generator,
        Service: Service,
        
        // animation functions and modules
        tweenValue: COG.tweenValue,
        easing: COG.easing,
        
        // images
        Tile: Tile,
        TileLayer: TileLayer,
        getImage: getImage,
        
        // core graphics modules
        viewState: viewState,
        View: View,
        ViewLayer: ViewLayer,
        ImageLayer: TileLayer,
        
        // shapes
        Drawable: Drawable,
        Marker: Marker,
        Poly: Poly,
        Line: Line,
        Arc: Arc,
        ImageDrawable: ImageDrawable,
        ImageMarker: ImageMarker,
        
        DrawLayer: DrawLayer,
        ShapeLayer: ShapeLayer,
        
        Map: Map,
        
        // some of the geo types starting to move up...
        Pos: Pos
    });
    
    //= require "js/geo/constants"
    //= require "js/geo/functions"

    //= require "js/geo/types/position"
    //= require "js/geo/types/boundingbox"
    //= require "js/geo/types/radius"
    //= require "js/geo/types/address"
    //= require "js/geo/types/geoxy"
    
    //= require "js/geo/geojson"

    //= require "js/geo/ui/geopoly"
    
    // define the geo functionality
    exports.Geo = {
        distanceToString: distanceToString,
        dist2rad: dist2rad,
        radsPerPixel: radsPerPixel,

        Position: Position,
        BoundingBox: BoundingBox,
        Radius: Radius,
        
        Address: Address,
        A: addrTools,
        
        GeoJSON: GeoJSON
    };
})(T5);