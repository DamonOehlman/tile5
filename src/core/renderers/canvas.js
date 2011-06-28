/**
# RENDERER: canvas
*/
reg('renderer', 'canvas', function(view, panFrame, container, params, baseRenderer) {
    params = _extend({
    }, params);
    
    /* internals */
    
    var vpWidth,
        vpHeight,
        canvas,
        createdCanvas = false,
        context,
        drawOffsetX = 0,
        drawOffsetY = 0,
        paddingX = 0,
        paddingY = 0,
        scaleFactor = 1,
        styleFns = {},
        transform = null,
        previousStyles = {},
        
        drawNothing = function(drawData) {
        },
        
        defaultDrawFn = function(drawData) {
            if (this.fill) {
                 context.fill();
            } // if
            
            if (this.stroke) {
                context.stroke();
            } // if
        },
        
        styleParams = [
            'fill',
            'stroke',
            'lineWidth',
            'opacity'
        ],
        
        styleAppliers = [
            'fillStyle',
            'strokeStyle',
            'lineWidth',
            'globalAlpha'
        ];

    // mozilla pointInPath fix courtesy of
    // https://bugzilla.mozilla.org/show_bug.cgi?id=405300#c11
    function checkBrokenPointInPath() {
        var c2dp = CanvasRenderingContext2D.prototype;

        //  special isPointInPath method to workaround Mozilla bug 405300
        //      [https://bugzilla.mozilla.org/show_bug.cgi?id=405300]
        function isPointInPath_mozilla(x, y) {
            this.save();
            this.setTransform( 1, 0, 0, 1, 0, 0 );
            var ret = this.isPointInPath_old( x, y );
            this.restore();
            return ret;
        }

        //  test for the presence of the bug, and set the workaround function only if needed
        var ctx = document.createElement('canvas').getContext('2d');
        ctx.translate( 50, 0 );
        ctx.moveTo( 125, 50 );
        ctx.arc( 100, 50, 25, 0, 360, false );
        if (!ctx.isPointInPath( 150, 50 )) {
            c2dp.isPointInPath_old = c2dp.isPointInPath;
            c2dp.isPointInPath = isPointInPath_mozilla;
        } // if
    } // checkBrokenPointInPath
        
    function createCanvas() {
        if (panFrame) {
            // initialise the viewport height and width
            vpWidth = panFrame.offsetWidth;
            vpHeight = panFrame.offsetHeight;
            
            // create the canvas
            canvas = DOM ? DOM.create('canvas', null, {
                position: 'absolute',
                'z-index': 1
            }) : new Canvas();
            
            canvas.width = vpWidth;
            canvas.height = vpHeight;

            // attach the frame to the view
            view.attachFrame(canvas, true);

            // initialise the context
            context = null;
        } // if
    } // createCanvas
    
    function getPreviousStyle(canvasId) {
        // create the previous styles array if not created already
        if (! previousStyles[canvasId]) {
            previousStyles[canvasId] = [];
        } // if
        
        // pop the previous style from the style stack
        return previousStyles[canvasId].pop() || STYLE_RESET;
    } // getPreviousStyle
    
    function handleDetach() {
        panFrame.removeChild(canvas);
    } // handleDetach
    
    function handlePredraw(evt, layers, viewport, tickcount, hits) {
        var ii,
            canClip = false;
            
        // if we already have a context, then restore
        if (context) {
            context.restore();
        }
        else if (canvas) {
            // get the context
            context = canvas.getContext('2d');
        } // if..else
        
        // check to see if we can clip
        for (ii = layers.length; ii--; ) {
            canClip = canClip || layers[ii].clip;
        } // for
        
        // update the offset x and y
        drawOffsetX = viewport.x;
        drawOffsetY = viewport.y;
        paddingX = viewport.padding.x;
        paddingY = viewport.padding.y;
        scaleFactor = viewport.scaleFactor;
        
        if (context) {
            // if we can't clip then clear the context
            if (! canClip) {
                context.clearRect(0, 0, vpWidth, vpHeight);
            } // if

            // save the context
            context.save();
            
            // initialise the composite operation
            context.globalCompositeOperation = 'source-over';
        } // if
    } // handlePredraw
    
    function handleResize() {
    } // handleResize
    
    function handleStyleDefined(evt, styleId, styleData) {
        var ii, data;
        
        styleFns[styleId] = function(context) {
            // iterate through the style params and if defined 
            // use the style applier to apply the style
            for (ii = styleParams.length; ii--; ) {
                data = styleData[styleParams[ii]];
                if (data) {
                    context[styleAppliers[ii]] = data;
                } // if
            } // for
        };
    } // handleStyleDefined
        
    function initDrawData(viewport, hitData, drawFn) {
        return {
            // initialise core draw data properties
            draw: drawFn || defaultDrawFn,
            viewport: viewport,
            hit: hitData && context.isPointInPath(hitData.x, hitData.y),
            vpX: drawOffsetX,
            vpY: drawOffsetY,
            
            // and the extras given we have a canvas implementation
            context: context
        };
        
        /*
        DEBUGGING CODE: draw the hit point on the canvas - very useful :)
        if (hitData) {
            context.beginPath();
            context.arc(hitData.x, hitData.y, 5, 0, Math.PI * 2, false);
            context.fill();
        } // if
        */
    } // initDrawData
    
    function loadStyles() {
        Style.each(function(id, data) {
            handleStyleDefined(null, id, data);
        });
        
        // capture style defined events so we know about new styles
        T5.bind('styleDefined', handleStyleDefined);
    } // loadStyles
    
    /* exports */
    
    function applyStyle(styleId) {
        var nextStyle = styleFns[styleId],
            canvasId = context && context.canvas ? context.canvas.id : 'default',
            previousStyle = getPreviousStyle(canvasId);

        if (nextStyle) {
            // push the style onto the style stack
            previousStyles[canvasId].push(styleId);

            // apply the style
            nextStyle(context);

            // return the previously selected style
            return previousStyle;        
        } // if
    } // applyStyle
    
    function applyTransform(drawable) {
        var translated = drawable.translateX !== 0 || drawable.translateY !== 0,
            transformed = translated || drawable.scaling !== 1 || drawable.rotation !== 0;
            
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
    
    function drawTiles(viewport, tiles, okToLoad) {
        var tile,
            minX = drawOffsetX - 256,
            minY = drawOffsetY - 256,
            maxX = viewport.x2,
            maxY = viewport.y2;
            
        for (var ii = tiles.length; ii--; ) {
            tile = tiles[ii];
            
            if ((! tile.loaded) && okToLoad) {
                tile.load(view.invalidate);
            }
            else if (tile.image) {
                context.drawImage(
                    tile.image,
                    tile.x - drawOffsetX, 
                    tile.y - drawOffsetY);
            } // if..else
        } // for
    } // drawTiles
    
    /**
    ### prepArc(drawable, viewport, hitData, opts)
    */
    function prepArc(drawable, viewport, hitData, opts) {
        context.beginPath();
        context.arc(
            drawable.xy.x - (transform ? transform.x : drawOffsetX),
            drawable.xy.y - (transform ? transform.y : drawOffsetY),
            drawable.size >> 1,
            drawable.startAngle,
            drawable.endAngle,
            false
        );
        
        return initDrawData(viewport, hitData);
    } // prepArc
    
    /**
    ### prepImage(drawable, viewport, hitData, opts)
    */
    function prepImage(drawable, viewport, hitData, opts) {
        var realX = (opts.x || drawable.xy.x) - (transform ? transform.x : drawOffsetX),
            realY = (opts.y || drawable.xy.y) - (transform ? transform.y : drawOffsetY),
            image = opts.image || drawable.image;
        
        if (image) {
            // open the path for hit tests
            context.beginPath();
            context.rect(
                realX, 
                realY, 
                opts.width || image.width, 
                opts.height || image.height
            );

            return initDrawData(viewport, hitData, function(drawData) {
                context.drawImage(
                    image, 
                    realX, 
                    realY,
                    opts.width || image.width,
                    opts.height || image.height
                );
            });
        }
    } // prepImage
    
    /**
    ### prepMarker(drawable, viewport, hitData, opts)
    */
    function prepMarker(drawable, viewport, hitData, opts) {
        var markerX = drawable.xy.x - (transform ? transform.x : drawOffsetX),
            markerY = drawable.xy.y - (transform ? transform.y : drawOffsetY),
            size = drawable.size,
            drawOverride = undefined;
        
        context.beginPath();
        
        switch (drawable.markerType.toLowerCase()) {
            case 'image':
                // update the draw override to the draw nothing handler
                drawOverride = drawNothing;
                
                // create the rect for the hit test
                context.rect(
                    markerX - (size >> 1),
                    markerY - (size >> 1), 
                    size, 
                    size);
                    
                // if the reset flag has been specified, and we already have an image
                // then ditch it
                if (drawable.reset && drawable.image) {
                    drawable.image = null;
                    drawable.reset = false;
                } // if
                    
                if (drawable.image) {
                    context.drawImage(
                        drawable.image,
                        markerX - (size >> 1),
                        markerY - (size >> 1),
                        size,
                        size
                    );
                }
                else {
                    getImage(drawable.imageUrl, function(image) {
                        drawable.image = image;

                        context.drawImage(
                            drawable.image,
                            markerX - (size >> 1),
                            markerY - (size >> 1),
                            size,
                            size
                        );
                    });
                } // if..else
            
                break;
                
            default: 
                context.moveTo(markerX, markerY);
                context.lineTo(markerX - (size >> 1), markerY - size);
                context.lineTo(markerX + (size >> 1), markerY - size);
                context.lineTo(markerX, markerY);
                break;
        } // switch
        
        return initDrawData(viewport, hitData, drawOverride);
    } // prepMarker
    
    /**
    ### prepPoly(drawable, viewport, hitData, opts)
    */
    function prepPoly(drawable, viewport, hitData, opts) {
        var first = true,
            points = opts.points || drawable.line().cull(viewport),
            offsetX = transform ? transform.x : drawOffsetX,
            offsetY = transform ? transform.y : drawOffsetY;

        context.beginPath();
        
        // now draw the lines
        // _log('drawing poly: have ' + drawVectors.length + ' vectors');
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
        
        return initDrawData(viewport, hitData);
    } // prepPoly
    
    /* initialization */

    // if we have a DOM then check for a broken implementation of point in path
    if (DOM) {
        checkBrokenPointInPath();
    } // if
    
    // create the canvas
    createCanvas();

    var _this = _extend(baseRenderer, {
        applyStyle: applyStyle,
        applyTransform: applyTransform,
        
        drawTiles: drawTiles,
        
        prepArc: prepArc,
        prepImage: prepImage,
        prepMarker: prepMarker,
        prepPoly: prepPoly,
        
        getCanvas: function() {
            return canvas;
        },
        
        getContext: function() { 
            return context;
        }
    });
    
    // load the styles
    loadStyles();
    
    // handle detaching
    _this.bind('predraw', handlePredraw);
    _this.bind('detach', handleDetach);
    _this.bind('resize', handleResize);
    
    return _this;
});