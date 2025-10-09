// START EA1: Interaktiv animierte Scheibe
var currentFrame = 0;
var totalFrames = 24;
var autoRotating = false;
var autoInterval = null;
var img = null;

function initNicholas() {
    img = document.getElementById('rotatingImage');

    document.getElementById('btnLeft').onclick = rotateLeft;
    document.getElementById('btnRight').onclick = rotateRight;
    document.getElementById('btnAuto').onclick = toggleAuto;
}

function updateNicholas() {
    var angle = currentFrame * 15;
    img.src = "images/nicholas_" + angle + ".png";
}

function rotateLeft() {
    currentFrame++;
    if (currentFrame >= totalFrames) {
        currentFrame = 0;
    }
    updateNicholas();
}

function rotateRight() {
    currentFrame--;
    if (currentFrame < 0) {
        currentFrame = totalFrames - 1;
    }
    updateNicholas();
}

function toggleAuto() {
    if (autoRotating) {
        clearInterval(autoInterval);
        autoRotating = false;
    } else {
        autoRotating = true;
        autoInterval = setInterval(function() {
            rotateRight();
        }, 80);
    }
}


// Erweiterung mit Sprite-Sheet
var maryFrame = 0;
var maryTotalFrames = 12;
var maryWidth = 350;
var maryAutoRunning = false;
var maryAutoInterval = null;
var marySprite = null;

function initMary() {
    marySprite = document.getElementById('marySprite');

    document.getElementById('btnMaryUp').onclick = maryUp;
    document.getElementById('btnMaryDown').onclick = maryDown;
    document.getElementById('btnMaryAuto').onclick = toggleMaryAuto;
}

function updateMary() {
    var xPos = -(maryFrame * maryWidth);
    marySprite.style.backgroundPosition = xPos + "px 0";
}

function maryUp() {
    maryFrame--;
    if (maryFrame < 0) {
        maryFrame = maryTotalFrames - 1;
    }
    updateMary();
}

function maryDown() {
    maryFrame++;
    if (maryFrame >= maryTotalFrames) {
        maryFrame = 0;
    }
    updateMary();
}

function toggleMaryAuto() {
    if (maryAutoRunning) {
        clearInterval(maryAutoInterval);
        maryAutoRunning = false;
    } else {
        maryAutoRunning = true;
        maryAutoInterval = setInterval(function() {
            maryDown();
        }, 60);
    }
}


// Tastatur-Steuerung
function handleKeys(evt) {
    var key = evt.keyCode;
    var char = String.fromCharCode(key);

    if (char == 'L') {
        rotateLeft();
    } else if (char == 'R') {
        rotateRight();
    } else if (char == 'A') {
        toggleAuto();
    } else if (char == 'Z') {
        maryUp();
    } else if (char == 'V') {
        maryDown();
    } else if (char == 'E') {
        toggleMaryAuto();
    }
}

window.onload = function() {
    initNicholas();
    initMary();
    window.onkeydown = handleKeys;
};

// END EA1: Interaktiv animierte Scheibe