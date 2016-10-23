'use strict';

window.CardDetail = (function () {

function $ (id) {
	return document.getElementById(id);
}
function newElement (tag) {
	var el = document.createElement(tag);
	for (var i = 1; i < arguments.length; i++) {
		el.classList.add(arguments[i]);
	}
	return el;
}
function KeyValue (prop,keyHidden) {
	this.prop = prop;
	this.keyHidden = keyHidden;
	this.value = '';

	this.eKey = newElement('td','key',prop);
	this.eKey.textContent = Localize.propToKey(prop);

	this.eValue = newElement('td','value',prop);
}


function CardDetail (imageManager) {
	this.imageManager = imageManager;

	this.eDetail    = $('detail');
	this.eImage     = $('detail-card-image');
	this.eWxid      = $('detail-card-wxid');
	this.eName      = $('detail-card-name');
	this.eLimiting  = $('detail-card-limiting');
	this.eTable     = $('detail-table');
	this.eTableBody = $('detail-table-body');

	this.kvCardType = new KeyValue('cardType');
	this.kvColor    = new KeyValue('color');
	this.kvLevel    = new KeyValue('level');
	this.kvClasses  = new KeyValue('classes');
	this.kvLimit    = new KeyValue('limit');
	this.kvPower    = new KeyValue('power');
	this.kvLimting  = new KeyValue('limting');
	this.kvGuard    = new KeyValue('guard');
	this.kvCost     = new KeyValue('cost');
	this.kvTimmings = new KeyValue('timmings');
	this.kvEffects  = new KeyValue('effects',true);
	this.kvBurst    = new KeyValue('burst',true);

	this._pid = 0;
}

CardDetail.prototype.show = function (pid) {
	if (!pid || this._pid === pid) return;
	this._pid = pid;
	this.eTable.setAttribute('lang',Localize.getLanguage());
	this.eTableBody.innerHTML = '';
	var info = CardInfo[pid];
	this.eWxid.textContent = info.wxid;
	this.eName.innerHTML = '';
	var link = newElement('a');
	link.target = '_blank';
	link.href = 'http://www.takaratomy.co.jp/products/wixoss/card/card_list.php?card=card_detail&card_no=' + info.wxid;
	link.textContent = Localize.cardName(info);
	this.eName.appendChild(link);
	this.eLimiting.textContent = Localize.limiting(info);
	this.eImage.src        = this.imageManager.getUrlByPid(pid);
	this.kvColor.value     = info.color.split('/').map(Localize.color).join('/');
	this.kvCardType.value  = Localize.cardType(info);
	this.kvEffects.value   = Localize.effectTexts(info);
	if (inArr(info.cardType,['LRIG','SIGNI','RESONA'])) {
		this.kvClasses.value = Localize.classes(info);
		this.kvLevel.value   = info.level;
	}
	if (inArr(info.cardType,['LRIG','SPELL','ARTS'])) {
		this.kvCost.value = Localize.cost(info);
	}
	if (inArr(info.cardType,['SIGNI','SPELL'])) {
		this.kvBurst.value = Localize.burstEffectTexts(info);
	}
	if (info.cardType === 'LRIG') {
		if (info.limit >= 1024) {
			this.kvLimit.value = '∞';
		} else {
			this.kvLimit.value = info.limit;
		}
		this.addKeyValue(
			[this.kvCardType,this.kvColor],
			[this.kvLevel,this.kvClasses],
			[this.kvLimit,this.kvCost],
			[this.kvEffects]
		);
	} else if (info.cardType === 'SIGNI') {
		this.kvPower.value = info.power;
		this.kvGuard.value = Localize.guard(info);
		this.addKeyValue(
			[this.kvCardType,this.kvColor],
			[this.kvLevel,this.kvClasses],
			[this.kvPower,this.kvGuard],
			[this.kvEffects],
			[this.kvBurst]
		);
	} else if (info.cardType === 'RESONA') {
		this.kvPower.value = info.power;
		this.kvGuard.value = Localize.guard(info);
		this.addKeyValue(
			[this.kvCardType,this.kvColor],
			[this.kvLevel,this.kvClasses],
			[this.kvPower,this.kvGuard],
			[this.kvEffects]
		);
	} else if (info.cardType === 'SPELL') {
		this.addKeyValue(
			[this.kvCardType,this.kvColor],
			[this.kvCost],
			[this.kvEffects],
			[this.kvBurst]
		);
	} else if (info.cardType === 'ARTS') {
		this.kvTimmings.value = Localize.timmings(info);
		this.addKeyValue(
			[this.kvCardType,this.kvColor],
			[this.kvCost],
			[this.kvTimmings],
			[this.kvEffects]
		);
	}
};

CardDetail.prototype.addKeyValue = function () {
	for (var i = 0; i < arguments.length; i++) {
		var rowArray = arguments[i];
		var eRow = newElement('tr');
		rowArray.forEach(function (kv) {
			kv.eValue.textContent = kv.value;
			kv.eValue.removeAttribute('colspan');
			if (!kv.keyHidden) eRow.appendChild(kv.eKey);
			eRow.appendChild(kv.eValue);
		},this);
		if (rowArray.length === 1) {
			var kv = rowArray[0];
			var colspan = kv.keyHidden? 4 : 3;
			kv.eValue.setAttribute('colspan',colspan);
		}
		this.eTableBody.appendChild(eRow);
	}
};

return CardDetail;
})();