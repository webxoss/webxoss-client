'use strict';

/*
	服务器 -> 客户端:
	msg = {
		buffer: [{
			id: id,
			data: []
		}]
	}
	客户端 -> 服务器
	msg = {
		id: id,
		data: {
			label: label,
			input: []
		}
	}
*/

function IO (socket) {
	this.socket = socket;
	this.listener = null;
	this.sendingMsg = null;  // 上次发送的信息,用于重连时重新发送.
	this.datas = [];         // 收到的数据.
	this.id = 0;

	// For test
	this.inputBlocked = false;
	this.outputBlocked = false;

	this.socket.removeAllListeners('gameMessage');
	this.socket.on('gameMessage',this.receiveGameMessage.bind(this));
};

IO.prototype.receiveGameMessage = function (msg) {
	if (this.inputBlocked) return;
	msg.buffer.forEach(function (buf) {
		if (buf.id < this.datas.length) return;
		if (buf.id !== this.datas.length) {
			console.error('buf.id !== this.datas.length');
			return;
		}
		this.sendingMsg = null;
		this.datas.push(buf.data);
		if (this.listener) {
			this.listener(buf.data);
		}
	},this);
};

IO.prototype.send = function (data) {
	this.id++;
	this.sendingMsg = {
		id: this.id,
		data: data
	};
	if (this.outputBlocked) return;
	this.socket.emit('gameMessage',this.sendingMsg);
};

IO.prototype.resend = function () {
	if (!this.sendingMsg) return;
	this.socket.emit('gameMessage',this.sendingMsg);
};

IO.prototype.getDatas = function () {
	return this.datas;
};

// For test
IO.prototype.toggleIn = function () {
	return this.inputBlocked = !this.inputBlocked;
};

IO.prototype.toggleOut = function () {
	return this.outputBlocked = !this.outputBlocked;
};