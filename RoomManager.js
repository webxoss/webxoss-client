'use strict';
// (function () {
// function main () {

var $ = document.getElementById.bind(document);
function hide (el) {
	el.style.display = 'none';
}
function show (el,flag) {
	if (arguments.length === 1) {
		el.style.display = '';
	} else {
		el.disabled = flag? '' : 'none';
	}
}
function disable (el) {
	el.disabled = true;
}
function enable (el,flag) {
	if (arguments.length === 1) {
		el.disabled = false;
	} else {
		el.disabled = !flag;
	}
}
function setClass (el,cls,flag) {
	if (flag) {
		el.classList.add(cls);
	} else {
		el.classList.remove(cls);
	}
}
function newElement (tag) {
	var el = document.createElement(tag);
	for (var i = 1; i < arguments.length; i++) {
		el.classList.add(arguments[i]);
	}
	return el;
}
function newImage (url) {
	var img = new Image();
	img.src = url;
	return img;
}

/* 更新 */
if (window.applicationCache) {
	applicationCache.addEventListener('progress',function (event) {
		$('div-notice').classList.add('shown');
		if (event.loaded === event.total) {
			$('div-notice').classList.add('green');
			var a = document.createElement('a');
			a.href = location.href;
			a.textContent = Localize.index('UPDATE_READY');
			$('span-notice').innerHTML = '';
			$('span-notice').appendChild(a);
		} else {
			var percent = (event.loaded/event.total*100).toFixed(0) + '%';
			$('span-notice').textContent = Localize.index('UPDATING') + percent;
		}
	},false);
	applicationCache.addEventListener('error',function (event) {
		console.warn(event);
	},false);
}


var VERSION = 68;
var serverVersion;
var clientId = 0;
var game = null;
var position = '';
var mayusRoom = true;
var inroom = false;
var blocking = false;
var roomMsgObj = null;
var audio = new GameAudio();
var msgBox = new MessageBox();
var deckManager = new DeckManager();
var socket;
if (location.search === '?local=true') {
	socket = new FakeSocket(window.opener);
	window.socket = socket;
	window.game = game;
} else {
	console.log = function () {
		window._lastLog = arguments;
	};
	var host = getProxy();
	if (!host) {
		if (/:\d*$/.test(location.host)) {
			host = location.host.replace(/:\d*$/, ':2015');
		} else {
			host = location.host + ':2015'
		}
	}
	var url = location.protocol + '//' + host
	socket = io(url,{
		reconnection: false,
		reconnectionDelay: 3000,
		reconnectionDelayMax: 30000,
		reconnectionAttempts: 10
	});
}
if (location.search === '?debug') {
	window.socket = socket;
}
var chatManager = new ChatManager(socket);

/* 代理 */
function getProxy () {
	var proxy = localStorage.getItem('proxy');
	// 兼容旧版
	var updateMap = {
		'cloudflare.webxoss.com': 'cloudflare.webxoss.com:2053',
		'cloudflare.webxoss.com:2015': 'cloudflare.webxoss.com:2053',
		'incapsula.webxoss.com': '',
		'shanghai.webxoss.com:10086': '',
	};
	if (proxy in updateMap) {
		proxy = updateMap[proxy];
		localStorage.setItem('proxy', proxy)
	}
	return localStorage.getItem('proxy') || '';
}
$('span-set-proxy').onclick = function () {
	$('select-proxy').value = getProxy();
	msgBox.preset('proxy');
};
$('proxy-button-ok').onclick = function () {
	var proxy = $('select-proxy').value;
	if (getProxy() === proxy) {
		msgBox.close();
		return;
	}
	localStorage.setItem('proxy',proxy);
	reload();
};
$('select-proxy').onchange = function () {
	if ($('select-proxy').value !== 'provide') return;
	msgBox.alert(Localize.index('PROVIDE_PROXY_SERVER'));
};

createjs.Ticker.on('tick',function (event) {
	if (game) game.update();
});

function initLanguage () {
	Localize.init();
	Localize.DOM('index');
	$('select-language').value = localStorage.getItem('language');
}

function initHall () {
	game = null;
	socket.io.reconnection(false);
	position = '';
	mayusRoom = true;
	blocking = false;
	inroom = false;
	watchingLive = false;
	playingReplay = false;
	roomMsgObj = null;
	document.body.removeAttribute('self');
	document.body.removeAttribute('opponent');
	document.body.classList.remove('gaming');
	hide($('GameDiv'));
	hide($('Room'));
	hide($('Chat'));
	show($('Hall'));
	chatManager.clear();
	audio.playBgm('main');
}

function initInputValues () {
	var nickname = localStorage.getItem('nickname');
	if (nickname) {
		$('input-nickame').value = nickname;
	}
	var roomName = localStorage.getItem('room name');
	if (roomName) {
		$('input-room-name').value = roomName;
	}
	var password = localStorage.getItem('password');
	if (password) {
		$('input-create-room-password').value = password;
	}
	var live = localStorage.getItem('live');
	if (live !== null) {
		$('input-live').checked = live;
	} else {
		$('input-live').checked = true;
	}
}

initLanguage();
initInputValues();
initHall();


$('select-language').onchange = function () {
	Localize.setLanguage($('select-language').value);
	Localize.DOM('index');
};

function reload () {
	window.onbeforeunload = null;
	window.location = window.location.href;
}

socket.on('error',function (err) {
	debugger;
	audio.playBgm();
	if ((err === 'MAX_SOCKETS_PER_IP') || (err === 'MAX_SOCKETS')) {
		msgBox.alert(err);
		return;
	}
	msgBox.alert(Localize.index('NET_WORK_ERROR'),reload);
});

socket.on('disconnect',function (data) {
	console.log('disconnect');
	if (!socket.io.reconnection()) {
		game = null;
		audio.playBgm();
		msgBox.alert(Localize.index('DISCONNECTED'),reload);
	} else {
		msgBox.preset('reconnect');
	}
});

socket.on('reconnect_failed',function (number) {
	msgBox.alert('RECONNECT_FAILED',reload);
});

socket.on('reconnect_attempt',function () {
	console.log('reconnect_attempt');
	socket.io.opts.query = 'clientId='+clientId;
});

socket.on('reconnect',function (number) {
	console.log('reconnect');
});

socket.on('error message',function (data) {
	msgBox.alert(data);
});

socket.on('client id',function (id) {
	clientId = id;
	console.log('clientId = %s',id);
});

socket.on('game reconnect',function () {
	console.log('game reconnect');
	msgBox.close();
	game.io.resend();
});

socket.on('game reconnect failed',function () {
	console.log('game reconnect failed');
	msgBox.alert(Localize.index('DROPPED'),initHall);
});

socket.on('wait for reconnect',function () {
	console.log('wait for reconnect');
	socket.io.reconnection(false);
	enable($('wait-for-reconnect-button-drop'),!isSpectator());
	msgBox.preset('wait-for-reconnect');
});

$('wait-for-reconnect-button-drop').onclick = function (event) {
	disable(this);
	socket.emit('drop');
};

socket.on('opponent reconnect',function () {
	console.log('opponent reconnect');
	socket.io.reconnection(true);
	msgBox.close();
});

socket.on('version',function (ver) {
	serverVersion = ver;
});

function checkVersion () {
	if (!serverVersion) {
		msgBox.alert(Localize.index('NOT_CONNECTED'));
		return false;
	}
	if (VERSION == serverVersion) return true;
	msgBox.alert(Localize.index('REQUIRE_UPDATE'));
	if (window.applicationCache && window.applicationCache.update) {
		window.applicationCache.update();
	}
	return false;
}

socket.on('game start',function (data) {
	gameStart();
});

function gameStart (tag) {
	hide($('Hall'));
	hide($('Room'));
	show($('GameDiv'));
	if (game) {
		game.destroy();
	}
	if (tag === 'replay') {
		hide($('Chat'));
		show($('div-replay-controls'));
		var top =  (734 - $('button-replay-step').clientHeight)/2;
		$('div-replay-controls').style.top = top + 'px';
	} else {
		hide($('div-replay-controls'));
		if (tag !== 'live') {
			show($('Chat'));
		} else {
			hide($('Chat'));
		}
	}
	var spectating = (tag === 'replay') || 
	                 (tag === 'live') ||
	                 isSpectator();
	if (spectating) {
		hide($('span-surrender'));
		show($('span-leave-game'));
	} else {
		show($('span-surrender'));
		hide($('span-leave-game'));
		socket.io.reconnection(true);
	}
	game = new Game(new IO(socket),audio,ongameover,spectating);
	document.body.classList.add('gaming');
}

function ongameover (win,surrender,messagePacks) {
	socket.io.reconnection(false);
	askForSupport(win);
	var title = win? 'WIN' : 'LOSE';
	var body = newElement('div');
	setClass(body,'gameover',true);
	var textDiv = newElement('div');
	if (win) {
		textDiv.textContent = surrender? Localize.index('OPPONENT_SURRENDERED') : 'YOU WIN!';
	} else {
		textDiv.textContent = surrender? Localize.index('SURRENDERED') : 'YOU LOSE!';
	}
	body.appendChild(textDiv);
	var blob = objToBlob(createReplayObj(messagePacks,win,surrender));
	var url = blobToUrl(blob);
	var replayLink = null;
	if (url) {
		replayLink = newElement('a');
		setClass(replayLink,'replay',true);
		replayLink.target = '_blank';
		var time = (new Date()).toISOString().replace('T',' ').substr(0,19).replace(/:/g,'-');
		var filename = time + '.wxrep'
		replayLink.download = filename;
		replayLink.href = url;
		replayLink.textContent = Localize.index('SAVE_REPLAY');
		if (navigator.msSaveBlob) {
			replayLink.onclick = function (event) {
				event.preventDefault();
				navigator.msSaveBlob(blob,filename);
				return false;
			}
		}
	}
	game.dialog.pop(title,body,replayLink,false,function () {
		game = null;
		if (url && window.URL) {
			window.URL.revokeObjectURL(url);
		}
		if (roomMsgObj && !watchingLive) {
			updateRoom(roomMsgObj);
		} else {
			initHall();
		}
	});
}

function askForSupport (win) {
	// // 显示通知
	// var str = 'WIXOSS really needs your support!!';
	// // 点开过不显示
	// if (localStorage.getItem('support') === str) return;
	// // 第一次访问的5天内不显示
	// var firstAccess = localStorage.getItem('first access') || 0;
	// var now = (new Date()).getTime();
	// if (!firstAccess) {
	// 	localStorage.setItem('first access',now);
	// 	return;
	// }
	// if ((now - firstAccess) < 5*24*60*60*1000) return;
	// // 完成游戏数少于3不显示
	// var gameCount = sessionStorage.getItem('game count') || 0;
	// gameCount++;
	// sessionStorage.setItem('game count',gameCount);
	// if (gameCount < 3) return;
	// // 不是胜利不显示
	// // if (!win) return;
	// // 显示
	// $('subtitle').className = 'support-webxoss';
	// $('link-support-webxoss').onclick = function (event) {
	// 	$('subtitle').classList.remove('support-webxoss');
	// 	localStorage.setItem('support',str);
	// 	var lang = localStorage.getItem('language');
	// 	// if (localStorage.getItem('support') === str) return;
	// 	if ((lang === 'zh_CN') || (lang === 'zh_TW')) {
	// 		msgBox.preset('support');
	// 		$('support-button-ok').onclick = function () {
	// 			msgBox.close();
	// 		};
	// 		event.preventDefault();
	// 		return false;
	// 	}
	// };
}

function createReplayObj (messagePacks,win,surrender) {
	return {
		format: 'WEBXOSS Replay',
		version: '1',
		content: {
			clientVersion: VERSION,
			_timestamp: (new Date()).getTime(),
			win: !!win,
			surrender: !!surrender,
			messagePacks: messagePacks
		}
	};
}

function blobToUrl (blob) {
	if (!blob) return '';
	var URL = window.URL || window.webkitURL || window.mozURL;
	if (!URL) return '';
	var url;
	try {
		url = URL.createObjectURL(blob);
	} catch (e) {
		debugger;
		return '';
	}
	return url;
}

function objToBlob (obj) {
	var Blob = window.Blob || window.WebKitBlob || window.mozBlob;
	var JSON = window.JSON;
	if (!Blob || !JSON) return '';
	var json;
	var blob;
	try {
		json = JSON.stringify(obj);
		blob = new Blob([json],{type: 'application/octet-stream'});
	} catch (e) {
		debugger;
		return null;
	}
	return blob;
}

socket.on('update room list',function (list) {
	$('room-list').innerHTML = '';
	var liveListElements = [];
	list.forEach(function (obj) {
		var li = document.createElement('li');
		if (!obj.mayusRoom) {
			li.classList.add('no-mayus-room');
		}
		if (obj.live) {
			li.textContent = obj.roomName;
			li.classList.add('live');
			li.onclick = watchLive.bind(null,obj.roomName);
			liveListElements.push(li);
		} else {
			li.textContent = obj.roomName+' ('+obj.count+'/'+obj.total+')';
			if (obj.passwordRequired) {
				li.classList.add('password-required');
			}
			li.onclick = joinRoom.bind(null,obj.roomName,obj.passwordRequired);
			$('room-list').appendChild(li);
		}
	});
	liveListElements.forEach(function (li) {
		$('room-list').appendChild(li);
	});
});

socket.on('update online counter',function (count) {
	$('span-online-counter').textContent = count;
});

// Tick-tock (Show latency)
(function () {
	var start = 0;
	var tocked = false;
	function tick () {
		tocked = false;
		start = Date.now();
		socket.emit('tick');
		setTimeout(function () {
			if (tocked) return;
			$('span-latency').classList.add('warn');
			$('span-latency').textContent = '>500ms';
		},1000);
	}
	socket.on('tock',function () {
		tocked = true;
		var latency = Math.round((Date.now() - start)/2);
		if (latency < 500) {
			$('span-latency').textContent = (latency + 'ms');
			$('span-latency').classList.remove('warn');
		}
		setTimeout(tick,1000);
	});
	tick();
})();

function initDeckOptions () {
	$('select-decks').innerHTML = '';
	var validDeckNames = [];
	var allDeckNames = deckManager.getDeckNames();
	allDeckNames.forEach(function (name) {
		var deck = deckManager.loadDeck(name);
		if (deckManager.checkDeck(deck,mayusRoom)) {
			validDeckNames.push(name);
		}
	});
	if (!validDeckNames.length) {
		msgBox.alert(Localize.index('NO_VALID_DECK'));
		return false;
	}
	validDeckNames.forEach(function (name) {
		var eOption = newElement('option');
		eOption.value = name;
		eOption.textContent = name;
		$('select-decks').appendChild(eOption);
	});
	return true;
}

function isHost () {
	return position === 'host';
}
function isGuest () {
	return position === 'guest';
}
function isSpectator () {
	return (position === 'host-spectator') || (position === 'guest-spectator');
}

var elements = [$('room-guest-nickname')];
for (var i = 0; i < 5; i++) {
	elements.push($('host-spectator-'+i));
	elements.push($('guest-spectator-'+i));
	var checkbox = $('checkbox-spectator-'+i);
	checkbox.onchange = (function (i,event) {
		if (blocking) return event.returnValue = false;
		if (this.checked) {
			socket.emit('unlockSpec',i);
		} else {
			socket.emit('lockSpec',i);
		}
		blocking = true;
	}).bind(checkbox,i);
}

function clearOnclicks () {
	elements.forEach(function (el) {
		el.onclick = null;
	});
}

function setClickableStyle () {
	elements.forEach(function (el) {
		setClass(el,'clickable',el.onclick);
	});
}

socket.on('update room',function (msgObj) {
	roomMsgObj = msgObj;
	updateRoom(msgObj);
});

function updateRoom (msgObj) {
	roomMsgObj = msgObj;
	if (game) return;
	mayusRoom = !!msgObj.mayusRoom;
	if (!inroom) initDeckOptions();
	inroom = true;
	blocking = false;
	hide($('Hall'));
	hide($('GameDiv'));
	show($('Room'));
	show($('Chat'));
	document.body.removeAttribute('self');
	document.body.removeAttribute('opponent');
	document.body.classList.remove('gaming');

	position = msgObj.me;
	audio.playBgm('main');
	if (isHost() && !$('room-guest-nickname').classList.contains('ready') && msgObj.guestReady) {
		audio.playSoundEffect('JoinRoom');
	}

	$('room-name').value = msgObj.roomName;
	if (!isHost()) {
		$('room-name').readOnly = true;
	}
	$('room-host-nickname').textContent = msgObj.host;
	$('room-guest-nickname').textContent = msgObj.guest;
	setClass($('room-guest-nickname'),'ready',msgObj.guestReady);

	$('Room').setAttribute('data-position',position);
	clearOnclicks();

	msgObj.hostSpectatorList.forEach(function (spectator,i) {
		var el = $('host-spectator-'+i);
		var locked = !isStr(spectator);
		el.textContent = spectator || '';
		setClass(el,'locked',locked);
		if (isHost()) {
			if (locked) {
				el.onclick = function (event) {
					if (blocking) return;
					socket.emit('unlockSpec',i);
					blocking = true;
				};
			} else {
				el.onclick = function (event) {
					if (blocking) return;
					socket.emit('lockSpec',i);
					blocking = true;
				};
			}
		} else if (!locked && !spectator) {
			el.onclick = function (event) {
				if (blocking) return;
				socket.emit('changePosition',{ position:'host-spectator',i:i });
				blocking = true;
			};
		}
	},this);
	msgObj.guestSpectatorList.forEach(function (spectator,i) {
		var el = $('guest-spectator-'+i);
		var locked = !isStr(spectator);
		el.textContent = spectator || '';
		setClass(el,'locked',locked);
		if (!isHost() && !locked && !spectator) {
			el.onclick = function (event) {
				if (blocking) return;
				socket.emit('changePosition',{ position:'guest-spectator',i:i });
				blocking = true;
			};
		}
	},this);
	if (isSpectator() && !msgObj.guest) {
		$('room-guest-nickname').onclick = function (event) {
			if (blocking) return;
			socket.emit('changePosition',{ position:'guest',i:0 });
			blocking = true;
		};
	}
	setClickableStyle();

	if (isHost()) {
		show($('button-start-game'));
		show($('select-decks'));
		enable($('select-decks'));
		hide($('container-ready'));
		show($('container-live'));
		enable($('button-start-game'),msgObj.guestReady);
	} else if (isGuest()) {
		hide($('button-start-game'));
		show($('select-decks'));
		show($('container-ready'));
		hide($('container-live'));
		if (msgObj.guestReady) {
			$('input-ready').checked = true;
			disable($('select-decks'));
		} else {
			$('input-ready').checked = false;
			enable($('select-decks'));
		}
	} else {
		hide($('button-start-game'));
		hide($('select-decks'));
		hide($('container-ready'));
		hide($('container-live'));
	}
}

socket.on('host left',function () {
	// window.alert(Localize.index('HOST_LEFT'));
	initHall();
});

socket.on('kicked',function () {
	initHall();
});

$('span-leave-room').onclick = function () {
	socket.emit('leaveRoom');
	initHall();
};

socket.on('wrong password',function () {
	msgBox.alert(Localize.index('WRONG_PASSWORD'));
});

socket.on('host disconnected',function () {
	if (game) {
		var msg = Localize.index('OPPONENT_DISCONNECTED');
		if (position === 'host-spectator') {
			msg = Localize.index('SELF_DISCONNECTED');
		}
		msgBox.alert(msg,initHall);
	} else {
		initHall();
	}
});

socket.on('guest disconnected',function () {
	var msg = Localize.index('OPPONENT_DISCONNECTED');
	if (position === 'guest-spectator') {
		msg = Localize.index('SELF_DISCONNECTED');
	}
	msgBox.alert(msg,initHall);
});

$('span-surrender').onclick = function () {
	if (!game) return;
	msgBox.confirm(Localize.index('CONFIRM_SURRENDER'),function (yes) {
		if (!yes) return;
		socket.emit('surrender');
	});
};

$('span-leave-game').onclick = function () {
	if (!game) return;
	if (!playingReplay) {
		socket.emit('leaveRoom');
	}
	initHall();
};

socket.on('surrendered',function () {
	if (!game) return;
	game.lose(true);
})

socket.on('opponent surrendered',function () {
	if (!game) return;
	game.win(true);
});

function joinRoom (roomName,passwordRequired) {
	if (!roomName) return;
	if (!checkVersion()) return;
	if (!$('input-nickame').value) {
		msgBox.alert(Localize.index('PLEASE_INPUT_A_NICKNAME'),function () {
			$('input-nickame').focus();
		});
		return;
	}
	if (!initDeckOptions()) {
		return;
	}
	if (passwordRequired) {
		msgBox.prompt(Localize.index('INPUT_PASSWORD'),function (password) {
			if (!password) return;
			doJoinRoom(roomName,password);
		});
		return;
	}
	doJoinRoom(roomName);
}

function doJoinRoom (roomName,password) {
	localStorage.setItem('nickname',$('input-nickame').value);
	socket.emit('joinRoom',{
		roomName: roomName,
		nickname: $('input-nickame').value,
		password: password || ''
	});
}

$('button-create-room').onclick = function (event) {
	if (!checkVersion()) return;
	if (!$('input-nickame').value) {
		msgBox.alert(Localize.index('PLEASE_INPUT_A_NICKNAME'),function () {
			$('input-nickame').focus();
		});
		return;
	}
	if (!$('input-room-name').value) {
		msgBox.alert(Localize.index('PLEASE_INPUT_A_ROOM_NAME'),function () {
			$('input-room-name').focus();
		});
		return;
	}
	mayusRoom = $('checkbox-mayus-room').checked;
	if (!initDeckOptions()) {
		return;
	}
	localStorage.setItem('room name',$('input-room-name').value);
	localStorage.setItem('nickname',$('input-nickame').value);
	localStorage.setItem('password',$('input-create-room-password').value);
	socket.emit('createRoom',{
		roomName: $('input-room-name').value,
		nickname: $('input-nickame').value,
		password: $('input-create-room-password').value,
		mayusRoom: mayusRoom
	});
};

$('input-ready').onchange = function (event) {
	if (blocking) return event.returnValue = false;
	if ($('input-ready').checked) {
		var deck = deckManager.loadDeck($('select-decks').value);
		if (!deck) {
			msgBox.alert(Localize.index('FAILED_TO_READ_DECK'),function () {
				$('input-ready').checked = false;
			});
			return;
		}
		disable($('select-decks'));
		socket.emit('ready',deck);
		blocking = true;
	} else {
		enable($('select-decks'));
		socket.emit('unready');
		blocking = true;
	}
};

$('button-start-game').onclick = function (event) {
	if (blocking) return event.returnValue = false;
	var deck = deckManager.loadDeck($('select-decks').value);
	if (!deck) {
		msgBox.alert(Localize.index('FAILED_TO_READ_DECK'));
		return;
	}
	var cfg = deck;
	cfg.live = $('input-live').checked;
	localStorage.setItem('live',cfg.live);
	socket.emit('startGame',cfg);
	blocking = true;
};

$('link-edit-deck').onclick = function (event) {
	window.open($('link-edit-deck').href);
	event.preventDefault();
	return false;
};

$('room-name').onblur = function () {
	var roomName = $('room-name').value;
	if (roomName) {
		socket.emit('renameRoom', {
			'roomName': roomName
		});
	}
	return false;
}

$('room-name-form').onsubmit = function (event) {
	var roomName = $('room-name').value;
	if (roomName) {
		socket.emit('renameRoom', {
			'roomName': roomName
		});
	}
	event.preventDefault();
	return false;
}

/* 直播 */
var stopFetchingLive = 0;
var watchingLive = false;
function watchLive (roomName) {
	if (!checkVersion()) return;
	socket.emit('watchLive',{roomName: roomName});
	msgBox.alert(Localize.index('FETCHING_DATA'),function () {
		stopFetchingLive++;
		socket.emit('leaveRoom');
	});
}
socket.on('liveData',function (messagePacks) {
	if (stopFetchingLive) {
		stopFetchingLive--;
		return;
	}
	if (!messagePacks) {
		msgBox.alert(Localize.index('FAILED_TO_FETCH_DATA'));
		return;
	}
	msgBox.close();
	watchingLive = true;
	gameStart('live');
	game.skip = true;
	messagePacks.forEach(function (pack,i) {
		game.io.receiveGameMessage({
			buffer: [{
				id: i,
				data: pack
			}]
		});
	});
	game.handleMsgQueue();
	game.skip = false;
});

/* 全网录像 */
var stopFetchingReplay = false;
function updateReplayList () {
	stopFetchingReplay = false;
	socket.emit('getReplayList');
}
socket.on('replayList',function (list) {
	$('replay-list').innerHTML = '';
	list.forEach(function (info) {
		var li = newElement('li');
		var selfLrig = CardInfo[info.selfLrig];
		var opponentLrig = CardInfo[info.opponentLrig];
		var text = Localize.classes(selfLrig) + ' vs ' + Localize.classes(opponentLrig);
		text = text.replace(/\n/g,'');
		li.textContent = text;
		li.onclick = getReplayContent.bind(null,info.id);
		$('replay-list').appendChild(li);
	});
});
function getReplayContent (id) {
	socket.emit('getReplayContent',id);
	msgBox.alert(Localize.index('FETCHING_DATA'),function () {
		stopFetchingReplay = true;
	});
}
socket.on('replayContent',function (content) {
	if (stopFetchingReplay) return;
	if (!content) {
		msgBox.alert(Localize.index('FAILED_TO_FETCH_DATA'));
		return;
	}
	msgBox.close();
	playReplayContent(content);
});

/* 聊天 */
socket.on('chat',function (msgObj) {
	var hosts = ['host','host-spectator'];
	var guests = ['guest','guest-spectator'];
	var specs = ['host-spectator','guest-spectator'];
	var isOpponent = (inArr(position,hosts) && inArr(msgObj.position,guests)) ||
	                 (inArr(position,guests) && inArr(msgObj.position,hosts));
	var isSpectator = inArr(msgObj.position,specs);
	chatManager.addMsg(msgObj.nickname,msgObj.content,isOpponent,isSpectator);
});

/* 声音 */
$('checkbox-bgm').onchange = function (event) {
	audio.disableBgm(!$('checkbox-bgm').checked);
};
$('checkbox-sound-effect').onchange = function (event) {
	audio.disableSoundEffect(!$('checkbox-sound-effect').checked);
};

/* 录像 */
var playingReplay = false;
$('span-play-replay').onclick = function (event) {
	$('input-replay-file').value = null;
	msgBox.preset('replay');
	updateReplayList();
}
$('button-replay-return').onclick = function (event) {
	msgBox.close();
};
$('input-replay-file').onchange = function (event) {
	readAndPlayReplayFile();
}
function readAndPlayReplayFile () {
	var file = $('input-replay-file').files[0];
	if (!file) return;
	$('input-replay-file').value = null;
	readReplayFile(file,function (obj) {
		if (!obj) {
			msgBox.alert(Localize.index('FAILED_TO_PARSE_REPLAY'),initHall);
			return;
		}
		msgBox.close();
		playReplayContent(obj.content);
	});
}
function playReplayContent (content) {
	if (content.clientVersion > VERSION) {
		msgBox.alert(Localize.index('UNSUPPORTED_REPLAY_VERSION'),initHall);
		return;
	}
	playingReplay = true;
	gameStart('replay');
	game.io.datas = content.messagePacks;
	var i = 0;
	var idle = true;
	var auto = false;
	game.onidle = function () {
		idle = true;
		if (i >= content.messagePacks.length) {
			$('button-replay-auto').onclick = null;
			$('button-replay-step').onclick = null;
			$('button-replay-save').onclick = null;
			if (content.surrender) {
				if (content.win) {
					game.win(true);
				} else {
					game.lose(true);
				}
			}
		} else {
			if (auto) {
				setTimeout(step,500);
			}
		}
	};
	step();

	$('button-replay-auto').onclick = function (event) {
		auto = true;
		step();
	};
	$('button-replay-step').onclick = function (event) {
		if (auto) {
			auto = false;
			return;
		}
		step();
	};
	$('button-replay-save').onclick = function (event) {
		event.preventDefault();
		var a = document.createElement('a');
		var blob = objToBlob(createReplayObj(
			content.messagePacks,
			content.win,
			content.surrender
		));
		var url = blobToUrl(blob);
		var time = (new Date()).toISOString().replace('T',' ').substr(0,19).replace(/:/g,'-');
		var filename = time + '.wxrep';
		a.href = url;
		a.download = filename;
		a.click();
		window.URL.revokeObjectURL(url);
	};

	function step () {
		if (!idle) return;
		idle = false;
		game.addMsgs(content.messagePacks[i++]);
	}
}
function readReplayFile (file,callback) {
	if (!file || !window.FileReader || !window.JSON) {
		callback(null);
		return;
	}
	var reader = new FileReader();
	reader.onload = function (event) {
		var json = reader.result;
		var obj = null;
		try {
			obj = JSON.parse(json);
		} catch (e) {
			return callback(null);
		}
		if (!checkReplayObj(obj)) return callback(null);
		callback(obj);
	};
	reader.onerror = function (event) {
		callback(null);
	}
	reader.readAsText(file);
}
function checkReplayObj (obj) {
	if (!isObj(obj)) return false;
	if (obj.format !== 'WEBXOSS Replay') return false;
	if (obj.version !== '1') return false;
	if (!isObj(obj.content)) return false;
	return true;
}

window.onbeforeunload = function (event) {
	if (!game) return;
	if (location.search === '?local=true') return;
	var confirmationMessage = Localize.index('CONFIRM_CLOSE');
	event.returnValue = confirmationMessage;
	return confirmationMessage; 
};


function checkDomain () {
	var hostname = location.hostname;
	if ((hostname === '127.0.0.1')) return;
	// if (!hostname) return;
	if (hostname.match(/^(.*\.)?webxoss\.com$/)) return;
	msgBox.preset('warn');
}
checkDomain();

// new deck editor
if (/iPhone|Android/i.test(navigator.userAgent)) {
	$('link-edit-deck').onclick = function (event) {
		if (window.confirm('Do you like to try our new DeckEditor for mobile phone?')) {
			event.preventDefault();
			location = '/next/';
		}
	}
}

// if (localStorage.getItem('notice') !== 'tournament') {
// 	$('subtitle').className = 'match';
// 	$('notice-match').onclick = function () {
// 		$('subtitle').className = '';
// 		msgBox.preset('match');
// 		$('match-button-ok').onclick = function () {
// 			msgBox.close();
// 			localStorage.setItem('notice','tournament');
// 		}
// 	};
// }

// if (localStorage.getItem('notice') !== 'destructed-wixoss') {
// 	$('subtitle').className = 'destructed-wixoss';
// 	$('link-destructed-wixoss').onclick = function () {
// 		$('subtitle').className = '';
// 		localStorage.setItem('notice','destructed-wixoss');
// 	};
// }

// if (localStorage.getItem('notice') !== 'helper-wanted') {
// 	if (Localize.getLanguage() === 'zh_CN') {
// 		$('subtitle').className = 'helper-wanted';
// 		$('link-helper-wanted').onclick = function () {
// 			$('subtitle').className = '';
// 			localStorage.setItem('notice','helper-wanted');
// 			msgBox.preset('helper-wanted');
// 			$('helper-wanted-button-ok').onclick = msgBox.close.bind(msgBox);
// 		};
// 	}
// }

// 通知
// if (localStorage.getItem('notice')) {
// 	hide($('link-notice'));
// } else {
// 	hide($('link-version'));
// }
// $('link-notice').onclick = function (event) {
// 	event.preventDefault();
// 	msgBox.preset(Localize.index('NOTICE_ID'));
// 	return false;
// }
// function closeNotice () {
// 	hide($('link-notice'));
// 	show($('link-version'));
// 	localStorage.setItem('notice','1');
// 	msgBox.close();
// }
// $('notice-chinese-button-ok').onclick = closeNotice;
// $('notice-enlish-button-ok').onclick = closeNotice;
// $('notice-japanese-button-ok').onclick = closeNotice;

// }


// if (document.readyState === 'complete') {
// 	main();
// } else {
// 	window.addEventListener('DOMContentLoaded',main);
// }

// })();