'use strict';

function ChatManager (socket) {
	this.socket = socket;
	this.dialogue = document.getElementById('chat-dialogue');
	this.input = document.getElementById('chat-input');

	// socket.on('chat feedback',this.receiveFeedback.bind(this));
	// socket.on('chat',this.onChat.bind(this));
	this.input.onkeypress = function (event) {
		var keyCode = event.keyCode || event.which || event.charCode;
		if (keyCode !== 13) return;
		this.sendMsg(this.input.value);
		this.input.value = null;
	}.bind(this);
}

// ChatManager.prototype.receiveFeedback = function (msg) {
// 	var chatCount = sessionStorage.getItem('chat count') || 0;
// 	chatCount++;
// 	sessionStorage.setItem('chat count',chatCount);
// 	this.addMsg(msg,'self');
// };

// ChatManager.prototype.onChat = function (msgObj) {
// 	this.addMsg(msg.nickname+':' + msg.msg,'opponent');
// };

ChatManager.prototype.sendMsg = function (msg) {
	if (!msg) return;
	this.socket.emit('chat',msg);
};

ChatManager.prototype.addSysMsg = function (msg) {
	var div = document.createElement('div');
	div.classList.add('sys');
	div.textContent = msg;
	this.dialogue.appendChild(div);
	this.dialogue.scrollTop = this.dialogue.scrollHeight;
};

ChatManager.prototype.addMsg = function (name,content,isOpponent,isSpectator) {
	var div = document.createElement('div');
	if (isOpponent) div.classList.add('opponent');
	if (isSpectator) div.classList.add('spectator');

	var spanName = document.createElement('span');
	spanName.classList.add('name');
	spanName.textContent = name;

	var spanContent = document.createElement('span');
	spanContent.classList.add('content');
	spanContent.textContent = content;

	div.appendChild(spanName);
	div.appendChild(spanContent);
	this.dialogue.appendChild(div);

	if (this.dialogue.children.length > 64) {
		this.dialogue.removeChild(this.dialogue.firstChild);
	}
	this.dialogue.scrollTop = this.dialogue.scrollHeight;
};

ChatManager.prototype.clear = function () {
	this.dialogue.innerHTML = '';
};