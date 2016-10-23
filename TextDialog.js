'use strict';

function TextDialog (game) {
	this.game = game;

}

TextDialog.prototype.newElement = function (tag) {
	return document.createElement(tag);
};

TextDialog.prototype.selectOne = function (title,texts,callback) {
	var dialog = this;
	var ol = this.newElement('div');
	texts.forEach(function (text,idx) {
		var li = this.newElement('div');
		li.textContent = text;
		ol.appendChild(li);

		li.onclick = function (event) {
			dialog.close();
			callback(idx);
		}
	},this);

	this.titleDiv.textContent = title;
	this.bodyDiv.innerHTML = '';
	this.bodyDiv.appendChild(ol);
	this.okButton.hidden = true;

	this.pop(title);
};

// TextDialog.prototype.selectOne = function (title,texts,callback) {
// 	var ol = this.newElement('div');
// 	texts.forEach(function (text) {
// 		var li = this.newElement('div');
// 		var label = this.newElement('label');
// 		var checkbox = this.newElement('input');
// 		checkbox.type = 'checkbox';
// 		var txt = document.createTextNode(text);

// 		label.appendChild(checkbox);
// 		label.appendChild(txt);
// 		li.appendChild(label);
// 		ol.appendChild(li);
// 	},this);

// 	this.titleDiv.textContent = title;
// 	this.bodyDiv.innerHTML = '';
// 	this.bodyDiv.appendChild(ol);
// };