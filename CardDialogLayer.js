'use strict';

function CardDialogLayer (game,stage) {
	this.game = game;
	this.stage = stage;

	this.div = stage.canvas.parentElement;
	this.scrollDiv = this.div.parentElement;
}

CardDialogLayer.prototype.show = function (cards,callbacks) {
	var width = Card.WIDTH*2;
	var height = Card.HEIGHT*2;
	var space = 10;
	var totalWidth = (width + 2*space) * 3;
	var totalHeight = (height + 2*space) * Math.ceil(this.cards.length/3);
	this.cards.forEach(function (card,i) {
		var img = this.game.getImageByCid(card.cid);
		var bitmap = new CardBitmap(card.cid,img);
		var row = i%3;             // 第row行 (下标从0开始);
		var col = Math.floor(i/3); // 第col列 (下标从0开始);
		bitmap.x = row*(width+2*space) + space;
		bitmap.y = col*(height+2*space) + space;
		bitmap.setWidthHeight(width,height);
		bitmap.on('click',callbacks[i]);
		this.stage.addChild(bitmap);
	},this);
	this.stage.canvas.width = totalWidth;
	this.stage.canvas.height = totalHeight;
	this.stage.update();

	var div = this.div;
	var scrollDiv = this.scrollDiv;
	div.style.opacity = '0';
	div.style.visibility = 'visible';
	// 消灭水平滚动条
	scrollDiv.style.width = totalWidth + scrollDiv.offsetWidth - scrollDiv.clientWidth + 'px';
	// 居中
	scrollDiv.style.top = (this.stage.canvas.height - scrollDiv.offsetHeight)/2 + 'px';
	scrollDiv.style.left = (this.stage.canvas.width - scrollDiv.offsetWidth)/2 + 'px';
	div.style.opacity = '1';
};