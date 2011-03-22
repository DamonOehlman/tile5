registerRenderer('canvas', function(view, container, params, baseRenderer) {
    params = COG.extend({
    }, params);
    
    /* internals */
    
    var flashPolyfill = typeof FlashCanvas != 'undefined',
        vpWidth,
        vpHeight,
        canvas,
        context,
        viewport,
        drawOffsetX = 0,
        drawOffsetY = 0,
        transform = null,
        previousStyles = {},
        
        drawFn = function(fill) {
            
        };
        
    function drawTile(tile, x, y) {
        if (tile.image) {
            context.drawImage(tile.image, x, y);
        }
        else if (! tile.loading) {
            tile.loading = true;
            
            getImage(tile.url, function(image, loaded) {
                tile.image = image;
                tile.loading = false;

                // draw the image in the new location
                context.drawImage(image, tile.screenX, tile.screenY);
            });
        } // if..else        
    } // drawTile
        
    function createCanvas() {
        if (container) {
            // initialise the viewport height and width
            vpWidth = view.width = container.offsetWidth;
            vpHeight = view.height = container.offsetHeight;

            // create the canvas
            canvas = newCanvas(vpWidth, vpHeight);
            canvas.style.cssText = 'position: absolute; z-index: 1;';
            context = null;
            
            // add the canvas to the container
            container.appendChild(canvas);
        } // if
    } // createCanvas
    
    /* exports */
    
    function applyStyle(styleId) {
        var nextStyle = getStyle(styleId),
            previousStyle = nextStyle && context && context.canvas ? 
                previousStyles[context.canvas.id] : 
                null;

        if (nextStyle) {
            // if we have a style change then make the change
            previousStyles[context.canvas.id] = styleId;

            // apply the style
            nextStyle.applyToContext(context);

            // return the previously selected style
            return previousStyle;        
        } // if
    } // applyStyle
    
    function applyTransform(drawable) {
        var translated = drawable.translateX || drawable.translateY,
            transformed = translated || drawable.scaling !== 1 || drawable.rotatation;
            
        if (transformed) {
            context.save();
            
            // initialise the transform
            transform = {
                undo: function() {
                    context.restore();
                    transform = null;
                },
                
                x: drawable.xy.x,
                y: drawable.xy.y
            };
            
            context.translate(
                drawable.xy.x - drawOffsetX + drawable.translateX, 
                drawable.xy.y - drawOffsetY + drawable.translateY
            );

            if (drawable.rotation !== 0) {
                context.rotate(drawable.rotation);
            } // if

            if (drawable.scaling !== 1) {
                context.scale(drawable.scaling, drawable.scaling);
            } // if
        } // if
        
        return transform;
    } // applyTransform
    
    function arc(x, y, radius, startAngle, endAngle) {
        context.beginPath();
        context.arc(
            x - (transform ? transform.x : drawOffsetX),
            y - (transform ? transform.y : drawOffsetY),
            radius,
            startAngle,
            endAngle,
            false
        );
        
        return {
            draw: function(viewX, viewY, state) {
                context.fill();
                context.stroke();
            }
        };
    } // arc
    
    function drawTiles(tiles) {
        var tile,
            inViewport,
            offsetX = transform ? transform.x : drawOffsetX,
            offsetY = transform ? transform.y : drawOffsetY,
            minX = offsetX - 256,
            minY = offsetY - 256,
            maxX = offsetX + vpWidth,
            maxY = offsetY + vpHeight,
            relX, relY;
            
        for (var ii = tiles.length; ii--; ) {
            tile = tiles[ii];
            
            // check whether the image is in the viewport or not
            inViewport = tile.x >= minX && tile.x <= maxX && 
                tile.y >= minY && tile.y <= maxY;
                
            // calculate the image relative position
            relX = tile.screenX = tile.x - offsetX;
            relY = tile.screenY = tile.y - offsetY;

            // show or hide the image depending on whether it is in the viewport
            if (inViewport) {
                drawTile(tile, relX, relY);
            } // if
        } // for
    } // drawTiles
    
    function image(image, x, y, width, height) {
        var realX = x - (transform ? transform.x : drawOffsetX),
            realY = y - (transform ? transform.y : drawOffsetY);
        
        // open the path for hit tests
        context.beginPath();
        context.rect(realX, realY, width, height);
        
        return {
            draw: function(viewX, viewY, state) {
                context.drawImage(image, realX, realY, width, height);
            }
        };
    } // image    
    
    function prepare(layers, state, tickCount, hitData) {
        var ii,
            canClip = false,
            viewOffset = view.getOffset(),
            scaleFactor = view.getScaleFactor(),
            viewX = viewOffset.x,
            viewY = viewOffset.y;
            
        // if we already have a context, then restore
        if (context) {
            context.restore();
        }
        else {
            // get the context
            context = canvas.getContext('2d');
        } // if..else
        
        // check to see if we can clip
        for (ii = layers.length; ii--; ) {
            canClip = canClip || layers[ii].clip;
        } // for

        // initialise the viewport
        viewport = XYRect.init(viewX, viewY, viewX + vpWidth, viewY + vpHeight);
        viewport.scaleFactor = scaleFactor;
        
        // if we are scaling, then scale the viewport
        if (scaleFactor !== 1) {
            viewport = XYRect.buffer(
                viewport, 
                vpWidth / scaleFactor >> 1,
                vpHeight / scaleFactor >> 1
            );
        } // if
        
        // update the offset x and y
        drawOffsetX = viewport.x1 - (viewport.width >> 1);
        drawOffsetY = viewport.y1 - (viewport.height >> 1);
        
        if (context) {
            // if we can't clip then clear the context
            if (! canClip) {
                context.clearRect(0, 0, vpWidth, vpHeight);
            } // if

            // save the context
            context.save();
            
            // scale the context
            context.scale(scaleFactor, scaleFactor);
        } // if
        
        // initialise the composite operation
        context.globalCompositeOperation = 'source-over';

        return context;
    } // prepare
    
    function path(points) {
        var first = true,
            offsetX = transform ? transform.x : drawOffsetX,
            offsetY = transform ? transform.y : drawOffsetY;

        context.beginPath();
        
        // now draw the lines
        // COG.info('drawing poly: have ' + drawVectors.length + ' vectors');
        for (var ii = points.length; ii--; ) {
            var x = points[ii].x - offsetX,
                y = points[ii].y - offsetY;
                
            if (first) {
                context.moveTo(x, y);
                first = false;
            }
            else {
                context.lineTo(x, y);
            } // if..else
        } // for
        
        return {
            draw: function(viewX, viewY, state) {
                context.fill();
                context.stroke();
            }
        };
    } // path
    
    /* initialization */
    
    // initialise the container
    createCanvas();

    var _this = COG.extend(baseRenderer, {
        interactTarget: canvas,
        
        applyStyle: applyStyle,
        applyTransform: applyTransform,
        arc: arc,
        drawTiles: drawTiles,
        image: image,
        prepare: prepare,
        path: path,
        
        getContext: function() { 
            return context;
        },
        
        getDimensions: function() {
            return {
                width: vpWidth,
                height: vpHeight
            };
        },
        
        getViewport: function() {
            return viewport;
        }
    });
    
    return _this;
});