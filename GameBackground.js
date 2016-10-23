'use strict';

function GameBackground (game) {
	createjs.Container.prototype.initialize.call(this);

	this.game = game;
	this.width = game.stage.canvas.width;
	this.height = game.stage.canvas.height;

	this.changed = true;

	// this.imageWhite = this.newImage('./background/white.png');
	// this.imageBlack = this.newImage('./background/black.png');
	// this.imageGreen = this.newImage('./background/green.png');
	// this.imageBlue  = this.newImage('./background/blue.png');
	// this.imageRed   = this.newImage('./background/red.png');

	// this.selfBackground = new createjs.Bitmap('');
	// this.opponentBackground = new createjs.Bitmap('');

	// this.selfBackground.x = 0;
	// this.selfBackground.y = 367;
	// this.opponentBackground.regX = 576;
	// this.opponentBackground.regY = 368;
	// this.opponentBackground.rotation = 180;

	this.mask = new createjs.Shape();
	// this.addChild(this.selfBackground,this.opponentBackground,this.mask);
	this.addChild(this.mask);
}

GameBackground.prototype = new createjs.Container();
GameBackground.prototype.constructor = GameBackground;

// GameBackground.prototype.newImage = function (src) {
// 	var img = new Image();
// 	img.src = src;
// 	return img;
// };
// GameBackground.prototype.setColor = function (selfColor,opponentColor) {
// 	var imageMap = {
// 		'white': this.imageWhite,
// 		'black': this.imageBlack,
// 		'green': this.imageGreen,
// 		'blue': this.imageBlue,
// 		'red': this.imageRed
// 	}
// 	this.selfBackground.image = imageMap[selfColor];
// 	this.opponentBackground.image = imageMap[opponentColor];
// 	this.changed = true;
// };
GameBackground.prototype.setWaiting = function (waiting) {
	if (waiting) {
		this.mask.graphics
			.clear()
			.beginFill('rgba(0,0,0,0.25)')
			.drawRect(0,0,this.width,this.height);
	} else {
		this.mask.graphics.clear();
	}
	this.changed = true;
};

GameBackground.prototype.update = function () {
	var changed = this.changed;
	this.changed = false;
	return changed;
};