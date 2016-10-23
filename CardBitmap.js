'use strict';

function CardBitmap (alt,img) {
	createjs.Container.prototype.initialize.call(this);

	this.setAltImage(alt,img);
	this.setWidthHeight(Card.WIDTH,Card.HEIGHT);

	this.complete = img.complete;

	this.text = new createjs.Text(alt);
	this.bitmap = new createjs.Bitmap(img);
	this.addChild(this.text,this.bitmap);

	this.changed = true;
}

CardBitmap.prototype = new createjs.Container();
CardBitmap.prototype.constructor = CardBitmap;

CardBitmap.prototype.setAltImage = function (alt,img) {
	if (alt !== this.alt || img !== this.img) {
		this.changed = true;
		this.alt = alt;
		this.img = img;
	}
};

CardBitmap.prototype.setWidthHeight = function (width,height) {
	if (width !== this.width || height !== this.height) {
		this.changed = true;
		this.width = width;
		this.height = height;
	}
};

CardBitmap.prototype.update = function () {
	if (this.complete != this.img.complete) {
		this.changed = true;
	}

	if (!this.changed) return false;

	this.changed = false;
	this.complete = this.img.complete;
	this.text.text = this.alt;
	if (this.img.complete && this.img.naturalWidth !== 0) {
		this.bitmap.image = this.img;
		this.bitmap.scaleX = this.width / this.img.width;
		this.bitmap.scaleY = this.height / this.img.height;
		this.bitmap.visible = true;
		this.text.visible = false;
	} else {
		this.bitmap.visible = false;
		this.text.visible = true;
	}
	return true;
};