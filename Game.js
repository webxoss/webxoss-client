'use strict';

function Game (io,audio,ongameover,spectating) {
	this.io = io;
	this.audio = audio;
	this.ongameover = ongameover;
	this.io.listener = function (data) {
		console.log(data);
		this.addMsgs(data);
		this.update();
	}.bind(this);

	this.onidle = null;

	// this._waiting = false;

	// 老是清不干净,干脆粗暴地删掉元素.
	this.gameDiv = document.getElementById('GameDiv');
	this.canvasContainer = document.getElementById('BattleField');
	this.canvasContainer.innerHTML = '';
	this.canvas = document.createElement('canvas');
	this.canvas.width = 576;
	this.canvas.height = 734;
	this.canvasContainer.appendChild(this.canvas);
	this.stage = new createjs.Stage(this.canvas);
	this.stage.enableDOMEvents(true);
	this.stage.enableMouseOver(10);

	this.dialog = new Dialog(this);
	this.selector = new Selector(this,spectating);

	this.objList = [];

	this.background = new GameBackground(this);
	this.stage.addChild(this.background);

	this.cards = [];
	this.cardLayer = new createjs.Container();
	this.stage.addChild(this.cardLayer);

	this.zones = [];
	this.zoneLayer = new createjs.Container();
	this.stage.addChild(this.zoneLayer);

	this.msgQueue = [];
	this._packageCount = 0;
	// this._done = false;

	this.imageManager = new ImageManager();
	this.cardDetail = new CardDetail(this.imageManager);

	this.initZones();

	this.skip = false; // 跳过动画
}

// Game.prototype.destroy = function () {
// 	this.gameDiv.classList.remove('colored');
// 	['white','black','red','blue','green'].forEach(function (color) {
// 		this.gameDiv.classList.remove('self-'+color);
// 		this.gameDiv.classList.remove('opponent-'+color);
// 	},this);
// 	this.stage.autoClear = true;
// 	this.stage.removeAllChildren();
// 	this.stage.update();
// 	this.stage.enableDOMEvents(false);
// 	this.stage.removeAllChildren();
// 	this.stage.removeAllEventListeners();
// };

// =========================
// Game.prototype.initZones
//   定义在ZonePosition.js
// =========================

Game.prototype.setSid = function (obj,sid) {
	obj.sid = sid;
	this.objList[sid] = obj;
};

Game.prototype.getObjBySid = function (sid) {
	return this.objList[sid];
};

Game.prototype.addCard = function (card) {
	this.cards.push(card);
	this.cardLayer.addChild(card);
};

Game.prototype.addZone = function (zone) {
	this.zones.push(zone);
	this.zoneLayer.addChild(zone);
};

Game.prototype.handleInit = function (msg) {
	this.setSid(this.player,msg.player);
	this.setSid(this.opponent,msg.opponent);

	function setZones (player,zones) {
		this.setSid(player.mainDeck,zones.mainDeck);
		this.setSid(player.lrigDeck,zones.lrigDeck);
		this.setSid(player.handZone,zones.handZone);
		this.setSid(player.lrigZone,zones.lrigZone);
		this.setSid(player.signiZones[0],zones.signiZones[0]);
		this.setSid(player.signiZones[1],zones.signiZones[1]);
		this.setSid(player.signiZones[2],zones.signiZones[2]);
		this.setSid(player.enerZone,zones.enerZone);
		this.setSid(player.checkZone,zones.checkZone);
		this.setSid(player.trashZone,zones.trashZone);
		this.setSid(player.lrigTrashZone,zones.lrigTrashZone);
		this.setSid(player.lifeClothZone,zones.lifeClothZone);
		this.setSid(player.excludedZone,zones.excludedZone);
		zones.mainDeckCards.forEach(function (sid) {
			var card = new Card(this,false);
			this.setSid(card,sid);
			card.move(0,player.mainDeck,true,false,false);
		},this);
		zones.lrigDeckCards.forEach(function (sid,i) {
			var card = new Card(this,true);
			this.setSid(card,sid);
			var info = zones.lrigDeckCardInfos[i];
			card.move(info.pid,player.lrigDeck,true,false,false,info.isSide);
		},this);
	}

	setZones.call(this,this.player,msg.playerZones);
	setZones.call(this,this.opponent,msg.opponentZones);
	return true;
};

Game.prototype.handleSetColor = function (msg) {
	// this.gameDiv.classList.add('colored');
	document.body.setAttribute('self',msg.selfColor);
	document.body.setAttribute('opponent',msg.opponentColor);
	var zoneTextColorMap = {
		'white': 'black',
		'black': 'yellow',
		'red': 'white',
		'blue': 'yellow',
		'green': 'white'
	};
	this.zones.forEach(function (zone) {
		var color = zone.opposite? zoneTextColorMap[msg.opponentColor] : zoneTextColorMap[msg.selfColor];
		zone.setTextColor(color);
	},this);
	var audio = this.audio;
	audio.bgmFadeOut(function () {
		audio.playBgm(msg.selfColor);
	});
	return true;
};

Game.prototype.handlePackedMsgStart = function () {
	// this.audio.playBgm();
	this._packageCount++;
	return true;
};

Game.prototype.handlePackedMsgEnd = function () {
	this._packageCount--;
	return true;
};

Game.prototype.handleMoveCard = function (msg) {
	var card = this.getObjBySid(msg.card);
	var zone = this.getObjBySid(msg.zone);
	card.move(msg.pid,zone,msg.up,msg.faceup,msg.bottom,msg.isSide);
	return false;
};

Game.prototype.handleUpCard = function (msg) {
	var card = this.getObjBySid(msg.card);
	card.up();
	return false;
};

Game.prototype.handleDownCard = function (msg) {
	var card = this.getObjBySid(msg.card);
	card.down();
	return false;
};

Game.prototype.handleFaceupCard = function (msg) {
	var card = this.getObjBySid(msg.card);
	card.pid = msg.pid;
	card.faceup();
	return false;
};

Game.prototype.handleFacedownCard = function (msg) {
	var card = this.getObjBySid(msg.card);
	card.facedown();
	return false;
};

Game.prototype.handleShuffle = function (msg) {
	msg.cards.forEach(function (sid) {
		var card = this.getObjBySid(sid);
		card.pid = 0;
	},this);
	return true;
};

Game.prototype.handleSelect = function (msg) {
	console.log(msg);
	if (this.skip) return true;
	this.selector.addMsg(msg);
	return true;
};

Game.prototype.handlePayEner = function (msg) {
	console.log('handlePayEner',msg);

	if (this.skip) return true;

	var cards = msg.cards.map(function (sid) {
		return this.getObjBySid(sid);
	},this);

	var game = this;
	var onCancel = null;
	if (msg.cancelable) {
		onCancel  = function () {
			game.input('PAY_ENER',null);
		}
	}
	this.dialog.selectEner(Localize('buttonTitle','PAY_ENER'),cards,msg.integers,msg,function (selectedIndexes) {
		game.input('PAY_ENER',selectedIndexes);
	},onCancel);
	return true;
};

Game.prototype.handleShowCards = function (msg) {
	if (this.skip) return true;
	var cards = msg.cards.map(function (sid,idx) {
		var card = this.getObjBySid(sid);
		card.pid = msg.pids[idx];
		return card;
	},this);
	var game = this;
	var label = msg.label || 'CONFIRM';
	this.dialog.showCards(Localize('buttonTitle',label),cards,function () {
		game.input('OK');
	});
	return true;
};

Game.prototype.handleShowCardsById = function (msg) {
	if (this.skip) return true;
	var cards = msg.ids.map(function (pid,idx) {
		return {pid: pid};
	},this);
	var game = this;
	var label = msg.label || 'CONFIRM';
	this.dialog.showCards(Localize('buttonTitle',label),cards,function () {
		game.input('OK');
	});
	return true;
};

Game.prototype.handleShowColors = function (msg) {
	if (this.skip) return true;
	var colors = msg.colors.map(function (color) {
		return Localize.color(color);
	});
	var game = this;
	this.dialog.showText(Localize('buttonTitle','COLOR'),colors.join(','),function () {
		game.input('OK');
	});
	return true;
};

Game.prototype.handleShowTypes = function (msg) {
	if (this.skip) return true;
	var types = msg.types.map(function (type) {
		return Localize('cardType',type);
	});
	var game = this;
	this.dialog.showText(Localize('prop','cardType'),types.join(','),function () {
		game.input('OK');
	});
	return true;
};

Game.prototype.handleShowEffects = function (msg) {
	if (this.skip) return true;
	var text = msg.effects.map(function (desc) {
		return Localize.desc(desc);
	}).join('\n');
	var game = this;
	this.dialog.showText(Localize('gameText','SHOW_EFFECTS_DIALOG_TITLE'),text,function () {
		game.input('OK');
	});
	return true;
};

Game.prototype.handleShowText = function (msg) {
	if (this.skip) return true;
	var text = '';
	if (msg.type === 'number') {
		text = msg.content;
	} else if (msg.type === 'text') {
		text = Localize('gameText',msg.content);
	} else {
		debugger;
	}
	var game = this;
	this.dialog.showText(Localize.labelToDialogTitle(msg.title),text,function () {
		game.input('OK');
	});
	return true;
};

Game.prototype.handleInformCards = function (msg) {
	msg.cards.forEach(function (sid,idx) {
		var card = this.getObjBySid(sid);
		card.pid = msg.pids[idx];
	},this);
	return true;
};

// Game.prototype.handlePower = function (msg) {
// 	msg.cards.forEach(function (sid,idx) {
// 		var card = this.getObjBySid(sid);
// 		card.zone.power = msg.powers[idx];
// 	},this);
// 	return true;
// };

Game.prototype.handleCardStates = function (msg) {
	var signiInfos = msg.signiInfos;
	var lrigInfos = msg.lrigInfos;
	var zoneInfos = msg.zoneInfos;
	signiInfos.forEach(function (signiInfo) {
		var card = this.getObjBySid(signiInfo.card);
		card.zone.power = signiInfo.power;
		card.removeStates();
		card.addStates(signiInfo.states);
	},this);
	lrigInfos.forEach(function (lrigInfo) {
		var card = this.getObjBySid(lrigInfo.card);
		card.removeStates();
		card.addStates(lrigInfo.states);
	},this);
	if (zoneInfos) { // 向前兼容
		zoneInfos.forEach(function (zoneInfo) {
			var zone = this.getObjBySid(zoneInfo.zone);
			zone.removeStates();
			zone.addStates(zoneInfo.states);
		},this);
	}
	return true;
};

Game.prototype.handleActivate = function (msg) {
	var card = this.getObjBySid(msg.card);
	card.shine();
	return false;
};

Game.prototype.handleCardSelected = function (msg) {
	var card = this.getObjBySid(msg.card);
	card.flash();
	return false;
};

Game.prototype.handleSelectNumber = function (msg) {
	if (this.skip) return true;
	var label = msg.label;
	var min = msg.min;
	var max = msg.max;
	var defaultValue = msg.defaultValue || 0;
	var title = Localize.labelToDialogTitle(label);
	// var options = [];
	// var n = min;
	// while (n <= max) {
	// 	options.push(n++);
	// }
	// var game = this;
	// this.dialog.selectText(title,options,false,function (idx) {
	// 	game.input(label,min+idx);
	// });
	var game = this;
	this.dialog.selectNumber(title,min,max,defaultValue,false,function (num) {
		game.input(label,num);
	});
	return true;
};

Game.prototype.handleSelectText = function (msg) {
	if (this.skip) return true;
	var label = msg.label;
	var title = Localize.labelToDialogTitle(label);
	var type = msg.type || 'gameText';
	var options = msg.texts.map(function (text) {
		return Localize(type,text);
	},this);
	var game = this;
	this.dialog.selectText(title,options,false,function (idx) {
		game.input(label,idx);
	});
	return true;
};

Game.prototype.handleSelectCardId = function (msg) {
	if (this.skip) return true;
	try {
		var game = this;
		var label = msg.label;
		var title = Localize.labelToDialogTitle(label);
		this.dialog.selectCardId(title,function (pid) {
			game.input(label,pid);
		});
	} catch (e) {
		window.alert(e.name + e.message);
	}
	// console.log('game.input(' + label + ',pid)');
	// debugger;
	return true;
};

Game.prototype.handleCoinChange = function (msg) {
	var player = msg.player === this.player.sid ? this.player : this.opponent;
	player.coinZone.setText('Coin' + msg.coin);
	return true;
};

Game.prototype.handleConfirm = function (msg) {
	if (this.skip) return true;
	var title = Localize.labelToDialogTitle('CONFIRM');
	var text = Localize('gameText',msg.text);
	var game = this;
	this.dialog.confirm(title,text,function (answer) {
		game.input('OK',answer);
	});
	return true;
};

// Game.prototype.handleWaitForOpponent = function (msg) {
// 	if (this._waiting) {
// 		this.buttonZone.setText(Localize.waitingMsg());
// 	} else {
// 		this._waiting = true;
// 		this.buttonZone.setText(Localize.waitingMsg(msg.operation));
// 	}
// 	this.background.setWaiting(true);
// 	return true;
// };

// Game.prototype.handleRockPaperScissors = function (msg) {
// 	var title = Localize('ROCK_PAPER_SCISSORS');
// 	var options = [
// 		Localize('ROCK'),
// 		Localize('PAPER'),
// 		Localize('SCISSORS')
// 	];
// 	var game = this;
// 	this.dialog.selectText(title,options,false,function (idx) {
// 		game.input('ROCK_PAPER_SCISSORS',idx);
// 	});
// 	return true;
// };

Game.prototype.handleWin = function (msg) {
	this.win();
};

Game.prototype.win = function (surrender) {
	// var gameCount = sessionStorage.getItem('game count') || 0;
	// gameCount++;
	// sessionStorage.setItem('game count',gameCount);
	// this.audio.playBgm();
	// this.dialog.showText('WIN',text,function () {
	// 	this.supportWebxoss(this.ongameover);
	// }.bind(this));
	this.ongameover(true,surrender,this.getMessagePacks());
};

// Game.prototype.supportWebxoss = function (callback) {
// 	if (this.shouldPopSupport()) {
// 		var title = 'SUPPORT WEBXOSS';
// 		var body = this.dialog.newElement('div');
// 		var link = this.dialog.newElement('a');
// 		link.target = '_blank';
// 		link.style.color = 'red';
// 		link.style.textDecoration = 'underline';
// 		link.href = Localize('index','SUPPORT_URL');
// 		link.textContent = 'help';
// 		link.onclick = function () {
// 			localStorage.setItem('support','webxoss~');
// 			return true;
// 		}
// 		body.appendChild(document.createTextNode('WEBXOSS needs your '));
// 		body.appendChild(link);
// 		body.appendChild(document.createTextNode('!'));
// 		body.style.color = 'green';
// 		this.dialog.pop(title,body,false,callback);
// 	} else {
// 		callback();
// 	}
// };

// Game.prototype.shouldPopSupport = function () {
// 	if (localStorage.getItem('support') === 'webxoss~') return false;
// 	var gameCount = sessionStorage.getItem('game count') || 0;
// 	if (gameCount >= 4) return true;
// 	return false;
// };

Game.prototype.handleLose = function (msg) {
	this.lose();
};

Game.prototype.lose = function (surrender) {
	// var gameCount = sessionStorage.getItem('game count') || 0;
	// gameCount++;
	// sessionStorage.setItem('game count',gameCount);
	// this.audio.playBgm();
	// this.dialog.showText('LOSE',text,this.ongameover);
	this.ongameover(false,surrender,this.getMessagePacks());
};

Game.prototype.getMessagePacks = function () {
	// var datas = this.io.getDatas();
	// return {
	// 	format: 'WEBXOSS Replay',
	// 	version: '1',
	// 	content: {
	// 		clietVersion: this.version,
	// 		messagePacks: this.io.getDatas();
	// 	}
	// };
	return this.io.getDatas();
};

Game.prototype.handleMsg = function (msg) {
	if (!msg) return false;
	var handlerMap = {
		'INIT': this.handleInit,
		'SET_COLOR': this.handleSetColor,
		'PACKED_MSG_START': this.handlePackedMsgStart,
		'PACKED_MSG_END': this.handlePackedMsgEnd,
		'MOVE_CARD': this.handleMoveCard,
		'UP_CARD': this.handleUpCard,
		'DOWN_CARD': this.handleDownCard,
		'FACEUP_CARD': this.handleFaceupCard,
		'FACEDOWN_CARD': this.handleFacedownCard,
		'SHUFFLE': this.handleShuffle,
		'SELECT': this.handleSelect,
		'PAY_ENER': this.handlePayEner,
		'SHOW_CARDS': this.handleShowCards,
		'SHOW_CARDS_BY_ID': this.handleShowCardsById,
		'SHOW_COLORS': this.handleShowColors,
		'SHOW_TYPES': this.handleShowTypes,
		'SHOW_EFFECTS': this.handleShowEffects,
		'SHOW_TEXT': this.handleShowText,
		'INFORM_CARDS': this.handleInformCards,
		// 'POWER': this.handlePower,
		'CARD_STATES': this.handleCardStates,
		'ACTIVATE': this.handleActivate,
		'CARD_SELECTED': this.handleCardSelected,
		'SELECT_NUMBER': this.handleSelectNumber,
		'SELECT_TEXT': this.handleSelectText,
		'SELECT_CARD_ID': this.handleSelectCardId,
		'CONFIRM': this.handleConfirm,
		'COIN_CHANGE': this.handleCoinChange,
		// 'ROCK_PAPER_SCISSORS': this.handleRockPaperScissors,
		// 'WAIT_FOR_OPPONENT': this.handleWaitForOpponent,
		'WIN': this.handleWin,
		'LOSE': this.handleLose
	};
	var handler = handlerMap[msg.type];
	if (handler) {
		return handler.call(this,msg.content) || this.skip;
	}
	console.warn(msg);
	window.alert('Unknown message type: "' + msg.type + '" .');
	return true;
};

Game.prototype.handleMsgQueue = function () {
	if (!this.msgQueue.length) return;
	// this._waiting = false;
	this.buttonZone.setText('');
	this.background.setWaiting(false);

	var done = true;
	var msg;
	while (msg = this.msgQueue.shift()) {
		if (!this.handleMsg(msg)) done = false;
		if (!done && !this._packageCount) break;
	}
	if (!this.msgQueue.length) {
		this.handleIdle();
	}
};

Game.prototype.handleIdle = function () {
	this.selector.removeButtons();
	this.selector.showButtons();
	this.selector.autoPop();
	if (!this.selector.msgs.length) {
		this.buttonZone.setText(Localize.waitingMsg());
		this.background.setWaiting(true);
	}
	if (this.onidle) this.onidle();
};

Game.prototype.addMsgs = function (msgs) {
	this.selector.clear();
	this.msgQueue = this.msgQueue.concat(msgs);
	if (!msgs.length) {
		this.handleIdle();
	}
};

Game.prototype.input = function (label,data) {
	if (data === undefined) {
		data = [];
	}
	this.removeButtons();
	this.io.send({
		label: label,
		input: data
	});
	this.background.setWaiting(true);
};

Game.prototype.removeButtons = function () {
	this.cards.forEach(function (card) {
		card.removeButtons();
	},this);
	this.zones.forEach(function (zone) {
		zone.removeButtons();
	},this);
	// this.dialog.close();
};

Game.prototype.update = function () {
	var changed = false;
	concat(this.cards,this.zones,this.background).forEach(function (obj) {
		if (obj.update()) changed = true;
	},this);

	if (changed) {
		this.cardLayer.sortChildren(function (a,b) {
			return a.zIndex - b.zIndex;
		});
		this.stage.update();
	} else {
		this.handleMsgQueue();
	}
};