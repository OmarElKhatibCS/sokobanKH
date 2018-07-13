// Options elle lal l3be
var gameOptions = {
    initialTileSize : 40,
    gameWidth: 500,
    gameHeight: 500,
    gameSpeed: 10,
    doubleTapDelay: 250
};

// setup the main scene nothing Important Huh
const gameConfig = {
    type: Phaser.CANVAS,
    width: gameOptions.gameWidth,
    height: gameOptions.gameHeight,
    scene: [winScreen,levelManager,gameEngine],
    pixelArt: true,
    audio: {
        disableWebAudio: true
    }
};

// Main scene...
const game = new Phaser.Game(gameConfig);
game.scene.start('levelManager', 1);

//Method la n3ml resize la cheche law ma knt el framework ma btd3m resize
function resize() {
    var canvas = document.querySelector("canvas");
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var windowRatio = windowWidth / windowHeight;
    var gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}

window.onload = function(){
    window.addEventListener("resize", resize, false);
    resize();
};
