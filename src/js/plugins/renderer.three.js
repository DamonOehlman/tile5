T5.registerRenderer('three:webgl', function(view, container, params, baseRenderer) {
    params = COG.extend({
    }, params);
    
    /* internals */
    
    var TILE_SIZE = 256,
        camera,
        scene,
        renderer,
        tileBg,
        tilePlane,
        materials,
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
        
    function initThree() {
        var xSeg, ySeg;
        
        if (container) {
            // initialise the viewport height and width
            vpWidth = view.width = container.offsetWidth;
            vpHeight = view.height = container.offsetHeight;
            
            // calculate the number of x segments
            xSeg = (vpWidth / TILE_SIZE | 0) + 2;
            ySeg = (vpHeight / TILE_SIZE | 0) + 2;

			scene = new THREE.Scene();

			var light, object, material;

			light = new THREE.DirectionalLight( 0x00aaff, 2.0 );
			light.position.z = 1;
			scene.addLight( light );

			light = new THREE.DirectionalLight( 0x000040, 0.5 );
			light.position.z = - 1;
			scene.addLight( light );

			tileBg = new THREE.Mesh(
			    new Plane(xSeg * TILE_SIZE, ySeg * TILE_SIZE, 16, 16), 
				new THREE.MeshBasicMaterial({ 
				    color: 0xffffff, 
				    wireframe: true
				})
			);
			scene.addObject(tileBg);
			
			camera = new THREE.Camera(45, vpWidth / vpHeight, 1, 2000, tileBg);
			camera.position.z = 500;

			// create a plane for the tiles
			tilePlane = new Plane(TILE_SIZE, TILE_SIZE, 4, 4);

			renderer = new THREE.WebGLRenderer();
			renderer.setSize(vpWidth, vpHeight);
            
            // add the canvas to the container
            container.appendChild(renderer.domElement);
        } // if
    } // createCanvas
    
    function loadTileMesh(tile) {
        // flag the tile as loading
        tile.loading = true;
        
        T5.getImage(tile.url, function(image) {
            var texture = new THREE.Texture(image),
                mesh = tile.mesh = new THREE.Mesh(
                    tilePlane,
                    new THREE.MeshBasicMaterial({
                        map: texture
                    })
                );
                
            // clear the loading flag
            tile.loading = false;
                
            // flag the texture as needing an update
            texture.needsUpdate = true;

            // update the mesh position and add to the scene
            mesh.position.x = tile.x + (vpWidth >> 1);
            mesh.position.y = -tile.y;
            scene.addObject(mesh);
        });
    } // loadTileMesh
    
    /* exports */
    
    function applyStyle(styleId) {
    } // applyStyle
    
    function applyTransform(drawable) {
    } // applyTransform
    
    function drawTiles(tiles) {
        var tile,
            inViewport,
            offsetX = transform ? transform.x : drawOffsetX,
            offsetY = transform ? transform.y : drawOffsetY,
            minX = offsetX - 256,
            minY = offsetY - 256,
            maxX = offsetX + vpWidth,
            maxY = offsetY + vpHeight,
            halfWidth = vpWidth >> 1,
            halfHeight = vpHeight >> 1,
            relX, relY,
            texture,
            mesh;
            
        for (var ii = tiles.length; ii--; ) {
            tile = tiles[ii];
            mesh = tile.mesh;
            
            // check whether the image is in the viewport or not
            inViewport = tile.x >= minX && tile.x <= maxX && 
                tile.y >= minY && tile.y <= maxY;
            
            // show or hide the image depending on whether it is in the viewport
            if (inViewport && (! mesh) && (! tile.loading)) {
                loadTileMesh(tile);
            } // if
        } // for    
    } // drawTiles
    
    function prepare(layers, state, tickCount, hitData) {
        var viewOffset = view.getOffset(),
            scaleFactor = view.getScaleFactor();
            
        // update the offset x and y
        drawOffsetX = viewOffset.x;
        drawOffsetY = viewOffset.y;
            
        // initialise the viewport
        viewport = T5.XYRect.init(drawOffsetX, drawOffsetY, drawOffsetX + vpWidth, drawOffsetY - vpHeight);
        viewport.scaleFactor = scaleFactor;
        
        // move the tile bg
        camera.position.x = tileBg.position.x = drawOffsetX + vpWidth;
        tileBg.position.y = -drawOffsetY;
        camera.position.y = tileBg.position.y - 500;
        
        return true;
    } // prepare
    
    function render() {
        renderer.render(scene, camera);
    } // render
    
    /* initialization */
    
    // initialise the container
    initThree();

    var _this = COG.extend(baseRenderer, {
        interactTarget: renderer.domElement,
        
        applyStyle: applyStyle,
        applyTransform: applyTransform,
        drawTiles: drawTiles,
        prepare: prepare,
        render: render,
        
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
        },
        
        getViewport: function() {
            return viewport;
        }
    });
    
    COG.info('created three:webgl renderer');
    
    return _this;
});