'use strict';

function Dialog (game) {
	this.game = game;

	this.searcher = new Searcher();

	this.warpDiv   = this.newElement('div');
	this.dialogDiv = this.newElement('div');
	this.titleDiv  = this.newElement('div');
	this.closeIcon = this.newElement('div');
	this.bodyDiv   = this.newElement('div');
	this.footerDiv = this.newElement('div');
	this.footSpan  = this.newElement('span');
	this.okBtn     = this.newElement('button');
	this.cancelBtn = this.newElement('button');

	this.okBtn.textContent = Localize('common','OK');
	this.cancelBtn.textContent = Localize('common','CANCEL');
	this.closeIcon.onclick = this.close.bind(this);

	this.warpDiv.classList.add('warp');
	this.dialogDiv.classList.add('dialog');
	this.titleDiv.classList.add('title');
	this.closeIcon.classList.add('closeIcon');
	this.bodyDiv.classList.add('body');
	this.footerDiv.classList.add('footer');
	this.okBtn.classList.add('okBtn');
	this.cancelBtn.classList.add('cancelBtn');

	this.warpDiv.appendChild(this.dialogDiv);
	this.dialogDiv.appendChild(this.closeIcon);
	this.dialogDiv.appendChild(this.titleDiv);
	this.dialogDiv.appendChild(this.bodyDiv);
	this.dialogDiv.appendChild(this.footerDiv);
	this.footerDiv.appendChild(this.footSpan);
	this.footerDiv.appendChild(this.okBtn);
	this.footerDiv.appendChild(this.cancelBtn);

	this.warpDiv.style.display = 'none';
	game.stage.canvas.parentElement.appendChild(this.warpDiv);
}

Dialog.prototype.newElement = function (tag) {
	return document.createElement(tag);
};

Dialog.prototype.newCardImg = function (pid) {
	var img = this.newElement('img');
	img.src = this.game.imageManager.getUrlByPid(pid);
	return img;
};

Dialog.prototype.mouseover = function (el,pid) {
	el.onmouseover = this.game.cardDetail.show.bind(this.game.cardDetail,pid);
};

Dialog.prototype.center = function (element) {
	var parent = element.parentElement;
	element.style.top = '0';
	element.style.left = '0';
	element.style.top = (parent.offsetHeight - element.offsetHeight)/2 + 'px';
	element.style.left = (parent.offsetWidth - element.offsetWidth)/2 + 'px';
};

Dialog.prototype.pop = function (title,body,foot,canClose,callback,callbackCancel) {
	var dialog = this;
	// 构筑DOM
	this.titleDiv.textContent = title;
	this.footSpan.innerHTML = '';
	if (foot) this.footSpan.appendChild(foot);
	this.bodyDiv.innerHTML = '';
	this.bodyDiv.style.width = '';
	this.bodyDiv.appendChild(body);
	this.closeIcon.style.display = canClose? '' : 'none';
	if (!callback) {
		this.okBtn.onclick = null;
		this.footerDiv.style.display = 'none';
	} else {
		this.okBtn.onclick = function (event) {
			dialog.close();
			callback();
		};
		// this.okBtn.disabled = false;
		this.footerDiv.style.display = '';
	}
	if (!callbackCancel) {
		this.cancelBtn.onclick = null;
		this.cancelBtn.style.display = 'none';
	} else {
		this.cancelBtn.onclick = function (event) {
			dialog.close();
			callbackCancel();
		};
		// this.cancelBtn.disabled = false;
		this.cancelBtn.style.display = '';
	}
	// 渲染,但完全透明,用于计算元素尺寸和位置.
	this.warpDiv.style.opacity = '0';
	this.warpDiv.style.display = '';
	// 加上滚动条宽度
	// this.bodyDiv.style.width = 2*this.bodyDiv.offsetWidth - this.bodyDiv.clientWidth + 'px';
	// 居中
	this.center(this.dialogDiv);
	// 显示
	this.warpDiv.style.opacity = '1';
};

Dialog.prototype.close = function () {
	this.okBtn.disabled = false;
	this.warpDiv.style.display = 'none';
};

Dialog.prototype.showText = function (title,text,callback) {
	var body = document.createTextNode(text);
	this.pop(title,body,null,false,callback);
};

Dialog.prototype.confirm = function (title,text,callback) {
	var body = document.createTextNode(text);
	this.pop(title,body,null,false,callback.bind(null,true),callback.bind(null,false));
};

// 从多个文本选项选择一个.
Dialog.prototype.selectText = function (title,options,canClose,callback) {
	var dialog = this;
	var body = this.newElement('div');
	options.forEach(function (option,idx) {
		var opt = this.newElement('div');
		opt.classList.add('option');
		opt.textContent = option;
		body.appendChild(opt);

		opt.onclick = function (event) {
			dialog.close();
			callback(idx);
		}
	},this);
	this.pop(title,body,null,canClose,null);
};

Dialog.prototype.selectNumber = function (title,min,max,defaultValue,canClose,callback) {
	var dialog = this;
	var body = this.newElement('div');
	var sel = this.newElement('select');
	for (var i = min; i <= max; i++) {
		var opt = this.newElement('option');
		opt.value = i;
		opt.textContent = i;
		sel.appendChild(opt);
	}
	sel.value = defaultValue;
	body.appendChild(sel);
	this.pop(title,body,null,canClose,function () {
		callback(sel.value);
	});
};

Dialog.prototype.showCards = function (title,cards,callback) {
	var body = this.newElement('div');
	if (!cards.length) {
		body.textContent = Localize('common','NO_CARDS');
	} else {
		cards.forEach(function (card) {
			var crd = this.newElement('div');
			var img = this.newCardImg(card.pid);

			crd.appendChild(img);
			crd.classList.add('card');
			this.mouseover(crd,card.pid);

			body.appendChild(crd);
		},this);
	}
	this.pop(title,body,null,false,callback);
};

Dialog.prototype.selectCardId = function (title,callback) {
	var dialog = this;
	var searcher = this.searcher;

	var body = this.newElement('div');
	body.style.textAlign = 'center';

	var searchBar = this.newElement('input');
	searchBar.setAttribute('placeholder','Search...');
	searchBar.type = 'text';
	searchBar.style.textAlign = 'center';
	searchBar.style.width = '90%';

	var container = this.newElement('div');
	container.style.maxHeight = '450px';
	container.style['overflow-y'] = 'auto';
	container.style.textAlign = 'left';

	var elShowMore = this.newElement('div');
	elShowMore.textContent = 'Show More...';
	elShowMore.style.color = 'blue';
	elShowMore.style.cursor = 'pointer';
	elShowMore.style.margin = '1em 0';

	body.appendChild(searchBar);
	body.appendChild(container);
	body.appendChild(elShowMore);

	var results = [];
	var RESULTS_LENGTH = 9;
	var _shown = 0;
	elShowMore.onclick = showMore;
	searchBar.onchange = searchBar.onkeyup = search;
	function search () {
		var q = searchBar.value;
		results = searcher.search(q);
		showResults();
	};
	search();
	function showResults () {
		_shown = 0;
		container.innerHTML = '';
		showMore();
	}
	function showMore () {
		for (var i = 0; i < RESULTS_LENGTH; i++) {
			var idx = _shown;
			if (idx >= results.length) break;
			var pid = results[idx].pid;

			var opt = dialog.newElement('div');
			var img = dialog.newCardImg(pid);

			opt.appendChild(img);
			opt.classList.add('card');
			dialog.mouseover(opt,pid);

			opt.onclick = function (pid) {
				dialog.close();
				callback(pid);
			}.bind(null,pid);

			container.appendChild(opt);
			_shown++;
		}

		// if (_shown < results.length) {
		// 	show(elShowMore);
		// } else {
		// 	hide(elShowMore);
		// }
	}
	this.pop(title,body,null,false,null);

	// 固定宽度
	body.style.minWidth = body.offsetWidth + 'px';
	searchBar.focus();
};

// 选择一张.
Dialog.prototype.selectCard = function (title,cards,canClose,callback) {
	var dialog = this;
	var body = this.newElement('div');
	cards.forEach(function (card,idx) {
		var opt = this.newElement('div');
		var img = this.newCardImg(card.pid);

		opt.appendChild(img);
		opt.classList.add('card');
		this.mouseover(opt,card.pid);

		opt.onclick = function (event) {
			dialog.close();
			callback(idx);
		}

		body.appendChild(opt);
	},this);
	this.pop(title,body,null,canClose,null);
};

Dialog.prototype.selectCardAdvanced = function (title,cards,texts,canClose,careOrder,onchanged,callback,callbackCancel) {
	if (!texts) texts = [];
	var dialog = this;
	var selectedIndexes = [];
	var datas = [];
	var body = this.newElement('div');
	cards.forEach(function (card,idx) {
		var opt = this.newElement('div');
		var img = this.newCardImg(card.pid);
		var txt = this.newElement('div');
		txt.textContent = texts[idx] || '';
		var msk = this.newElement('div');
		var num = this.newElement('div');

		opt.appendChild(img);
		opt.appendChild(txt);
		opt.appendChild(msk);
		opt.appendChild(num);

		opt.classList.add('card');
		txt.classList.add('txt');
		msk.classList.add('msk');
		num.classList.add('num');
		this.mouseover(opt,card.pid);

		var data = {
			opt: opt,
			txt: txt,
			msk: msk,
			num: num,
		};
		datas[idx] = data;

		opt.onclick = function (event) {
			if (!opt.classList.contains('selected') && opt.classList.contains('disabled')) return;
			if (opt.classList.contains('selected')) {
				removeFromArr(idx,selectedIndexes);
			} else {
				selectedIndexes.push(idx);
			}
			opt.classList.toggle('selected');
			handleSelectChanged();
		};

		body.appendChild(opt);
	},this);

	handleSelectChanged();
	dialog.pop(title,body,null,canClose,callback.bind(null,selectedIndexes),callbackCancel);
	datas.forEach(function (data) {
		this.center(data.txt);
	},this);

	function handleSelectChanged () {
		datas.forEach(function (data,idx) {
			data.opt.classList.remove('disabled');
		},this);
		var ok = onchanged(selectedIndexes,disable);
		dialog.okBtn.disabled = !ok;
		if (careOrder) {
			datas.forEach(function (data,idx) {
				var order = selectedIndexes.indexOf(idx) + 1;
				data.num.textContent = order || '';
				dialog.center(data.num);
			},this);
		}
	}
	function disable (idx) {
		datas[idx].opt.classList.add('disabled');
	}
};

// 选择若干张.
Dialog.prototype.selectSomeCards = function (title,cards,arg,callback) {
	var min = arg.min || 0;
	// var max = arg.max || cards.length;
	var max = arg.max;
	if (!max) {
		max = arg.targets? arg.targets.length : cards.length;
	}
	var texts = arg.texts;
	var canClose = arg.canClose;
	var careOrder = arg.careOrder;
	var targets = arg.targets;
	var callbackCancel;
	if (min) {
		callbackCancel = null;
	} else {
		callbackCancel = callback.bind(null,[]);
	}
	this.selectCardAdvanced(title,cards,texts,canClose,careOrder,function (selectedIndexes,disable) {
		if (targets && targets.length) {
			cards.forEach(function (card,idx) {
				if (!inArr(card,targets)) disable(idx);
			},this);
		}

		var len = selectedIndexes.length;
		if (len >= max) {
			cards.forEach(function (card,idx) {
				disable(idx);
			},this);
			return true;
		}
		return len && (len >= min);
	},function (selectedIndexes) {
		if (targets && targets.length && (targets.length !== cards.length)) {
			selectedIndexes = selectedIndexes.map(function (idx) {
				return targets.indexOf(cards[idx]);
			});
		}
		callback(selectedIndexes);
	},callbackCancel);
};

Dialog.prototype.selectEner = function (title,cards,integers,cost,callback,onCancel) {
	function checkRequirements(items, requirements) {
		var n = requirements.length
		var len = 1 << n
		var arr = (typeof Uint8Array === 'undefined') ? new Array(len) : new Uint8Array(len)
		// 第 i 条不等式。
		// 假设 n == 4，即有 4 种元需求：
		// i 为从 0000 到 1111，从右到左分别称为第 1,2,3,4 位
		// 当 i == 0110 时，代表不等式左边为第 2、3 个集合的并集
		for (var i = 0; i < len; i++) {
			var filters = []
			for (var j = 0; j < n; j++) {
				if (i & (1 << j)) {
					filters.push(requirements[j].filter)
					// 不等式的右边（先把需求数加上去，满足的时候减 1，减至 0 则满足该不等式）
					arr[i] += requirements[j].count
				}
			}
			// 遍历能量区，满足条件的减 1
			for (var j = 0; j < items.length; j++) {
				var item = items[j]
				if (filters.some(function (filter) {
					return filter(item)
				})) {
					// 减至 0，该不等式成立
					if (!--arr[i]) break
				}
			}
			if (arr[i]) return false
		}
		return true
	}

	var total = 0;
	var requirements = cost.requirements.map(function (requirement) {
		total += requirement.count;
		return {
			count: requirement.count,
			mask: requirement.mask,
			filter: function (int) {
				return int & requirement.mask;
			},
		};
	});
	function onSelectChange (selectedIndexes,disable) {
		var selectedIntegers = selectedIndexes.map(function (index) {
			return integers[index]
		});
		var ok = (selectedIndexes.length === total) && checkRequirements(selectedIntegers,requirements);
		if (ok) {
			integers.forEach(function (_,index) {
				disable(index);
			});
		}
		return ok;
	};

	var texts = cards.map(function (card) {
		return card.sid === cost.source ? 'WARN' : '';
	},this);
	this.selectCardAdvanced(title,cards,texts,false,false,onSelectChange,callback,onCancel);
};