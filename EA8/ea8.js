"use strict";

var gl;
var canvas;
var prog;

var models = [];
var lightAngle = 0.785;
var useToonShading = false;

var illumination = {
    ambientLight: [0.5, 0.5, 0.5],
    light: [
        {isOn: true, position: [3.0, 1.0, 3.0], color: [1.0, 1.0, 1.0]},
        {isOn: true, position: [-3.0, 1.0, -3.0], color: [1.0, 1.0, 1.0]}
    ]
};

var camera = {
    eye: [0, 1, 4],
    center: [0, 0.5, 0],
    up: [0, 1, 0],
    fovy: 60.0 * Math.PI / 180,
    vMatrix: mat4.create(),
    pMatrix: mat4.create()
};

function start() {
    initWebGL();
    initShaderProgram();
    initUniforms();
    initModels();
    initEventHandler();
    initPipeline();
    render();
}

function initWebGL() {
    canvas = document.getElementById("canvas");
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
}

function initPipeline() {
    gl.clearColor(0.95, 0.95, 0.95, 1);
    gl.frontFace(gl.CCW);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    camera.aspect = gl.viewportWidth / gl.viewportHeight;
}

function initShaderProgram() {
    var vs = getShaderSource("vertexshader");
    var fs = getShaderSource("fragmentshader");

    var vertexShader = compileShader(gl.VERTEX_SHADER, vs);
    var fragmentShader = compileShader(gl.FRAGMENT_SHADER, fs);

    prog = gl.createProgram();
    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.bindAttribLocation(prog, 0, "aPosition");
    gl.linkProgram(prog);

    gl.useProgram(prog);
}

function getShaderSource(id) {
    var script = document.getElementById(id);
    return script.textContent;
}

function compileShader(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function initUniforms() {
    prog.pMatrixUniform = gl.getUniformLocation(prog, "uPMatrix");
    prog.mvMatrixUniform = gl.getUniformLocation(prog, "uMVMatrix");
    prog.nMatrixUniform = gl.getUniformLocation(prog, "uNMatrix");

    prog.ambientLightUniform = gl.getUniformLocation(prog, "ambientLight");

    prog.lightUniform = [];
    for (var j = 0; j < illumination.light.length; j++) {
        var lightNb = "light[" + j + "]";
        var l = {};
        l.isOn = gl.getUniformLocation(prog, lightNb + ".isOn");
        l.position = gl.getUniformLocation(prog, lightNb + ".position");
        l.color = gl.getUniformLocation(prog, lightNb + ".color");
        prog.lightUniform[j] = l;
    }

    prog.materialKaUniform = gl.getUniformLocation(prog, "material.ka");
    prog.materialKdUniform = gl.getUniformLocation(prog, "material.kd");
    prog.materialKsUniform = gl.getUniformLocation(prog, "material.ks");
    prog.materialKeUniform = gl.getUniformLocation(prog, "material.ke");

    prog.useToonUniform = gl.getUniformLocation(prog, "useToon");
}

function createPhongMaterial(material) {
    material = material || {};
    material.ka = material.ka || [0.3, 0.3, 0.3];
    material.kd = material.kd || [0.6, 0.6, 0.6];
    material.ks = material.ks || [0.8, 0.8, 0.8];
    material.ke = material.ke || 10.0;
    return material;
}

function initModels() {
    var fs = "fill";

    var mDefault = createPhongMaterial();
    var mRed = createPhongMaterial({kd: [1.0, 0.0, 0.0]});
    var mGreen = createPhongMaterial({kd: [0.0, 1.0, 0.0]});
    var mBlue = createPhongMaterial({kd: [0.0, 0.0, 1.0]});
    var mWhite = createPhongMaterial({ka: [1.0, 1.0, 1.0], kd: [0.5, 0.5, 0.5], ks: [0.0, 0.0, 0.0]});

    createModel("torus", fs, [1, 1, 1, 1], [0, 0.75, 0], [0, 0, 0], [1, 1, 1], mRed);
    createModel("sphere", fs, [1, 1, 1, 1], [-1.25, 0.5, 0], [0, 0, 0], [0.5, 0.5, 0.5], mGreen);
    createModel("sphere", fs, [1, 1, 1, 1], [1.25, 0.5, 0], [0, 0, 0], [0.5, 0.5, 0.5], mBlue);
    createModel("plane", fs, [1, 1, 1, 1], [0, 0, 0], [0, 0, 0], [1, 1, 1], mWhite);
}

function createModel(geometryname, fillstyle, color, translate, rotate, scale, material) {
    var model = {};
    model.fillstyle = fillstyle;
    model.color = color;
    model.material = material;

    initDataAndBuffers(model, geometryname);
    initTransformations(model, translate, rotate, scale);

    models.push(model);
}

function initDataAndBuffers(model, geometryname) {
    var geom = window[geometryname];
    geom.createVertexData.apply(model);

    model.vboPos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vboPos);
    gl.bufferData(gl.ARRAY_BUFFER, model.vertices, gl.STATIC_DRAW);
    prog.positionAttrib = gl.getAttribLocation(prog, "aPosition");
    gl.enableVertexAttribArray(prog.positionAttrib);

    model.vboNormal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vboNormal);
    gl.bufferData(gl.ARRAY_BUFFER, model.normals, gl.STATIC_DRAW);
    prog.normalAttrib = gl.getAttribLocation(prog, "aNormal");
    gl.enableVertexAttribArray(prog.normalAttrib);

    model.iboTris = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboTris);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indicesTris, gl.STATIC_DRAW);
    model.iboTris.numberOfElements = model.indicesTris.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

function initTransformations(model, translate, rotate, scale) {
    model.translate = translate;
    model.rotate = rotate;
    model.scale = scale;

    model.mMatrix = mat4.create();
    model.mvMatrix = mat4.create();
    model.nMatrix = mat3.create();
}

function initEventHandler() {
    window.onkeydown = function(evt) {
        var key = evt.which ? evt.which : evt.keyCode;
        var c = String.fromCharCode(key);

        if (c === 'L') {
            moveLights();
        } else if (c === 'T') {
            toggleToonShading();
        }

        render();
    };

    document.getElementById("moveLights").addEventListener("click", function() {
        moveLights();
        render();
    });

    document.getElementById("toggleToon").addEventListener("click", function() {
        toggleToonShading();
        render();
    });
}

function moveLights() {
    lightAngle += 0.1;

    var radius1 = Math.sqrt(illumination.light[0].position[0] * illumination.light[0].position[0] +
                            illumination.light[0].position[2] * illumination.light[0].position[2]);
    var radius2 = Math.sqrt(illumination.light[1].position[0] * illumination.light[1].position[0] +
                            illumination.light[1].position[2] * illumination.light[1].position[2]);

    illumination.light[0].position[0] = radius1 * Math.cos(lightAngle);
    illumination.light[0].position[2] = radius1 * Math.sin(lightAngle);

    illumination.light[1].position[0] = radius2 * Math.cos(lightAngle + Math.PI);
    illumination.light[1].position[2] = radius2 * Math.sin(lightAngle + Math.PI);
}

function toggleToonShading() {
    useToonShading = !useToonShading;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    setProjection();
    mat4.lookAt(camera.vMatrix, camera.eye, camera.center, camera.up);

    gl.uniform3fv(prog.ambientLightUniform, illumination.ambientLight);

    for (var j = 0; j < illumination.light.length; j++) {
        gl.uniform1i(prog.lightUniform[j].isOn, illumination.light[j].isOn);
        var lightPos = [].concat(illumination.light[j].position);
        lightPos.push(1.0);
        vec4.transformMat4(lightPos, lightPos, camera.vMatrix);
        lightPos.pop();
        gl.uniform3fv(prog.lightUniform[j].position, lightPos);
        gl.uniform3fv(prog.lightUniform[j].color, illumination.light[j].color);
    }

    gl.uniform1i(prog.useToonUniform, useToonShading);

    for (var i = 0; i < models.length; i++) {
        updateTransformations(models[i]);

        gl.uniformMatrix4fv(prog.mvMatrixUniform, false, models[i].mvMatrix);
        gl.uniformMatrix3fv(prog.nMatrixUniform, false, models[i].nMatrix);

        gl.uniform3fv(prog.materialKaUniform, models[i].material.ka);
        gl.uniform3fv(prog.materialKdUniform, models[i].material.kd);
        gl.uniform3fv(prog.materialKsUniform, models[i].material.ks);
        gl.uniform1f(prog.materialKeUniform, models[i].material.ke);

        draw(models[i]);
    }
}

function setProjection() {
    mat4.perspective(camera.pMatrix, camera.fovy, camera.aspect, 1, 10);
    gl.uniformMatrix4fv(prog.pMatrixUniform, false, camera.pMatrix);
}

function updateTransformations(model) {
    var mMatrix = model.mMatrix;
    var mvMatrix = model.mvMatrix;

    mat4.identity(mMatrix);
    mat4.identity(mvMatrix);

    mat4.translate(mMatrix, mMatrix, model.translate);
    mat4.rotateX(mMatrix, mMatrix, model.rotate[0]);
    mat4.rotateY(mMatrix, mMatrix, model.rotate[1]);
    mat4.rotateZ(mMatrix, mMatrix, model.rotate[2]);
    mat4.scale(mMatrix, mMatrix, model.scale);

    mat4.multiply(mvMatrix, camera.vMatrix, mMatrix);
    mat3.normalFromMat4(model.nMatrix, mvMatrix);
}

function draw(model) {
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vboPos);
    gl.vertexAttribPointer(prog.positionAttrib, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.vboNormal);
    gl.vertexAttribPointer(prog.normalAttrib, 3, gl.FLOAT, false, 0, 0);

    var fill = (model.fillstyle.search(/fill/) != -1);
    if (fill) {
        gl.enableVertexAttribArray(prog.normalAttrib);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboTris);
        gl.drawElements(gl.TRIANGLES, model.iboTris.numberOfElements, gl.UNSIGNED_SHORT, 0);
    }
}

window.onload = start;
