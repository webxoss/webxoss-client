'use strict';
function Searcher () {
	this.infos = [];
	for (var pid in CardInfo) {
		this.infos.push(CardInfo[pid]);
	}
	this.rules = [
		ColorRule,
		CrossRule,
		TypeRule,
		RarityRule,
		SkillRule,
		NoBurstRule,
		// LifeBurstRule,
		TimmingRule,
		LimitingRule,
		ClassRule,
		PowerRule,
		LevelRule,
		LimitRule,
		NumberRule,
		IllustRule,
		WxidRule,
		WxbidRule,
		NameRule
	];
}
Searcher.prototype.search = function (str) {
	// if (!str) return [];
	var words = str.toLowerCase().split(/\s+/);
	var filters = this.rules.map(function (rule) {
		return rule.parse(words);
	},this);
	return filters.reduce(function (results,filter) {
		return results.filter(filter);
	},this.infos);
};