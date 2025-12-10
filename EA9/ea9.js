"use strict";

var gl;
var canvas;
var prog;

var model;
var useProceduralTexture = false;

var camera = {
    eye: [0, 2, 5],
    center: [0, 0, 0],
    up: [0, 1, 0],
    rotationX: 0,
    rotationY: 0
};

function start() {
    canvas = document.getElementById("canvas");
    gl = canvas.getContext("experimental-webgl");

    if (!gl) {
        console.log("WebGL nicht verfügbar");
        return;
    }

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    initShaders();
    initTexture();
    initModel();
    initEventHandlers();

    render();
}

function initShaders() {
    var vs = getShaderSource("vertexshader");
    var fs = getShaderSource("fragmentshader");

    var vertexShader = compileShader(gl.VERTEX_SHADER, vs);
    var fragmentShader = compileShader(gl.FRAGMENT_SHADER, fs);

    prog = gl.createProgram();
    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.log("Shader linking fehlgeschlagen: " + gl.getProgramInfoLog(prog));
        return;
    }

    gl.useProgram(prog);

    prog.aPosition = gl.getAttribLocation(prog, "aPosition");
    prog.aNormal = gl.getAttribLocation(prog, "aNormal");
    prog.aTextureCoord = gl.getAttribLocation(prog, "aTextureCoord");

    prog.uPMatrix = gl.getUniformLocation(prog, "uPMatrix");
    prog.uMVMatrix = gl.getUniformLocation(prog, "uMVMatrix");
    prog.uNMatrix = gl.getUniformLocation(prog, "uNMatrix");

    prog.uLightPosition = gl.getUniformLocation(prog, "uLight.position");
    prog.uLightColor = gl.getUniformLocation(prog, "uLight.color");

    prog.uMaterialKa = gl.getUniformLocation(prog, "uMaterial.ka");
    prog.uMaterialKd = gl.getUniformLocation(prog, "uMaterial.kd");
    prog.uMaterialKs = gl.getUniformLocation(prog, "uMaterial.ks");
    prog.uMaterialKe = gl.getUniformLocation(prog, "uMaterial.ke");

    prog.uAmbientLight = gl.getUniformLocation(prog, "uAmbientLight");
    prog.uTexture = gl.getUniformLocation(prog, "uTexture");
    prog.uUseProceduralTexture = gl.getUniformLocation(prog, "uUseProceduralTexture");
}

function getShaderSource(id) {
    var script = document.getElementById(id);
    return script.textContent;
}

function compileShader(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log("Shader compile error: " + gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function initTexture() {
    var texture = gl.createTexture();
    texture.loaded = false;
    texture.image = new Image();

    texture.image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
        texture.loaded = true;
        render();
    };

    texture.image.src = "texture.jpg";

    window.texture = texture;
}

function initModel() {
    torus.createVertexData.apply(torus);

    model = {};
    model.vertices = torus.vertices;
    model.normals = torus.normals;
    model.textureCoord = torus.textureCoord;
    model.indices = torus.indicesTris;

    model.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, model.vertices, gl.STATIC_DRAW);

    model.nbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.nbo);
    gl.bufferData(gl.ARRAY_BUFFER, model.normals, gl.STATIC_DRAW);

    model.tbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.tbo);
    gl.bufferData(gl.ARRAY_BUFFER, model.textureCoord, gl.STATIC_DRAW);

    model.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indices, gl.STATIC_DRAW);

    model.mMatrix = mat4.create();
    mat4.identity(model.mMatrix);
    mat4.rotateX(model.mMatrix, model.mMatrix, -Math.PI / 6);

    model.material = {
        ka: [0.2, 0.2, 0.2],
        kd: [0.9, 0.9, 0.9],
        ks: [0.1, 0.1, 0.1],
        ke: 5.0
    };
}

function initEventHandlers() {
    var deltaMove = 0.3;
    var deltaRotate = Math.PI / 36;

    document.addEventListener("keydown", function(event) {
        var key = event.key;

        switch (key) {
            case "ArrowLeft":
            case "ArrowRight":
            case "ArrowUp":
            case "ArrowDown":
                event.preventDefault();
                break;
        }

        switch (key) {
            case "t":
            case "T":
                toggleTexture();
                break;
            case "w":
            case "W":
                camera.eye[1] += deltaMove;
                camera.center[1] += deltaMove;
                break;
            case "s":
            case "S":
                camera.eye[1] -= deltaMove;
                camera.center[1] -= deltaMove;
                break;
            case "a":
            case "A":
                camera.eye[0] -= deltaMove;
                camera.center[0] -= deltaMove;
                break;
            case "d":
            case "D":
                camera.eye[0] += deltaMove;
                camera.center[0] += deltaMove;
                break;
            case "ArrowLeft":
                camera.rotationY -= deltaRotate;
                break;
            case "ArrowRight":
                camera.rotationY += deltaRotate;
                break;
            case "ArrowUp":
                camera.rotationX -= deltaRotate;
                break;
            case "ArrowDown":
                camera.rotationX += deltaRotate;
                break;
        }

        render();
    });

    document.getElementById("toggleTexture").addEventListener("click", function() {
        toggleTexture();
    });
}

function toggleTexture() {
    useProceduralTexture = !useProceduralTexture;
    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var pMatrix = mat4.create();
    var aspect = canvas.width / canvas.height;
    mat4.perspective(pMatrix, Math.PI / 4, aspect, 0.1, 100.0);
    gl.uniformMatrix4fv(prog.uPMatrix, false, pMatrix);

    var vMatrix = mat4.create();
    mat4.lookAt(vMatrix, camera.eye, camera.center, camera.up);

    mat4.rotateX(vMatrix, vMatrix, camera.rotationX);
    mat4.rotateY(vMatrix, vMatrix, camera.rotationY);

    var lightPosition = [3.0, 4.0, 5.0];
    gl.uniform3fv(prog.uLightPosition, lightPosition);
    gl.uniform3fv(prog.uLightColor, [1.0, 1.0, 1.0]);
    gl.uniform3fv(prog.uAmbientLight, [0.3, 0.3, 0.3]);
    gl.uniform1i(prog.uUseProceduralTexture, useProceduralTexture ? 1 : 0);

    if (window.texture && window.texture.loaded) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, window.texture);
        gl.uniform1i(prog.uTexture, 0);
    }

    var mvMatrix = mat4.create();
    mat4.multiply(mvMatrix, vMatrix, model.mMatrix);
    gl.uniformMatrix4fv(prog.uMVMatrix, false, mvMatrix);

    var nMatrix = mat3.create();
    mat3.normalFromMat4(nMatrix, mvMatrix);
    gl.uniformMatrix3fv(prog.uNMatrix, false, nMatrix);

    gl.uniform3fv(prog.uMaterialKa, model.material.ka);
    gl.uniform3fv(prog.uMaterialKd, model.material.kd);
    gl.uniform3fv(prog.uMaterialKs, model.material.ks);
    gl.uniform1f(prog.uMaterialKe, model.material.ke);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo);
    gl.enableVertexAttribArray(prog.aPosition);
    gl.vertexAttribPointer(prog.aPosition, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.nbo);
    gl.enableVertexAttribArray(prog.aNormal);
    gl.vertexAttribPointer(prog.aNormal, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.tbo);
    gl.enableVertexAttribArray(prog.aTextureCoord);
    gl.vertexAttribPointer(prog.aTextureCoord, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.ibo);
    gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
}

window.onload = start;
