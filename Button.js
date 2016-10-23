'use strict';

function Button (txt,onclick) {
	createjs.Container.prototype.initialize.call(this);

	this.changed = true;

	var paddingTop = 5;
	var paddingLeft = 8;

	var fontSize = Button.HEIGHT;
	var font = fontSize + 'px "Segoe UI", Arial, "Microsoft Yahei", Simsun, sans-serif';

	this.text = new createjs.Text(txt,font);
	this.text.textBaseline = "middle";

	this.height = fontSize + paddingTop*2;
	this.width = this.text.getMeasuredWidth() + paddingLeft*2;

	this.regX = this.width/2;
	this.regY = this.height/2;

	this.text.x = paddingLeft;
	this.text.y = this.height/2;

	this.background = new createjs.Shape();

	this.toDefaultStyle();

	this.addChild(this.background,this.text);

	this.on('click',onclick);
	this.on('mouseover',this.toHoverStyle);
	this.on('mouseout',this.toDefaultStyle);
}

Button.HEIGHT = 11;

Button.prototype = new createjs.Container();
Button.prototype.constructor = Button;

Button.prototype.toDefaultStyle = function () {
	this.changed = true;
	this.text.color = '#444';
	this.background.graphics
		.clear()
		.beginStroke('#c0c0c0')
		.beginLinearGradientFill(['#ededed','#ededed','#dedede'],[0,0.38,1],0,0,0,this.height)
		.drawRoundRect(0,0,this.width,this.height,2);
};

Button.prototype.toHoverStyle = function () {
	this.changed = true;
	this.text.color = '#000';
	this.background.graphics
		.clear()
		.beginStroke('#afafaf')
		.beginLinearGradientFill(['#f0f0f0','#f0f0f0','#e0e0e0'],[0,0.38,1],0,0,0,this.height)
		.drawRoundRect(0,0,this.width,this.height,2);
};

Button.prototype.update = function () {
	var changed = this.changed;
	this.changed = false;
	return changed;
};