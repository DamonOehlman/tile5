T5.registerRenderer('three:webgl', function(view, container, params, baseRenderer) {
    params = COG.extend({
    }, params);
    
    /* internals */
    
    var TILE_SIZE = 256,
        camera,
        scene,
        renderer,
        activeObjects = {},
        currentObjects = {},
        lastTiles = [],
        tileBg,
        tilePlane,
        materials,
        vpWidth,
        vpHeight,
        canvas,
        context,
        drawOffsetX = 0,
        drawOffsetY = 0,
        transform = null,
        previousStyles = {},
        
        defaultDrawFn = function(drawData) {
        };
        
    function initDrawData(viewport, hitData, state, drawFn) {
        var isHit = false;

        return {
            // initialise core draw data properties
            draw: drawFn || defaultDrawFn,
            viewport: viewport,
            state: state,
            hit: isHit,
            vpX: viewport.x,
            vpY: viewport.y
        };
    } // initDrawData        
        
    function initThree() {
        var xSeg, ySeg;
        
        if (container) {
            // initialise the viewport height and width
            vpWidth = view.width = container.offsetWidth;
            vpHeight = view.height = container.offsetHeight;
            
            // calculate the number of x segments
            xSeg = (vpWidth / TILE_SIZE | 0) + 1;
            ySeg = (vpHeight / TILE_SIZE | 0) + 1;

			scene = new THREE.Scene();

			var light, object, material;

			light = new THREE.DirectionalLight( 0x00aaff, 2.0 );
			light.position.z = 1;
			scene.addLight( light );

			light = new THREE.DirectionalLight( 0x000040, 0.5 );
			light.position.z = - 1;
			scene.addLight( light );

			tileBg = new THREE.Mesh(
			    new Plane(xSeg * TILE_SIZE, ySeg * TILE_SIZE, xSeg, ySeg), 
				new THREE.MeshBasicMaterial({ 
				    color: 0xffffff, 
				    wireframe: true
				})
			);
			scene.addObject(tileBg);
			
			camera = new THREE.Camera(45, vpWidth / vpHeight, 1, 1500, tileBg);
			camera.position.z = 150;

			// create a plane for the tiles
			tilePlane = new Plane(TILE_SIZE, TILE_SIZE, 4, 4);

			renderer = new THREE.WebGLRenderer();
			renderer.setSize(vpWidth, vpHeight);
            
            // add the canvas to the container
            container.appendChild(renderer.domElement);
        } // if
    } // createCanvas
    
    function initMesh(mesh, drawable, x, y) {
        // set the mesh position
        mesh.position.x = x || drawable.xy.x;
        mesh.position.y = (y || drawable.xy.y) * -1;
        
        if (drawable.scaling !== 1) {
            mesh.scale = new THREE.Vector3(drawable.scaling, drawable.scaling, drawable.scaling);
        } // if
        
        // add to the active objects
        activeObjects[drawable.id] = drawable;
    } // initMesh
    
    function loadTileMesh(tile) {
        // flag the tile as loading
        tile.loading = true;
        
        T5.getImage(tile.url, function(image) {
            // if the tile is still current, then load the mesh
            if (currentObjects[tile.id]) {
                var texture = new THREE.Texture(image),
                    mesh = tile.mesh = new THREE.Mesh(
                        tilePlane,
                        new THREE.MeshBasicMaterial({
                            map: texture
                        })
                    );

                // set the id of the mesh object
                mesh.id = tile.id;

                // clear the loading flag
                tile.loading = false;
                
                // add the tile to the active objects list
                activeObjects[tile.id] = tile;

                // flag the texture as needing an update
                texture.needsUpdate = true;

                // update the mesh position and add to the scene
                mesh.position.x = tile.x + tile.w / 2;
                mesh.position.y = -(tile.y + tile.h / 2);
                scene.addObject(mesh);
                
                // invalidate the view
                view.invalidate();
            } // if
        });
    } // loadTileMesh
    
    function removeOldObjects(testIds) {
        var deletedKeys = [];
        
        // iterate through the active objects 
        // TODO: use something other than a for in loop please...
        for (var objId in activeObjects) {
            var drawable = activeObjects[objId];
            
            // if the object is not in the current objects, remove from the scene
            if (! currentObjects[objId]) {
                scene.removeChild(drawable.mesh);
                
                // reset the mesh
                drawable.mesh = null;
                
                // add to the deleted keys
                deletedKeys[deletedKeys.length] = objId;
            } // if
        } // for
        
        // remove the deleted keys from the active objects
        for (var ii = deletedKeys.length; ii--; ) {
            delete activeObjects[deletedKeys[ii]];
        } // for
    } // removeOldObjects
    
    /* exports */
    
    function applyStyle(styleId) {
    } // applyStyle
    
    function applyTransform(drawable) {
        var translated = drawable.translateX !== 0 || drawable.translateY !== 0,
            transformed = translated || drawable.scaling !== 1 || drawable.rotation !== 0;
            
        if (transformed && drawable.mesh) {
            var scale = drawable.mesh.scale;
            
            scale.x = scale.y = scale.z = drawable.scaling;
            
            // initialise the transform
            transform = {
                undo: function() {
                    transform = null;
                },
                
                x: drawable.xy.x,
                y: drawable.xy.y
            };
            

            /*
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
            */
        } // if
        
        return transform;
    } // applyTransform
    
    function drawTiles(viewport, tiles) {
        var tile,
            offsetX = transform ? transform.x : drawOffsetX,
            offsetY = transform ? transform.y : drawOffsetY,
            ii,
            tileIds = [];
            
        for (ii = tiles.length; ii--; ) {
            tile = tiles[ii];
            
            // add the tile id to the active objects list
            currentObjects[tile.id] = tile;
            
            // show or hide the image depending on whether it is in the viewport
            if ((! tile.mesh) && (! tile.loading)) {
                loadTileMesh(tile);
            } // if
        } // for
    } // drawTiles
    
    function prepare(layers, viewport, state, tickCount, hitData) {
        // update the offset x and y
        drawOffsetX = viewport.x;
        drawOffsetY = viewport.y;
            
        // initialise the viewport
        // viewport = T5.XYRect.init(drawOffsetX, drawOffsetY, drawOffsetX + vpWidth, drawOffsetY - vpHeight);
        
        // move the tile bg
        camera.position.x = tileBg.position.x = drawOffsetX + vpWidth / 2;
        tileBg.position.y = -drawOffsetY - vpHeight / 2;
        camera.position.y = tileBg.position.y - 200 / viewport.scaleFactor;
        
        camera.position.z = 150 / viewport.scaleFactor;
        
        // reset the current objects array
        currentObjects = {};
        
        return true;
    } // prepare
    
    /**
    ### prepArc(drawable, viewport, hitData, state, opts)
    */
    function prepArc(drawable, viewport, hitData, state, opts) {
        if (! drawable.mesh) {
            var sphere = new Sphere(drawable.size, 15, 15),
                mesh = drawable.mesh = new THREE.Mesh(
                    sphere,
                    /*
                    new THREE.MeshBasicMaterial({
                        color: 0xff0000, 
                        blending: THREE.AdditiveBlending 
                    }),
                    */
                    new THREE.MeshLambertMaterial({
                        color: 0xdddddd, 
                        shading: THREE.FlatShading 
                    })
                );
                
            // prep the mesh and add to the scene
            initMesh(mesh, drawable);
            
            // rotate the sphere...
            mesh.rotation.x = Math.PI / 2;
            
            // add to the scene
            scene.addObject(mesh);
        } // if
        
        // flag as a current object
        currentObjects[drawable.id] = drawable;
        
        return initDrawData(viewport, hitData, state);
    } // prepArc
    
    /**
    ### prepImage(drawable, viewport, hitData, state, opts)
    */
    function prepImage(drawable, viewport, hitData, state, opts) {
        var image = opts.image || drawable.image;
        
        if (image && (! drawable.mesh)) {
            var plane = new Plane(image.width, image.height),
                drawX = (opts.x || drawable.xy.x) + image.width / 2,
                drawY = (opts.y || drawable.xy.y) + image.height / 2,
                texture = new THREE.Texture(image),
                mesh = drawable.mesh = new THREE.Mesh(
                    plane,
                    new THREE.MeshBasicMaterial({
                        map: texture
                    })
                );
                
            texture.needsUpdate = true;
            
            // prep the mesh and add to the scene
            initMesh(mesh, drawable, drawX, drawY);
            mesh.position.z = 1;
            
            
            scene.addObject(mesh);
        }
        
        // flag as a current object
        currentObjects[drawable.id] = drawable;
        
        return initDrawData(viewport, hitData, state);
    } // prepImage    
    
    function render() {
        // remove any old objects
        removeOldObjects();
        
        // render the scene
        renderer.render(scene, camera);
    } // render
    
    function reset() {
        currentObjects = {};
        removeOldObjects();
    } // reset
    
    /* initialization */
    
    // initialise the container
    initThree();

    var _this = COG.extend(baseRenderer, {
        interactTarget: renderer.domElement,
        
        applyStyle: applyStyle,
        applyTransform: applyTransform,
        drawTiles: drawTiles,
        
        prepare: prepare,
        prepArc: prepArc,
        prepImage: prepImage,
        
        render: render,
        reset: reset,
        
        getCamera: function() {
            return camera;
        },
        
        getContext: function() { 
            return context;
        },
        
        getDimensions: function() {
            return {
                width: vpWidth,
                height: vpHeight
            };
        }
    });
    
    COG.info('created three:webgl renderer');
    
    return _this;
});