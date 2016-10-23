'use strict';
var concat = Array.prototype.concat.bind([]);
var toArr = function (obj) {
	if (!obj) return [];
	if (typeof obj === 'string') return [];
	return Array.prototype.slice.call(obj,0);
};
var isArr = Array.isArray;
var inArr = function (item,arr) {
	return (toArr(arr).indexOf(item) != -1);
};
var removeFromArr = function (item,arr) {
	var idx = arr.indexOf(item);
	if (idx < 0) {
		return false;
	} else {
		arr.splice(idx,1);
		return true;
	}
}
var isStr = function (v) {
	return (typeof v === 'string');
};
var isObj = function (v) {
	return v && (typeof v === 'object') && !isArr(v);
};
var isNum = function (v) {
	return (typeof v === 'number');
};
var isFunc = function (v) {
	return (typeof v === 'function');
};
var pEach = function (arr,func,thisp) {
	return arr.reduce(function (chain,item) {
		return chain.then(function () {
			return func(item);
		});
	},Promise.resolve());
}

function callConstructor(constructor) {
	var factoryFunction = constructor.bind.apply(constructor,arguments);
	return new factoryFunction();
}

function applyToConstructor(constructor,argArray) {
	// var args = [null].concat(argArray);
	var args = concat(null,toArr(argArray));
	var factoryFunction = constructor.bind.apply(constructor,args);
	return new factoryFunction();
}

function nextTick (callback) {
	setTimeout(callback,0);
}