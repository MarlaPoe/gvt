
        "use strict";

        function getShaderSource(id) {
            return document.getElementById(id).textContent;
        }

        function compileShader(gl, source, type) {
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader Fehler:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }

            return shader;
        }

        function createProgram(gl, vertexShader, fragmentShader) {
            var program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error('Program Fehler:', gl.getProgramInfoLog(program));
                return null;
            }

            return program;
        }

        function createRotationMatrix(angleX, angleY) {
            var cosX = Math.cos(angleX);
            var sinX = Math.sin(angleX);
            var cosY = Math.cos(angleY);
            var sinY = Math.sin(angleY);

            return new Float32Array([
                cosY, sinX * sinY, -cosX * sinY, 0,
                0, cosX, sinX, 0,
                sinY, -sinX * cosY, cosX * cosY, 0,
                0, 0, 0, 1
            ]);
        }

        // Pillow Shape generieren
        function generatePillow(a, uSteps, vSteps) {
            var vertices = [];
            var colors = [];
            var lineIndices = [];
            var triangleIndices = [];

            var uMin = 0;
            var uMax = Math.PI;
            var vMin = -Math.PI;
            var vMax = Math.PI;

            for (var i = 0; i <= uSteps; i++) {
                for (var j = 0; j <= vSteps; j++) {
                    var u = uMin + (uMax - uMin) * i / uSteps;
                    var v = vMin + (vMax - vMin) * j / vSteps;

                    var x = Math.cos(u);
                    var y = Math.cos(v);
                    var z = a * Math.sin(u) * Math.sin(v);

                    vertices.push(x, y, z);

                    // Farbe: Blau-Verlauf (hell zu dunkel)
                    var colorU = i / uSteps;
                    var colorV = j / vSteps;
                    var t = colorU * 0.5 + colorV * 0.5;
                    colors.push(0.1 + t * 0.2, 0.2 + t * 0.3, 0.5 + t * 0.3);
                }
            }

            // Linien-Indices generieren
            for (var i = 0; i < uSteps; i++) {
                for (var j = 0; j < vSteps; j++) {
                    var idx = i * (vSteps + 1) + j;

                    // Horizontale Linie
                    lineIndices.push(idx, idx + 1);

                    // Vertikale Linie
                    lineIndices.push(idx, idx + (vSteps + 1));
                }
            }

            // Triangle-Indices generieren
            for (var i = 0; i < uSteps; i++) {
                for (var j = 0; j < vSteps; j++) {
                    var a = i * (vSteps + 1) + j;
                    var b = a + 1;
                    var c = a + (vSteps + 1);
                    var d = c + 1;

                    // Erstes Dreieck
                    triangleIndices.push(a, c, b);

                    // Zweites Dreieck
                    triangleIndices.push(b, c, d);
                }
            }

            return { vertices: vertices, colors: colors, lineIndices: lineIndices, triangleIndices: triangleIndices };
        }

        // Möbius Band generieren
        function generateMoebius(R, w, sSteps, tSteps) {
            var vertices = [];
            var colors = [];
            var lineIndices = [];
            var triangleIndices = [];

            var sMin = -w;
            var sMax = w;
            var tMin = 0;
            var tMax = 2 * Math.PI;

            for (var i = 0; i <= sSteps; i++) {
                for (var j = 0; j <= tSteps; j++) {
                    var s = sMin + (sMax - sMin) * i / sSteps;
                    var t = tMin + (tMax - tMin) * j / tSteps;

                    var x = (R + s * Math.cos(t / 2)) * Math.cos(t);
                    var y = (R + s * Math.cos(t / 2)) * Math.sin(t);
                    var z = s * Math.sin(t / 2);

                    vertices.push(x, y, z);

                    // Farbe: Orange Verlauf (hell zu dunkel)
                    var colorS = i / sSteps;
                    var colorT = j / tSteps;
                    var t = colorS * 0.5 + colorT * 0.5;
                    colors.push(0.9 - t * 0.35, 0.5 - t * 0.2, 0.25 - t * 0.1);
                }
            }

            // Linien-Indices generieren
            for (var i = 0; i <= sSteps; i++) {
                for (var j = 0; j <= tSteps; j++) {
                    var idx = i * (tSteps + 1) + j;

                    // Horizontale Linie (in t-Richtung)
                    if (j < tSteps) {
                        lineIndices.push(idx, idx + 1);
                    }

                    // Vertikale Linie (in s-Richtung)
                    if (i < sSteps) {
                        lineIndices.push(idx, idx + (tSteps + 1));
                    }
                }
            }

            // Triangle-Indices generieren
            for (var i = 0; i < sSteps; i++) {
                for (var j = 0; j < tSteps; j++) {
                    var a = i * (tSteps + 1) + j;
                    var b = a + 1;
                    var c = a + (tSteps + 1);
                    var d = c + 1;

                    // Erstes Dreieck
                    triangleIndices.push(a, c, b);

                    // Zweites Dreieck
                    triangleIndices.push(b, c, d);
                }
            }

            return { vertices: vertices, colors: colors, lineIndices: lineIndices, triangleIndices: triangleIndices };
        }

        // Toruskissen generieren (eigene Parametrisierung)
        // Torus-Grundform + Pillow-Shape Ausbeulung
        function generateToruskissen(R, r, a, uSteps, vSteps) {
            var vertices = [];
            var colors = [];
            var lineIndices = [];
            var triangleIndices = [];

            var uMin = 0;
            var uMax = 2 * Math.PI;
            var vMin = 0;
            var vMax = 2 * Math.PI;

            for (var i = 0; i <= uSteps; i++) {
                for (var j = 0; j <= vSteps; j++) {
                    var u = uMin + (uMax - uMin) * i / uSteps;
                    var v = vMin + (vMax - vMin) * j / vSteps;

                    // Torus Basis
                    var x = (R + r * Math.cos(v)) * Math.cos(u);
                    var y = (R + r * Math.cos(v)) * Math.sin(u);
                    // z mit Pillow-Ausbeulung
                    var z = r * Math.sin(v) + a * Math.sin(u) * Math.sin(v);

                    vertices.push(x, y, z);

                    // Farbe: Blau-Verlauf (hell zu dunkel)
                    var colorU = i / uSteps;
                    var colorV = j / vSteps;
                    var t = colorU * 0.5 + colorV * 0.5;
                    colors.push(0.1 + t * 0.2, 0.2 + t * 0.3, 0.5 + t * 0.3);
                }
            }

            // Linien-Indices generieren
            for (var i = 0; i < uSteps; i++) {
                for (var j = 0; j < vSteps; j++) {
                    var idx = i * (vSteps + 1) + j;

                    // Horizontale Linie
                    lineIndices.push(idx, idx + 1);

                    // Vertikale Linie
                    lineIndices.push(idx, idx + (vSteps + 1));
                }
            }

            // Triangle-Indices generieren
            for (var i = 0; i < uSteps; i++) {
                for (var j = 0; j < vSteps; j++) {
                    var a = i * (vSteps + 1) + j;
                    var b = a + 1;
                    var c = a + (vSteps + 1);
                    var d = c + 1;

                    // Erstes Dreieck
                    triangleIndices.push(a, c, b);

                    // Zweites Dreieck
                    triangleIndices.push(b, c, d);
                }
            }

            return { vertices: vertices, colors: colors, lineIndices: lineIndices, triangleIndices: triangleIndices };
        }

        function initSurface(canvasId, surfaceData, scale) {
            var canvas = document.getElementById(canvasId);
            var gl = canvas.getContext('webgl');

            if (!gl) {
                alert('WebGL wird von deinem Browser nicht unterstützt!');
                return null;
            }

            var vertexShaderSource = getShaderSource('vertex-shader');
            var vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);

            var fragmentShaderSource = getShaderSource('fragment-shader');
            var fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

            var program = createProgram(gl, vertexShader, fragmentShader);
            gl.useProgram(program);

            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);

            // Vertices skalieren
            var scaledVertices = [];
            for (var i = 0; i < surfaceData.vertices.length; i++) {
                scaledVertices.push(surfaceData.vertices[i] * scale);
            }

            // Vertex Buffer
            var vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(scaledVertices), gl.STATIC_DRAW);

            var aPosition = gl.getAttribLocation(program, 'aPosition');
            gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(aPosition);

            // Color Buffer
            var colorBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surfaceData.colors), gl.STATIC_DRAW);

            var aColor = gl.getAttribLocation(program, 'aColor');
            gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(aColor);

            // Line Index Buffer
            var lineIndexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(surfaceData.lineIndices), gl.STATIC_DRAW);

            // Triangle Index Buffer
            var triangleIndexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(surfaceData.triangleIndices), gl.STATIC_DRAW);

            var uRotation = gl.getUniformLocation(program, 'uRotation');
            var uUseBlack = gl.getUniformLocation(program, 'uUseBlack');

            return {
                gl: gl,
                program: program,
                lineIndexBuffer: lineIndexBuffer,
                triangleIndexBuffer: triangleIndexBuffer,
                lineIndexCount: surfaceData.lineIndices.length,
                triangleIndexCount: surfaceData.triangleIndices.length,
                uRotation: uRotation,
                uUseBlack: uUseBlack
            };
        }

        function renderSurface(context, showFilled, showWireframe, angleX, angleY) {
            var gl = context.gl;

            gl.useProgram(context.program);

            var rotationMatrix = createRotationMatrix(angleX, angleY);
            gl.uniformMatrix4fv(context.uRotation, false, rotationMatrix);

            gl.clearColor(0.96, 0.97, 0.97, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            if (showFilled) {
                if (showWireframe) {
                    gl.enable(gl.POLYGON_OFFSET_FILL);
                    gl.polygonOffset(1.0, 1.0);
                }
                gl.uniform1f(context.uUseBlack, 0.0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, context.triangleIndexBuffer);
                gl.drawElements(gl.TRIANGLES, context.triangleIndexCount, gl.UNSIGNED_SHORT, 0);
                if (showWireframe) {
                    gl.disable(gl.POLYGON_OFFSET_FILL);
                }
            }

            if (showWireframe) {
                gl.uniform1f(context.uUseBlack, 1.0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, context.lineIndexBuffer);
                gl.drawElements(gl.LINES, context.lineIndexCount, gl.UNSIGNED_SHORT, 0);
            }
        }

        // Pillow Shape initialisieren
        var pillowData = generatePillow(0.5, 40, 40);
        var pillowContext = initSurface('pillowCanvas', pillowData, 0.8);
        var pillowShowFilled = true;
        var pillowShowWireframe = true;
        var pillowAngleX = 0.5;
        var pillowAngleY = 0.5;
        renderSurface(pillowContext, pillowShowFilled, pillowShowWireframe, pillowAngleX, pillowAngleY);

        // Möbius Band initialisieren
        var moebiusData = generateMoebius(1.0, 0.5, 20, 128);
        var moebiusContext = initSurface('moebiusCanvas', moebiusData, 0.6);
        var moebiusShowFilled = true;
        var moebiusShowWireframe = true;
        var moebiusAngleX = 0.3;
        var moebiusAngleY = 0.5;
        renderSurface(moebiusContext, moebiusShowFilled, moebiusShowWireframe, moebiusAngleX, moebiusAngleY);

        // Toruskissen initialisieren
        var toruskissenData = generateToruskissen(2.0, 0.8, 0.5, 40, 40);
        var toruskissenContext = initSurface('twistedCanvas', toruskissenData, 0.25);
        var toruskissenShowFilled = true;
        var toruskissenShowWireframe = true;
        var toruskissenAngleX = 0.7;
        var toruskissenAngleY = 0.4;
        renderSurface(toruskissenContext, toruskissenShowFilled, toruskissenShowWireframe, toruskissenAngleX, toruskissenAngleY);

        // Toggle Buttons
        document.getElementById('togglePillowFill').addEventListener('click', function() {
            pillowShowFilled = !pillowShowFilled;
            renderSurface(pillowContext, pillowShowFilled, pillowShowWireframe, pillowAngleX, pillowAngleY);
        });

        document.getElementById('togglePillowWire').addEventListener('click', function() {
            pillowShowWireframe = !pillowShowWireframe;
            renderSurface(pillowContext, pillowShowFilled, pillowShowWireframe, pillowAngleX, pillowAngleY);
        });

        document.getElementById('toggleMoebiusFill').addEventListener('click', function() {
            moebiusShowFilled = !moebiusShowFilled;
            renderSurface(moebiusContext, moebiusShowFilled, moebiusShowWireframe, moebiusAngleX, moebiusAngleY);
        });

        document.getElementById('toggleMoebiusWire').addEventListener('click', function() {
            moebiusShowWireframe = !moebiusShowWireframe;
            renderSurface(moebiusContext, moebiusShowFilled, moebiusShowWireframe, moebiusAngleX, moebiusAngleY);
        });

        document.getElementById('toggleTwistedFill').addEventListener('click', function() {
            toruskissenShowFilled = !toruskissenShowFilled;
            renderSurface(toruskissenContext, toruskissenShowFilled, toruskissenShowWireframe, toruskissenAngleX, toruskissenAngleY);
        });

        document.getElementById('toggleTwistedWire').addEventListener('click', function() {
            toruskissenShowWireframe = !toruskissenShowWireframe;
            renderSurface(toruskissenContext, toruskissenShowFilled, toruskissenShowWireframe, toruskissenAngleX, toruskissenAngleY);
        });

