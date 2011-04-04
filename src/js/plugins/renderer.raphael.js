T5.registerRenderer('raphael', function(view, container, params, baseRenderer) {
    params = COG.extend({
    }, params);
    
    /* internals */
    
    var RADIANS_TO_DEGREES = 180 / Math.PI,
        vpWidth,
        vpHeight,
        drawOffsetX,
        drawOffsetY,
        activeObjects = {},
        activeTiles = {},
        currentObjects = {},
        currentTiles = {},
        currentStyle,
        hitObjects = {},
        styles = {},
        paper;
        
    function createPaper() {
        // initialise the viewport height and width
        vpWidth = view.width = container.offsetWidth;
        vpHeight = view.height = container.offsetHeight;

        // create the mapper
        paper = Raphael(container, vpWidth, vpHeight);
    } // createCanvas
    
    function handleStyleDefined(evt, styleId, styleData) {
        styles[styleId] = styleData;
    } // handleStyleDefined
    
    function initDrawData(drawable, viewport, hitData, state, drawFn) {
        var isHit = false;
        
        return {
            // initialise core draw data properties
            draw: drawFn || objDraw,
            viewport: viewport,
            state: state,
            hit: hitObjects[drawable.id],
            vpX: drawOffsetX,
            vpY: drawOffsetY
        };
    } // initDrawData
    
    function loadStyles() {
        for (var styleId in T5.styles) {
            handleStyleDefined(null, styleId, T5.styles[styleId]);
        } // for
        
        // capture style defined events so we know about new styles
        T5.bind('styleDefined', handleStyleDefined);
    } // loadStyles
    
    function objInit(rObject, drawable) {
        // scale the drawable
        rObject.scale(drawable.scaling, drawable.scaling);
        
        // rotate as appropriate
        rObject.rotate(drawable.rotation * RADIANS_TO_DEGREES, true);
        
        // capture mouse over and mouse out events
        rObject.mouseover(function(evt) {
            hitObjects[drawable.id] = true;
        });
        
        // capture mouse over and mouse out events
        rObject.mouseout(function(evt) {
            delete hitObjects[drawable.id];
        });

        // add the to the active objects list
        activeObjects[drawable.id] = drawable;
    } // objInit
    
    function objDraw(drawData) {
        if (this.rObject) {
            var updates = COG.extend({}, styles[currentStyle] || styles.basic),
                offsetX = drawOffsetX - this.translateX,
                offsetY = drawOffsetY - this.translateY;
            
            switch (this.rObject.type) {
                case 'circle':
                    updates['cx'] = this.xy.x - offsetX;
                    updates['cy'] = this.xy.y - offsetY;
                    
                    break;
                
                case 'path':
                    var pathString = '',
                        points = this.drawPoints || [];

                    // create the path string
                    for (var ii = points.length; ii--; ) {
                        pathString = (ii == 0 ? 'M' : 'L') + 
                            (points[ii].x - offsetX) + ' ' + 
                            (points[ii].y - offsetY) + pathString;
                    } // for
                
                    updates['path'] = pathString;
                    
                    break;
                    
                default:
                    updates['x'] = this.xy.x - (this.size >> 1) - offsetX;
                    updates['y'] = this.xy.y - (this.size >> 1) - offsetY;
            } // switch
            
            // check for a fill attribute and a drawable fill setting of false
            if (updates.fill && (! this.fill)) {
                delete updates.fill;
            } // if
            
            if (updates.stroke && (! this.stroke)) {
                delete updates.stroke;
            } // if
            
            // apply the updates
            this.rObject.attr(updates);
            
            // flag as current
            currentObjects[this.id] = this;
        } // if
    } // objUpdate
    
    function removeOldObjects(activeObj, currentObj, flagField) {
        var deletedKeys = [];
        
        // iterate through the active objects 
        // TODO: use something other than a for in loop please...
        for (var objId in activeObj) {
            var item = activeObj[objId],
                inactive = flagField ? item[flagField] : (! currentObj[objId]);
            
            // if the object is not in the current objects, remove from the scene
            if (inactive) {
                // remove the object from the raphael paper
                item.rObject.remove();
                
                // reset to null
                item.rObject = null;
                
                // add to the deleted keys
                deletedKeys[deletedKeys.length] = objId;
            } // if
        } // for
        
        // remove the deleted keys from the active objects
        for (var ii = deletedKeys.length; ii--; ) {
            delete activeObj[deletedKeys[ii]];
        } // for
    } // removeOldObjects
    
    /* exports */
    
    function applyStyle(styleId) {
        var previousStyle;
        
        if (currentStyle !== styleId) {
            previousStyle = currentStyle;
            currentStyle = styleId;
        } // if
        
        return previousStyle || 'basic';
    } // applyStyle
    
    function applyTransform(drawable) {
        if (drawable.rObject) {
            // scale the drawable
            drawable.rObject.scale(drawable.scaling, drawable.scaling);
            
            // rotate as appropriate
            drawable.rObject.rotate(drawable.rotation * RADIANS_TO_DEGREES, true);
        }
    } // applyTransform
    
    function drawTiles(viewport, tiles) {
        var tile;
            
        for (var ii = tiles.length; ii--; ) {
            tile = tiles[ii];
            
            if (tile.rObject) {
                tile.rObject.attr({
                    x: tile.x - drawOffsetX,
                    y: tile.y - drawOffsetY
                });
            }
            else if (! activeTiles[tile.id]) {
                // add the tile to the list of active tiles
                activeTiles[tile.id] = tile;

                // create the tile
                tile.rObject = paper.image(
                    tile.url,
                    tile.x - drawOffsetX,
                    tile.y - drawOffsetY, 
                    tile.w, 
                    tile.h);
                    
                // send the tile to the back
                tile.rObject.toBack();
            } // if..else
            
            // add the tile to the list of currently displayed tiles
            currentTiles[tile.id] = tile;
        } // for
    } // drawTiles
    
    function prepare(layers, viewport, state, tickCount, hitData) {
        // save the viewport x and y as the draw offset x and y
        drawOffsetX = viewport.x;
        drawOffsetY = viewport.y;
        
        // remove any old objects
        removeOldObjects(activeObjects, currentObjects);
        currentObjects = {};

        // remove old tiles
        removeOldObjects(activeTiles, currentTiles);
        currentTiles = {};
        
        return paper;
    } // prepare
    
    /**
    ### prepArc(drawable, viewport, hitData, state, opts)
    */
    function prepArc(drawable, viewport, hitData, state, opts) {
        if (! drawable.rObject) {
            objInit(drawable.rObject = paper.circle(
                drawable.xy.x - drawOffsetX,
                drawable.xy.y - drawOffsetY,
                drawable.size
            ), drawable);
        } // if
        
        return initDrawData(drawable, viewport, hitData, state);
    } // prepArc
    
    /**
    ### prepMarker(drawable, viewport, hitData, state, opts)
    */
    function prepMarker(drawable, viewport, hitData, state, opts) {
        // if this is a reset, then remove the existing object
        if (drawable.reset && drawable.rObject) {
            drawable.rObject.remove();
            drawable.rObject = null;
            drawable.reset = false;
        } // if

        if (! drawable.rObject) {
            var markerX = drawable.xy.x - drawOffsetX,
                markerY = drawable.xy.y - drawOffsetY,
                size = drawable.size;
                
            switch (drawable.markerStyle.toLowerCase()) {
                case 'image':
                    objInit(drawable.rObject = paper.image(
                        drawable.imageUrl,
                        markerX - (size >> 1),
                        markerY - (size >> 1),
                        size,
                        size
                    ), drawable);
                    
                    break;
                    
                default:
                    objInit(drawable.rObject = paper.circle(
                        markerX,
                        markerY,
                        size
                    ), drawable);
            } // switch
        } // if
        
        return initDrawData(drawable, viewport, hitData, state);
    } // prepMarker    
    
    /**
    ### prepPoly(drawable, viewport, hitData, state, opts)
    */
    function prepPoly(drawable, viewport, hitData, state, opts) {
        if (! drawable.rObject) {
            // initialise the object
            objInit(drawable.rObject = paper.path('M0 0L0 0'), drawable);
        } // if
        
        // save the draw points to the drawable
        drawable.drawPoints = opts.points || drawable.points;

        return initDrawData(drawable, viewport, hitData, state);
    } // prepPoly
    
    function reset() {
        COG.info('reset called');
        
        currentTiles = {};
        removeOldObjects(activeTiles, currentTiles);
        
        removeOldObjects(activeObjects, currentObjects, 'removeOnReset');
        // currentObjects = {};
        // removeOldObjects();
    } // reset
    
    /* initialization */
    
    // initialise the container
    createPaper();

    var _this = COG.extend(baseRenderer, {
        interactTarget: container,
        preventPartialScale: true,
        
        applyStyle: applyStyle,
        applyTransform: applyTransform,
        drawTiles: drawTiles,
        
        prepare: prepare,

        prepArc: prepArc,
        prepMarker: prepMarker,
        prepPoly: prepPoly,
        
        reset: reset,
        
        getDimensions: function() {
            return {
                width: vpWidth,
                height: vpHeight
            };
        },
        
        getOffset: function() {
            return new XY(drawOffsetX, drawOffsetY);
        }
    });
    
    // load styles
    loadStyles();
    
    return _this;
});