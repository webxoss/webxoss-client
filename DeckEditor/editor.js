'use strict';
// window.addEventListener('DOMContentLoaded',function () {


var $ = document.getElementById.bind(document);
function hide (el) {
	el.style.display = 'none';
}
function show (el) {
	el.style.display = '';
}
function disable (el) {
	el.disabled = true;
}
function enable (el) {
	el.disabled = false;
}
function newElement (tag) {
	var el = document.createElement(tag);
	for (var i = 1; i < arguments.length; i++) {
		el.classList.add(arguments[i]);
	}
	return el;
}
function getImageUrlByPid (pid) {
	return imageManager.getUrlByPid(pid);
}


Localize.init();
Localize.DOM('DeckEditor');
window.searcher = new Searcher();
window.imageManager = new ImageManager('../');
window.detail = new CardDetail(imageManager);

// ====== 搜索开始 ======
var results = [];
var RESULTS_LENGTH = 20;
var _shown = 0;
$('search-input').onchange = search;
$('search-input').onkeyup = search;
function search () {
	var q = $('search-input').value;
	results = searcher.search(q);
	showResults();
}
function showResults () {
	_shown = 0;
	$('search-list').innerHTML = '';
	showMore();
}
$('search-show-more').onclick = showMore;
function showMore () {
	for (var i = 0; i < RESULTS_LENGTH; i++) {
		var idx = _shown;
		if (idx >= results.length) break;
		var info = results[idx];
		var li = newElement('li');
		var img = new Image();
		img.src = getImageUrlByPid(info.pid);
		img.alt = Localize.cardName(info);
		img.title = Localize.cardName(info);
		img.onmousemove = showDetail.bind(null,info);
		img.onclick = addCardByInfo.bind(null,info,false);
		li.appendChild(img);
		$('search-list').appendChild(li);
		_shown++;
	}

	if (_shown < results.length) {
		show($('search-show-more'));
	} else {
		hide($('search-show-more'));
	}
}
function showDetail (info) {
	detail.show(info.pid);
}
// ====== 搜索结束 ======



// ====== 组卡开始 ======
var WIDTH = 62;
var HEIGHT = 87;
var mainData = {
	deck: 'main',
	limit: 50,
	deckObjs: [],
	zone: $('main-deck-zone')
};
var lrigData = {
	deck: 'lrig',
	limit: 20,
	deckObjs: [],
	zone: $('lrig-deck-zone')
};
var deckManager = new DeckManager();
var deckNames = [];
var deckName = '';
var deckIndex = -1;
var whiteHope = {
	mainDeck: [
		112,113,114,115,116,117,118,119,120,121,
		112,113,114,115,116,117,118,119,120,121,
		112,113,114,115,116,117,118,119,120,121,
		112,113,114,115,116,117,118,119,120,121
	],
	lrigDeck: [104,105,106,107,108,109,110,111]
};
updateDeckList();
selectDeck(0);
function updateDeckList () {
	$('select-decks').innerHTML = '';
	deckNames = deckManager.getDeckNames();
	if (!deckNames.length) {
		createDeck('WHITE_HOPE',whiteHope);
		return;
	}
	deckNames.forEach(function (name) {
		var eOption = newElement('option');
		eOption.textContent = name;
		$('select-decks').appendChild(eOption);
	},this);
}
function loadDeck (name) {
	var deck = deckManager.loadDeck(name);
	removeAllCards(mainData);
	deck.mainDeck.forEach(function (pid) {
		var info = CardInfo[pid];
		addCardByInfo(info,true);
	});
	removeAllCards(lrigData);
	deck.lrigDeck.forEach(function (pid) {
		var info = CardInfo[pid];
		addCardByInfo(info,true);
	});
	updateDeck(mainData);
	updateDeck(lrigData);
}
function saveDeck (name) {
	deckManager.saveDeck(name,getCurrentDeck());
}
var emptyDeck = {
	mainDeck: [],
	lrigDeck: []
};
$('button-new-deck').onclick = function (event) {
	if (!$('input-new-deck-name').value) {
		window.alert(Localize.editor('PLEASE_INPUT_A_DECK_NAME'));
		$('input-new-deck-name').focus();
		return;
	}
	createDeck($('input-new-deck-name').value,emptyDeck);
	$('input-new-deck-name').value = '';
};
$('button-copy-deck').onclick = function (event) {
	if (!$('input-new-deck-name').value) {
		window.alert(Localize.editor('PLEASE_INPUT_A_DECK_NAME'));
		$('input-new-deck-name').focus();
		return;
	}
	createDeck($('input-new-deck-name').value);
	$('input-new-deck-name').value = '';
};
function createDeck (name,deck) {
	if (!name) return false;
	var idx = deckNames.indexOf(name);
	if (idx >= 0) {
		selectDeck(idx);
		return;
	}
	deckManager.createDeck(name,deck || getCurrentDeck());
	updateDeckList();
	idx = deckNames.indexOf(name);
	selectDeck(idx);
}
$('button-delete-deck').onclick = function (event) {
	if (window.confirm(Localize.editor('CONFIRM_DELETE_DECK',deckName))) {
		deleteDeck(deckName);
	}
};
function deleteDeck (name) {
	var idx = deckIndex;
	deckManager.deleteDeck(name);
	updateDeckList();
	if (idx >= deckNames.length) {
		idx = deckNames.length-1;
	}
	selectDeck(idx);
}
$('select-decks').onchange = function (event) {
	selectDeck($('select-decks').selectedIndex);
};
$('button-rename').onclick = function (event) {
	var newName = window.prompt(Localize.editor('DECK_NAME'),deckName);
	if (!newName || newName === deckName) return;
	if (inArr(newName,deckNames)) {
		window.alert(Localize.editor('DECK_NAME_ALREADY_EXISTS',newName));
		return;
	}
	renameDeck(newName);
}
function renameDeck (newName) {
	var oldName = deckName;
	createDeck(newName);
	deleteDeck(oldName);
}
function selectDeck (idx) {
	deckIndex = idx;
	deckName = deckNames[idx];
	loadDeck(deckName);
	$('select-decks').selectedIndex = idx;
}
function getCurrentDeck () {
	var deck = {};
	deck.mainDeck = mainData.deckObjs.map(function (deckObj) {
		return deckObj.info.pid;
	});
	deck.lrigDeck = lrigData.deckObjs.map(function (deckObj) {
		return deckObj.info.pid;
	});
	return deck;
}
function dataToPids (data) {
	return data.deckObjs.map(function (obj) {
		return obj.info.pid;
	});
}
function addCardByInfo (info,dontUpdateOrSave) {
	var data;
	if (info.cardType==='LRIG' || info.cardType==='ARTS' || info.cardType==='RESONA') {
		data = lrigData;
	} else {
		data = mainData;
	}
	if (data.deckObjs.length >= data.limit) {
		return;
	}
	data.deckObjs.push({
		idx: data.deckObjs.length,
		info: info,
		img: null
	});
	if (!dontUpdateOrSave) {
		updateDeck(data);
		saveDeck(deckName);
	}
}
function removeCardByIndex (data,idx,dontUpdateOrSave) {
	data.zone.removeChild(data.deckObjs[idx].img);
	data.deckObjs.splice(idx,1);
	updateDeck(data);
	if (!dontUpdateOrSave) saveDeck(deckName);
}
function removeAllCards (data) {
	data.zone.innerHTML = '';
	data.deckObjs.length = 0;
}
function updateDeck (data) {
	defaultSort(data);
	var pids = dataToPids(data);
	var valid,elTitle;
	if (data.deck === 'main') {
		valid = deckManager.checkMainDeck(pids);
		elTitle = $('main-deck-title');
		$('main-deck-burst-count').textContent = deckManager.burstCount(pids);
	} else {
		valid = deckManager.checkLrigDeck(pids);
		elTitle = $('lrig-deck-title');
	}
	if (valid) {
		elTitle.classList.remove('invalid');
	} else {
		elTitle.classList.add('invalid');
	}
	elTitle = $('main-deck-mayus-room');
	valid = deckManager.checkMayusRoom(dataToPids(mainData).concat(dataToPids(lrigData)));
	if (valid) {
		elTitle.classList.remove('invalid');
	} else {
		elTitle.classList.add('invalid');
	}
	data.deckObjs.forEach(function (obj,idx) {
		var info = obj.info;
		var img = obj.img;
		if (!img) {
			img = new Image();
			img.src = getImageUrlByPid(info.pid);
			img.alt = Localize.cardName(info);
			img.onmousemove = showDetail.bind(null,info);

			obj.img = img;

			data.zone.appendChild(img);
		}
		img.onclick = removeCardByIndex.bind(null,data,idx,false);
		img.style.left = ((idx%10)*WIDTH) + 'px';
		img.style.top = (Math.floor(idx/10)*HEIGHT) + 'px';
	},this);
}
function defaultSort (data) {
	data.deckObjs.sort(function (aObj,bObj) {
		var a = aObj.info;
		var b = bObj.info;
		var aIdx = aObj.idx;
		var bIdx = bObj.idx;
		if (a.cardType === 'LRIG') {
			if (b.cardType !== 'LRIG') return -1;
			if (b.level !== a.level) {
				return a.level - b.level;
			}
		}
		if (a.cardType === 'ARTS') {
			if (b.cardType !== 'ARTS') return 1;
		}
		if (a.cardType === 'RESONA') {
			if (b.cardType === 'LRIG') return 1;
			if (b.cardType === 'ARTS') return -1;
			if (b.level !== a.level) {
				return a.level - b.level;
			}
		}
		if (a.cardType === 'SIGNI') {
			if (b.cardType !== 'SIGNI') return -1;
			if (a.level !== b.level) {
				return b.level - a.level;
			}
			if (a.power !== b.power) {
				return a.power - b.power;
			}
		}
		if (a.cardType === 'SPELL') {
			if (b.cardType !== 'SPELL') return 1;
		}
		if (a.cid !== b.cid) {
			return a.cid - b.cid
		}
		return aIdx - bIdx;
	});
	data.deckObjs.forEach(function (obj,idx) {
		obj.idx = idx;
	});
}



// ====== 导入导出开始 ======
$('button-import-export').onclick = function (event) {
	show($('div-import-warp'));
	$('textarea-import-export').value = '';
};
$('button-import-export-cancel').onclick = function (event) {
	hideImpotExport();
};
function hideImpotExport () {
	hide($('div-import-warp'));
}
$('button-text').onclick = function (event) {
	var text = deckToText(getCurrentDeck());
	// var doc = window.open().document;
	// doc.title = deckName;
	// doc.body.innerText = text;
	$('textarea-import-export').value = text;
	$('textarea-import-export').select();
}
function deckToText (deck) {
	var text = '';
	var decks = [
		deck.lrigDeck,
		deck.mainDeck.filter(function (pid) {
			var info = CardInfo[pid];
			return !(info.burstEffectTexts && info.burstEffectTexts.length);
		}),
		deck.mainDeck.filter(function (pid) {
			var info = CardInfo[pid];
			return info.burstEffectTexts && info.burstEffectTexts.length;
		})
	];
	decks.forEach(function (deck,idx,arr) {
		var lastName = '';
		var count = 0;
		var decks = [];
		deck.forEach(function (pid,idx,arr) {
			var info = CardInfo[pid];
			var name = Localize.cardName(info);
			if ((name !== lastName) && (idx !== 0)) {
				text += count + ' ' + lastName + '\n';
				lastName = name;
				count = 1;
			} else {
				lastName = name;
				count++;
			}
			if (idx === arr.length-1) {
				text += count + ' ' + lastName + '\n';
			}
		},this);
		if (idx !== arr.length-1) {
			text += '——————————\n';
		}
	});
	return text;
}
$('button-export').onclick = function (event) {
	var filename = deckName + '.webxoss';
	var json = deckToJson(getCurrentDeck());
	download(filename,json);
};
$('button-export-code').onclick = function (event) {
	var json = deckToJson(getCurrentDeck());
	$('textarea-import-export').value = json;
	$('textarea-import-export').select();
};
var download = (function () {
	var a = newElement('a');
	a.target = '_blank';
	a.style.position = 'fixed';
	a.style.width = '0';
	a.style.height = '0';
	a.style.overflow = 'hidden';
	a.style.top = '0';
	a.style.left = '0';
	a.style.zIndex = '-1024';
	a.style.opacity = '0';
	document.body.appendChild(a);

	return function download (name,text) {
		a.href = 'data:application/octet-stream,' + encodeURI(text);
		a.download = name;
		a.click();
	}
})();
function deckToJson (deck) {
	var fileObj = {
		format: 'WEBXOSS Deck',
		version: '1',
		content: deck
	};
	return JSON.stringify(fileObj);
}
$('input-file').onchange = function (event) {
	var file = $('input-file').files[0];
	$('input-file').value = null;
	if (!file) return;
	var name = file.name.replace(/\.webxoss$/,'');
	if (inArr(name,deckNames)) {
		window.alert(Localize.editor('DECK_NAME_ALREADY_EXISTS',name));
		return;
	}
	parseFile(file,function (deck) {
		$('input-file').value = null;
		if (!deck) {
			window.alert(Localize.editor('FAILED_TO_PARSE_FILE'));
			return;
		}
		createDeck(name,deck);
		hideImpotExport();
	});
};
$('button-import-code').onclick = function (event) {
	var json = $('textarea-import-export').value;
	var deck = parseCode(json);
	if (!deck) {
		window.alert(Localize.editor('FAILED_TO_PARSE_CODE'));
	} else {
		var name = window.prompt(Localize.editor('DECK_NAME'));
		if (!name) return;
		if (inArr(name,deckNames)) {
			window.alert(Localize.editor('DECK_NAME_ALREADY_EXISTS',name));
			return;
		}
		createDeck(name,deck);
		hideImpotExport();
	}
};
function parseFile (file,callback) {
	if (!FileReader || file.size > 1024) {
		callback(null);
		return;
	}
	var reader = new FileReader();
	reader.onload = function (event) {
		callback(parseCode(reader.result));
	};
	reader.readAsText(file);
}
function parseCode (json) {
	try {
		var obj = JSON.parse(json);
		var legal =
			(obj.format === 'WEBXOSS Deck') &&
			(+obj.version === 1) &&
			(obj.content.mainDeck.length <= 50) &&
			(obj.content.lrigDeck.length <= 20);
		if (legal) {
			return obj.content;
		} else {
			return null;
		}
	} catch (e) {
		return null;
	}
}
// ====== 导入导出结束 ======

$('link-back-to-webxoss').onclick = function (event) {
	if (window.opener && !window.opener.closed) {
		event.preventDefault();
		window.close();
		return false;
	}
}




search();




// });