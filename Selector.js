'use strict';

function Selector (game,spectating) {
	this.game = game;
	this.msgs = [];
	this.selectedIndexes = [];
	this._autoPopMsg = null;
	this.spectating = spectating;
}

// Selector.prototype.getMsgByLabel = function (label) {
// 	for (var i = 0; i < this.msgs.length; i++) {
// 		var msg = this.msgs[i];
// 		if (msg.label === label) {
// 			return msg;
// 		}
// 	}
// 	debugger;
// 	return null;
// };

Selector.prototype.addMsg = function (msg) {
	this.msgs.push(this.parseMsg(msg));
};

Selector.prototype.parseMsg = function (msg) {
	var newMsg = {
		label: msg.label,
		min: msg.min,
		max: msg.max,
		careOrder: msg.careOrder
	};
	newMsg.title = Localize.labelToTitle(msg.label);
	newMsg.cards = msg.options.map(function (sid) {
		return this.game.getObjBySid(sid);
	},this);
	newMsg.extraCards = msg.extraCards.map(function (sid,idx) {
		var card = this.game.getObjBySid(sid);
		card.pid = msg.extraPids[idx];
		return card;
	},this);
	if (!newMsg.extraCards.length) {
		newMsg.extraCards = newMsg.cards.slice();
	}
	newMsg.descriptions = msg.descriptions.map(function (desc) {
		return Localize.desc(desc);
	},this);
	return newMsg;
};

// Selector.prototype.parseDesc = function (desc) {
// 	var arr = desc.split('-');
// 	var pid = arr[0];
// 	var type = arr[1];
// 	var idx = arr[2];
// 	var info = CardInfo[pid];
// 	return Localize.desc(info,type,idx);
// };

Selector.prototype.showButtons = function () {
	this.msgs.forEach(function (msg) {
		var cards = msg.extraCards;
		if (!cards.length) {
			this.game.buttonZone.addButton(Localize.noOptions(msg.label),this.selectBind(msg));
		} else if (msg.label === 'USE_ACTION_EFFECT') {
			var datas = [];
			msg.cards.forEach(function (card,idx) {
				var buttonCarrier;
				var description = msg.descriptions[idx];
				if (card.shouldUseDialog()) {
					if (card.zone.constructor === TileZone) {
						buttonCarrier = this.game.buttonZone;
					} else {
						buttonCarrier = card.zone;
					}
				} else {
					buttonCarrier = card;
				}
				if (card.zone.name === 'EnerZone') {
					buttonCarrier = card.zone.cards.length > 4 ? card.zone : card;
				}
				var data;
				for (var i = 0; i < datas.length; i++) {
					var data= datas[i];
					if (data.buttonCarrier === buttonCarrier) {
						data.cards.push(card);
						data.descriptions.push(description);
						data.indexes.push(idx);
						return;
					};
				}
				datas.push({
					buttonCarrier: buttonCarrier,
					cards: [card],
					descriptions: [description],
					indexes: [idx]
				});
				// card.addButton(msg.title,function () {
				// 	var descriptions = [];
				// 	var indexMap = [];
				// 	msg.descriptions.forEach(function (description,idx) {
				// 		if (msg.cards[idx] === card) {
				// 			indexMap.push(idx);
				// 			descriptions.push(description);
				// 		}
				// 	},this);
				// 	if (descriptions.length <= 1) {
				// 		this.send(msg,[indexMap[0]]);
				// 	} else {
				// 		this.game.dialog.selectText(msg.title,descriptions,true,function (idx) {
				// 			this.send(msg,[indexMap[idx]]);
				// 		}.bind(this));
				// 	}
				// }.bind(this));
			},this);
			datas.forEach(function (data) {
				data.buttonCarrier.addButton(msg.title,function () {
					if ((data.cards.length === 1) && (data.buttonCarrier.constructor === Card)) {
						this.send(msg,[data.indexes[0]]);
					} else {
						var arg = {
							min: 1,
							max: 1,
							texts: data.descriptions,
							canClose: true,
							careOrder: false,
							targets: data.cards
						}
						this.game.dialog.selectSomeCards(msg.title,data.cards,arg,function (selectedIndexes) {
							var i = selectedIndexes[0];
							this.send(msg,[data.indexes[i]]);
						}.bind(this));
					}
				}.bind(this));
			},this);
		} else {
			var useDialog = msg.descriptions.length || cards.some(function (card) {
				return card.shouldUseDialog();
			},this);
			if (useDialog) {
				this._autoPopMsg = msg;
				var zone = cards[0].zone;
				var sameZone = cards.every(function (card) {
					return card.zone === zone;
				},this);
				if (!sameZone || zone.constructor === TileZone) {
					zone = this.game.buttonZone;
				} else if (msg.label === 'GROW') {
					// 根据 有k 的反馈,把成长按钮放到LRIG上.
					zone = this.game.player.lrigZone;
				}
				zone.addButton(msg.title,this.popDialogBind(msg));
				if (!msg.min) {
					this.game.buttonZone.addButton(Localize.giveUp(msg.label),this.sendBind(msg));
				}
			} else {
				this.showMsgButtons(msg);
			}
		}
	},this);
};

Selector.prototype.select = function (msg,idx) {
	if (this.spectating) return;
	if (isNum(idx)) {
		this.selectedIndexes.push(idx);
	}
	if (this.selectedIndexes.length >= msg.max) {
		this.send(msg);
		return;
	}
	this.removeButtons();
	this.showMsgButtons(msg);
};

Selector.prototype.selectBind = function (msg,idx) {
	return this.select.bind(this,msg,idx);
};

Selector.prototype.unselect = function (msg,idx) {
	if (this.spectating) return;
	removeFromArr(idx,this.selectedIndexes);
	this.removeButtons();
	if (this.selectedIndexes.length) {
		this.showMsgButtons(msg);
	} else {
		this.showButtons();
	}
};

Selector.prototype.unselectBind = function (msg,idx) {
	return this.unselect.bind(this,msg,idx);
};

Selector.prototype.showMsgButtons = function (msg) {
	msg.cards.forEach(function (card,idx) {
		if (inArr(idx,this.selectedIndexes)) {
			card.addButton('-'+msg.title,this.unselectBind(msg,idx));
		} else {
			card.addButton(msg.title,this.selectBind(msg,idx));
		}
	},this);
	if (this.selectedIndexes.length >= msg.min) {
		var txt;
		if (this.selectedIndexes.length) {
			txt = Localize('buttonTitle','END_SELECT');
		} else {
			txt = Localize.giveUp(msg.label);
		}
		this.game.buttonZone.addButton(txt,this.sendBind(msg));
	}
};

Selector.prototype.send = function (msg,selectedIndexes) {
	if (this.spectating) return;
	if (!isArr(selectedIndexes)) {
		selectedIndexes = this.selectedIndexes;
	}

	this.game.input(msg.label,selectedIndexes.slice());
	console.log('game.input("'+msg.label+'",['+selectedIndexes.toString()+']);');

	this.clear();
};

Selector.prototype.sendBind = function (msg) {
	return this.send.bind(this,msg);
};

Selector.prototype.popDialog = function (msg) {
	var title = Localize.labelToDialogTitle(msg.label);
	var cards = msg.extraCards;
	// if (msg.min === 1 && msg.max === 1) {
	// 	if (msg.descriptions.length) {
	// 		var sample = cards[0];
	// 		var sameCard = cards.every(function (card) {
	// 			return card === sample;
	// 		},this);
	// 		if (sameCard) {
	// 			this.game.dialog.selectText(title,msg.descriptions,true,function (idx) {
	// 				this.send(msg,[idx]);
	// 			}.bind(this));
	// 			return;
	// 		}
	// 	} else {
	// 		this.game.dialog.selectCard(title,msg.cards,true,function (idx) {
	// 			this.send(msg,[idx]);
	// 		}.bind(this));
	// 		return;
	// 	}
	// }
	var arg = {
		min: msg.min,
		max: msg.max,
		texts: msg.descriptions,
		canClose: true,
		careOrder: msg.careOrder,
		targets: msg.cards
	};
	this.game.dialog.selectSomeCards(title,cards,arg,this.sendBind(msg));
};

Selector.prototype.popDialogBind = function (msg) {
	return this.popDialog.bind(this,msg);
};

Selector.prototype.removeButtons = function () {
	this.game.removeButtons();
};

Selector.prototype.autoPop = function () {
	if (this.msgs.length === 1 && this._autoPopMsg) {
		if (this._autoPopMsg.label === 'SPELL_CUT_IN') return;
		this.popDialog(this._autoPopMsg);
	}
};

Selector.prototype.clear = function () {
	this.removeButtons();
	this.game.dialog.close();
	this.selectedIndexes.length = 0;
	this.msgs.length = 0;
	this._autoPopMsg = null;
};