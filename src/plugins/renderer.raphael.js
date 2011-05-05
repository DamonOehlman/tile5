T5.Registry.register('renderer', 'raphael', function(view, panFrame, container, params, baseRenderer) {
    params = T5.ex({
    }, params);
    
    /* internals */
    
    var RADIANS_TO_DEGREES = 180 / Math.PI,
        STYLE_CONVERSION_PROPS = {
            lineWidth: 'stroke-width'
        },
        drawOffsetX,
        drawOffsetY,
        activeObjects = {},
        currentObjects = {},
        currentStyle,
        hitObjects = {},
        styles = {},
        paper;
        
    function createPaper() {
        // create the mapper
        paper = Raphael(panFrame, panFrame.offsetWidth, panFrame.offsetHeight);
        
        // set the canvas display style
        paper.canvas.style.position = 'absolute';
        
        // register the canvas with the view
        view.attachFrame(paper.canvas);
    } // createCanvas
    
    function convertStyleData(input) {
        output = T5.ex({}, input);
        
        // iterate through the style conversion properties
        for (var key in STYLE_CONVERSION_PROPS) {
            if (output[key]) {
                output[STYLE_CONVERSION_PROPS[key]] = output[key];
                delete output[key];
            } // if
        } // for
        
        return output;
    } // convertStyleData
    
    function handleDetach() {
        // remove the canvas from the dom
        panFrame.removeChild(paper.canvas);
    } // handleDetach
    
    function handlePredraw(evt, viewport) {
        // remove any old objects
        removeOldObjects(activeObjects, currentObjects);
        currentObjects = {};
    } // handlePredraw
    
    function handleStyleDefined(evt, styleId, styleData) {
        styles[styleId] = convertStyleData(styleData);
    } // handleStyleDefined
    
    function handleReset(evt) {
        removeOldObjects(activeObjects, currentObjects, 'removeOnReset');
    } // handleReset
    
    function initDrawData(drawable, viewport, hitData, drawFn) {
        var isHit = false;
        
        return {
            // initialise core draw data properties
            draw: drawFn || objDraw,
            viewport: viewport,
            hit: hitObjects[drawable.id],
            vpX: drawOffsetX,
            vpY: drawOffsetY
        };
    } // initDrawData
    
    function loadStyles() {
        T5.Style.each(function(id, data) {
            handleStyleDefined(null, id, data);
        });
        
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
            var updates = T5.ex({}, styles[currentStyle] || styles.basic),
                offsetX = drawOffsetX - this.translateX,
                offsetY = drawOffsetY - this.translateY;
            
            switch (this.rObject.type) {
                case 'circle':
                    updates.cx = this.xy.x - offsetX;
                    updates.cy = this.xy.y - offsetY;
                    
                    break;
                
                case 'path':
                    updates.path = this.path(offsetX, offsetY, drawData.viewport);
                    
                    break;
                    
                default:
                    updates.x = this.xy.x - (this.size >> 1) - offsetX;
                    updates.y = this.xy.y - (this.size >> 1) - offsetY;
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
        
        return previousStyle || T5.Style.resetStyle;
    } // applyStyle
    
    function applyTransform(drawable) {
        if (drawable.rObject) {
            // scale the drawable
            drawable.rObject.scale(drawable.scaling, drawable.scaling);
            
            // rotate as appropriate
            drawable.rObject.rotate(drawable.rotation * RADIANS_TO_DEGREES, true);
        }
    } // applyTransform
    
    function prepare(layers, viewport, tickCount, hitData) {
        // save the viewport x and y as the draw offset x and y
        drawOffsetX = viewport.x;
        drawOffsetY = viewport.y;
        
        return paper;
    } // prepare
    
    /**
    ### prepArc(drawable, viewport, hitData, opts)
    */
    function prepArc(drawable, viewport, hitData, opts) {
        if (! drawable.rObject) {
            objInit(drawable.rObject = paper.circle(
                drawable.xy.x - drawOffsetX,
                drawable.xy.y - drawOffsetY,
                drawable.size
            ), drawable);
        } // if
        
        return initDrawData(drawable, viewport, hitData);
    } // prepArc
    
    /**
    ### prepMarker(drawable, viewport, hitData, opts)
    */
    function prepMarker(drawable, viewport, hitData, opts) {
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
                
            switch (drawable.markerType.toLowerCase()) {
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
                        size >> 1
                    ), drawable);
            } // switch
        } // if
        
        return initDrawData(drawable, viewport, hitData);
    } // prepMarker    
    
    /**
    ### prepPoly(drawable, viewport, hitData, opts)
    */
    function prepPoly(drawable, viewport, hitData, opts) {
        
        if (! drawable.rObject) {
            var rawPath = [],
                points = opts.points || drawable.points();
                
            drawable.path = function(x, y, vp) {
                var pathString = '',
                    drawPoints = points.cull(vp);
                    
                for (var ii = drawPoints.length; ii--; ) {
                    // now initialise the path string
                    pathString = (ii > 0 ? 'L' : 'M') + 
                        (drawPoints[ii].x - x) + ' ' + (drawPoints[ii].y - y) + 
                        pathString;
                } // for

                return pathString || 'M0 0L0 0';
            };
                
            // initialise the object
            drawable.removeOnReset = true;
            objInit(drawable.rObject = paper.path('M0 0L0 0'), drawable);
        } // if
        
        return initDrawData(drawable, viewport, hitData);
    } // prepPoly
    
    /* initialization */
    
    // initialise the panFrame
    createPaper();

    var _this = T5.ex(baseRenderer, {
        applyStyle: applyStyle,
        applyTransform: applyTransform,
        
        prepare: prepare,

        prepArc: prepArc,
        prepMarker: prepMarker,
        prepPoly: prepPoly
    });
    
    // handle the predraw event
    _this.bind('predraw', handlePredraw);
    _this.bind('detach', handleDetach);
    view.bind('reset', handleReset);
    
    // load styles
    loadStyles();
    
    return _this;
});