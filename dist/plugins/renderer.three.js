function ColorParser(color_string) {
    this.ok = false;

    if (color_string.charAt(0) == '#') { // remove # if any
        color_string = color_string.substr(1,6);
    }

    color_string = color_string.replace(/ /g,'');
    color_string = color_string.toLowerCase();

    var color_defs = [
        {
            re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
            example: ['rgb(123, 234, 45)', 'rgb(255,234,245)'],
            process: function (bits){
                return [
                    parseInt(bits[1], 10),
                    parseInt(bits[2], 10),
                    parseInt(bits[3], 10)
                ];
            }
        },
        {
            re: /^(\w{2})(\w{2})(\w{2})$/,
            example: ['#00ff00', '336699'],
            process: function (bits){
                return [
                    parseInt(bits[1], 16),
                    parseInt(bits[2], 16),
                    parseInt(bits[3], 16)
                ];
            }
        },
        {
            re: /^(\w{1})(\w{1})(\w{1})$/,
            example: ['#fb0', 'f0f'],
            process: function (bits){
                return [
                    parseInt(bits[1] + bits[1], 16),
                    parseInt(bits[2] + bits[2], 16),
                    parseInt(bits[3] + bits[3], 16)
                ];
            }
        }
    ];

    for (var i = 0; i < color_defs.length; i++) {
        var re = color_defs[i].re;
        var processor = color_defs[i].process;
        var bits = re.exec(color_string);
        if (bits) {
            channels = processor(bits);
            this.r = channels[0];
            this.g = channels[1];
            this.b = channels[2];
            this.ok = true;
        }

    }

    this.r = (this.r < 0 || isNaN(this.r)) ? 0 : ((this.r > 255) ? 255 : this.r);
    this.g = (this.g < 0 || isNaN(this.g)) ? 0 : ((this.g > 255) ? 255 : this.g);
    this.b = (this.b < 0 || isNaN(this.b)) ? 0 : ((this.b > 255) ? 255 : this.b);

    this.toRGB = function () {
        return 'rgb(' + this.r + ', ' + this.g + ', ' + this.b + ')';
    };

    this.toHex = function () {
        var r = this.r.toString(16);
        var g = this.g.toString(16);
        var b = this.b.toString(16);
        if (r.length == 1) r = '0' + r;
        if (g.length == 1) g = '0' + g;
        if (b.length == 1) b = '0' + b;
        return parseInt('0x' + r + g + b, 16);
    };
}

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
        currentStyle = 'basic',
        lastTiles = [],
        tileBg,
        tilePlane,
        tileMaterials = [],
        materials,
        vpWidth,
        vpHeight,
        cubes = [],
        defaultMarker,
        markerStyles = {},
        meshMaterials = {},
        lineMaterials = {},
        drawOffsetX = 0,
        drawOffsetY = 0,
        transform = null,
        textureCache = {},
        materialCache = {},
        previousStyles = {},

        defaultDrawFn = function(drawData) {
        };

    function createCube(size) {
        var realSize = size >> 1;
        return cubes[size] = new Cube(realSize, realSize, realSize);
    } // createCube

    function getCachedMaterials(materialKey, creator) {
        if ((! materialCache[materialKey]) && creator) {
            materialCache[materialKey] = creator();
        } // if

        return materialCache[materialKey];
    } // getCachedMaterial

    function getPreviousStyle(canvasId) {
        if (! previousStyles[canvasId]) {
            previousStyles[canvasId] = [];
        } // if

        return previousStyles[canvasId].pop() || 'basic';
    } // getPreviousStyle

    function handleStyleDefined(evt, styleId, styleData) {
        var fillColor = new ColorParser(styleData.fill || '#ffffff'),
            strokeColor = new ColorParser(styleData.stroke || '#ffffff');

        meshMaterials[styleId] = [
            new THREE.MeshLambertMaterial({
                color: fillColor.toHex(),
                shading: THREE.FlatShading
            })
        ];

        lineMaterials[styleId] = [
            new THREE.LineBasicMaterial({
                color: strokeColor.toHex(),
                opacity: styleData.opacity || 1,
                linewidth: styleData.lineWidth || 2
            })
        ];
    } // handleStyleDefined

    function initDrawData(viewport, hitData, state, drawFn) {
        var isHit = false;

        return {
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
            vpWidth = view.width = container.offsetWidth;
            vpHeight = view.height = container.offsetHeight;

            xSeg = (vpWidth / TILE_SIZE | 0) + 1;
            ySeg = (vpHeight / TILE_SIZE | 0) + 1;

            scene = new THREE.Scene();

            var light, object, material;

            light = new THREE.DirectionalLight( 0xffffff, 2.0 );
            light.position.z = 1;
            scene.addLight( light );

            /*
            light = new THREE.DirectionalLight( 0x000040, 0.5 );
            light.position.z = - 1;
            scene.addLight( light );
            */

            tileBg = new THREE.Mesh(
                new Plane(xSeg * TILE_SIZE, ySeg * TILE_SIZE, xSeg, ySeg),
                new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    wireframe: true
                })
            );
            tileBg.position.z = -1;
            scene.addObject(tileBg);

            camera = new THREE.Camera(45, vpWidth / vpHeight, 1, 1500, tileBg);
            camera.position.z = 150;

            tilePlane = new Plane(TILE_SIZE, TILE_SIZE, 4, 4);

            tileMaterials = [];

            renderer = new THREE.WebGLRenderer();
            renderer.setSize(vpWidth, vpHeight);

            container.appendChild(renderer.domElement);
        } // if

        initGeometries();

        initMaterials();
    } // createCanvas

    function initGeometries() {
        defaultMarker = new Cube(5, 5, 5);
    } // initGeometries

    function initMaterials() {
    } // initMaterials

    function initMesh(mesh, drawable, x, y, z) {
        drawable.zOffset = z || drawable.zOffset || 1;

        mesh.position.x = (x || drawable.xy.x) + drawable.translateX;
        mesh.position.y = (y || drawable.xy.y) * -1;
        mesh.position.z = drawable.zOffset - drawable.translateY;

        if (drawable.scaling !== 1) {
            mesh.scale = new THREE.Vector3(drawable.scaling, drawable.scaling, drawable.scaling);
        } // if

        activeObjects[drawable.id] = drawable;

        scene.addObject(mesh);
    } // initMesh

    function loadStyles() {
        for (var styleId in T5.styles) {
            handleStyleDefined(null, styleId, T5.styles[styleId]);
        } // for

        T5.bind('styleDefined', handleStyleDefined);
    } // loadStyles

    function loadTexture(imageUrl, mapping, callback) {
        T5.getImage(imageUrl, function(image) {
            var texture = new THREE.Texture(image, mapping);

            texture.needsUpdate = true;

            textureCache[imageUrl] = texture;

            if (callback) {
                callback(texture);
            } // if
        });
    } // loadTexture

    function loadTileMesh(tile) {
        tile.loading = true;

        T5.getImage(tile.url, function(image) {
            if (currentObjects[tile.id]) {
                var texture = new THREE.Texture(image),
                    mesh = tile.mesh = new THREE.Mesh(
                        tilePlane, [
                            new THREE.MeshBasicMaterial({
                                map: texture
                            })
                        ].concat(tileMaterials)
                    );

                mesh.id = tile.id;

                tile.loading = false;

                activeObjects[tile.id] = tile;

                texture.needsUpdate = true;

                mesh.position.x = tile.x + tile.w / 2;
                mesh.position.y = -(tile.y + tile.h / 2);
                scene.addObject(mesh);

                view.invalidate();
            } // if
        });
    } // loadTileMesh

    function removeOldObjects(testIds) {
        var deletedKeys = [];

        for (var objId in activeObjects) {
            var drawable = activeObjects[objId];

            if (! currentObjects[objId]) {
                scene.removeChild(drawable.mesh);

                drawable.mesh = null;

                deletedKeys[deletedKeys.length] = objId;
            } // if
        } // for

        for (var ii = deletedKeys.length; ii--; ) {
            delete activeObjects[deletedKeys[ii]];
        } // for
    } // removeOldObjects

    /* exports */

    function applyStyle(styleId) {
        var previousStyle = getPreviousStyle(container.id);

        if (meshMaterials[styleId]) {
            previousStyles[container.id].push(styleId);

            currentStyle = styleId;

            return previousStyle;
        } // if
    } // applyStyle

    function applyTransform(drawable) {
        var mesh = drawable.mesh,
            translated = drawable.translateX !== 0 || drawable.translateY !== 0,
            transformed = translated || drawable.scaling !== 1 || drawable.rotation !== 0;

        if (mesh && (transformed || drawable.transformed)) {
            mesh.scale.x = mesh.scale.y = mesh.scale.z = drawable.scaling;
            mesh.rotation.z = drawable.rotation;

            mesh.position.x = drawable.xy.x + drawable.translateX;
            mesh.position.z = -drawable.translateY + drawable.zOffset;

            transform = {
                undo: function() {
                    transform = null;
                },

                x: drawable.xy.x,
                y: drawable.xy.y
            };
        } // if

        drawable.transformed = transformed;

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

            currentObjects[tile.id] = tile;

            if ((! tile.mesh) && (! tile.loading)) {
                loadTileMesh(tile);
            } // if
        } // for
    } // drawTiles

    function prepare(layers, viewport, state, tickCount, hitData) {
        drawOffsetX = viewport.x;
        drawOffsetY = viewport.y;


        camera.position.x = tileBg.position.x = drawOffsetX + vpWidth / 2;
        tileBg.position.y = -drawOffsetY - vpHeight / 2;
        camera.position.y = tileBg.position.y - 200 / viewport.scaleFactor;

        camera.position.z = 150 / viewport.scaleFactor;

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
                    meshMaterials[currentStyle]
                );

            initMesh(mesh, drawable);

            mesh.rotation.x = Math.PI / 2;
        } // if

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
                        map: texture,
                        blending: THREE.BillboardBlending
                    })
                );

            texture.needsUpdate = true;

            initMesh(mesh, drawable, drawX, drawY, 1);
        }

        currentObjects[drawable.id] = drawable;

        return initDrawData(viewport, hitData, state);
    } // prepImage

    /**
    ### prepMarker(drawable, viewport, hitData, state, opts)
    */
    function prepMarker(drawable, viewport, hitData, state, opts) {
        if (! drawable.mesh) {
            var markerX = drawable.xy.x,
                markerY = drawable.xy.y,
                size = drawable.size,
                mesh;

            switch (drawable.markerStyle.toLowerCase()) {
                case 'image':
                    var materialKey = 'marker_image_' + drawable.imageUrl,
                        materials = getCachedMaterials(materialKey, function() {
                            return [
                                new THREE.MeshBasicMaterial({
                                    map: ImageUtils.loadTexture(drawable.imageUrl)
                                })
                            ];
                        });

                    mesh = drawable.mesh = new THREE.Mesh(
                        cubes[drawable.size] || createCube(drawable.size),
                        meshMaterials[currentStyle].concat(materials)
                    );

                    break;

                default:
                    mesh = drawable.mesh = new THREE.Mesh(
                        cubes[drawable.size] || createCube(drawable.size),
                        meshMaterials[currentStyle]
                    );
            } // switch


            if (mesh) {
                drawable.zOffset = size >> 1;

                initMesh(mesh, drawable);
            }
        } // if

        currentObjects[drawable.id] = drawable;

        return initDrawData(viewport, hitData, state);
    } // prepMarker

    /**
    ### prepPoly(drawable, viewport, hitData, state, opts)
    */
    function prepPoly(drawable, viewport, hitData, state, opts) {
        if (! drawable.mesh) {
            var points = opts.points || drawable.points,
                geometry = new THREE.Geometry(),
                offsetX = drawable.xy.x,
                offsetY = drawable.xy.y,
                mesh;

            for (var ii = points.length; ii--; ) {
                geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(
                    points[ii].x - offsetX,
                    (points[ii].y - offsetY) * -1,
                    1)));
            } // for

            mesh = drawable.mesh = new THREE.Line(
                geometry,
                lineMaterials[currentStyle]
            );

            initMesh(mesh, drawable);
        } // if

        currentObjects[drawable.id] = drawable;

        return initDrawData(viewport, hitData, state);
    } // prepPoly

    function render() {
        removeOldObjects();

        renderer.render(scene, camera);
    } // render

    function reset() {
        currentObjects = {};
        removeOldObjects();
    } // reset

    /* initialization */

    initThree();

    var _this = COG.extend(baseRenderer, {
        interactTarget: renderer.domElement,

        applyStyle: applyStyle,
        applyTransform: applyTransform,
        drawTiles: drawTiles,

        prepare: prepare,
        prepArc: prepArc,
        prepImage: prepImage,
        prepMarker: prepMarker,
        prepPoly: prepPoly,

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

    loadStyles();
    COG.info('created three:webgl renderer');

    return _this;
});
