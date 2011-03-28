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
        drawOffsetX = 0,
        drawOffsetY = 0,
        transform = null,
        previousStyles = {},

        drawFn = function(fill) {

        };

    function initThree() {
        var xSeg, ySeg;

        if (container) {
            vpWidth = view.w = container.offsetWidth;
            vpHeight = view.h = container.offsetHeight;

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

			tilePlane = new Plane(TILE_SIZE, TILE_SIZE, 4, 4);

			renderer = new THREE.WebGLRenderer();
			renderer.setSize(vpWidth, vpHeight);

            container.appendChild(renderer.domElement);
        } // if
    } // createCanvas

    function loadTileMesh(tile) {
        tile.loading = true;

        T5.getImage(tile.url, function(image) {
            var texture = new THREE.Texture(image),
                mesh = tile.mesh = new THREE.Mesh(
                    tilePlane,
                    new THREE.MeshBasicMaterial({
                        map: texture
                    })
                );

            tile.loading = false;

            texture.needsUpdate = true;

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

            inViewport = tile.x >= minX && tile.x <= maxX &&
                tile.y >= minY && tile.y <= maxY;

            if (inViewport && (! mesh) && (! tile.loading)) {
                loadTileMesh(tile);
            } // if
        } // for
    } // drawTiles

    function prepare(layers, viewport, state, tickCount, hitData) {
        drawOffsetX = viewport.x;
        drawOffsetY = viewport.y;


        camera.position.x = tileBg.position.x = drawOffsetX + vpWidth;
        tileBg.position.y = -drawOffsetY;
        camera.position.y = tileBg.position.y - 500;

        return true;
    } // prepare

    function render() {
        renderer.render(scene, camera);
    } // render

    /* initialization */

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
        }
    });

    COG.info('created three:webgl renderer');

    return _this;
});
