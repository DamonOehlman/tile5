// req: colorparser

T5.Registry.register('renderer', 'three:webgl', function(view, panFrame, container, params, baseRenderer) {
    // initialise the params
    params = params || {};
    
    /* internals */
    
    var TILE_SIZE = 256,
        camera,
        scene,
        renderer,
        activeObjects = {},
        activeTiles = {},
        currentObjects = {},
        currentTiles = {},
        resetStyle = T5.Style.resetStyle,
        currentStyle = resetStyle,
        lastTiles = [],
        jsonLoader = new THREE.JSONLoader(),
        tileBg,
        tilePlane,
        tileMaterials = [],
        materials,
        vpWidth,
        vpHeight,
        cubes = [],
        guides = [],
        defaultMarker,
        markerStyles = {},
        meshMaterials = {},
        lineMaterials = {},
        drawOffsetX = 0,
        drawOffsetY = 0,
        transform = null,
        textureCache = {},
        materialCache = {},
        previousStyles = {};
        
    function createGuides() {
        var xGeom = new THREE.Geometry(),
            yGeom = new THREE.Geometry(),
            zGeom = new THREE.Geometry();
            
        // create the x line
        xGeom.vertices.push(new THREE.Vertex(new THREE.Vector3(0, 0, 0)));
        xGeom.vertices.push(new THREE.Vertex(new THREE.Vector3(128, 0, 0)));
        
        // create the y line
        yGeom.vertices.push(new THREE.Vertex(new THREE.Vector3(0, 0, 0)));
        yGeom.vertices.push(new THREE.Vertex(new THREE.Vector3(0, 128, 0)));
        
        // create the z line
        zGeom.vertices.push(new THREE.Vertex(new THREE.Vector3(0, 0, 0)));
        zGeom.vertices.push(new THREE.Vertex(new THREE.Vector3(0, 0, 128)));

        guides.push(new THREE.Line(xGeom, [
            new THREE.LineBasicMaterial({
                color: 0xff0000,
                linewidth: 3
            })
        ]));

        guides.push(new THREE.Line(yGeom, [
            new THREE.LineBasicMaterial({
                color: 0x00ff00,
                linewidth: 3
            })
        ]));

        guides.push(new THREE.Line(zGeom, [
            new THREE.LineBasicMaterial({
                color: 0x0000ff,
                linewidth: 3
            })
        ]));
        
        // add the guides to the scene
        for (var ii = guides.length; ii--; ) {
            guides[ii].position.y = 1;
            scene.addObject(guides[ii]);
        } // for
    }
        
    function createCube(size) {
        var realSize = size >> 1;
        return cubes[size] = new THREE.Cube(realSize, realSize, realSize);
    } // createCube
    
    function getCachedMaterials(materialKey, creator) {
        if ((! materialCache[materialKey]) && creator) {
            materialCache[materialKey] = creator();
        } // if
        
        return materialCache[materialKey];
    } // getCachedMaterial
    
    function getPreviousStyle(canvasId) {
        // create the previous styles array if not created already
        if (! previousStyles[canvasId]) {
            previousStyles[canvasId] = [];
        } // if
        
        // pop the previous style from the style stack
        return previousStyles[canvasId].pop() || resetStyle;
    } // getPreviousStyle
    
    function handleDetach() {
        // TODO: clean up the scene
        
        // remove the dom element from the panFrame
        if (renderer && renderer.domElement && renderer.domElement.parentNode) {
            container.removeChild(renderer.domElement);
        } // if
    } // handleDetach
    
    function handleStyleDefined(evt, styleId, styleData) {
        var fillColor = new ColorParser(styleData.fill || '#ffffff'),
            strokeColor = new ColorParser(styleData.stroke || '#ffffff');
            
        // firstly create the mesh materials for the style
        meshMaterials[styleId] = [
            new THREE.MeshLambertMaterial({
                color: fillColor.toHex(), 
                shading: THREE.FlatShading 
            })
        ];
        
        // next create the line materials for the style
        lineMaterials[styleId] = [
            new THREE.LineBasicMaterial({
                color: strokeColor.toHex(),
                opacity: styleData.opacity || 1,
                linewidth: styleData.lineWidth || 2
            })        
        ];
    } // handleStyleDefined
    
    function handlePredraw(evt, layers, viewport, tickCount, hitData) {
        // update the offset x and y
        drawOffsetX = viewport.x;
        drawOffsetY = viewport.y;
            
        // move the tile bg
        shiftViewport(
            drawOffsetX + (vpWidth >> 1), 
            drawOffsetY + (vpHeight >> 1),
            viewport.scaleFactor
        );
        // camera.position.x = tileBg.position.x = drawOffsetX + vpWidth / 2;
        //tileBg.position.z = drawOffsetY - vpHeight / 2;
        //camera.position.z = tileBg.position.y - 200 / viewport.scaleFactor;
        
        //camera.position.y = -150 / viewport.scaleFactor;
        
        // remove any old objects
        removeOldObjects(activeObjects, currentObjects);
        currentObjects = {};
        
        // remove any old tiles
        removeOldObjects(activeTiles, currentTiles);
        currentTiles = {};
    } // handlePredraw
    
    function handleRender(evt, viewport) {
        // render the scene
        renderer.render(scene, camera);
    } // handleRender
    
    function handleReset(evt) {
        removeOldObjects(activeTiles, currentTiles = {});
        removeOldObjects(activeObjects, currentObjects, 'removeOnReset');
    } // handleReset
        
    function initDrawData(viewport, hitData, drawFn) {
        var isHit = false;

        return {
            // initialise core draw data properties
            draw: drawFn || meshDraw,
            viewport: viewport,
            hit: isHit,
            vpX: drawOffsetX,
            vpY: drawOffsetY
        };
    } // initDrawData        
        
    function initThree() {
        var xSeg, ySeg;
        
        if (panFrame) {
            // initialise the viewport height and width
            vpWidth = panFrame.offsetWidth;
            vpHeight = panFrame.offsetHeight;
            
            // calculate the number of x segments
            xSeg = (vpWidth / TILE_SIZE | 0) + 1;
            ySeg = (vpHeight / TILE_SIZE | 0) + 1;

            scene = new THREE.Scene();

            var light, object, material;

            globalLight = light = new THREE.DirectionalLight( 0xffffff, 2.0 );
            light.position.z = 1;
            scene.addLight( light );

            /*
            light = new THREE.DirectionalLight( 0x000040, 0.5 );
            light.position.z = - 1;
            scene.addLight( light );
            */
            
            tileBg = new THREE.Mesh(
                new THREE.Plane(xSeg * TILE_SIZE, ySeg * TILE_SIZE, xSeg, ySeg), 
                new THREE.MeshBasicMaterial({ 
                    color: 0xdddddd,
                    wireframe: true
                })
            );
            
            // if we have guides, then display them
            if (params.guides) {
                createGuides();
            } // guides
            
            tileBg.rotation.x = -Math.PI / 2;
            tileBg.position.y = -1;
            scene.addObject(tileBg);
            
            globalCamera = camera = new THREE.Camera(45, vpWidth / vpHeight, 1, 2000, tileBg);
            // camera.position.x = camera.position.y = camera.position.z = 50;

            // create a plane for the tiles
            tilePlane = new THREE.Plane(TILE_SIZE, TILE_SIZE, 4, 4);
            
            // initialise the materials that will be applied to the tiles over the image
            tileMaterials = [];

            renderer = new THREE.WebGLRenderer();
            renderer.setSize(vpWidth, vpHeight);
            
            // add the canvas to the panFrame
            container.appendChild(renderer.domElement);
        } // if
        
        // initialise geometries
        initGeometries();
        
        // initialise materials
        initMaterials();
    } // createCanvas
    
    function initGeometries() {
        defaultMarker = new THREE.Cube(5, 5, 5);
    } // initGeometries
    
    function initMaterials() {
    } // initMaterials
    
    function loadStyles() {
        for (var styleId in T5.styles) {
            handleStyleDefined(null, styleId, T5.styles[styleId]);
        } // for
        
        // capture style defined events so we know about new styles
        T5.bind('styleDefined', handleStyleDefined);
    } // loadStyles
    
    function loadTexture(imageUrl, mapping, callback) {
        // get the image, 
        T5.getImage(imageUrl, function(image) {
            // create the texture
            var texture = new THREE.Texture(image, mapping);
            
            // flag as needing an update
            texture.needsUpdate = true;
            
            // add to the texture cache
            textureCache[imageUrl] = texture;
            
            // if we have a callback, then fire it
            if (callback) {
                callback(texture);
            } // if
        });
    } // loadTexture
    
    function loadTileMesh(tile) {
        // flag the tile as loading
        activeTiles[tile.id] = tile;
        
        T5.getImage(tile.url, function(image) {
            var texture = new THREE.Texture(image),
                mesh = tile.mesh = new THREE.Mesh(
                    tilePlane, [
                        new THREE.MeshBasicMaterial({
                            map: texture
                        })
                    ].concat(tileMaterials)
                );

            // set the id of the mesh object
            mesh.id = tile.id;
            mesh.rotation.x = -Math.PI / 2;

            // flag the texture as needing an update
            texture.needsUpdate = true;

            // update the mesh position and add to the scene
            mesh.position.x = tile.x + tile.w / 2;
            mesh.position.z = tile.y + tile.h / 2;
            scene.addObject(mesh);
            
            // invalidate the view
            view.invalidate();
        });
    } // loadTileMesh
    
    function removeOldObjects(activeObj, currentObj, flagField) {
        var deletedKeys = [];
        
        // iterate through the active objects 
        // TODO: use something other than a for in loop please...
        for (var objId in activeObj) {
            var item = activeObj[objId],
                inactive = flagField ? item[flagField] : (! currentObj[objId]);
            
            // if the object is not in the current objects, remove from the scene
            if (inactive) {
                if (item.mesh) {
                    // remove the file object
                    scene.removeChild(item.mesh);

                    // reset the mesh
                    item.mesh = null;
                } // if
                
                // add to the deleted keys
                deletedKeys[deletedKeys.length] = objId;
            } // if
        } // for
        
        // remove the deleted keys from the active objects
        for (var ii = deletedKeys.length; ii--; ) {
            delete activeObj[deletedKeys[ii]];
        } // for
    } // removeOldObjects
    
    function shiftViewport(centerX, centerY, scaleFactor) {
        for (var ii = guides.length; ii--; ) {
            guides[ii].position.x = centerX;
            guides[ii].position.z = centerY;
        } // for
        
        tileBg.position.x = centerX;
        tileBg.position.z = centerY;
        
        camera.position.x = centerX;
        camera.position.y = 200 / scaleFactor;
        camera.position.z = centerY + 200 / scaleFactor;
        
        // top down view 
        // camera.position.y = 350 + 200 / scaleFactor;
        // camera.position.z = centerY + 1;
    } // shiftViewport
    
    /* exports */
    
    function applyStyle(styleId) {
        var previousStyle;
        
        if (currentStyle !== styleId) {
            previousStyle = currentStyle;
            currentStyle = styleId;
        } // if
        
        return previousStyle || resetStyle;
    } // applyStyle
    
    function applyTransform(drawable) {
        var mesh = drawable.mesh,
            translated = drawable.translateX !== 0 || drawable.translateY !== 0,
            transformed = translated || drawable.scaling !== 1 || drawable.rotation !== 0;
        
        if (mesh && (transformed || drawable.transformed)) {
            mesh.scale.x = mesh.scale.y = mesh.scale.z = drawable.scaling;
            mesh.rotation.y = -drawable.rotation;
            
            mesh.position.x = drawable.xy.x + drawable.translateX;
            mesh.position.y = drawable.z - drawable.translateY;
            
            // initialise the transform
            transform = {
                undo: function() {
                    transform = null;
                },
                
                x: drawable.xy.x,
                y: drawable.xy.y
            };
        } // if
        
        // update the drawable transformed status
        drawable.transformed = transformed;
            
        return transform;
    } // applyTransform
    
    function drawTiles(viewport, tiles, okToLoad) {
        var tile,
            offsetX = transform ? transform.x : drawOffsetX,
            offsetY = transform ? transform.y : drawOffsetY,
            ii,
            tileIds = [];
            
        for (ii = tiles.length; ii--; ) {
            tile = tiles[ii];
            
            // show or hide the image depending on whether it is in the viewport
            if ((! tile.mesh) && (! activeTiles[tile.id])) {
                loadTileMesh(tile);
            } // if
            
            // add the tile to the current objects
            currentTiles[tile.id] = tile;
        } // for
    } // drawTiles
    
    function meshDraw(drawData) {
        var mesh = this.mesh;
        
        if (mesh) {
            var styleMaterials = mesh instanceof THREE.Line ? lineMaterials : meshMaterials,
                materials = styleMaterials[currentStyle] || styleMaterials.basic || [];
            
            currentObjects[this.id] = this;
            
            // update the mesh position
            mesh.position.x = (drawData.x || this.xy.x) + this.translateX;
            mesh.position.z = (drawData.y || this.xy.y);
            
            // if the drawable has materials attached, then add those
            if (this.materials) {
                materials = materials.concat(this.materials);
            } // if
            
            // update the materials
            mesh.materials = materials;
        } // if
    } // meshDraw
    
    function meshInit(mesh, drawable, x, y, z) {
        // initialise the drawable z offset
        drawable.z = z || drawable.z || 1;
        
        // set the mesh position
        mesh.position.x = (x || drawable.xy.x) + drawable.translateX;
        mesh.position.y = drawable.z - drawable.translateY;
        mesh.position.z = (y || drawable.xy.y);

        if (drawable.scaling !== 1) {
            mesh.scale = new THREE.Vector3(drawable.scaling, drawable.scaling, drawable.scaling);
        } // if

        // add to the active objects
        activeObjects[drawable.id] = drawable;

        // add to the scene
        scene.addObject(mesh);
    } // meshInit
    
    /**
    ### prepArc(drawable, viewport, hitData, opts)
    */
    function prepArc(drawable, viewport, hitData, opts) {
        if (! drawable.mesh) {
            var sphere = new THREE.Sphere(drawable.size, 15, 15),
                mesh = drawable.mesh = new THREE.Mesh(
                    sphere
                );
                
            // prep the mesh and add to the scene
            meshInit(mesh, drawable);
            
            // rotate the sphere...
            mesh.rotation.x = Math.PI / 2;
        } // if
        
        return initDrawData(viewport, hitData);
    } // prepArc
    
    /**
    ### prepImage(drawable, viewport, hitData, opts)
    */
    function prepImage(drawable, viewport, hitData, opts) {
        var image = opts.image || drawable.image;
        
        if (image && (! drawable.mesh)) {
            var plane = new THREE.Plane(image.width, image.height),
                drawX = (opts.x || drawable.xy.x) + image.width / 2,
                drawY = (opts.y || drawable.xy.y) + image.height / 2,
                texture = new THREE.Texture(image),
                mesh = drawable.mesh = new THREE.Mesh(
                    plane,
                    new THREE.MeshBasicMaterial({
                        map: texture,
                        blending: THREE.BillboardBlending
                    })
                );
                
            texture.needsUpdate = true;
            
            // prep the mesh and add to the scene
            meshInit(mesh, drawable, drawX, drawY, 1);
        }
        
        return initDrawData(viewport, hitData);
    } // prepImage
    
    /**
    ### prepMarker(drawable, viewport, hitData, opts)
    */
    function prepMarker(drawable, viewport, hitData, opts) {
        if ((! drawable.mesh) && (! drawable.loading)) {
            var markerX = drawable.xy.x,
                markerY = drawable.xy.y,
                size = drawable.size,
                mesh;

            switch (drawable.markerType.toLowerCase()) {
                case 'image':
                    // look for the image texture
                    var materialKey = 'marker_image_' + drawable.imageUrl;
                    
                    drawable.materials = getCachedMaterials(materialKey, function() {
                        return [
                            new THREE.MeshBasicMaterial({
                                map: THREE.ImageUtils.loadTexture(drawable.imageUrl)
                            })
                        ];
                    });
                    
                    // if we have it then create the mesh
                    mesh = drawable.mesh = new THREE.Mesh(
                        cubes[drawable.size] || createCube(drawable.size)
                    );
                    
                    break;
                    
                case 'model.ascii':
                    var modelStyle = currentStyle;
                
                    drawable.loading = true;
                    jsonLoader.load({
                        model: drawable.modelUrl, 
                        callback: function(geometry) {
                            mesh = drawable.mesh = new THREE.Mesh(geometry);
                            
                            meshInit(mesh, drawable);
                        }
                    });
                    
                    break;
                    
                default:
                    mesh = drawable.mesh = new THREE.Mesh(
                        cubes[drawable.size] || createCube(drawable.size)
                    );
            } // switch
            
            
            if (mesh) {
                drawable.z = size >> 1;
                
                // initialise the mesh and add to the scene
                meshInit(mesh, drawable);
            }
        } // if
        
        return initDrawData(viewport, hitData);
    } // prepMarker
    
    /**
    ### prepPoly(drawable, viewport, hitData, opts)
    */
    function prepPoly(drawable, viewport, hitData, opts) {
        if (! drawable.mesh) {
            var points = opts.points || drawable.line().points,
                geometry = new THREE.Geometry(),
                offsetX = drawable.xy.x,
                offsetY = drawable.xy.y,
                mesh;

            // initialise the vertices
            for (var ii = points.length; ii--; ) {
                geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(
                    points[ii].x - offsetX,
                    1,
                    points[ii].y - offsetY
                )));
            } // for
            
            // create the mesh
            mesh = drawable.mesh = new THREE.Line(
                geometry,
                lineMaterials[currentStyle]
            );
            
            // flag the drawable as remove on reset
            drawable.removeOnReset = true;
            
            meshInit(mesh, drawable);
        } // if

        return initDrawData(viewport, hitData);
    } // prepPoly    
    
    /* initialization */
    
    // initialise three
    initThree();

    var _this = cog.extend(baseRenderer, {
        fastpan: false,
        
        applyStyle: applyStyle,
        applyTransform: applyTransform,
        
        drawTiles: drawTiles,
        
        prepArc: prepArc,
        prepImage: prepImage,
        prepMarker: prepMarker,
        prepPoly: prepPoly,
        
        getCamera: function() {
            return camera;
        },
        
        getContext: function() { 
            return context;
        }
    });
    
    // handle cleanup
    _this.bind('detach', handleDetach);
    _this.bind('predraw', handlePredraw);
    _this.bind('render', handleRender);
    view.bind('reset', handleReset);
    
    loadStyles();
    T5.log('created three:webgl renderer');
    
    return _this;
});