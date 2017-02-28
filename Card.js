'use strict';

function Card (game,isWhiteBack) {
	createjs.Container.prototype.initialize.call(this);

	// 基本属性
	this.game = game;
	this.isWhiteBack = isWhiteBack;
	this.width = Card.WIDTH;
	this.height = Card.HEIGHT;
	this.pid = 0;
	this.zone = null;
	this.zIndex = 0;
	this.changed = true;
	this.isSide = false; // 双面共鸣, isSide 为 true 时,不计入区域卡片数量,不显示动画.

	// 渲染层
	// 因为EasleJS没有位置偏移(translate),
	// 所以增加渲染层来提供偏移. 即:
	// Card.x 指定卡片的水平位置, renderLayer.x 指定其水平偏移.
	// 所有显示对象都放到渲染层,这样,它们都会跟着偏移.
	this.renderLayer = new createjs.Container();
	this.addChild(this.renderLayer);

	// 变形原点在中心.
	this.renderLayer.regX = this.width/2;
	this.renderLayer.regY = this.height/2;

	// 位图层
	this.bitmap = new CardBitmap('',game.imageManager.noimage);
	this.renderLayer.addChild(this.bitmap);

	// 状态层 (冻结,枪兵等状态)
	this.stateLayer = new createjs.Container();
	this.renderLayer.addChild(this.stateLayer);

	// 效果层
	this.effectShape = new createjs.Shape();
	this.renderLayer.addChild(this.effectShape);

	// 按钮层
	this.buttonLayer = new ButtonList();
	this.buttonLayer.x = this.width/2;
	this.buttonLayer.y = this.height/2
	this.renderLayer.addChild(this.buttonLayer);

	// 样式
	this.style = new Style({
		x: 0,
		y: 0,
		zIndex: 0,
		top: false,
		covered: false,
		offX: 0, // 位置偏移
		offY: 0,
		rotation: 0,
		scaleX: -1, // 用于翻面,负数表示反面,正数表示正面
		shadowColor: "#f7ff00",
		shadowBlur: 0,
		flash: 0, // 用于闪烁: alpha = 1 - (flash % 1)
		          // flash 从0渐变到n,则闪烁n次.
		shine: 0  // 用于闪耀,范围为0至1,
		          // 表示闪耀动画进行的百分比.
	});
	this.style.checkSkip = function () {
		return this.game.skip;
	}.bind(this);

	this.on('mouseover',this.handleMouseover);
	this.on('mouseout',this.handleMouseout);

	this.game.addCard(this);
}

Card.WIDTH = 63;
Card.HEIGHT = 88;

Card.prototype = new createjs.Container();
Card.prototype.constructor = Card;

Card.prototype.up = function () {
	var rotation = this.zone.opposite? 180 : 0;
	this.style.transit('rotation',rotation,0.2);
};

Card.prototype.down = function () {
	var rotation = this.zone.opposite? 180 : 0;
	rotation += 90;
	this.style.transit('rotation',rotation,0.2);
};

Card.prototype.faceup = function () {
	this.style.transit('scaleX',1,0.2);
};

Card.prototype.facedown = function () {
	this.style.transit('scaleX',-1,0.2);
};

Card.prototype.move = function (pid,zone,up,faceup,bottom,isSide) {
	this.pid = pid;
	this.isSide = isSide;
	this.floatdown();

	if (this.zone) this.zone.removeCard(this);
	this.zone = zone;
	this.zone.addCard(this,bottom);

	up? this.up() : this.down();
	faceup? this.faceup() : this.facedown();
};

Card.prototype.moveTo = function (x,y,coveredMoving,coveredSettaled) {
	var duration = this.isSide? 0 : 0.2;
	this.style.transit('x',x,duration);
	this.style.transit('y',y,duration);
	if (x !== this.x || y !== this.y) {
		this.style.set('top',true);
		this.style.transit('top',false,duration);
	}
	this.style.set('covered',coveredMoving);
	this.style.transit('covered',coveredSettaled,duration);
};

Card.prototype.floatup = function () {
	this.style.set('top',true);
	// this.style.transit('offY',-10,0.1,Style.linear);
};

Card.prototype.floatdown = function () {
	this.style.set('top',false);
	// this.style.transit('offY',0,0.1,Style.linear);
};

Card.prototype.outlineOn = function () {
	this.style.transit('shadowBlur',5,0.2,Style.linear);
};

Card.prototype.outlineOff = function () {
	this.style.transit('shadowBlur',0,0.2,Style.linear);
};

Card.prototype.flash = function () {
	this.style.set('flash',0);
	this.style.transit('flash',3,0.3,Style.linear);
};

Card.prototype.shine = function () {
	this.style.set('shine',0);
	this.style.transit('shine',1,0.3,Style.linear);
};

Card.prototype.addStates = function (states) {
	this.changed = true;
	this.stateLayer.visible = true;
	states.forEach(function (state) {
		var stateImage = this.game.imageManager.getStateImage(state);
		var bitmap = new createjs.Bitmap(stateImage);
		this.stateLayer.addChild(bitmap);
	},this);
};

Card.prototype.removeStates = function () {
	this.changed = true;
	this.stateLayer.visible = false;
	this.stateLayer.removeAllChildren();
};

Card.prototype.addButton = function (txt,onclick) {
	// var useDialog = this.shouldUseDialog();

	// if (useDialog) {
	// 	this.zone.addButton(txt,onclick.bind(this,this),this);
	// 	return;
	// }

	// 兼容参数为 button
	if (txt.constructor === Button) {
		var btn = txt;
		this.buttonLayer.addButton(btn);
		return;
	}
	var btn = new Button(txt,onclick.bind(this,this));
	this.buttonLayer.addButton(btn);
	// this.outlineOn();
};


// 在给卡片添加按钮时,有时候卡片被遮挡,
// 须要用卡片选择框.
// 问:具体什么情况下要用选择框呢?
// 答:满足以下条件之一:
//     1.卡片在TileZone(除了己方手牌),牌组,LRIG牌组,废弃区,LRIG废弃区;
//     2.卡片在检查区,且检查区不止1张卡.
//     3.卡片在SIGNI区或LRIG区,并且,不在最上面.
Card.prototype.shouldUseDialog = function () {
	var zoneName = this.zone.name;
	if (this.zone.constructor === TileZone) {
		if (this.zone !== this.game.player.handZone) {
			return true;
		}
	}
	if (inArr(zoneName,['MainDeck','LrigDeck','TrashZone','LrigTrashZone'])) {
		return true;
	}
	if (zoneName === 'CheckZone') {
		if (this.zone.cards.length > 1) {
			return true;
		}
	}
	if (inArr(zoneName,['SigniZone','LrigZone'])) {
		if (this.zone.getCardIndex(this) !== 0) {
			return true;
		}
	}
	return false;
};

Card.prototype.removeButtons = function () {
	this.buttonLayer.removeAllButtons();
	// this.outlineOff();
};

Card.prototype.update = function () {
	var changed = this.style.isChanged() || this.changed;
	concat(this.buttonLayer,this.bitmap).forEach(function (obj) {
		if (obj.update()) changed = true;
	},this);
	if (!changed) return false;
	this.changed = false;
	// shortcuts
	var layer = this.renderLayer;
	var effectShape = this.effectShape;
	var bitmap = this.bitmap;
	// 计算样式
	var style = this.style.getComputedStyle();
	// 位置
	this.x = style.x;
	this.y = style.y;
	// 旋转
	this.rotation = style.rotation;
	this.buttonLayer.rotation = -style.rotation;
	// 闪烁 (flash)
	this.alpha = 1 - (style.flash % 1);
	// 偏移
	layer.x = style.offX;
	layer.y = style.offY;
	// 翻面
	var cardName = this.pid? Localize.cardName(CardInfo[this.pid]) : '???';
	if (style.scaleX > 0) {
		// 正面
		this.bitmap.setAltImage(cardName,this.game.imageManager.getImageByPid(this.pid));
	} else {
		// 背面
		this.bitmap.setAltImage(cardName,this.game.imageManager.getBackImage(this.isWhiteBack));
	}
	layer.scaleX = Math.abs(style.scaleX);
	// outline (其实是shadow)
	bitmap.shadow = new createjs.Shadow(style.shadowColor,0,0,style.shadowBlur);
	// 闪耀 (shine)
	// 闪耀就是在效果层上画一道移动的白光
	if (style.shine > 0) {
		var w = 40; // 白光的"宽度" (等于白光实际宽度除以根号2,因为白光是45度倾斜的)
		var x0 = style.shine*(this.width+w) - w;
		var y0 = style.shine*(this.height+w) - w;
		var x1 = x0 + w;
		var y1 = y0 + w;
		this.effectShape.graphics
			.clear()
			.beginLinearGradientFill(['rgba(255,255,255,0)','white','rgba(255,255,255,0)'],[0,0.5,1],x0,y0,x1,y1)
			.drawRect(0,0,this.width,this.height);
	}
	// zIndex
	this.zIndex = style.top? 512 : style.zIndex;
	this.visible = style.top || !style.covered;
	return true;
};

Card.prototype.handleMouseover = function (event) {
	this.game.cardDetail.show(this.pid);
	if (this.zone.opposite || this.zone.name !== 'HandZone') return;
	this.floatup();
};

Card.prototype.handleMouseout = function (event) {
	if (this.zone.opposite || this.zone.name !== 'HandZone') return;
	this.floatdown();
};