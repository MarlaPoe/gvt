"use strict";

var app = (function() {
    var gl;
    var prog;

    var camera = {
        eye: [0, 1, 4],
        center: [0, 0, 0],
        up: [0, 1, 0],
        fovy: 60.0 * Math.PI / 180,
        vMatrix: mat4.create(),
        pMatrix: mat4.create(),
        zAngle: 0,
        distance: 7
    };

    var animation = {
        running: false,
        angle: 0,
        speed: 0.02,
        torusRotation: 0,
        torusSpeed: 0.01
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
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(0.5, 0);
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

        prog.normalAttribute = gl.getAttribLocation(prog, "aNormal");
        gl.enableVertexAttribArray(prog.normalAttribute);

        prog.pMatrixUniform = gl.getUniformLocation(prog, "uPMatrix");
        prog.mvMatrixUniform = gl.getUniformLocation(prog, "uMVMatrix");
        prog.colorUniform = gl.getUniformLocation(prog, "uColor");
        prog.useColorUniform = gl.getUniformLocation(prog, "uUseColor");
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
    }

    function initModels() {
        createModel("torus", [0, 0, 0], [0, 0, 0], [1, 1, 1], "fillwireframe");

        var TORUS_R = 1.5;
        var ORBIT_CENTER_RADIUS = TORUS_R;
        var LOCAL_ORBIT_RADIUS = 1.5;
        var SPHERE_RADIUS = 0.25;

        var model1 = createModel("sphere", [0, 0, 0], [0, 0, 0],
            [SPHERE_RADIUS, SPHERE_RADIUS, SPHERE_RADIUS], "fill");
        model1.centerPhi = 0;
        model1.orbitCenterRadius = ORBIT_CENTER_RADIUS;
        model1.localOrbitRadius = LOCAL_ORBIT_RADIUS;
        model1.timeOffset = 0;

        var model2 = createModel("sphere", [0, 0, 0], [0, 0, 0],
            [SPHERE_RADIUS, SPHERE_RADIUS, SPHERE_RADIUS], "fill");
        model2.centerPhi = Math.PI;
        model2.orbitCenterRadius = ORBIT_CENTER_RADIUS;
        model2.localOrbitRadius = LOCAL_ORBIT_RADIUS;
        model2.timeOffset = Math.PI;

        var model3 = createModel("sphere", [0, 0, 0], [0, 0, 0],
            [SPHERE_RADIUS, SPHERE_RADIUS, SPHERE_RADIUS], "fill");
        model3.orbitCenterRadius = ORBIT_CENTER_RADIUS;
        model3.localOrbitRadius = LOCAL_ORBIT_RADIUS;
        model3.timeOffset = Math.PI / 2;
        model3.verticalOrbit = true;

        var model4 = createModel("sphere", [0, 0, 0], [0, 0, 0],
            [SPHERE_RADIUS, SPHERE_RADIUS, SPHERE_RADIUS], "fill");
        model4.orbitCenterRadius = ORBIT_CENTER_RADIUS;
        model4.localOrbitRadius = LOCAL_ORBIT_RADIUS;
        model4.timeOffset = Math.PI / 2 + Math.PI;
        model4.verticalOrbit = true;
        model4.verticalDown = true;

        createModel("plane", [0, -2.5, 0], [0, 0, 0], [1.5, 1, 1.5], "wireframe");
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
        }

        model.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, data.vertices, gl.STATIC_DRAW);

        if (data.normals) {
            model.nbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, model.nbo);
            gl.bufferData(gl.ARRAY_BUFFER, data.normals, gl.STATIC_DRAW);
        }

        if (fillstyle === "fillwireframe" || fillstyle === "fill") {
            model.iboTris = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboTris);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indicesTris, gl.STATIC_DRAW);
            model.iboTrisLength = data.indicesTris.length;
        }

        if (fillstyle === "fillwireframe" || fillstyle === "wireframe") {
            model.iboLines = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboLines);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indicesLines, gl.STATIC_DRAW);
            model.iboLinesLength = data.indicesLines.length;
        }

        models.push(model);
        return model;
    }

    function initEventHandler() {
        var deltaRotate = Math.PI / 36;
        var deltaTranslate = 0.05;

        window.addEventListener("keydown", function(e) {
            var key = e.key;
            var sign = e.shiftKey ? -1 : 1;

            switch (key) {
                case "ArrowLeft":
                case "ArrowRight":
                case "ArrowUp":
                case "ArrowDown":
                    e.preventDefault();
                    break;
            }

            switch (key) {
                case "ArrowLeft":
                    camera.zAngle += sign * deltaRotate;
                    break;
                case "ArrowRight":
                    camera.zAngle -= sign * deltaRotate;
                    break;
                case "ArrowUp":
                    camera.eye[1] += deltaTranslate;
                    break;
                case "ArrowDown":
                    camera.eye[1] -= deltaTranslate;
                    break;
                case "n":
                case "N":
                    camera.distance += sign * 0.2;
                    if (camera.distance < 1) camera.distance = 1;
                    break;
                case "k":
                case "K":
                    if (animation.running) {
                        toggleAnimation();
                    } else {
                        stepAnimation();
                    }
                    break;
            }

            render();
        });

        document.getElementById("toggleAnimation").addEventListener("click", toggleAnimation);
        document.getElementById("stepAnimation").addEventListener("click", stepAnimation);
        document.getElementById("resetCamera").addEventListener("click", resetCamera);
    }

    function toggleAnimation() {
        animation.running = !animation.running;
        var btn = document.getElementById("toggleAnimation");
        var status = document.getElementById("animStatus");

        if (animation.running) {
            btn.textContent = "Animation stoppen";
            status.textContent = "Läuft";
            status.className = "status running";
            animate();
        } else {
            btn.textContent = "Animation starten";
            status.textContent = "Pausiert";
            status.className = "status paused";
        }
    }

    function stepAnimation() {
        animation.angle += animation.speed;
        animation.torusRotation += animation.torusSpeed;
        updateSpherePositions();
        updateTorusRotation();
        render();
    }

    function animate() {
        if (!animation.running) return;

        animation.angle += animation.speed;
        animation.torusRotation += animation.torusSpeed;

        updateSpherePositions();
        updateTorusRotation();

        render();
        requestAnimationFrame(animate);
    }

    function updateSpherePositions() {
        for (var i = 1; i <= 4; i++) {
            var model = models[i];
            if (model && model.type === "sphere") {
                var R = model.orbitCenterRadius;
                var r = model.localOrbitRadius;
                var timeOffset = model.timeOffset || 0;
                var verticalOrbit = model.verticalOrbit || false;
                var localX, localY, localZ;

                if (verticalOrbit) {
                    var cosA = Math.cos(animation.angle + timeOffset);
                    var sinA = Math.sin(animation.angle + timeOffset);
                    var verticalDown = model.verticalDown || false;

                    if (verticalDown) {
                        var cy = -R;
                        var oy = r * cosA;
                        var oz = r * sinA;
                        localX = 0;
                        localY = cy + oy;
                        localZ = oz;
                    } else {
                        var cy = R;
                        var oy = r * cosA * (-1);
                        var oz = r * sinA;
                        localX = 0;
                        localY = cy + oy;
                        localZ = oz;
                    }
                } else {
                    var centerPhi = model.centerPhi;
                    var rHat = [Math.cos(centerPhi), 0, Math.sin(centerPhi)];
                    var tHat = [-Math.sin(centerPhi), 0, Math.cos(centerPhi)];
                    var cx = R * rHat[0];
                    var cz = R * rHat[2];
                    var cosA = Math.cos(animation.angle + timeOffset);
                    var sinA = Math.sin(animation.angle + timeOffset);
                    var ox = r * (cosA * (-rHat[0]) + sinA * tHat[0]);
                    var oz = r * (cosA * (-rHat[2]) + sinA * tHat[2]);
                    localX = cx + ox;
                    localY = 0;
                    localZ = cz + oz;
                }

                var rotAngle = animation.torusRotation;
                var cosRot = Math.cos(rotAngle);
                var sinRot = Math.sin(rotAngle);

                model.translate[0] = localX;
                model.translate[1] = localY * cosRot - localZ * sinRot;
                model.translate[2] = localY * sinRot + localZ * cosRot;
            }
        }
    }

    function updateTorusRotation() {
        var torusModel = models[0];
        if (torusModel && torusModel.type === "torus") {
            torusModel.rotate[0] = animation.torusRotation;
        }
    }

    function resetCamera() {
        camera.zAngle = 0;
        camera.distance = 7;
        camera.eye[1] = 1;
        render();
    }

    function initCamera() {
        var aspect = gl.viewportWidth / gl.viewportHeight;
        mat4.perspective(camera.pMatrix, camera.fovy, aspect, 0.1, 100);
    }

    function updateCamera() {
        camera.eye[0] = camera.distance * Math.sin(camera.zAngle);
        camera.eye[2] = camera.distance * Math.cos(camera.zAngle);

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

        if (model.color) {
            gl.uniform3fv(prog.colorUniform, model.color);
            gl.uniform1f(prog.useColorUniform, 1.0);
        } else {
            gl.uniform1f(prog.useColorUniform, 0.0);
        }

        var fill = (model.fillstyle.search(/fill/) != -1);
        if (fill) {
            gl.enableVertexAttribArray(prog.normalAttribute);
            gl.bindBuffer(gl.ARRAY_BUFFER, model.nbo);
            gl.vertexAttribPointer(prog.normalAttribute, 3, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboTris);
            gl.drawElements(gl.TRIANGLES, model.iboTrisLength, gl.UNSIGNED_SHORT, 0);
        }

        var wireframe = (model.fillstyle.search(/wireframe/) != -1);
        if (wireframe) {
            gl.disableVertexAttribArray(prog.normalAttribute);
            gl.vertexAttrib3f(prog.normalAttribute, 0, 0, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboLines);
            gl.drawElements(gl.LINES, model.iboLinesLength, gl.UNSIGNED_SHORT, 0);
        }
    }

    return {
        start: start
    };
})();

window.onload = app.start;
