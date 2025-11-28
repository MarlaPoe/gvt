"use strict";

var app = (function() {
    var gl;
    var prog;

    var camera = {
        eye: [0, 3, 12],
        center: [0, 0, 0],
        up: [0, 1, 0],
        fovy: 60.0 * Math.PI / 180,
        vMatrix: mat4.create(),
        pMatrix: mat4.create(),
        rotationX: 0,
        rotationY: 0
    };

    var models = [];

    function start() {
        init();
        render();
    }

    function init() {
        initWebGL();
        initShaders();
        initGeometry();
        initModels();
        initEventHandler();
        initCamera();
    }

    function initWebGL() {
        var canvas = document.getElementById("canvas");
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;

        gl.clearColor(0.95, 0.95, 0.95, 1);
        gl.frontFace(gl.CCW);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.enable(gl.DEPTH_TEST);
    }

    function initShaders() {
        var vertexShader = getShader("vertexshader");
        var fragmentShader = getShader("fragmentshader");

        prog = gl.createProgram();
        gl.attachShader(prog, vertexShader);
        gl.attachShader(prog, fragmentShader);
        gl.linkProgram(prog);

        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.error("Could not init shaders");
            return;
        }

        gl.useProgram(prog);

        prog.positionAttribute = gl.getAttribLocation(prog, "aPosition");
        gl.enableVertexAttribArray(prog.positionAttribute);

        prog.pMatrixUniform = gl.getUniformLocation(prog, "uPMatrix");
        prog.mvMatrixUniform = gl.getUniformLocation(prog, "uMVMatrix");
    }

    function getShader(id) {
        var script = document.getElementById(id);
        var shaderType = script.type === "x-shader/x-vertex" ?
            gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;

        var shader = gl.createShader(shaderType);
        gl.shaderSource(shader, script.text);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader compile error:", gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    function initGeometry() {
        torus.createVertexData.apply(torus);
        sphere.createVertexData.apply(sphere);
        plane.createVertexData.apply(plane);
        box.createVertexData.apply(box);
    }

    function initModels() {
        createModel("torus", [0, 0, 0], [0, 0, 0], [1.2, 1.2, 1.2], "fill");
        createModel("sphere", [2, 0, -1], [0, 0, 0], [0.8, 0.8, 0.8], "fill");
        createModel("box", [-1.5, 0.5, 1], [0.3, 0.5, 0], [0.6, 0.6, 0.6], "fill");
        createModel("plane", [0, -2, 0], [0, 0, 0], [3, 1, 3], "fill");
    }

    function createModel(type, translate, rotate, scale, fillstyle) {
        var model = {
            type: type,
            translate: translate,
            rotate: rotate,
            scale: scale,
            fillstyle: fillstyle,
            mMatrix: mat4.create(),
            mvMatrix: mat4.create()
        };

        var data;
        if (type === "sphere") {
            data = sphere;
        } else if (type === "torus") {
            data = torus;
        } else if (type === "plane") {
            data = plane;
        } else if (type === "box") {
            data = box;
        }

        model.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, data.vertices, gl.STATIC_DRAW);

        if (fillstyle === "fill") {
            model.iboTris = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboTris);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indicesTris, gl.STATIC_DRAW);
            model.iboTrisLength = data.indicesTris.length;
        }

        models.push(model);
        return model;
    }

    function initEventHandler() {
        var deltaMove = 0.5;
        var deltaRotate = Math.PI / 36;

        window.addEventListener("keydown", function(e) {
            var key = e.key;

            switch (key) {
                case "ArrowLeft":
                case "ArrowRight":
                case "ArrowUp":
                case "ArrowDown":
                    e.preventDefault();
                    break;
            }

            switch (key) {
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

        document.getElementById("resetCamera").addEventListener("click", resetCamera);
    }

    function resetCamera() {
        camera.eye = [0, 3, 12];
        camera.center = [0, 0, 0];
        camera.rotationX = 0;
        camera.rotationY = 0;
        render();
    }

    function initCamera() {
        var aspect = gl.viewportWidth / gl.viewportHeight;
        mat4.perspective(camera.pMatrix, camera.fovy, aspect, 8.0, 18.0);
    }

    function updateCamera() {
        mat4.lookAt(camera.vMatrix, camera.eye, camera.center, camera.up);
    }

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        updateCamera();

        gl.uniformMatrix4fv(prog.pMatrixUniform, false, camera.pMatrix);

        for (var i = 0; i < models.length; i++) {
            updateTransformations(models[i]);
            draw(models[i]);
        }
    }

    function updateTransformations(model) {
        var mMatrix = model.mMatrix;
        var mvMatrix = model.mvMatrix;

        mat4.identity(mMatrix);
        mat4.rotateX(mMatrix, mMatrix, camera.rotationX);
        mat4.rotateY(mMatrix, mMatrix, camera.rotationY);
        mat4.translate(mMatrix, mMatrix, model.translate);
        mat4.rotateX(mMatrix, mMatrix, model.rotate[0]);
        mat4.rotateY(mMatrix, mMatrix, model.rotate[1]);
        mat4.rotateZ(mMatrix, mMatrix, model.rotate[2]);
        mat4.scale(mMatrix, mMatrix, model.scale);

        mat4.multiply(mvMatrix, camera.vMatrix, mMatrix);
    }

    function draw(model) {
        gl.uniformMatrix4fv(prog.mvMatrixUniform, false, model.mvMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo);
        gl.vertexAttribPointer(prog.positionAttribute, 3, gl.FLOAT, false, 0, 0);

        if (model.fillstyle === "fill") {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboTris);
            gl.drawElements(gl.TRIANGLES, model.iboTrisLength, gl.UNSIGNED_SHORT, 0);
        }
    }

    return {
        start: start
    };
})();

window.onload = app.start;
