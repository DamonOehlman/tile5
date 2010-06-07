/*
File:  slick.canvas.js
This file contains the various modules for implementing layered drawing routines on a HTML5 canvas

Section: Version History
2010.06.03 (DJO) - Created File
*/

SLICK.View = function(args) {
    // initialise defaults
    var DEFAULT_ARGS = {
        container: "",
        fps: 30
    }; // DEFAULT_ARGS
    
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
    // get the container context
    var canvas = jQuery(args.container).get(0);
    var context = null;
    if (canvas) {
        try {
            context = canvas.getContext('2d');
        } 
        catch (e) {
            LOGGER.exception(e);
            throw "Could not initialise canvas on specified tiler element";
        }
    } // if
    
    var redraw_timer = 0;
    var redraw_sleep = Math.floor(1000 / args.fps);

    // initialise self
    var self = {
        getContext: function() {
            return context;
        },
        
        getDimensions: function() {
            // get the jquery wrapper
            var jq_container = jQuery(canvas);
            
            return new SLICK.Dimensions(jq_container.width(), jq_container.height()); 
        },
        
        invalidate: function(force) {
            if (force && context && args.onDraw) {
                args.onDraw(context);
            }
            else if (context && (redraw_timer === 0)) {
                redraw_timer = setTimeout(function() {
                    if (args.onDraw) {
                        args.onDraw(context);
                    } // if
                    
                    redraw_timer = 0;
                }, redraw_sleep); // this redraw time equates to approx 25FPS
            } // if
        }        
    };
    
    return self;
}; // SLICK.Canvas

SLICK.OffscreenCanvas = function(args) {
    // initialise defaults
    var DEFAULT_ARGS = {
        width: 0,
        height: 0
    }; // DEFAULT_ARGS
    
    // update the args with the defaults
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
    // create the canvas
    var buffer_canvas = document.createElement("canvas");
    
    // initialise the canvas size
    buffer_canvas.width = args.width;;
    buffer_canvas.height = args.height;
    
    // calculate the initial aspect ratio
    var init_aspect_ratio = buffer_canvas.height ? (buffer_canvas.width / buffer_canvas.height) : 1;
    
    // initialise self
    var self = {
        width: args.width,
        height: args.height,
        aspect_ratio: init_aspect_ratio,
        inv_aspect_ratio: 1 / init_aspect_ratio,
        
        getCanvas: function() {
            return buffer_canvas;
        },
        
        getContext: function(dimension) {
            if (! dimension) {
                dimension = "2d";
            } // if
            
            return buffer_canvas.getContext(dimension);
        },
        
        drawBackground: function(context, dimensions) {
            // fill the background
            context.fillStyle = "rgb(200, 200, 200)";
            context.fillRect(0, 0, dimensions.width, dimensions.height);
        },
        
        drawToView: function(view) {
            // get the context and dimensions
            var context = view.getContext();
            var dimensions = view.getDimensions();
            
            self.drawBackground(context, dimensions);
            
            // get the scale amount
            var scale_amount = (view.scalable ? view.getScaleAmount() : 0);
            var offset = view.pannable ? view.getOffset() : new SLICK.Vector();
            
            // initialise the destination parameters
            var dst_x = 0;
            var dst_y = 0;
            var dst_width = dimensions.width;
            var dst_height = dimensions.height;
            
            // determine the x_offset and y_offset taking into account the scale
            // TODO: sort this scaling nonsense out
            var src_x = Math.min(Math.max(offset.x + scale_amount, 0), buffer_canvas.width);
            var src_y = Math.min(Math.max(offset.y + scale_amount, 0), buffer_canvas.height);
            var src_width = dimensions.width - (scale_amount * 2);
            var src_height = Math.round(src_width * dimensions.inv_aspect_ratio);
            
            if (src_x < 0 || src_x + src_width > buffer_canvas.width || src_y < 0 || src_y + src_height > buffer_canvas.height) {
                src_width = Math.min(src_width, buffer_canvas.width - src_x);
                src_height = Math.round(src_width * dimensions.inv_aspect_ratio);
                
                // check the src height
                if (src_y + src_height > buffer_canvas.height) {
                    src_height = buffer_canvas.height - src_y;
                    src_width = Math.round(src_height * dimensions.aspect_ratio);
                } // if
                
                // determine the destination positions and height
                dst_width = Math.max(Math.min(dimensions.width + (scale_amount * 2), dimensions.width), 200);
                dst_height = Math.round(dst_width * dimensions.inv_aspect_ratio);
                dst_x = (dimensions.width - dst_width) * 0.5;
                dst_y = (dimensions.height - dst_height) * 0.5;
            } // if
            
            //LOGGER.info(String.format("offset = {0}, scale = {1}", offset, scale_amount));
            //LOGGER.info(String.format("src: x = {0}, y = {1}, width = {2}, height = {3}", src_x, src_y, src_width, src_height));
            //LOGGER.info(String.format("dst: x = {0}, y = {1}, width = {2}, height = {3}", dst_x, dst_y, dst_width, dst_height));
            
            // draw the sliced tile grid to the canvas
            context.drawImage(
                buffer_canvas, // the source canvas
                src_x, // the source x, y, width and height
                src_y, 
                src_width,
                src_height,
                dst_x, // the dest x, y, width and height
                dst_y,
                dst_width,
                dst_height);
        }        
    }; // self
    
    return self;
}; // SLICK.DrawLayer

