'use strict';

function ButtonList () {
	createjs.Container.prototype.initialize.call(this);

	this.changed = false;
	this.buttons = [];
}

ButtonList.prototype = new createjs.Container();
ButtonList.prototype.constructor = ButtonList;

ButtonList.prototype.addButton = function (btn) {
	this.changed = true;
	this.buttons.push(btn);
	this.addChild(btn);
};

ButtonList.prototype.setButtonPositions = function () {
	var base = -this.buttons.length/2 + 0.5;
	this.buttons.forEach(function (btn,i) {
		btn.x = 0;
		btn.y = (base + i)*btn.height;
	});
};

ButtonList.prototype.removeButton = function (btn) {
	removeFromArr(btn,this.buttons);
	if (this.removeChild(btn)) this.changed = true;
};

ButtonList.prototype.removeAllButtons = function () {
	if (!this.buttons.length) return;
	this.changed = true;
	this.buttons.length = 0;
	this.removeAllChildren();
};

ButtonList.prototype.update = function () {
	if (this.changed) {
		this.setButtonPositions();
	}

	var changed = this.changed;
	this.buttons.forEach(function (btn) {
		if (btn.update()) changed = true;
	});
	this.changed = false;
	return changed;
};