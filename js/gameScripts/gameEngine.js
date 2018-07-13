let levelForFuture,currentLevelForFuture;
var gameEngine = new Phaser.Class({
  // standar scene things
  key : 'gameEngine',
  Extends : Phaser.Scene,
  initialize: function gameEngine(){
    Phaser.Scene.call(this , {key:"gameEngine"});
  },
  //init game la jib level w array level elle ane fiha
  init:function(data) {
    // hon 3mlt copyArray la2an ayya t3dil bisiba la this.level byt2ser el data.level fiha
    // javascript hya hek 3mlta tanks @jdotr bi discord la hal ma3lume <3
    /* jdotr : mutations of this.level will change data.level
    because javascript is (effectively) a pass by reference language (even though it's actually pass by value)*/
    this.level = this.copyArray(data.level);
    this.currentLevel = data.currentLevel;
  },
  // function mn ases el phaser bst5dma la estd3e el mlfet 3dtan
  preload: function() {
    //he tile majmu3et suwar b whde b2sma bchkl initialTileSize (hjm sura asese)
    this.load.spritesheet("tiles", "../../assets/images/tiles.png", {
        frameWidth: gameOptions.initialTileSize,
        frameHeight: gameOptions.initialTileSize
    });
    this.load.bitmapFont('atariClassic', '../../assets/fonts/atari-classic.png', '../../Assets/fonts/atari-classic.xml');
    this.load.audio("bgm", '../../assets/Sounds/bgm.ogg');
  },
  // function mn ases el phaser bst5dma la mara whde lama anche2 el scene
  create: function() {
    // music asesye la l3be
    this.playerSprites = [];
    this.validMovesLocations = [];

    var bgMusic = this.sound.add('bgm');
    bgMusic.play();
    //et2kd anno fi swipe saret
    this.swipeIsMade = 0;
    this.moves = 0;
    // bt5zen mawke3 le3eb
    this.playerLocation;
    //array bt5zn el levels la a3ml undo
    this.undoArray = [];
    //math la jib el hjm el monseb la suwar le3be fi hal scale
    this.tileSize = Math.round(Math.sqrt((gameOptions.gameWidth * gameOptions.gameHeight) / (this.level[0].length * this.level[1].length) ));
    this.drawLevel();
    this.shown = 0;
    // kol ma okbos el mouse 3a matrah bl cheche bruh le3eb 3le eza by2dar
    this.input.on("pointerdown" , (pointer)=>{
      //he 3am hotta la2an el lo3ba 3am t8yer awel saff la hala bchkl 8arib
      this.level[0] = this.copyArray(new Array(this.level.length).fill(1));
      var copyOfLevel = this.copyArray(this.level);
      this.goal = [Math.floor(pointer.x/this.tileSize),Math.floor(pointer.y/this.tileSize)];
      // hon 3am chuf eza kbset 3al le3eb aw knt kbs 3le
      // this.shown hen eza knt kbs w 5ales la ot5ls mn el suwar el zdtn bl showValidMoves
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
    // this.input.on("pointerdown" , this.endSwipe, this);

    //setup bitmapText
    var scoreTxtConfig = {
        image: 'atariClassic',
        width: 31,
        height: 25,
        chars: Phaser.GameObjects.RetroFont.TEXT_SET6,
        charsPerRow: 10,
        spacing: { x: 1, y: 1 }
    };
    this.cache.bitmapFont.add('atariClassic', Phaser.GameObjects.RetroFont.Parse(this, scoreTxtConfig));
    //text la yo3rod score
    this.scoreTxt = this.add.bitmapText(gameOptions.gameWidth / 2, this.tileSize/3, 'atariClassic', 'moves:'+this.moves);
    this.scoreTxt.width = 10;
    this.scoreTxt.height = 10;
    this.scoreTxt.setOrigin(0.5);
    this.scoreTxt.depth = 3;
    this.scoreTxt.fontSize = this.tileSize /2;
  },
  //he bt3ml nos5a mn level la astar pathfinding 1 masmuh yomro2 fi , 0 mannu3
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
    // he 3am hotta la2an el lo3ba 3am t8yer awel saff la hala bchkl 8arib
    copyOfLevel[0] = this.copyArray(new Array(copyOfLevel.length).fill(0));
    return copyOfLevel;
  },
  // function btmche l3eb la halo
  autoWalk : function(path) {
    for(var i=0 ; i < path.length ; i++) {
      this.checkMove(path[i].x - this.playerLocation.x , path[i].y - this.playerLocation.y);
    }
  },
  // he function la a3ml check iza fi swipe
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
  // he btjib el array w thwla la Graphics
  drawLevel : function() {
    //he scaleValue la t3dl hjm suwar bchkl ytwafe2 ma3 array w el screen size
    var scaleValue = this.tileSize/gameOptions.initialTileSize;
    //he 3am hotta la2an el lo3ba 3am t8yer awel saff la hala bchkl 8arib
    this.level[0] = this.copyArray(new Array(this.level.length).fill(1));
    for(var i = 0 ; i < this.level.length ; i++) {
      for(var j = 0 ; j < this.level.length ; j++) {
        switch (this.level[i][j]) {
          case PLAYER:
          //Hon hottet PLAYER+SPOT la2an bt3le2 lo3ba 3a sprite lama ykun el player 3a SPOT
          case PLAYER+SPOT:
            this.playerLocation = {x:i , y:j};
            // zid le sura mahal el j la2an j hya el x w el i hya y
            /*
              la2an el array manzara hek
              [
                  i
              j  [.,.,.],
                [.,.,.],
              ]
            */
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
  // function la t3ml enable lal keyboardControl
  keyboardControl: function() {
    // Creates object for input with WASD kets
    moveKeys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        undo: Phaser.Input.Keyboard.KeyCodes.E,
        restart: Phaser.Input.Keyboard.KeyCodes.R
    });

    // JustDown bt5li y3ml bas move 1 mch hold key bas kbse
    if (Phaser.Input.Keyboard.JustDown(moveKeys.up)) {
      // lamma ykun fi tiles elle ma3mln generate bl showValidMoves
      // lamma okbos bl keyboard by5tfo
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
    // lama okbos el U
    // bt3ml nfs elle abel bas he Undo
    if (Phaser.Input.Keyboard.JustDown(moveKeys.undo)) {
      this.comeFromTouch = 0;
      this.showValidMoves();
      this.doingAnUndo();
    }
    // btrster el lo3ba -_-
    if (Phaser.Input.Keyboard.JustDown(moveKeys.restart)) {
      this.scene.start('levelManager',this.currentLevel);
      this.scene.restart(this.registry.get('dataRequested'));
    }
  },
  //btchof eza l3eb ader ytharrak
  checkMove: function(deltaX,deltaY){
    this.level[0] = this.copyArray(new Array(this.level.length).fill(1));
    // bt3ml check eza elle b3d el le3eb bi hsb el ettijah
    if(this.isWalkable(this.playerLocation.x+deltaX , this.playerLocation.y+deltaY)){
      //btzid el array 3a undoArray la a3ml undo brhte
      this.undoArray.push(this.copyArray(this.level));
      this.movePlayer(deltaX,deltaY);
      this.moves++;
      return;
    }
    // bt3ml check eza elle b3d el le3eb bi hsb el ettijah sandu2
    if(this.isCrate(this.playerLocation.x+deltaX , this.playerLocation.y+deltaY)){
      // bt3ml check eza elle b3d el sondu2 fade aw spot la yo2dar yomro2
      if(this.isWalkable(this.playerLocation.x+2*deltaX , this.playerLocation.y+2*deltaY)){
        //btzid el array 3a undoArray la a3ml undo brhte
        this.undoArray.push(this.copyArray(this.level));
        this.moveCrate(deltaX , deltaY);
        this.movePlayer(deltaX,deltaY);
        this.moves++;
        return;
      }
    }
  },
  // btrj3 0 aw 1 hasab eza el etijehet
  isWalkable: function(posX,posY) {
    return this.level[posX][posY] == EMPTY || this.level[posX][posY] == SPOT;
  },
  // btrj3 0 aw 1 hasab eza el etijehet eza ken CRATE
  isCrate: function(posX,posY) {
    return this.level[posX][posY] == CRATE || this.level[posX][posY] == CRATE + SPOT;
  },
  // function la threk el le3eb
  movePlayer: function(deltaX,deltaY) {
    //btn2es mawke3 el le3eb mn 4 y3ne byrja3 la hlto aslye
    this.level[this.playerLocation.x][this.playerLocation.y] -= PLAYER;
    //btzid el etijehet la mawke3 le3eb hele
    this.playerLocation.x += deltaX;
    this.playerLocation.y += deltaY;
    //btn2es mawke3 el le3eb mn 4 y3ne byrja3 la hlto aslye
    this.level[this.playerLocation.x][this.playerLocation.y] += PLAYER;
    this.drawLevel();
  },
  moveCrate: function(deltaX,deltaY) {
    //btn2es mawke3 el le3eb mn 4 y3ne byrja3 la hlto aslye
    this.level[this.playerLocation.x + deltaX][this.playerLocation.y + deltaY] -= CRATE;
    //btzid mawke3 el le3eb mn 4 y3ne byrja3 la hlto aslye
    this.level[this.playerLocation.x+2*deltaX][this.playerLocation.y+2*deltaY] += CRATE;
    this.drawLevel();

    //t25ir el tnfiz lal function 500ms
    this.time.delayedCall(500 , function() {
      // this.scene.restart();
      //b3d kol taharrok btchuf eza lo3ba 5olset
      this.GameOver();
    }, [] , this);

  },
  // function la trj3 el lo3ba la abel e5er taharrok
  doingAnUndo : function() {
  //   // eza kn fi taharrokat sabika
    if(this.undoArray.length > 0) {
  //   // btfde e5er taharrok 3mlto mn array w bt5zno
    var undoLevel = this.undoArray.pop();
  //   //b5le array el lo3ba hya e5er ta5zina w brsom el marhla
    this.level = this.copyArray(undoLevel);
    this.drawLevel();
  //   //bt3ml t2sir flash lal canvas
    this.cameras.main.flash(400);
    this.moves--;
    }
  },
  // bt3ml check la 3adad spotet w el crates bl array
  // bts3dne la chuf eza lo3be 5olset la2an 3adad el spotet bswe snadi2
  // eza kno 2 sfer y3ne batlo bl array y3ne el loba btkun 5olset
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
    //btrj3 object bthtwe 3a 3adad spotet w el crates
    return {nbSpots : countOfSpots , nbCrates : countOfCrates};
  },
  // b3uza la a3ml nos5a 3an array tnye
  copyArray: function(a) {
    var newArray = a.slice(0);
    for(var i = newArray.length; i > 0 ; i--) {
      if(newArray[i] instanceof Array){
        newArray[i] = this.copyArray(newArray[i]);
      }
    }
    return newArray;
  },
  //btfrjine matareh ele ader le3eb
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
    // he la torsom el matareh ele momkn el l3eb ywsalla bas eza jeye mn touch
    // la2an btb2el tnmhe asar el function eza 3mlt touch w ma rj3t kbset
    // bas thrket mn keyboard
    if(!this.shown && this.comeFromTouch) {
      var graph = new Graph(level);
      var start = graph.grid[this.playerLocation.x][this.playerLocation.y];
      this.playerSprites = [];
      for(var i = 0 ; i < this.validMovesLocations.length ; i++ ) {
        // nhaya hye kol matrah lal ameken masmuha
        var end =  graph.grid[this.validMovesLocations[i].x][this.validMovesLocations[i].y];
        var result = astar.search(graph,start, end);
        //iza kn el le3eb ader ywsal la hal mant2a fa mnrsom 3lya 5yel le3eb
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
      // hon la to5las b3ml mtl flag la 5ber function anno nrsm w 55oles
      // la2an nfs el function btrsom w btmhe
      this.shown = 1;
      //btrja3 lama torsom ahsen ma ysir fi td5ol bna w bn el mahey
      return;
    }
    if(this.shown) {
      for(var i = 0 ; i < this.playerSprites.length ; i++) {
        //btdmer le sprite
        this.playerSprites[i].destroy();
      }
      // hon la to5las b3ml mtl flag la 5ber function anno nmha w 55oles
      // la2an nfs el function btrsom w btmhe
      this.shown = 0;
      //btrja3 lama torsom ahsen ma ysir fi td5ol bna w bn el rasem
      return;
    }
  },
  // la tchfle eza l3be 5olset
  GameOver: function() {
    //bjib 3adad el spots w el crates
    NumberOfCrateAndSpots = this.getNumberOfCrateAndSpots();
    // eza kn 3dad el spot w el crate 0 y3ne rbht marhle
    if(NumberOfCrateAndSpots.nbSpots == 0 && NumberOfCrateAndSpots.nbCrates == 0) {
      // game.scene.remove('gameEngine');
      game.scene.start('levelManager', ++this.currentLevel);
      this.scene.restart(this.registry.get('dataRequested'));
    }
  },
  // function mn ases el phaser bst5dma la a3ml awemer kel frame
  update: function() {
    //btdal tost2bl taharrokat el le3eb mn keyboard
    this.keyboardControl();
    // thdis imet el nas 3al cheche
    this.scoreTxt.text = 'moves:'+this.moves;
  },
});
