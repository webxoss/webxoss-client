'use strict';

function GameAudio () {
	this.bgm = document.getElementById('audio-bgm');
	this.soundEffect = document.getElementById('audio-sound-effect');
	this.bgmCheckBox = document.getElementById('checkbox-bgm');
	this.seCheckBox = document.getElementById('checkbox-sound-effect');
	this.bgmDisabled = false;
	this.seDisabled = false;
	this.lastPlay = '';
	this.map = {
		'white': 'WhiteAng',
		'black': 'DarkFßen',
		'red': 'reLEIdEN',
		'blue': 'Süblueß',
		'green': 'GreenWi',
		'NevWorry': 'NevWorry',
		'main': 'Love Your Enemies.W',
		'Battle': 'バトル！'
	}
	this.loadSettings();
}

GameAudio.prototype.loadSettings = function () {
	if (localStorage.getItem('bgm') === 'disabled') {
		this.bgmDisabled = true;
	}
	if (localStorage.getItem('sound effect') === 'disabled') {
		this.seDisabled = true;
	}
	this.bgmCheckBox.checked = !this.bgmDisabled;
	this.seCheckBox.checked = !this.seDisabled;
};

GameAudio.prototype.disableBgm = function (flag) {
	if (flag) {
		this.bgmDisabled = true;
		localStorage.setItem('bgm','disabled');
		this.bgm.pause();
		this.bgm.src = '';
	} else {
		this.bgmDisabled = false;
		localStorage.setItem('bgm','enabled');
		this.bgm.src = this.lastPlay;
		this.bgm.play();
	}
};

GameAudio.prototype.disableSoundEffect = function (flag) {
	if (flag) {
		this.seDisabled = true;
		localStorage.setItem('sound effect','disabled');
	} else {
		this.bgmDisabled = false;
		localStorage.setItem('sound effect','enabled');
	}
};

GameAudio.prototype.bgmFadeOut = function (callback) {
	var bgm = this.bgm;
	var timer = setInterval(function () {
		if (bgm.volume <= 0.2) {
			bgm.volume = 0;
			clearInterval(timer);
			callback();
			return;
		}
		bgm.volume -= 0.2;
	},200);
};

GameAudio.prototype.playBgm = function (code) {
	if (!code) {
		this.bgm.src = '';
		this.lastPlay = '';
		return;
	}
	var src = './background/' + this.map[code] + '.mp3';
	if (this.lastPlay === src) return;
	this.lastPlay = src;
	if (this.bgmDisabled) return;
	this.bgm.src = src;
	this.bgm.volume = 1;
	this.bgm.play();
};

GameAudio.prototype.playSoundEffect = function (name) {
	if (this.seDisabled) return;
	this.soundEffect.src = './background/' + name + '.mp3';
	this.soundEffect.play();
};