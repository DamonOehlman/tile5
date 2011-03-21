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
    
    function arc(x, y, radius, startAngle, endAngle) {
        context.beginPath();
        context.arc(
            x - viewport.x1,
            y - viewport.y1,
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
            offsetX = viewport.x1,
            offsetY = viewport.y1,
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
        var realX = x - viewport.x1,
            realY = y - viewport.y1;
        
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
            viewX = viewOffset.x - (vpWidth >> 1),
            viewY = viewOffset.y - (vpHeight >> 1);
            
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
        
        // update the viewport
        viewport = XYRect.init(
            viewX, 
            viewY, 
            viewX + vpWidth, 
            viewY + vpHeight);
        viewport.scaleFactor = view.getScaleFactor();
        
        if (context) {
            // if we can't clip then clear the context
            if (! canClip) {
                context.clearRect(0, 0, vpWidth, vpHeight);
            } // if

            // save the context
            context.save();
        } // if
        
        // initialise the composite operation
        context.globalCompositeOperation = 'source-over';

        return context;
    } // prepare
    
    function path(points) {
        var first = true,
            offsetX = viewport.x1,
            offsetY = viewport.y1;

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