//= require <glMatrix>

T5.registerRenderer('webgl', function(view, container, params, baseRenderer) {
    params = COG.extend({
    }, params);
    
    /* some shaders */
    
    var DEFAULT_SHADER_FRAGMENT = [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',

            'varying vec2 vTextureCoord;',

            'uniform sampler2D uSampler;',

            'void main(void) {',
                'gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));',
            '}'
        ].join('\n'),
        
        DEFAULT_SHADER_VERTEX = [
            'attribute vec3 aVertexPosition;',
            'attribute vec2 aTextureCoord;',

            'uniform mat4 uMVMatrix;',
            'uniform mat4 uPMatrix;',

            'varying vec2 vTextureCoord;',

            'void main(void) {',
                'gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);',
                'vTextureCoord = aTextureCoord;',
            '}'
        ].join('\n');
    
    /* internals */
    
    var TILE_SIZE = 256,
        vpWidth,
        vpHeight,
        canvas,
        gl,
        shaderProgram,
        mvMatrix = mat4.create(),
        pMatrix = mat4.create(),
        tilesToRender = [],
        viewport,
        drawOffsetX = 0,
        drawOffsetY = 0,
        transform = null,
        previousStyles = {},
        squareVertexTextureBuffer;
        
    function createTileBuffer(tile) {
        var texture, buffer,
            x1, x2, y1, y2,
            vertices;
            
        // flag the tile as loading
        tile.loading = true;
        
        T5.getImage(tile.url, function(image) {
            texture = tile.texture = gl.createTexture();
            texture.image = image;
            
            // finished loading, clear flag
            tile.loading = false;
            
            // initialise the texture
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);
            
            // initialise the tile verticies
            x1 = tile.x;
            y1 = -tile.y;
            x2 = x1 + tile.w;
            y2 = y1 + tile.h;
            vertices = [
                 x2, y2, 0,
                 x1, y2, 0,
                 x2, y1, 0,
                 x1, y1, 0
            ];
            
            // now create the tile buffer
            buffer = tile.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

            buffer.itemSize = 3;
            buffer.numItems = 4;            
        });
    } // createTileBuffer
        
    function init() {
        var xSeg, ySeg;
        
        if (container) {
            // initialise the viewport height and width
            vpWidth = view.width = container.offsetWidth;
            vpHeight = view.height = container.offsetHeight;
            
            // calculate the number of x segments
            xSeg = (vpWidth / TILE_SIZE | 0) + 2;
            ySeg = (vpHeight / TILE_SIZE | 0) + 2;

            // create the canvas
            canvas = T5.newCanvas(vpWidth, vpHeight);
            canvas.style.cssText = 'position: absolute; z-index: 1;';
            
            // get the webgl context
            gl = canvas.getContext('experimental-webgl');
            gl.viewportWidth = vpWidth;
            gl.viewportHeight = vpHeight;

            // add the canvas to the container
            container.appendChild(canvas);
            
            // initialise the shaders
            initShaders();
            
            // initialise the buffers
            initBuffers();
            
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.enable(gl.DEPTH_TEST);
        } // if
    } // init
    
    function initBuffers() {
        var vertices = [
            1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ];
        
        squareVertexTextureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        squareVertexTextureBuffer.itemSize = 2;
        squareVertexTextureBuffer.numItems = 4;
    } // initBuffers    
    
    function initShaders() {
        
        function createShader(type, source) {
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            
            return shader;
        } // createShader
        
        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, 
            createShader(gl.FRAGMENT_SHADER, DEFAULT_SHADER_FRAGMENT)
        );
        
        gl.attachShader(shaderProgram, 
            createShader(gl.VERTEX_SHADER, DEFAULT_SHADER_VERTEX)
        );
        
        gl.linkProgram(shaderProgram);
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            COG.warn("Could not initialise shaders");
        }
 
        gl.useProgram(shaderProgram);
 
        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
 
        shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
 
        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    } // initShaders
    
    function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    } // setMatrixUniforms
    
    /* exports */
    
    function applyStyle(styleId) {
    } // applyStyle
    
    function applyTransform(drawable) {
    } // applyTransform
    
    function arc(x, y, radius, startAngle, endAngle) {
    } // arc
    
    function drawTiles(viewport, tiles) {
        var tile,
            inViewport,
            offsetX = transform ? transform.x : drawOffsetX,
            offsetY = transform ? transform.y : drawOffsetY,
            minX = offsetX - 256,
            minY = offsetY - 256,
            maxX = offsetX + vpWidth,
            maxY = offsetY + vpHeight,
            relX, relY;
            
        for (var ii = tiles.length; ii--; ) {
            tile = tiles[ii];
            
            // calculate the image relative position
            relX = tile.screenX = tile.x - offsetX;
            relY = tile.screenY = tile.y - offsetY;

            // show or hide the image depending on whether it is in the viewport
            if ((! tile.buffer) && (! tile.loading)) {
                createTileBuffer(tile);
            } // if
            
            // add the buffer to the list
            if (tile.buffer) {
                tilesToRender[tilesToRender.length] = tile;
            } // if
        } // for
    } // drawTiles
    
    function image(image, x, y, width, height) {
    } // image    
    
    function prepare(layers, viewport, state, tickCount, hitData) {
        // update the offset x and y
        drawOffsetX = viewport.x;
        drawOffsetY = viewport.y;
        
        // reset the draw buffers
        tilesToRender = [];
            
        gl.viewport(0, 0, vpWidth, vpHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
 
        mat4.perspective(45, vpWidth / vpHeight, 0.1, 1000, pMatrix);
 
        mat4.identity(mvMatrix);
        mat4.rotate(mvMatrix, -Math.PI / 4, [1, 0, 0]);
        mat4.translate(mvMatrix, [
            -drawOffsetX - vpWidth / 2, 
            drawOffsetY + vpHeight / 2, 
            -200 / viewport.scaleFactor]
        ); 
        
        return true;
    } // prepare
    
    function render() {
        // iterate through the tiles to render and render
        for (var ii = tilesToRender.length; ii--; ) {
            var tile = tilesToRender[ii];
            
            // set the tile buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, tile.buffer);
            gl.vertexAttribPointer(
                shaderProgram.vertexPositionAttribute, 
                tile.buffer.itemSize, 
                gl.FLOAT, 
                false,
                0, 
                0);

            // set the texture buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexTextureBuffer);
            gl.vertexAttribPointer(
                shaderProgram.textureCoordAttribute, 
                squareVertexTextureBuffer.itemSize, 
                gl.FLOAT, 
                false, 
                0, 
                0);

            // activate the tile texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tile.texture);
            gl.uniform1i(shaderProgram.samplerUniform, 0);        

            // draw the tile
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, tile.buffer.numItems);
        } // for
        
        setMatrixUniforms();
    } // render
    
    function path(points) {
    } // path
    
    /* initialization */
    
    // initialise the container
    init();

    var _this = COG.extend(baseRenderer, {
        interactTarget: canvas,
        preventPartialScale: true,
        
        applyStyle: applyStyle,
        applyTransform: applyTransform,
        arc: arc,
        drawTiles: drawTiles,
        image: image,
        prepare: prepare,
        render: render,
        path: path,
        
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
    
    COG.info('created webgl renderer');
    
    return _this;
});