'use strict';

function MessageBox () {
	this.eWarp = document.getElementById('msgbox-warp');
	this.eWin = document.getElementById('msgbox-window');
	this.eMsg = document.getElementById('msgbox-msg');
	this.eInput = document.getElementById('msgbox-input');
	this.ePreset = document.getElementById('msgbox-preset');
	this.eOk = document.getElementById('msgbox-button-ok');
	this.eCancel = document.getElementById('msgbox-button-cancel');
}

MessageBox.prototype.alert = function (msg,callback) {
	this.eWin.className = 'alert';
	this.eMsg.textContent = msg;
	this.eWarp.classList.add('shown');
	this.eOk.focus();
	this.eOk.onclick = function (event) {
		this.close();
		if (callback) callback();
	}.bind(this);
};

MessageBox.prototype.confirm = function (msg,callback) {
	this.eWin.className = 'confirm';
	this.eMsg.textContent = msg;
	this.eWarp.classList.add('shown');
	this.eCancel.focus();

	this.eOk.onclick = function (event) {
		this.close();
		if (callback) callback(true);
	}.bind(this);
	this.eCancel.onclick = function (event) {
		this.close();
		if (callback) callback(false);
	}.bind(this);
};

MessageBox.prototype.prompt = function (msg,value,callback) {
	if (arguments.length === 2) {
		value = '';
		callback = arguments[1];
	}
	this.eWin.className = 'prompt';
	this.eMsg.textContent = msg;
	this.eInput.value = value;
	this.eWarp.classList.add('shown');
	this.eInput.select();

	var close = function (value) {
		this.close();
		if (callback) callback(value || '');
	}.bind(this);

	this.eOk.onclick = function (event) {
		close(this.eInput.value);
	}.bind(this);
	this.eCancel.onclick = function (event) {
		close();
	}.bind(this);
	this.eInput.onkeypress = function (event) {
		var keyCode = event.keyCode || event.which || event.charCode;
		if (keyCode !== 13) return;
		close(this.eInput.value);
	}.bind(this);
};

MessageBox.prototype.preset = function (label) {
	this.eWin.className = 'preset';
	var children = this.ePreset.children;
	for (var i = 0; i < children.length; i++) {
		var child = children[i];
		child.style.display = 'none';
	}
	document.getElementById('preset-'+label).style.display = '';
	this.eWarp.classList.add('shown');
};

MessageBox.prototype.close = function () {
	this.eWarp.classList.remove('shown');
	this.eWin.className = '';
};