let levelForFuture,currentLevelForFuture;
var gameEngine = new Phaser.Class({
  key : 'gameEngine',
  Extends : Phaser.Scene,
  initialize: function gameEngine(){
    Phaser.Scene.call(this , {key:"gameEngine"});
  },
  init:function(data) {
    // I use copyArray because any change to this.level affect data.level
    // tanks @jdotr bi discord for the help <3
    /* jdotr : mutations of this.level will change data.level
    because javascript is (effectively) a pass by reference language (even though it's actually pass by value)*/
    this.level = this.copyArray(data.level);
    this.currentLevel = data.currentLevel;
  },
  preload: function() {
    this.load.spritesheet("tiles", "../../assets/images/tiles.png", {
        frameWidth: gameOptions.initialTileSize,
        frameHeight: gameOptions.initialTileSize
    });
    this.load.bitmapFont('atariClassic', '../../assets/fonts/atari-classic.png', '../../Assets/fonts/atari-classic.xml');
    this.load.audio("bgm", '../../assets/Sounds/bgm.ogg');
  },

  create: function() {
    this.playerSprites = [];
    this.validMovesLocations = [];

    var bgMusic = this.sound.add('bgm');
    bgMusic.play();

    this.swipeIsMade = 0;
    this.moves = 0;

    this.playerLocation;

    this.undoArray = [];
    //Equation to get the scale that I should use based on screen size
    this.tileSize = Math.round(Math.sqrt((gameOptions.gameWidth * gameOptions.gameHeight) / (this.level[0].length * this.level[1].length) ));
    this.drawLevel();
    this.shown = 0;

    this.input.on("pointerdown" , (pointer)=>{
      // TODO(Omar) : Weird bug here I use this because the game changing the first row with no logical reason.
      this.level[0] = this.copyArray(new Array(this.level.length).fill(1));
      var copyOfLevel = this.copyArray(this.level);
      this.goal = [Math.floor(pointer.x/this.tileSize),Math.floor(pointer.y/this.tileSize)];

      // this.shown to check if I was already pressed on player to get rid sprites added in showValidMoves 
      if(this.goal[1] == this.playerLocation.x && this.goal[0] == this.playerLocation.y || this.shown) {
        //he la2ofsol el keyboard 3an touch
        // la2an momkn kun 3ml touch bnfs w2t hrk bl keyboardControl
        //fa bdaln el suwar m3l2in 3a cheche
        this.comeFromTouch = 1;
        this.showValidMoves();
      }
      var graph = new Graph(this.makePathFindPattern(copyOfLevel));
      var start = graph.grid[this.playerLocation.x][this.playerLocation.y];
      var end = graph.grid[this.goal[1]][this.goal[0]];
      var result = astar.search(graph,start, end);
      if(result.length)
        this.autoWalk(result);

      this.drawLevel();
    }, this);

    var scoreTxtConfig = {
        image: 'atariClassic',
        width: 31,
        height: 25,
        chars: Phaser.GameObjects.RetroFont.TEXT_SET6,
        charsPerRow: 10,
        spacing: { x: 1, y: 1 }
    };
    this.cache.bitmapFont.add('atariClassic', Phaser.GameObjects.RetroFont.Parse(this, scoreTxtConfig));

    this.scoreTxt = this.add.bitmapText(gameOptions.gameWidth / 2, this.tileSize/3, 'atariClassic', 'moves:'+this.moves);
    this.scoreTxt.width = 10;
    this.scoreTxt.height = 10;
    this.scoreTxt.setOrigin(0.5);
    this.scoreTxt.depth = 3;
    this.scoreTxt.fontSize = this.tileSize /2;
  },
  //Convert the level to a shape that A* pathfinding algorithm can accept : 1 can go throught fi , 0 can not (Wall , ....)
  makePathFindPattern: function(copyOfLevel) {
    for(var i = 0; i < copyOfLevel.length;i++) {
      for(var j = 0 ; j < copyOfLevel.length ; j++) {
        switch(copyOfLevel[i][j]) {
          case WALL:
          case CRATE:
          case CRATE+SPOT:
          case PLAYER:
          case PLAYER+SPOT:
            copyOfLevel[i][j] = 0;
            break;
          default:
            copyOfLevel[i][j] = 1;
            break;
        }
      }
    }
    
    copyOfLevel[0] = this.copyArray(new Array(copyOfLevel.length).fill(0));
    return copyOfLevel;
  },
  
  autoWalk : function(path) {
    for(var i=0 ; i < path.length ; i++) {
      this.checkMove(path[i].x - this.playerLocation.x , path[i].y - this.playerLocation.y);
    }
  },
  
  endSwipe: function(e) {
    var swipeTime = e.upTime - e.downTime;
    var swipe = new Phaser.Geom.Point(e.upX - e.downX , e.upY - e.downY);
    var swipeMagnitude = Phaser.Geom.Point.GetMagnitude(swipe);
    var swipeNormal = new Phaser.Geom.Point(swipe.x / swipeMagnitude , swipe.y / swipeMagnitude);
    if(swipeMagnitude>20 && swipeTime < 1000 && (Math.abs(swipeNormal.y) > 0.8 || Math.abs(swipeNormal.x) > 0.8)) {
      if(swipeNormal.x > 0.8){
        this.checkMove(0,1);
      }
      if(swipeNormal.x < -0.8){
        this.checkMove(0,-1);
      }
      if(swipeNormal.y > 0.8){
        this.checkMove(1,0);
      }
      if(swipeNormal.y < -0.8){
        this.checkMove(-1,0);
      }
      this.swipeIsMade = 1;
    } else {
      this.swipeIsMade = 0;
    }
  },

  drawLevel : function() {
    var scaleValue = this.tileSize/gameOptions.initialTileSize;

    this.level[0] = this.copyArray(new Array(this.level.length).fill(1));
    for(var i = 0 ; i < this.level.length ; i++) {
      for(var j = 0 ; j < this.level.length ; j++) {
        switch (this.level[i][j]) {
          case PLAYER:
          case PLAYER+SPOT:
            this.playerLocation = {x:i , y:j};
            this.player = this.add.sprite(this.tileSize * j , this.tileSize * i , "tiles" , this.level[i][j]).setScale(scaleValue );
            this.player.depth = 1;
            this.player.setOrigin(0);
            break;
          default:
            var sp = this.add.sprite(this.tileSize * j , this.tileSize * i , "tiles" , this.level[i][j]).setScale(scaleValue );
            sp.depth = 1;
            sp.setOrigin(0);
            break;
        }
      }
    }
  },
  keyboardControl: function() {
    moveKeys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        undo: Phaser.Input.Keyboard.KeyCodes.E,
        restart: Phaser.Input.Keyboard.KeyCodes.R
    });

    if (Phaser.Input.Keyboard.JustDown(moveKeys.up)) {
      this.comeFromTouch = 0;
      this.showValidMoves();
      this.checkMove(-1,0);
    }
    if (Phaser.Input.Keyboard.JustDown(moveKeys.down)) {
      this.comeFromTouch = 0;
      this.showValidMoves();
      this.checkMove(1,0);
    }
    if (Phaser.Input.Keyboard.JustDown(moveKeys.left)) {
      this.comeFromTouch = 0;
      this.showValidMoves();
      this.checkMove(0,-1);
    }
    if (Phaser.Input.Keyboard.JustDown(moveKeys.right)) {
      this.comeFromTouch = 0;
      this.showValidMoves();
      this.checkMove(0,1);
    }
    if (Phaser.Input.Keyboard.JustDown(moveKeys.undo)) {
      this.comeFromTouch = 0;
      this.showValidMoves();
      this.doingAnUndo();
    }

    if (Phaser.Input.Keyboard.JustDown(moveKeys.restart)) {
      this.scene.start('levelManager',this.currentLevel);
      this.scene.restart(this.registry.get('dataRequested'));
    }
  },

  checkMove: function(deltaX,deltaY){
    this.level[0] = this.copyArray(new Array(this.level.length).fill(1));

    if(this.isWalkable(this.playerLocation.x+deltaX , this.playerLocation.y+deltaY)){
      //btzid el array 3a undoArray la a3ml undo brhte
      this.undoArray.push(this.copyArray(this.level));
      this.movePlayer(deltaX,deltaY);
      this.moves++;
      return;
    }

    if(this.isCrate(this.playerLocation.x+deltaX , this.playerLocation.y+deltaY)){
      if(this.isWalkable(this.playerLocation.x+2*deltaX , this.playerLocation.y+2*deltaY)){
        this.undoArray.push(this.copyArray(this.level));
        this.moveCrate(deltaX , deltaY);
        this.movePlayer(deltaX,deltaY);
        this.moves++;
        return;
      }
    }
  },

  isWalkable: function(posX,posY) {
    return this.level[posX][posY] == EMPTY || this.level[posX][posY] == SPOT;
  },

  isCrate: function(posX,posY) {
    return this.level[posX][posY] == CRATE || this.level[posX][posY] == CRATE + SPOT;
  },

  movePlayer: function(deltaX,deltaY) {

    this.level[this.playerLocation.x][this.playerLocation.y] -= PLAYER;

    this.playerLocation.x += deltaX;
    this.playerLocation.y += deltaY;

    this.level[this.playerLocation.x][this.playerLocation.y] += PLAYER;
    this.drawLevel();
  },
  moveCrate: function(deltaX,deltaY) {

    this.level[this.playerLocation.x + deltaX][this.playerLocation.y + deltaY] -= CRATE;

    this.level[this.playerLocation.x+2*deltaX][this.playerLocation.y+2*deltaY] += CRATE;
    this.drawLevel();

    this.time.delayedCall(500 , function() {
      this.GameOver();
    }, [] , this);

  },
  doingAnUndo : function() {
    if(this.undoArray.length > 0) {
    var undoLevel = this.undoArray.pop();
    this.level = this.copyArray(undoLevel);
    this.drawLevel();
    this.cameras.main.flash(400);
    this.moves--;
    }
  },

  getNumberOfCrateAndSpots: function() {
    var countOfSpots = 0;
    var countOfCrates = 0;
    for(var i=0; i < this.level.length;i++) {
      for(var j = 0 ; j < this.level.length ; j++) {
        if (this.level[i][j] == SPOT) {
          countOfSpots++;
        } else if(this.level[i][j] == CRATE) {
          countOfCrates++;
        }
      }
    }

    return {nbSpots : countOfSpots , nbCrates : countOfCrates};
  },

  copyArray: function(a) {
    var newArray = a.slice(0);
    for(var i = newArray.length; i > 0 ; i--) {
      if(newArray[i] instanceof Array){
        newArray[i] = this.copyArray(newArray[i]);
      }
    }
    return newArray;
  },
  
  showValidMoves : function() {
    var level = this.makePathFindPattern(this.copyArray(this.level))
    var scaleValue = this.tileSize/gameOptions.initialTileSize;
    this.validMovesLocations = [];
    for(var i=0; i< level.length ; i++) {
      for (var j=0; j<level.length;j++) {
        if(level[i][j] == 1) {
          //bjib kol el matareh ele el le3eb bydar yd3as 3lya
          this.validMovesLocations.push({x:i,y:j});
        }
      }
    }
    
    if(!this.shown && this.comeFromTouch) {
      var graph = new Graph(level);
      var start = graph.grid[this.playerLocation.x][this.playerLocation.y];
      this.playerSprites = [];
      for(var i = 0 ; i < this.validMovesLocations.length ; i++ ) {
        var end =  graph.grid[this.validMovesLocations[i].x][this.validMovesLocations[i].y];
        var result = astar.search(graph,start, end);
        if(result.length > 0) {
          var playerSprite = this.add.sprite(this.tileSize * this.validMovesLocations[i].y ,
             this.tileSize * this.validMovesLocations[i].x , "tiles" , PLAYER).setScale(scaleValue );
          // la hott el sura fo2 kol objects la ybyno for EMPTY
          playerSprite.depth = 1.1;
          playerSprite.setOrigin(0);
          playerSprite.alpha  = 0.2;
          //b5zen el sprite l2n 3yz emhiha b3den
          this.playerSprites.push(playerSprite);
        }
      }
      this.shown = 1;

      return;
    }
    if(this.shown) {
      for(var i = 0 ; i < this.playerSprites.length ; i++) {
        this.playerSprites[i].destroy();
      }
      this.shown = 0;
      return;
    }
  },
  GameOver: function() {
    NumberOfCrateAndSpots = this.getNumberOfCrateAndSpots();
    if(NumberOfCrateAndSpots.nbSpots == 0 && NumberOfCrateAndSpots.nbCrates == 0) {
      game.scene.start('levelManager', ++this.currentLevel);
      this.scene.restart(this.registry.get('dataRequested'));
    }
  },
  update: function() {
    this.keyboardControl();
    this.scoreTxt.text = 'moves:'+this.moves;
  },
});
