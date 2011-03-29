T5.registerRenderer('three:webgl', function(view, container, params, baseRenderer) {
    params = COG.extend({
    }, params);

    /* internals */

    var TILE_SIZE = 256,
        camera,
        scene,
        renderer,
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

            mesh.position.x = tile.x;
            mesh.position.y = -tile.y;
            scene.addObject(mesh);
        });
    } // loadTileMesh

    /* exports */

    function applyStyle(styleId) {
    } // applyStyle

    function applyTransform(drawable) {
    } // applyTransform

    function drawTiles(viewport, tiles) {
        var tile,
            offsetX = transform ? transform.x : drawOffsetX,
            offsetY = transform ? transform.y : drawOffsetY,
            mesh,
            ii,
            tileIds = [];

        COG.info('drawing tiles, viewport: x = ' + viewport.x + ', y = ' + viewport.y);

        for (ii = tiles.length; ii--; ) {
            tile = tiles[ii];
            tileIds[tileIds.length] = tile.id;
            mesh = tile.mesh;

            if ((! mesh) && (! tile.loading)) {
                loadTileMesh(tile);
            } // if
        } // for

        for (ii = lastTiles.length; ii--; ) {
            tile = lastTiles[ii];

            if (tile.mesh && (tileIds.indexOf(tile.id) < 0)) {
                scene.removeObject(tile.mesh);
                tile.mesh = null;
            } // if
        } // for

        lastTiles = [].concat(tiles);
    } // drawTiles

    function prepare(layers, viewport, state, tickCount, hitData) {
        drawOffsetX = viewport.x;
        drawOffsetY = viewport.y;


        camera.position.x = tileBg.position.x = drawOffsetX;
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
