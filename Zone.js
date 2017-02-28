'use strict';

function Zone (cfg) {
	createjs.Container.prototype.initialize.call(this);

	this.game = cfg.game;
	this.name = cfg.name;
	this.x = cfg.x;
	this.y = cfg.y;

	this.showAmount = !!cfg.showAmount;
	this._amount = 0;
	this.opposite = !!cfg.opposite;
	this.checkable  = !!cfg.checkable;

	this.cards = [];
	this.changed = true;

	this.text = new createjs.Text('','bold 12px monospace');
	this.text.textAlign = 'center';
	// this.text.textBaseline = 'middle';
	this.addChild(this.text);

	if (this.opposite) {
		this.rotation = 180;
		this.text.rotation = 180;
	}

	this.buttonLayer = new ButtonList();
	this.buttonLayer.rotation = -this.rotation;
	this.addChild(this.buttonLayer);

	if (this.checkable) {
		this.viewCardsButton = new Button(Localize('buttonTitle','VIEW'),function () {
			this.game.dialog.showCards(Localize('buttonTitle','VIEW'),this.cards,function () {});
		}.bind(this));
		this.viewCardsButton.alpha = 0.8;
	}

	this.game.addZone(this);
}

Zone.prototype = new createjs.Container();
Zone.prototype.constructor = Zone;

Zone.prototype.sortCards = function () {
	var len = this.cards.length;
	this.cards.forEach(function (card,i) {
		card.style.set('zIndex',len-i);
	},this);
};
Zone.prototype.addCard = function (card,bottom) {
	if ((this.name !== 'SigniZone') || (this.name !== 'LrigZone')) {
		card.removeStates();
	}
	if (bottom) {
		this.cards.push(card);
	} else {
		this.cards.unshift(card);
	}
	this.sortCards();
	this.updateCardPosition();
};
Zone.prototype.removeCard = function (card,bottom) {
	removeFromArr(card,this.cards);
	this.sortCards();
	this.updateCardPosition();
};
Zone.prototype.getCardIndex = function (card) {
	return this.cards.indexOf(card);
};
Zone.prototype.updateCardPosition = function () {};
Zone.prototype.update = function () {
	var len = this.cards.filter(function (card) {
		return !card.isSide;
	},this).length;
	if (this.showAmount && (this._amount !== len)) {
		this._amount = len;
		var txt = (this._amount === 0)? '' : this._amount;
		this.setText(txt);
	}
	var changed =  this.buttonLayer.update() || this.changed;
	this.changed = false;
	return changed;
};
Zone.prototype.addButton = function (txt,onclick/*,card*/) {
	var btn = new Button(txt,onclick.bind(this,this));
	this.buttonLayer.addButton(btn);
};
Zone.prototype.removeButtons = function () {
	this.buttonLayer.removeAllButtons();
	if (this.checkable && this.cards.length>1) {
		if (this.name === 'SigniZone') {
			this.cards[0].addButton(this.viewCardsButton);
		} else {
			this.buttonLayer.addButton(this.viewCardsButton);
		}
	}
};
Zone.prototype.setText = function (txt) {
	this.changed = true;
	if (!txt) {
		this.text.visible = false;
		return;
	}
	this.text.visible = true;
	this.text.text = txt;
};
Zone.prototype.setTextColor = function (color) {
	this.changed = true;
	if (this.name === 'EnerZone') {
		this.text.color = 'white';
	} else {
		this.text.color = color;
	}
};
Zone.prototype.shouldUseDialog = function () {
	return false;
};




function StackZone (cfg) {
	Zone.apply(this,arguments);

	this.showPower  = !!cfg.showPower;

	this.changed = true;
	this._power = 0;
	this.power = 0;

	if (cfg.centerText) {
		this.text.textBaseline = 'middle';
	} else {
		this.text.textBaseline = 'top';
		this.text.y = Card.HEIGHT/2;
		if (this.opposite) {
			this.text.rotation = 180;
			this.text.textBaseline = 'bottom';
		}
	}

	// 状态层
	this.stateLayer = new createjs.Container();
	this.stateShape = new createjs.Shape();
	this.stateLayer.addChild(this.stateShape);
	this.addChild(this.stateLayer);
}

StackZone.prototype = Object.create(Zone.prototype);
StackZone.prototype.constructor = StackZone;

StackZone.prototype.updateCardPosition = function () {
	var covered = false;
	this.cards.forEach(function (card,idx) {
		card.moveTo(this.x,this.y,covered,!!idx);
		if (card.x === this.x && card.y === this.y) {
			covered = true;
		}
	},this);
};

StackZone.prototype.addViewCardsButton = function () {
	this.buttonLayer.addButton(this.viewCardsButton);
};

Zone.prototype.addStates = function (states) {
	this.changed = true;
	this.stateLayer.visible = true;
	states.forEach(function (state) {
		var g = this.stateShape.graphics;
		var w = Card.WIDTH;
		var h = Card.HEIGHT;
		if (state === 'powerDown') {
			g.f('rgba(164,96,222,0.3)').r(-w/2,-h/2,w,h);
		} else if (state === 'disabled') {
			g.f('rgba(0,0,0,0.7)').r(-w/2,-h/2,w,h);
		}
	},this);
};

Zone.prototype.removeStates = function () {
	this.changed = true;
	this.stateLayer.visible = false;
	this.stateShape.graphics.clear();
};

StackZone.prototype.update = function () {
	var changed = this.changed;
	if (this.showPower) {
		if (this._amount !== this.cards.length) {
			this._amount = this.cards.length;
			this.power = this._power = 0;
			this.setText('');
		}
		if (this._power !== this.power) {
			this._power = this.power;
			this.setText(this._power);
		}
	} else {
		if (Zone.prototype.update.call(this)) {
			changed = true;
		}
	}
	this.changed = false;
	return changed;
};




function TileZone (cfg) {
	Zone.apply(this,arguments);       // 这里设置了 x,y ,表示原点坐标.
	this.up = cfg.up;                 // true/false: 卡片竖置/横置
	this.horizontal = cfg.horizontal; // true/false: 水平/竖直分布.
	this.center = cfg.center;         // true/false: 居中/左对齐
	this.width = cfg.width;           // 区域的最大"宽度". (若该区域为竖直分布,则为高度)
	this.spacing = cfg.spacing;       // 卡与卡的边距.
	this.showAmount = !!cfg.showAmount;

	if (this.horizontal) {
		this.text.textBaseline = 'middle';
		if (this.opposite) {
			this.text.textAlign = 'left';
		} else {
			this.text.textAlign = 'right';
		}
	} else {
		this.text.textAlign = 'center';
		if (this.opposite) {
			this.text.textBaseline = 'top';
		} else {
			this.text.textBaseline = 'bottom';
		}
	}

	if (this.checkable) {
		this.buttonLayer.y += this.width / 2
		this.buttonLayer.addButton(this.viewCardsButton)
	}
}

TileZone.prototype = Object.create(Zone.prototype);
TileZone.prototype.constructor = TileZone;

TileZone.prototype.updateCardPosition = function () {
	if (!this.cards.length) return;

	var s = this.spacing;
	var w; // 卡片在轴上所占的"宽度"
	if (this.horizontal)
		w = this.up? Card.WIDTH : Card.HEIGHT;
	else
		w = this.up? Card.HEIGHT : Card.WIDTH;

	var base;  // 首张卡的位置
	var delta; // 卡与卡中心间隔.
	var factor = this.opposite? -1 : 1; // 倒转修正系数
	if ((w+s)*this.cards.length-s <= this.width) {
		// 可以容纳.
		delta = w+s;
		if (this.center) {
			base = -delta*(this.cards.length-1)/2;
		} else {
			base = w/2;
		}
	} else {
		// 容纳不下,挤压
		delta = (this.width-w)/(this.cards.length-1);
		if (this.center) {
			base = w/2 - this.width/2;
		} else {
			base = w/2;
		}
	}

	// 在zone.cards中,索引为0的卡表示在"顶部"
	// 因此,卡片在轴上排列时,索引大的排前面,小的排后面.
	var len = this.cards.length;
	if (this.horizontal) {
		this.cards.forEach(function (card,i) {
			var j = len - i - 1;
			card.moveTo(this.x + factor*(base+j*delta),this.y);
		},this);
	} else {
		this.cards.forEach(function (card,i) {
			var j = len - i - 1;
			card.moveTo(this.x,this.y + factor*(base+j*delta));
		},this);
	}
};

TileZone.prototype.update = function () {
	this.buttonLayer.visible = this.cards.length > 4;
	return Zone.prototype.update.call(this);
};