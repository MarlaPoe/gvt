// EA2 - 2D Geometrie aus Linien
"use strict";

var canvas = document.getElementById('canvas');
var gl = canvas.getContext('webgl');

if (!gl) {
    alert('WebGL wird von deinem Browser nicht unterstützt!');
}

function getShaderSource(id) {
    return document.getElementById(id).textContent;
}

function compileShader(source, type) {
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

function createProgram(vertexShader, fragmentShader) {
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

var vertexShaderSource = getShaderSource('vertex-shader');
var vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);

var fragmentShaderSource = getShaderSource('fragment-shader');
var fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

var program = createProgram(vertexShader, fragmentShader);
gl.useProgram(program);

// Vertices
var vertices = [
    -0.6268,  0.8370,
    -0.5892,  0.9498,
    -0.5776,  0.9067,
    -0.5586,  0.8370,
    -0.6133,  0.8776,
    -0.6596,  0.8370,
    -0.7019,  0.7657,
    -0.7347,  0.4884,
    -0.7347,  0.4429,
    -0.7019,  0.4172,
    -0.6080,  0.4172,
    -0.6080,  0.4664,
    -0.5282,  0.5320,
    -0.4645,  0.6427,
    -0.4313,  0.7993,
    -0.5740,  0.8933,
    -0.4191,  0.9063,
    -0.2966,  0.8473,
    -0.1315,  0.5756,
    -0.1001,  0.4869,
    -0.0037,  0.4140,
     0.0288,  0.3142,
     0.3636,  0.1002,
     0.5513,  0.0309,
     0.7008, -0.0810,
     0.7414, -0.2780,
     0.6734, -0.4146,
     0.4434, -0.5573,
     0.4927, -0.7414,
     0.2040, -0.9335,
     0.0609, -0.9335,
     0.1665, -0.8484,
     0.3308, -0.7394,
     0.2392, -0.5157,
     0.2056, -0.3451,
     0.0488, -0.3238,
    -0.3992, -0.0642,
    -0.3334,  0.0309,
    -0.2558,  0.1992,
     0.7719, -0.5057,
     0.8892, -0.6939,
     0.8306, -0.8681,
     0.6816, -0.7910,
     0.7086, -0.6721,
     0.6545, -0.5751,
    -0.3827,  0.4172,
    -0.6068,  0.2805,
    -0.6068,  0.0805,
    -0.8312, -0.0355,
    -0.8791, -0.3729,
    -0.7880, -0.3569,
    -0.7723, -0.2048,
    -0.7383, -0.0849,
    -0.4164,  0.0588,
     0.1129, -0.0022,
     0.3786, -0.0297,
    -0.5631,  0.6802,
    -0.5422,  0.3199,
    -0.8666, -0.2844,
    -0.7780, -0.2595,
     0.1365, -0.8681,
     0.3021, -0.8681
];

var vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

var aPosition = gl.getAttribLocation(program, 'aPosition');
gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPosition);

gl.clearColor(0.96, 0.97, 0.97, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

var seg1 = new Uint16Array([0, 1, 2, 3, 0]);
var ibo1 = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo1);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, seg1, gl.STATIC_DRAW);
gl.drawElements(gl.LINE_LOOP, 5, gl.UNSIGNED_SHORT, 0);

var seg2 = new Uint16Array([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 3, 7]);
var ibo2 = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo2);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, seg2, gl.STATIC_DRAW);
gl.drawElements(gl.LINE_STRIP, 13, gl.UNSIGNED_SHORT, 0);

var seg3 = new Uint16Array([15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 21]);
var ibo3 = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo3);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, seg3, gl.STATIC_DRAW);
gl.drawElements(gl.LINE_STRIP, 25, gl.UNSIGNED_SHORT, 0);

var seg4 = new Uint16Array([25, 39, 40, 41, 42, 43, 44, 26]);
var ibo4 = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo4);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, seg4, gl.STATIC_DRAW);
gl.drawElements(gl.LINE_STRIP, 8, gl.UNSIGNED_SHORT, 0);

var seg5 = new Uint16Array([13, 45, 46, 47, 48, 49, 50, 51, 52, 36]);
var ibo5 = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo5);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, seg5, gl.STATIC_DRAW);
gl.drawElements(gl.LINE_STRIP, 10, gl.UNSIGNED_SHORT, 0);

var seg6 = new Uint16Array([46, 38, 45, 20]);
var ibo6 = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo6);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, seg6, gl.STATIC_DRAW);
gl.drawElements(gl.LINE_STRIP, 4, gl.UNSIGNED_SHORT, 0);

var seg7 = new Uint16Array([36, 53, 47, 52, 48]);
var ibo7 = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo7);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, seg7, gl.STATIC_DRAW);
gl.drawElements(gl.LINE_STRIP, 5, gl.UNSIGNED_SHORT, 0);

var seg8 = new Uint16Array([38, 54, 35]);
var ibo8 = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo8);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, seg8, gl.STATIC_DRAW);
gl.drawElements(gl.LINE_STRIP, 3, gl.UNSIGNED_SHORT, 0);

var seg9 = new Uint16Array([54, 55, 34]);
var ibo9 = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo9);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, seg9, gl.STATIC_DRAW);
gl.drawElements(gl.LINE_STRIP, 3, gl.UNSIGNED_SHORT, 0);

var seg10 = new Uint16Array([6, 56, 11]);
var ibo10 = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo10);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, seg10, gl.STATIC_DRAW);
gl.drawElements(gl.LINE_STRIP, 3, gl.UNSIGNED_SHORT, 0);

var lines = [
    [12, 57], [14, 19], [58, 59], [60, 61], [38, 22],
    [55, 26], [55, 27], [55, 24], [33, 27], [27, 32],
    [56, 14], [5, 0]
];

for (var i = 0; i < lines.length; i++) {
    var lineIndices = new Uint16Array(lines[i]);
    var lineBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lineIndices, gl.STATIC_DRAW);
    gl.drawElements(gl.LINES, 2, gl.UNSIGNED_SHORT, 0);
}
