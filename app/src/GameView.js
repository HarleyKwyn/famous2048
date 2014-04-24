	define(function(require, exports, module) {
    var Surface         = require('famous/core/Surface');
    var Modifier        = require('famous/core/Modifier');
    var Transform       = require('famous/core/Transform');
    var View            = require('famous/core/View');
    var TileView        = require('src/TileView');
    var Easing          = require('famous/transitions/Easing');
    var Timer           = require('famous/utilities/Timer');
    var EventHandler    = require('famous/core/EventHandler');
    var grid            = require('src/grid');
    var Game            = require('src/application');
    var controller      = require('src/controller');
    var Random          = require('famous/math/Random');

    function GameView() {
        View.apply(this, arguments);
        _createGameSurface.call(this);
        _createTiles.call(this);
        _respondToLogic.call(this);
        _coords.call(this);
    };

    GameView.prototype = Object.create(View.prototype);
    GameView.prototype.constructor = GameView;

    GameView.DEFAULT_OPTIONS = {};

    function _createGameSurface() {
  		this.backgroundSurface = new Surface({
  				size: this.options.size,
          properties: {
            border: '1px solid grey'
          }
       });
      this.backgroundSurface.pipe(this._eventOutput);

  		this._add(this.backgroundSurface);
    };

    function _createTiles(){
      this.width = this.options.size[0];
      this.tileModifiers = [];
      this.tileRModifiers = [];
      this.tiles = []
        for(var i = 0; i < 4; i++) {
          this.tiles.push([]);
          this.tileModifiers.push([]);
          this.tileRModifiers.push([]);
          for(var j = 0; j < 4; j++){
              var tile = new Surface({
              size:[this.width/5, this.width/5],
              content: '',
                properties:{
                  backgroundColor: 'grey',
                  borderRadius: '3px',
                  color: 'black'
                }
            });
            var tileModifier = new Modifier({
              origin:[0.5,0],
              opacity: 0.5,
              transform: Transform.translate(-1000, -1000, 100)
            });
            this.tiles[i].push(tile);
            this.tileModifiers[i].push(tileModifier);

            var RModifier = new Modifier({
              transform: Transform.rotateZ(0)
            });
            this.tileRModifiers[i].push(RModifier);

            this._add(tileModifier).add(RModifier).add(tile);
          }
        }
    };

    function _coords(){
      this.positions = [];
      for(var i = 0; i < 4; i++) {
        this.positions.push([]);
        for(var j = 0; j < 4; j++){
          this.positions[i].push([i*this.width/4 - (this.width/2 - this.width/8) ,(j*this.width/4) + this.width/30]);
        }
      }
    };

    function _animateTilesIn(){
      for(var i = 0; i < this.tileModifiers.length; i++) {
        for(var j = 0; j < this.tileModifiers[i].length; j++){
          Timer.setTimeout(function(i, j) {
            this.tileModifiers[i][j].setTransform(
              Transform.translate(this.positions[i][j][0], this.positions[i][j][1]),
              { duration: 1000, curve: Easing.outQuint });
          }.bind(this, i, j), i * 100)
        }
      }
    };
    function _respondToLogic(){
      this.eventHandler   = new EventHandler();
      //mei@famo.us
      //this._eventInput.subscribe(controller);
      this.eventHandler.subscribe(controller);

      this.eventHandler.on('clear', function(data){
        this.tiles.forEach(function(row){
          row.forEach(function(tile){
            tile.setContent('');
          });
        });
      }.bind(this));
      
      this.eventHandler.on('game-over', function(){

        for(var i = 0; i < 4; i++){
          for(var j = 0; j < 4; j++){
            Timer.setTimeout(function(i, j) {
              this.tileRModifiers[i][j].setTransform(
                Transform.rotateZ(i),
                {duration:1000}
              );
              // this.tileModifiers[i][j]
              this.tileModifiers[i][j].setOpacity(0.5);
              this.tileModifiers[i][j].setTransform(
                Transform.translate(this.positions[i][j][0], this.width),
                { duration: 1000, curve: Easing.outQuint }
              );
            }.bind(this, i, j), i * 100);

          }
        }
      }.bind(this));

      this.eventHandler.on('restart', function(data){
        for(var i = 0; i < 4; i++){
          for(var j = 0; j < 4; j++){
            this.tileModifiers[i][j].setOpacity(1);
            this.tileRModifiers[i][j].setTransform(
              Transform.rotateZ(0));
            this.tileModifiers[i][j].setTransform(
              Transform.translate(-1000, -1000, 100));
            Timer.setTimeout(function(i, j) {

              this.tileModifiers[i][j].setOpacity(0.5);
              this.tileModifiers[i][j].setTransform(
                Transform.translate(this.positions[i][j][0], this.positions[i][j][1]),
                { duration: 1000, curve: Easing.outQuint }
              );
            }.bind(this, i, j), i * 100);

          }
        }
      }.bind(this));

      this.eventHandler.on('addTile', function(data){
        var newX = data.tile.x;
        var newY = data.tile.y;
        var newCoords = this.positions[newX][newY];
        if(data.tile.previousPosition){
          var prevX = data.tile.previousPosition.x;
          var prevY = data.tile.previousPosition.y;
          var prevCoords = this.positions[prevX][prevY]
          if(prevX !== newX || prevY !== newY){
          var prevMod = this.tileModifiers[prevX][prevY]

          prevMod.setTransform(
            Transform.translate(prevCoords[0],prevCoords[1], 100),
            {duration: 50, curve: Easing.outQuint});

          prevMod.setTransform(
            Transform.translate(newCoords[0],newCoords[1]),
            {duration: 100, curve: Easing.outQuint});

          prevMod.setTransform(
            Transform.translate(newCoords[0],newCoords[1], 0),
            {duration: 50, curve: Easing.outQuint});
          
          prevMod.setOpacity(1);

          prevMod.setTransform(
            Transform.translate(prevCoords[0],prevCoords[1]),
            {duration:0});
          prevMod.setOpacity(0.5);
          }
        }

        this.tiles[data.tile.x][data.tile.y].setContent(data.tile.value);
      }.bind(this));

      Game.exports.setup();

      _animateTilesIn.call(this);

    }

    module.exports = GameView;
});