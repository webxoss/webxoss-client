'use strict';

function CardDialog (game,id) {
	this.game = game;
	this.stage = new createjs.Stage(id+'Canvas');
	this.stage.enableMouseOver(10);

	this.scrollDiv = document.getElementById(id+'ScrollDiv');
	this.windowDiv = document.getElementById(id+'WindowDiv');
	this.warpDiv   = document.getElementById(id+'WarpDiv');
	this.titleDiv  = document.getElementById(id+'TitleDiv');
	this.closeIcon = document.getElementById(id+'CloseIcon');
	this.okButton  = document.getElementById(id+'OkButton');

	this.cardButtons = [];

	this.hidden = true;
	this.canClose = false;

	this.warpDiv.style.visibility = 'hidden';

	var dialog = this;
}

CardDialog.prototype.showCards = function (title,cards,callback) {
	var dialog = this;
	cards.forEach(function (card) {
		var btn = new CardButton(card,function () {});
		dialog.cardButtons.push(btn);
		dialog.stage.addChild(btn);
	},this);

	dialog.okButton.disabled = false;
	dialog.okButton.textContent = '确定';
	dialog.okButton.onclick = function (event) {
		dialog.close();
		callback();
	}
	dialog.okButton.hidden = false;
	dialog.canClose = false;
	dialog.pop(title);
};

CardDialog.prototype.selectOne = function (title,cards,callback) {
	var dialog = this;
	cards.forEach(function (card) {
		var btn = new CardButton(card,function (event) {
			dialog.close();
			callback(card);
		});
		dialog.cardButtons.push(btn);
		dialog.stage.addChild(btn);
	},this);
	dialog.okButton.hidden = true;
	dialog.pop(title);
};

CardDialog.prototype.selectSomeAdvanced = function (title,cards,careOrder,onSelectChange,callback) {
	var dialog = this;
	var selectedIndexes = [];
	cards.forEach(function (card,idx) {
		var btn = new CardButton(card,function (event) {
			if (!this.selected && this.disabled) return;
			this.changed = true;
			dialog.cardButtons.forEach(function (btn) {
				btn.enable();
			},this);
			if (this.selected) {
				this.selected = false;
				removeFromArr(idx,selectedIndexes);
			} else {
				this.selected = true;
				selectedIndexes.push(idx);
			}
			handleSelectChange();
		});
		dialog.cardButtons.push(btn);
		dialog.stage.addChild(btn);
	},this);
	handleSelectChange();
	this.okButton.textContent = '确定';
	this.okButton.hidden = false;
	dialog.pop(title);

	function handleSelectChange () {
		var done = onSelectChange(selectedIndexes,disable);
		if (careOrder) {
			dialog.cardButtons.forEach(function (btn,idx) {
				var order = selectedIndexes.indexOf(idx) + 1;
				btn.setOrder(order);
			});
		}
		if (done) {
			dialog.okButton.disabled = false;
			dialog.okButton.onclick = function (event) {
				dialog.close();
				callback(selectedIndexes);
			};
		} else {
			dialog.okButton.disabled = true;
			dialog.okButton.onclick = null;
		}
	}
	function disable (idx) {
		dialog.cardButtons[idx].disable();
	}
};

CardDialog.prototype.selectSome = function (title,cards,min,max,careOrder,callback) {
	this.selectSomeAdvanced(title,cards,careOrder,function (selectedIndexes,disable) {
		var len = selectedIndexes.length;
		if (len >= max) {
			cards.forEach(function (card,idx) {
				disable(idx);
			},this);
			return true;
		}
		return len >= min;
	},function (selectedIndexes) {
		callback(selectedIndexes.map(function (idx) {
			return cards[idx];
		}));
	});
};

CardDialog.prototype.seekSome = function (title,cards,targets,min,max,callback) {
	this.selectSomeAdvanced(title,cards,false,function (selectedIndexes,disable) {
		// 先 disable 掉 targets 以外的卡.
		cards.forEach(function (card,idx) {
			if (!inArr(card,targets)) disable(idx);
		},this);

		var len = selectedIndexes.length;
		if (len >= max) {
			cards.forEach(function (card,idx) {
				disable(idx);
			},this);
			return true;
		}
		return len >= min;
	},function (selectedIndexes) {
		callback(selectedIndexes.map(function (idx) {
			return cards[idx];
		}));
	});
};

CardDialog.prototype.selectEner = function (title,cards,colors,cost,callback) {
	this.selectSomeAdvanced(title,cards,false,onSelectChange,function (selectedIndexes) {
		callback(selectedIndexes.map(function (idx) {
			return cards[idx];
		}));
	});

	function onSelectChange (selectedIndexes,disable) {
		var need = {};
		var total = 0;
		['colorless','white','black','red','blue','green','multi'].forEach(function (color) {
			need[color] = cost[color] || 0;
			total += need[color];
		},this);

		if (selectedIndexes.length >= total) {
			cards.forEach(function (card,idx) {
				disable(idx);
			},this);
			return true;
		}

		selectedIndexes.forEach(function (idx) {
			var color = colors[idx];
			if (color === 'multi') return;
			if (need[color] > 0) {
				need[color] -= 1;
			} else {
				need.colorless -= 1;
			}
		},this);

		if (need.colorless > 0) return false;

		cards.forEach(function (card,idx) {
			var color = colors[idx];
			if (color === 'multi') return;
			if (!need[color]) disable(idx);
		},this);
	}
};

CardDialog.prototype.draw = function () {
	var width = Card.WIDTH*2;
	var height = Card.HEIGHT*2;
	var space = 10;
	var len = this.cardButtons.length;
	var singleRow = len <= 3;
	var totalWidth = (width + 2*space) * 3;
	var totalHeight = (height + 2*space) * Math.ceil(this.cardButtons.length/3);
	this.cardButtons.forEach(function (btn,i) {
		var row = i%3;             // 第row行 (下标从0开始);
		var col = Math.floor(i/3); // 第col列 (下标从0开始);
		if (singleRow) {
			btn.x = (totalWidth - len*(width+2*space)) / 2;
		} else {
			btn.x = 0;
		}
		btn.x += row*(width+2*space) + space;
		btn.y = col*(height+2*space) + space;
	},this);
	this.stage.canvas.width = totalWidth;
	this.stage.canvas.height = totalHeight;
};

CardDialog.prototype.pop = function (title) {
	this.draw();
	this.titleDiv.textContent = title;
	if (this.canClose) {
		this.closeIcon.style.display = '';
		this.closeIcon.onclick = this.close.bind(this);
	} else {
		this.closeIcon.style.display = 'none';
		this.closeIcon.onclick = null;
	}
	this.hidden = false;

	var warp = this.warpDiv;
	var win = this.windowDiv;
	var scroll = this.scrollDiv;
	warp.style.opacity = '0';
	warp.style.visibility = 'visible';
	// 消灭水平滚动条
	scroll.style.width = this.stage.canvas.width + scroll.offsetWidth - scroll.clientWidth + 'px';
	// 居中
	win.style.top = (this.game.stage.canvas.height - win.offsetHeight)/2 + 'px';
	win.style.left = (this.game.stage.canvas.width - win.offsetWidth)/2 + 'px';
	warp.style.opacity = '1';

	this.update();
};

CardDialog.prototype.close = function () {
	this.hidden = true;
	this.cardButtons.length = 0;
	this.stage.removeAllChildren();
	this.warpDiv.style.visibility = 'hidden';
};

CardDialog.prototype.update = function () {
	if (this.hidden) return;
	var changed = false;
	this.stage.children.forEach(function (bitmap) {
		if (bitmap.update()) changed = true;
	},this);
	if (changed) {
		this.stage.update();
	}
};