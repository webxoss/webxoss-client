'use strict';

function TextualRule (prop,map,exact) {
	this.prop    = prop;
	this.map     = map;
	this.exact   = exact;
}
TextualRule.prototype.parse = function (words) {
	var keywords = [];
	for (var i = 0; i < words.length; i++) {
		var word = words[i];
		var keyword = this.parseWord(word);
		if (!keyword) continue;
		keywords.push(keyword);
		words.splice(i,1);
		i--;
	}
	var prop = this.prop;
	var exact = this.exact;
	return function filter (info) {
		if (!keywords.length) return true;
		return keywords.some(function (keyword) {
			var value = info[prop].toLowerCase();
			if (exact) {
				return value === keyword;
			} else {
				return value.indexOf(keyword) !== -1;
			}
		});
	};
};
TextualRule.prototype.parseWord = function (word) {
	for (var keyword in this.map) {
		var matchWords = this.map[keyword];
		if (matchWords.some(function (matchWord) {
			return word === Localize.traditionalize(matchWord);
		},this)) {
			return keyword;
		}
	}
	return null;
};
///////////////////////////////////////////////////////////////
//
//  枚举型规则,包括:
//    ColorRule,TypeRule,RarityRule
//  匹配例子:
//    "白 LRIG SR 红"
//    "白色 精灵 lr red"
//
///////////////////////////////////////////////////////////////
var ColorRule = new TextualRule('color',{
	'colorless': ['colorless','无','无色','無','incolore','무','무색'],
	'white': ['white','白','白色','白','белая','bianco','백','백색'],
	'black': ['black','黑','黑色','黒','чёрная','nero','흑','흑색'],
	'red': ['red','红','红色','赤','красная','rosso','적','적색'],
	'blue': ['blue','蓝','蓝色','青','синяя','blu','청','청색'],
	'green': ['green','绿','绿色','緑','зелёная','verde','녹','녹색']
},false);
var TypeRule = new TextualRule('cardType',{
	'lrig': ['l','lrig','分身','ルリグ','идел','루리그'],
	'signi': ['s','signi','精灵','シグニ','запись','시그니'],
	'spell': ['spell','魔法','スペル','магия','스펠'],
	'arts': ['arts','必杀','技艺','アーツ','умение','아츠'],
	'resona': ['resona','共鸣','レゾナ','отголосок','레조나']
},true);
var RarityRule = new TextualRule('rarity',{
	'c': ['c'],
	'r': ['r'],
	'lc': ['lc'],
	'sr': ['sr'],
	'lr': ['lr'],
	'st': ['st'],
	'pr': ['pr'],
	'sp': ['sp']
},true);

///////////////////////////////////////////////////////////////
//
//  效果(能力)型规则:
//    SkillRule
//  匹配例子:
//    "常","常时","常时效果","常时能力"
//    "※","爆发","爆发效果","迸发","迸发效果"
//
///////////////////////////////////////////////////////////////
var SkillRule = {};
SkillRule.parse = function (words) {
	var effectProps = [];
	for (var i = 0; i < words.length; i++) {
		var word = words[i];
		var effectProp = this.parseWord(word);
		if (!effectProp) continue;
		effectProps.push(effectProp);
		words.splice(i,1);
		i--;
	}
	return function filter (info) {
		if (!effectProps.length) return true;
		info = CardInfo[info.cid];
		return effectProps.some(function (effectProp) {
			var effectTexts = info[effectProp];
			return effectTexts && effectTexts.length;
		});
	};
};
SkillRule.parseWord = TextualRule.prototype.parseWord;
SkillRule.map = {
	'constEffectTexts': [
		'【常】','常','常时','常时效果','常時能力',
		'【常】','常','常時','常時效果','常時能力',
		'[constant]','const','constant',
		'[постоянно]','постоянно',
		'상시','[상시]'
	],
	'startUpEffectTexts': [
		'【出】','出','出场','出场效果','出场能力',
		'【出】','出','出現','出現效果','出現能力',
		'[on-play]','[onplay]','on-play','onplay',
		'[при вводе]','при вводе',
		'출현','[출현]'
	],
	'actionEffectTexts': [
		'【起】','起','起动','起动效果','起动能力',
		'【起】','起','起動','起動效果','起動能力',
		'[action]','action',
		'[действие]','действие',
		'기동','[기동]',
	],
	'burstEffectTexts': [
		'【※】','※','爆发','迸发','爆发效果','迸发效果','生命爆发','生命迸发','生命爆发效果','生命迸发效果',
		'ライフバースト','バースト',
		'burst','lifeburst','lb',
		'вспышка','жизненная вспышка',
		'라이프 버스트','라이프버스트','버스트'
	]
};

///////////////////////////////////////////////////////////////
//
//  无迸发规则:
//    NoBurstRule
//  匹配例子:
//    "无爆发","noburst"
//
///////////////////////////////////////////////////////////////
var NoBurstRule = {};
NoBurstRule.parse = function (words) {
	var matched = false;
	for (var i = 0; i < words.length; i++) {
		var word = words[i];
		if (!this.parseWord(word)) continue;
		matched = true;
		words.splice(i,1);
		i--;
	}
	return function filter (info) {
		if (!matched) return true;
		info = CardInfo[info.cid];
		return (info.cardType === 'SIGNI' || info.cardType === 'SPELL') &&
		       (!info.burstEffectTexts || !info.burstEffectTexts.length);
	};
};
NoBurstRule.parseWord = TextualRule.prototype.parseWord;
NoBurstRule.map = {
	'burstEffectTexts': [
		'无爆发','无迸发','无爆发效果','无迸发效果','无生命爆发','无生命迸发','无生命爆发效果','无生命迸发效果',
		'noburst',
		'ライフバースト-','バースト-',
		'迸发-','爆发-',
		'burst-','lifeburst-','lb-',
		'вспышка-','жизненная вспышка-',
		'버스트-','라이프버스트-'
	]
};

///////////////////////////////////////////////////////////////
//
//  CROSS规则:
//    CrossRule
//  匹配例子:
//    "cross","交错","クロス"等
//
///////////////////////////////////////////////////////////////
var CrossRule = {};
CrossRule.parse = function (words) {
	var matched = false;
	for (var i = 0; i < words.length; i++) {
		var word = words[i];
		if (!this.parseWord(word)) continue;
		matched = true;
		words.splice(i,1);
		i--;
	}
	return function filter (info) {
		if (!matched) return true;
		info = CardInfo[info.cid];
		return (info.cardType === 'SIGNI') &&
		       (info.crossLeft || info.crossRight);
	};
};
CrossRule.parseWord = TextualRule.prototype.parseWord;
CrossRule.map = {
	'cross': [
		'cross','交错','クロス','связь','크로스',
		'[cross]','>cross<','【cross】','【交错】','【クロス】','[связь]','>크로스<'
	]
};

///////////////////////////////////////////////////////////////
//
//  时点规则:
//    TimmingRule
//  匹配例子:
//    "【主要阶段】","主要阶段"
//    "【魔法切入】","魔法切入"
//
///////////////////////////////////////////////////////////////
var TimmingRule = {};
TimmingRule.parse = function (words) {
	var timmings = [];
	for (var i = 0; i < words.length; i++) {
		var word = words[i];
		var timming = this.parseWord(word);
		if (!timming) continue;
		timmings.push(timming);
		words.splice(i,1);
		i--;
	}
	return function filter (info) {
		if (!timmings.length) return true;
		return timmings.some(function (timming) {
			if (!info.timmings) return false;
			return inArr(timming,info.timmings);
		});
	};
};
TimmingRule.parseWord = TextualRule.prototype.parseWord;
TimmingRule.map = {
	'mainPhase': [
		'主要阶段','【主要阶段】','主要',
		'メインフェイズ','【メインフェイズ】',
		'[mainphase]','mainphase','main',
		'[основнаяфаза]','основнаяфаза','основная',
		'메인','메인페이즈','[메인페이즈]'
	],
	'attackPhase': [
		'攻击阶段','【攻击阶段】','攻击',
		'アタックフェイズ','【アタックフェイズ】',
		'[attackphase]','attackphase','attack',
		'[фазаатаки]','фазаатаки','атака',
		'어택','어택페이즈','[어택페이즈]'
	],
	'spellCutIn': [
		'魔法切入','【魔法切入】','切入',
		'スペルカットイン','【スペルカットイン】',
		'[spellcut-in]','[cut-in]','[spellcutin]','[cutin]','spellcutin','cutin','cut',
		'[ответнамагию]','[ответ]','ответнамагию','ответ',
		'컷인','컷인','[스펠컷인]','스펠컷인'
	]
};

///////////////////////////////////////////////////////////////
//
//  限定规则:
//    LimitingRule
//  匹配例子:
//    "小玉"
//    "小玉+"
//
///////////////////////////////////////////////////////////////
var LimitingRule = {};
LimitingRule.parse = function (words) {
	var matchedClasses = [];
	var flagNoLimiting = false;
	for (var i = 0; i < words.length; i++) {
		var word = words[i];
		var classes = [
			'タマ','花代','ユヅキ','ピルルク','エルドラ','ミルルン','緑子',
			'アン','ウリス','イオナ','ウムル','リメンバ','タウィル','サシェ',
			'ミュウ','アイヤイ','アルフォウ','ハナレ'
		];
		for (var j = 0; j < classes.length; j++) {
			var cls = classes[j];
			var matched = false;
			var localizedClass = Localize('class',cls).toLowerCase();
			if (word === localizedClass) {
				matched = true;
			} else if (word === localizedClass+'+') {
				matched = true;
				flagNoLimiting = true;
			}
			if (matched) {
				matchedClasses.push(cls);
				words.splice(i,1);
				i--;
				break;
			}
		}
	}
	return function filter (info) {
		if (!matchedClasses.length) return true;
		if (info.cardType === 'LRIG') {
			return matchedClasses.some(function (cls) {
				if (!info.classes) return false;
				return inArr(cls,info.classes);
			},this);
		}
		if (!info.limiting) return flagNoLimiting;
		return inArr(info.limiting,matchedClasses);
	};
};

///////////////////////////////////////////////////////////////
//
//  类别规则:
//    ClassRule
//  匹配例子:
//    "精武"
//    "武装"
//
///////////////////////////////////////////////////////////////
var ClassRule = {};
ClassRule.parse = function (words) {
	var matchedClasses = [];
	for (var i = 0; i < words.length; i++) {
		var word = words[i];
		var classes = [
			'精像','天使','悪魔','美巧','精武','アーム','ウェポン','遊具',
			'毒牙','精羅','鉱石','宝石','植物','原子','宇宙','精械','電機',
			'古代兵器','迷宮','精生','水獣','空獣','地獣','龍獣','凶蟲','精元'
		];
		for (var j = 0; j < classes.length; j++) {
			var cls = classes[j];
			if (word === Localize('class',cls).toLowerCase().replace(' ','')) {
				matchedClasses.push(cls);
				words.splice(i,1);
				i--;
				break;
			}
		}
	}
	return function filter (info) {
		if (!matchedClasses.length) return true;
		return matchedClasses.some(function (cls) {
			if (!info.classes) return false;
			return inArr(cls,info.classes);
		},this);
	};
};

///////////////////////////////////////////////////////////////
//
//  数值型规则,包括:
//    PowerRule,LevelRule,LimitRule
//  匹配格式:
//    相等: "关键字:=数值"
//    大于: "关键字:>=数值" 或 "关键字:数值+"
//    小于: "关键字:<=数值" 或 "关键字:数值-"
//    范围: "关键字:min~max" 或 "关键字:min-max"
//    (注: 上述的":"和"="可省略.)
//  匹配例子(每行等价):
//    "力量>100","Power>100","Power:100+","Power100+"
//    "等级=4","level=4","level4","lv4","lv.4"
//    "界限>7 界限<9","limit7+ 界限9-","界限:7-9","界限7~9"
//
///////////////////////////////////////////////////////////////
function NumericRule (prop,keywords) {
	this.prop = prop;
	this.keywords = keywords;
}
NumericRule.prototype.parseExpression = function (str) {
	var match;
	// 相等
	match = str.match(/^=*(\d+)$/);
	if (match) {
		var num = parseInt(match[1]);
		return [num,num];
	}
	// 大于
	match = str.match(/^>=*(\d+)\+?$/);
	if (!match) match = str.match(/^(\d+)\+$/);
	if (match) {
		var num = parseInt(match[1]);
		return [num,Infinity];
	}
	// 小于
	match = str.match(/^<=*(\d+)\-?$/);
	if (!match) match = str.match(/^(\d+)\-$/);
	if (match) {
		var num = parseInt(match[1]);
		return [-Infinity,num];
	}
	// 范围
	match = str.match(/^(\d+)[\-\~](\d+)$/);
	if (match) {
		var a = parseInt(match[1]);
		var b = parseInt(match[2]);
		return [a,b];
	}
	return null
};
NumericRule.prototype.parseWord = function (word) {
	for (var i = 0; i < this.keywords.length; i++) {
		var keyword = Localize.traditionalize(this.keywords[i]);
		if (word.indexOf(keyword) === 0) {
			word = word.slice(keyword.length).replace(/^:/,'');
			return this.parseExpression(word);
		}
	}
	return null;
};
NumericRule.prototype.parse = function (words) {
	var ranges = [];
	for (var i = 0; i < words.length; i++) {
		var word = words[i];
		var range = this.parseWord(word);
		if (!range) continue;
		ranges.push(range);
		words.splice(i,1);
		i--;
	}
	var prop = this.prop;
	return function filter (info) {
		if (!ranges.length) return true;
		if ((info.cardType === 'SPELL') || (info.cardType === 'ARTS')) {
			return false;
		}
		return ranges.every(function (range) {
			var value = info[prop];
			var min = range[0];
			var max = range[1];
			return (value >= min) && (value <= max);
		});
	};
};
var PowerRule = new NumericRule('power',['力量','パワー','power','сила','파워']);
var LevelRule = new NumericRule('level',['等级','レベル','level','lv.','lv','уровень','livello','레벨']);
var LimitRule = new NumericRule('limit',['界限','リミット','limite','limit','ограничение','리미트']);

///////////////////////////////////////////////////////////////
//
//  数字规则: NumberRule.
//  匹配说明:
//    力量和等级的关键字可以省略,此时用NumberRule匹配.
//    数字小于10,则匹配为等级,否则匹配为力量.
//  匹配例子:
//    "1000+ 3-"      // 等价于"power>1000 level<3"
//    ">3 2000~3000"  // 等价于"level>3 power:2000~3000"
//
///////////////////////////////////////////////////////////////
var NumberRule = new NumericRule('',['']);
NumberRule.parse = function (words) {
	var ranges = [];
	for (var i = 0; i < words.length; i++) {
		var word = words[i];
		var range = this.parseWord(word);
		if (!range) continue;
		ranges.push(range);
		words.splice(i,1);
		i--;
	}
	return function filter (info) {
		return ranges.every(function (range) {
			if ((info.cardType === 'SPELL') || (info.cardType === 'ARTS')) return false;
			function matchLevel (num) {
				return !isFinite(num) || (num < 10);
			}
			var value = range.every(matchLevel)? info.level : info.power;
			var min = range[0];
			var max = range[1];
			return (value >= min) && (value <= max);
		});
	};
};

///////////////////////////////////////////////////////////////
//
//  画师规则: IllustRule.
//  匹配例子:
//    "画师:pop"
//    "Illust:藤真拓哉"
//
///////////////////////////////////////////////////////////////
var IllustRule = {};
IllustRule.parseWord = function (word) {
	var match = word.match(/illust:?(.+)/);
	if (!match) match = word.match(/画师:?(.+)/);
	if (!match) match = word.match(/畫師:?(.+)/);
	if (!match) return null;
	return match[1];
}
IllustRule.parse = function (words) {
	var illusts = [];
	for (var i = 0; i < words.length; i++) {
		var word = words[i];
		var illust = this.parseWord(word);
		if (!illust) continue;
		illusts.push(illust);
		words.splice(i,1);
		i--;
	}
	return function filter (info) {
		if (!illusts.length) return true;
		return illusts.some(function (illust) {
			var cardIllust = info.illust.toLowerCase();
			return cardIllust.indexOf(illust) !== -1;
		});
	};
};

///////////////////////////////////////////////////////////////
//
//  ID规则: WxidRule.
//  匹配例子:
//    "WD01-001","wd01-001","wD01001"  // 仅匹配"WD01-001"
//    "wx02-01","WX0201"  // 匹配"WX02-010"至"WX02-019"
//    "wd03-","WD03"      // 匹配"WD03"的所有卡
//    "wx12-re01","WX12CB" // 匹配re,CB卡
//
///////////////////////////////////////////////////////////////
var WxidRule = {};
WxidRule.parseWord = function (word) {
	var match = word.match(/^(wx\d{2}|wd\d{2}|pr|sp\d{2})-?(re\d{0,2}|cb\d{0,2}|\d{0,3}[a|b]?)$/);
	if (!match) return null;
	return match[1] + '-' + match[2];
}
WxidRule.parse = function (words) {
	var idLimits = [];
	for (var i = 0; i < words.length; i++) {
		var word = words[i];
		var limit = this.parseWord(word);
		if (!limit) continue;
		idLimits.push(limit);
		words.splice(i,1);
		i--;
	}
	return function filter (info) {
		if (!idLimits.length) return true;
		return idLimits.some(function (limit) {
			return info.wxid.toLowerCase().indexOf(limit) === 0;
		});
	};
};

///////////////////////////////////////////////////////////////
//
//  卡名规则: NameRule.
//  匹配例子:
//    "喷流 知识"       // 卡名同时包含"喷流"和"知识".
//    "喷流|知识"       // 卡名包含"喷流"或"知识".
//    "喷流||知识"      // 卡名包含"喷流"或"知识".
//    "喷流||的||知识"  // 卡名包含"喷流"或"知识"或"的".
//
///////////////////////////////////////////////////////////////
var NameRule = {};
NameRule.dotRegex =
	/[\u00B7\u0387\u05BC\u2022\u2027\u2219\u22C5\u30FB\uFF0E\uFF65⁑:*†]/g;
NameRule.fullWidth =
	'０１２３４５６７８９＝＠＃' +
	'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ' +
	'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ';
NameRule.halfWidth =
	'0123456789=@#' +
	'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
	'abcdefghijklmnopqrstuvwxyz';
NameRule.normalizeString = function (str) {
	var chars = str.replace(this.dotRegex,'').split('');
	chars.forEach(function (char,idx) {
		var i = this.fullWidth.indexOf(char);
		chars[idx] = this.halfWidth[i] || char;
	},this);
	return chars.join('').toLowerCase();
};
NameRule.parse = function (words) {
	var wordSets = [];
	words.forEach(function (word) {
		wordSets.push(word.split(/\|+/));
	},this);
	words.length = 0;
	var that = this;
	return function filter (info) {
		return wordSets.every(function (wordSet) {
			if (!wordSet.length) return true;
			return wordSet.some(function (word) {
				var name = that.normalizeString(Localize.cardName(info));
				var w = that.normalizeString(word);
				return (name.indexOf(w) !== -1);
			},this);
		},this);
	};
};