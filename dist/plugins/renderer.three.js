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
        guides: false
    }, params);

    /* internals */

    var TILE_SIZE = 256,
        camera,
        scene,
        renderer,
        activeObjects = {},
        activeTiles = {},
        currentObjects = {},
        currentTiles = {},
        currentStyle = 'basic',
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

        xGeom.vertices.push(new THREE.Vertex(new THREE.Vector3(0, 0, 0)));
        xGeom.vertices.push(new THREE.Vertex(new THREE.Vector3(128, 0, 0)));

        yGeom.vertices.push(new THREE.Vertex(new THREE.Vector3(0, 0, 0)));
        yGeom.vertices.push(new THREE.Vertex(new THREE.Vector3(0, 128, 0)));

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

        for (var ii = guides.length; ii--; ) {
            guides[ii].position.y = 1;
            scene.addObject(guides[ii]);
        } // for
    }

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

    function handleDetach() {

        container.removeChild(renderer.domElement);
    } // handleDetach

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
            draw: drawFn || meshDraw,
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

            globalLight = light = new THREE.DirectionalLight( 0xffffff, 2.0 );
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
                    color: 0xdddddd,
                    wireframe: true
                })
            );

            if (params.guides) {
                createGuides();
            } // guides

            tileBg.rotation.x = -Math.PI / 2;
            tileBg.position.y = -1;
            scene.addObject(tileBg);

            globalCamera = camera = new THREE.Camera(45, vpWidth / vpHeight, 1, 2000, tileBg);

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

            mesh.id = tile.id;
            mesh.rotation.x = -Math.PI / 2;

            texture.needsUpdate = true;

            mesh.position.x = tile.x + tile.w / 2;
            mesh.position.z = tile.y + tile.h / 2;
            scene.addObject(mesh);

            view.invalidate();
        });
    } // loadTileMesh

    function removeOldObjects(activeObj, currentObj, flagField) {
        var deletedKeys = [];

        for (var objId in activeObj) {
            var item = activeObj[objId],
                inactive = flagField ? item[flagField] : (! currentObj[objId]);

            if (inactive) {
                if (item.mesh) {
                    scene.removeChild(item.mesh);

                    item.mesh = null;
                } // if

                deletedKeys[deletedKeys.length] = objId;
            } // if
        } // for

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

    } // shiftViewport

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
        var mesh = drawable.mesh,
            translated = drawable.translateX !== 0 || drawable.translateY !== 0,
            transformed = translated || drawable.scaling !== 1 || drawable.rotation !== 0;

        if (mesh && (transformed || drawable.transformed)) {
            mesh.scale.x = mesh.scale.y = mesh.scale.z = drawable.scaling;
            mesh.rotation.y = -drawable.rotation;

            mesh.position.x = drawable.xy.x + drawable.translateX;
            mesh.position.y = drawable.z - drawable.translateY;

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

            if ((! tile.mesh) && (! activeTiles[tile.id])) {
                loadTileMesh(tile);
            } // if

            currentTiles[tile.id] = tile;
        } // for
    } // drawTiles

    function meshDraw(drawData) {
        var mesh = this.mesh;

        if (mesh) {
            var styleMaterials = mesh instanceof THREE.Line ? lineMaterials : meshMaterials,
                materials = styleMaterials[currentStyle] || styleMaterials.basic;

            currentObjects[this.id] = this;

            mesh.position.x = (drawData.x || this.xy.x) + this.translateX;
            mesh.position.z = (drawData.y || this.xy.y);

            if (this.materials) {
                materials = materials.concat(this.materials);
            } // if

            mesh.materials = materials;
        } // if
    } // meshDraw

    function meshInit(mesh, drawable, x, y, z) {
        drawable.z = z || drawable.z || 1;

        mesh.position.x = (x || drawable.xy.x) + drawable.translateX;
        mesh.position.y = drawable.z - drawable.translateY;
        mesh.position.z = (y || drawable.xy.y);

        if (drawable.scaling !== 1) {
            mesh.scale = new THREE.Vector3(drawable.scaling, drawable.scaling, drawable.scaling);
        } // if

        activeObjects[drawable.id] = drawable;

        scene.addObject(mesh);
    } // meshInit

    function prepare(layers, viewport, state, tickCount, hitData) {
        drawOffsetX = viewport.x;
        drawOffsetY = viewport.y;

        shiftViewport(
            viewport.x + (vpWidth >> 1),
            viewport.y + (vpHeight >> 1),
            viewport.scaleFactor
        );


        removeOldObjects(activeObjects, currentObjects);
        currentObjects = {};

        removeOldObjects(activeTiles, currentTiles);
        currentTiles = {};

        return true;
    } // prepare

    /**
    ### prepArc(drawable, viewport, hitData, state, opts)
    */
    function prepArc(drawable, viewport, hitData, state, opts) {
        if (! drawable.mesh) {
            var sphere = new Sphere(drawable.size, 15, 15),
                mesh = drawable.mesh = new THREE.Mesh(
                    sphere
                );

            meshInit(mesh, drawable);

            mesh.rotation.x = Math.PI / 2;
        } // if

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

            meshInit(mesh, drawable, drawX, drawY, 1);
        }

        return initDrawData(viewport, hitData, state);
    } // prepImage

    /**
    ### prepMarker(drawable, viewport, hitData, state, opts)
    */
    function prepMarker(drawable, viewport, hitData, state, opts) {
        if ((! drawable.mesh) && (! drawable.loading)) {
            var markerX = drawable.xy.x,
                markerY = drawable.xy.y,
                size = drawable.size,
                mesh;

            switch (drawable.markerStyle.toLowerCase()) {
                case 'image':
                    var materialKey = 'marker_image_' + drawable.imageUrl;

                    drawable.materials = getCachedMaterials(materialKey, function() {
                        return [
                            new THREE.MeshBasicMaterial({
                                map: ImageUtils.loadTexture(drawable.imageUrl)
                            })
                        ];
                    });

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

                meshInit(mesh, drawable);
            }
        } // if

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
                    1,
                    points[ii].y - offsetY
                )));
            } // for

            mesh = drawable.mesh = new THREE.Line(
                geometry,
                lineMaterials[currentStyle]
            );

            drawable.removeOnReset = true;

            meshInit(mesh, drawable);
        } // if

        return initDrawData(viewport, hitData, state);
    } // prepPoly

    function render() {
        renderer.render(scene, camera);
    } // render

    function reset() {
        currentTiles = {};
        removeOldObjects(activeTiles, currentTiles);

        removeOldObjects(activeObjects, currentObjects, 'removeOnReset');
    } // reset

    /* initialization */

    initThree();

    var _this = COG.extend(baseRenderer, {
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

    _this.bind('detach', handleDetach);

    loadStyles();
    COG.info('created three:webgl renderer');

    return _this;
});
