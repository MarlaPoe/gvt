
        "use strict";

        var gl;
        var prog;
        var models = [];
        var camera = {
            eye: [0, 1, 4],
            center: [0, 0, 0],
            up: [0, 1, 0],
            zAngle: 0,
            distance: 4,
            fovy: Math.PI / 3,
            aspect: 1,
            pMatrix: mat4.create(),
            vMatrix: mat4.create()
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
            var canvas = document.getElementById('canvas');
            gl = canvas.getContext('experimental-webgl');
            if (!gl) {
                alert('WebGL wird nicht unterstützt!');
                return;
            }
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;

            canvas.setAttribute('tabindex', '0');
            canvas.focus();
        }

        function initShaderProgram() {
            var vs = getShader('vertexshader');
            var fs = getShader('fragmentshader');

            prog = gl.createProgram();
            gl.attachShader(prog, vs);
            gl.attachShader(prog, fs);
            gl.linkProgram(prog);

            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                alert('Program Fehler: ' + gl.getProgramInfoLog(prog));
            }

            gl.useProgram(prog);
        }

        function getShader(id) {
            var script = document.getElementById(id);
            var source = script.textContent;

            var shader;
            if (script.type === 'x-shader/x-vertex') {
                shader = gl.createShader(gl.VERTEX_SHADER);
            } else if (script.type === 'x-shader/x-fragment') {
                shader = gl.createShader(gl.FRAGMENT_SHADER);
            }

            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert('Shader Fehler: ' + gl.getShaderInfoLog(shader));
            }

            return shader;
        }

        function initUniforms() {
            prog.pMatrixUniform = gl.getUniformLocation(prog, 'uPMatrix');
            prog.mvMatrixUniform = gl.getUniformLocation(prog, 'uMVMatrix');
        }

        var recursionDepth = 2;
        var showSphereLines = false;

        function initModels() {
            var cone = createCone();
            cone.mvMatrix = mat4.create();
            models.push(cone);

            var cube = createCube();
            cube.mvMatrix = mat4.create();
            models.push(cube);

            var sphere = createRecursiveSphere(recursionDepth);
            sphere.mvMatrix = mat4.create();
            models.push(sphere);
        }

        function createCone() {
            var n = 32;
            var vertices = [];
            var normals = [];
            var colors = [];
            var indices = [];
            var baseColor = [0.808, 0.471, 0.220];

            // Spitze
            vertices.push(0, 1, 0);
            normals.push(0, 1, 0);
            colors.push(baseColor[0], baseColor[1], baseColor[2]);

            // Boden-Kreis
            for (var i = 0; i <= n; i++) {
                var u = (i / n) * 2 * Math.PI;
                var x = Math.cos(u);
                var z = Math.sin(u);

                vertices.push(x, 0, z);

                // Normale für Mantel (nach außen und oben geneigt)
                var len = Math.sqrt(x*x + 0.5*0.5 + z*z);
                normals.push(x/len, 0.5/len, z/len);
                colors.push(baseColor[0], baseColor[1], baseColor[2]);
            }

            // Boden-Mittelpunkt
            var centerIndex = vertices.length / 3;
            vertices.push(0, 0, 0);
            normals.push(0, -1, 0);
            colors.push(baseColor[0], baseColor[1], baseColor[2]);

            // Boden-Kreis Vertices (mit Normale nach unten)
            for (var i = 0; i <= n; i++) {
                var u = (i / n) * 2 * Math.PI;
                var x = Math.cos(u);
                var z = Math.sin(u);

                vertices.push(x, 0, z);
                normals.push(0, -1, 0);
                colors.push(baseColor[0], baseColor[1], baseColor[2]);
            }

            // Mantel-Dreiecke (gegen Uhrzeigersinn von außen gesehen)
            for (var i = 0; i < n; i++) {
                indices.push(0, i + 2, i + 1);
            }

            // Boden-Dreiecke (gegen Uhrzeigersinn von unten gesehen)
            for (var i = 0; i < n; i++) {
                indices.push(centerIndex, centerIndex + i + 1, centerIndex + i + 2);
            }

            var model = {
                vertices: new Float32Array(vertices),
                normals: new Float32Array(normals),
                colors: new Float32Array(colors),
                indices: new Uint16Array(indices)
            };

            initBuffers(model);
            return model;
        }

        function createCube() {
            var baseColor = [0.2, 0.4, 0.7];

            var vertices = [
                // Vorne
                -0.5, -0.5,  0.5,
                 0.5, -0.5,  0.5,
                 0.5,  0.5,  0.5,
                -0.5,  0.5,  0.5,
                // Hinten
                -0.5, -0.5, -0.5,
                 0.5, -0.5, -0.5,
                 0.5,  0.5, -0.5,
                -0.5,  0.5, -0.5,
                // Oben
                -0.5,  0.5,  0.5,
                 0.5,  0.5,  0.5,
                 0.5,  0.5, -0.5,
                -0.5,  0.5, -0.5,
                // Unten
                -0.5, -0.5,  0.5,
                 0.5, -0.5,  0.5,
                 0.5, -0.5, -0.5,
                -0.5, -0.5, -0.5,
                // Rechts
                 0.5, -0.5,  0.5,
                 0.5, -0.5, -0.5,
                 0.5,  0.5, -0.5,
                 0.5,  0.5,  0.5,
                // Links
                -0.5, -0.5,  0.5,
                -0.5, -0.5, -0.5,
                -0.5,  0.5, -0.5,
                -0.5,  0.5,  0.5
            ];

            var normals = [
                // Vorne
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                // Hinten
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                // Oben
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,
                // Unten
                0, -1, 0,
                0, -1, 0,
                0, -1, 0,
                0, -1, 0,
                // Rechts
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                // Links
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0
            ];

            var indices = [
                0, 1, 2,  0, 2, 3,    // Vorne
                4, 6, 5,  4, 7, 6,    // Hinten
                8, 9, 10, 8, 10, 11,  // Oben
                12, 14, 13, 12, 15, 14, // Unten
                16, 17, 18, 16, 18, 19, // Rechts
                20, 22, 21, 20, 23, 22  // Links
            ];

            // Farben für alle Vertices
            var colors = [];
            for (var i = 0; i < 24; i++) {
                colors.push(baseColor[0], baseColor[1], baseColor[2]);
            }

            var model = {
                vertices: new Float32Array(vertices),
                normals: new Float32Array(normals),
                colors: new Float32Array(colors),
                indices: new Uint16Array(indices)
            };

            initBuffers(model);
            return model;
        }

        function createRecursiveSphere(depth) {
            var baseColor = [0.2, 0.7, 0.4];

            var vertices = [];
            var normals = [];
            var colors = [];
            var indices = [];
            var indicesLines = [];

            // Oktaeder Vertices (auf Einheitskugel)
            var octahedron = [
                [0, 1, 0],   // 0: oben
                [1, 0, 0],   // 1: rechts
                [0, 0, 1],   // 2: vorne
                [-1, 0, 0],  // 3: links
                [0, 0, -1],  // 4: hinten
                [0, -1, 0]   // 5: unten
            ];

            // Oktaeder Dreiecke (8 Dreiecke)
            var triangles = [
                [0, 1, 2], // oben vorne rechts
                [0, 2, 3], // oben vorne links
                [0, 3, 4], // oben hinten links
                [0, 4, 1], // oben hinten rechts
                [5, 2, 1], // unten vorne rechts
                [5, 3, 2], // unten vorne links
                [5, 4, 3], // unten hinten links
                [5, 1, 4]  // unten hinten rechts
            ];

            // Rekursive Verfeinerung
            for (var d = 0; d < depth; d++) {
                var newTriangles = [];
                for (var i = 0; i < triangles.length; i++) {
                    var v0 = triangles[i][0];
                    var v1 = triangles[i][1];
                    var v2 = triangles[i][2];

                    // Mittelpunkte der Kanten berechnen
                    var m01 = midpointOnSphere(octahedron[v0], octahedron[v1]);
                    var m12 = midpointOnSphere(octahedron[v1], octahedron[v2]);
                    var m20 = midpointOnSphere(octahedron[v2], octahedron[v0]);

                    // Neue Vertices hinzufügen
                    var im01 = octahedron.length;
                    octahedron.push(m01);
                    var im12 = octahedron.length;
                    octahedron.push(m12);
                    var im20 = octahedron.length;
                    octahedron.push(m20);

                    // 4 neue Dreiecke
                    newTriangles.push([v0, im01, im20]);
                    newTriangles.push([v1, im12, im01]);
                    newTriangles.push([v2, im20, im12]);
                    newTriangles.push([im01, im12, im20]);
                }
                triangles = newTriangles;
            }

            // Vertices und Normalen aus Oktaeder-Daten
            for (var i = 0; i < octahedron.length; i++) {
                vertices.push(octahedron[i][0], octahedron[i][1], octahedron[i][2]);
                // Normalen = normalisierte Position (für Kugel)
                normals.push(octahedron[i][0], octahedron[i][1], octahedron[i][2]);
                colors.push(baseColor[0], baseColor[1], baseColor[2]);
            }

            // Indices für Dreiecke
            for (var i = 0; i < triangles.length; i++) {
                indices.push(triangles[i][0], triangles[i][1], triangles[i][2]);
            }

            // Indices für Linien (alle Kanten)
            for (var i = 0; i < triangles.length; i++) {
                var v0 = triangles[i][0];
                var v1 = triangles[i][1];
                var v2 = triangles[i][2];
                indicesLines.push(v0, v1, v1, v2, v2, v0);
            }

            var model = {
                vertices: new Float32Array(vertices),
                normals: new Float32Array(normals),
                colors: new Float32Array(colors),
                indices: new Uint16Array(indices),
                indicesLines: new Uint16Array(indicesLines)
            };

            initBuffers(model);
            return model;
        }

        function midpointOnSphere(v0, v1) {
            // Mittelpunkt berechnen
            var mx = (v0[0] + v1[0]) / 2;
            var my = (v0[1] + v1[1]) / 2;
            var mz = (v0[2] + v1[2]) / 2;

            // Auf Einheitskugel normieren
            var len = Math.sqrt(mx*mx + my*my + mz*mz);
            return [mx/len, my/len, mz/len];
        }

        function initBuffers(model) {
            model.vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo);
            gl.bufferData(gl.ARRAY_BUFFER, model.vertices, gl.STATIC_DRAW);

            var posAttrib = gl.getAttribLocation(prog, 'aPosition');
            gl.vertexAttribPointer(posAttrib, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(posAttrib);
            model.posAttrib = posAttrib;

            model.nbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, model.nbo);
            gl.bufferData(gl.ARRAY_BUFFER, model.normals, gl.STATIC_DRAW);

            var normalAttrib = gl.getAttribLocation(prog, 'aNormal');
            gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(normalAttrib);
            model.normalAttrib = normalAttrib;

            model.cbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, model.cbo);
            gl.bufferData(gl.ARRAY_BUFFER, model.colors, gl.STATIC_DRAW);

            var colorAttrib = gl.getAttribLocation(prog, 'aColor');
            gl.vertexAttribPointer(colorAttrib, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(colorAttrib);
            model.colorAttrib = colorAttrib;

            model.ibo = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.ibo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indices, gl.STATIC_DRAW);
            model.ibo.numberOfElements = model.indices.length;

            if (model.indicesLines) {
                model.iboLines = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboLines);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indicesLines, gl.STATIC_DRAW);
                model.iboLines.numberOfElements = model.indicesLines.length;
            }
        }

        function initEventHandler() {
            var canvas = document.getElementById('canvas');

            var handleKeyDown = function(evt) {
                var key = evt.which ? evt.which : evt.keyCode;
                var sign = evt.shiftKey ? -1 : 1;
                var deltaRotate = Math.PI / 36;
                var deltaDistance = 0.2;

                // Pfeiltasten
                if (key === 37) {
                    camera.zAngle += deltaRotate;
                } else if (key === 39) {
                    camera.zAngle -= deltaRotate;
                }

                // N für Radius
                var c = String.fromCharCode(key);
                if (c === 'N') {
                    camera.distance += sign * deltaDistance;
                    if (camera.distance < 1) camera.distance = 1;
                }

                render();
            };

            window.addEventListener('keydown', handleKeyDown);
            canvas.addEventListener('keydown', handleKeyDown);

            // Button Event Handler
            document.getElementById('btnDecrease').onclick = function() {
                if (recursionDepth > 0) {
                    recursionDepth--;
                    updateDepthDisplay();
                    recreateSphere();
                }
            };

            document.getElementById('btnIncrease').onclick = function() {
                if (recursionDepth < 5) {
                    recursionDepth++;
                    updateDepthDisplay();
                    recreateSphere();
                }
            };

            document.getElementById('btnToggleLines').onclick = function() {
                showSphereLines = !showSphereLines;
                render();
            };
        }

        function updateDepthDisplay() {
            document.getElementById('depthDisplay').textContent = recursionDepth;
        }

        function recreateSphere() {
            // Entferne alte Kugel
            models.splice(2, 1);

            // Erstelle neue Kugel mit aktueller Rekursionstiefe
            var sphere = createRecursiveSphere(recursionDepth);
            sphere.mvMatrix = mat4.create();
            models.push(sphere);

            render();
        }

        function initPipeline() {
            gl.clearColor(0.93, 0.94, 0.95, 1.0);
            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
            camera.aspect = gl.viewportWidth / gl.viewportHeight;
        }

        function render() {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // Projektion
            mat4.perspective(camera.pMatrix, camera.fovy, camera.aspect, 1, 10);
            gl.uniformMatrix4fv(prog.pMatrixUniform, false, camera.pMatrix);

            // Kamera Position berechnen
            var x = 0, z = 2;
            camera.eye[x] = camera.center[x] + camera.distance * Math.sin(camera.zAngle);
            camera.eye[z] = camera.center[z] + camera.distance * Math.cos(camera.zAngle);

            mat4.lookAt(camera.vMatrix, camera.eye, camera.center, camera.up);

            // Kegel
            mat4.copy(models[0].mvMatrix, camera.vMatrix);
            mat4.translate(models[0].mvMatrix, models[0].mvMatrix, [-1.2, -1.0, 0]);
            gl.uniformMatrix4fv(prog.mvMatrixUniform, false, models[0].mvMatrix);
            drawModel(models[0]);

            // Quader
            mat4.copy(models[1].mvMatrix, camera.vMatrix);
            mat4.translate(models[1].mvMatrix, models[1].mvMatrix, [1.2, -0.5, 0]);
            gl.uniformMatrix4fv(prog.mvMatrixUniform, false, models[1].mvMatrix);
            drawModel(models[1]);

            // Kugel
            mat4.copy(models[2].mvMatrix, camera.vMatrix);
            mat4.translate(models[2].mvMatrix, models[2].mvMatrix, [0, -0.5, -1.5]);
            mat4.scale(models[2].mvMatrix, models[2].mvMatrix, [0.8, 0.8, 0.8]);
            gl.uniformMatrix4fv(prog.mvMatrixUniform, false, models[2].mvMatrix);

            if (showSphereLines) {
                drawModelLines(models[2]);
            } else {
                drawModel(models[2]);
            }
        }

        function drawModel(model) {
            gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo);
            gl.vertexAttribPointer(model.posAttrib, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, model.nbo);
            gl.vertexAttribPointer(model.normalAttrib, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, model.cbo);
            gl.vertexAttribPointer(model.colorAttrib, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.ibo);
            gl.drawElements(gl.TRIANGLES, model.ibo.numberOfElements, gl.UNSIGNED_SHORT, 0);
        }

        function drawModelLines(model) {
            gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo);
            gl.vertexAttribPointer(model.posAttrib, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, model.nbo);
            gl.vertexAttribPointer(model.normalAttrib, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, model.cbo);
            gl.vertexAttribPointer(model.colorAttrib, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iboLines);
            gl.drawElements(gl.LINES, model.iboLines.numberOfElements, gl.UNSIGNED_SHORT, 0);
        }

        window.onload = start;
