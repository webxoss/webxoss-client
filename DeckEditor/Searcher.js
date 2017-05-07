'use strict';
function Searcher () {
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
		NameRule
	];
}
Searcher.prototype.search = function (str) {
	// if (!str) return [];
	var words = str.toLowerCase().split(/\s+/);
	var filters = this.rules.map(function (rule) {
		return rule.parse(words);
	},this);
	var infos = Object.keys(CardInfo).map(function (pid) {
		return CardInfo[pid];
	});
	return filters.reduce(function (results,filter) {
		return results.filter(filter);
	},infos);
};