'use strict';
function Searcher () {
	this.rules = [
		ColorRule,
		CrossRule,
		TypeRule,
		RarityRule,
		RiseRule,
		TrapRule,
		AcceRule,
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
		NameRule
	];
}
Searcher.prototype.search = function (str) {
	// if (!str) return [];
	var words = str.toLowerCase().split(/\s+/);
	var filters = this.rules.map(function (rule) {
		return rule.parse(words);
	},this);
	var infos = [];
	for (var pid in CardInfo) {
		infos.push(CardInfo[pid]);
	}
	return filters.reduce(function (results,filter) {
		return results.filter(filter);
	},infos);
};