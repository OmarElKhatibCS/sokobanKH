var levelManager = new Phaser.Class({
  key : 'levelManager',
  Extends : Phaser.Scene,
  initialize: function levelManager(){
    Phaser.Scene.call(this , {key:"levelManager"});
  },
  init:function(currentLevel){
    this.currentLevel = currentLevel;
  },
  preload: function() {
    var nbOfLvls ;
    try { nbOfLvls= getNbOfDirFiles('./assets/Data/Levels/');}
    catch(e) {nbOfLvls=6;}
    for(var i = 1 ; i <= nbOfLvls ;i++) {
      this.load.json('level'+i,'assets/Data/Levels/level'+i+'.json');
    }
  },
  create :  function() {
    // game.scene.add('gameEngine', gameEngine, false);
    this.loadLevel();
  },
  loadLevel : function() {
    var levelData = this.cache.json.get('level'+this.currentLevel);
    game.scene.start('gameEngine', {level : levelData.levelPattern , currentLevel : this.currentLevel});
    this.scene.stop();
  }
});
