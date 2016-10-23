'use strict';

function CardButton (card,onclick) {
	createjs.Container.prototype.initialize.call(this);

	this.changed = true;
	this.selected = false;
	this.disabled = false;
	this.hovered = false;
	this.order = 0;

	var img = card.game.imageManager.getImageByCid(card.cid);
	this.bitmap = new CardBitmap(card.cid,img);
	this.width = Card.WIDTH*2;
	this.height = Card.HEIGHT*2;
	this.bitmap.setWidthHeight(this.width,this.height);
	this.addChild(this.bitmap);

	this.maskLayer = new createjs.Shape();
	this.orderLayer = new createjs.Text();
	this.addChild(this.maskLayer,this.orderLayer);

	this.orderLayer.font = "70px 'Segoe UI', Arial, 'Microsoft Yahei', Simsun, sans-serif'";
	this.orderLayer.textBaseline = "middle";
	this.orderLayer.textAlign = 'center';
	this.orderLayer.x = this.width/2;
	this.orderLayer.y = this.height/2;

	this.on('click',onclick);
	this.on('mouseover',this.onmouseover);
	this.on('mouseout',this.onmouseout);
}

CardButton.prototype = new createjs.Container();
CardButton.prototype.constructor = CardButton;

CardButton.prototype.onmouseover = function (event) {
	if (this.hovered) return;
	this.hovered = true;
	this.changed = true;
};

CardButton.prototype.onmouseout = function (event) {
	if (!this.hovered) return;
	this.hovered = false;
	this.changed = true;
};

CardButton.prototype.setOrder = function (order) {
	if (this.order === order) return;
	this.order = order;
	this.changed = true;
};

CardButton.prototype.disable = function () {
	if (this.disabled) return;
	this.disabled = true;
	this.changed = true;
};

CardButton.prototype.enable = function () {
	if (!this.disabled) return;
	this.disabled = false;
	this.changed = true;
};

CardButton.prototype.update = function () {
	if (this.bitmap.update()) this.changed = true;
	if (!this.changed) return false;
	this.changed = false;

	this.maskLayer.graphics.clear();
	if (this.order) {
		this.orderLayer.visible = true;
		this.orderLayer.text = this.order;
	} else {
		this.orderLayer.visible = false;
	}
	if (this.selected) {
		this.maskLayer.graphics
			.beginFill('rgba(255,255,255,0.5)')
			.drawRect(0,0,this.width,this.height);
	} else if (this.disabled) {
		this.maskLayer.graphics
			.beginFill('rgba(0,0,0,0.5)')
			.drawRect(0,0,this.width,this.height);
	} else if (this.hovered) {
		this.maskLayer.graphics
			.beginFill('rgba(255,255,255,0.1)')
			.drawRect(0,0,this.width,this.height);
	} else {
		this.maskLayer.graphics.clear();
	}
	return true;
};