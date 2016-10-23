function Style (defaultStyle) {
	this.transitingStyle = {};
	for (var prop in defaultStyle) {
		this.transitingStyle[prop] = new TransitingValue(defaultStyle[prop]);
	}
	this.changed = true;
	this.checkSkip = null;
}

Style.linear = function (t) {
	return t;
};

Style.prototype.transit = function (prop,value,duration,timing) {
	if (this.checkSkip && this.checkSkip()) duration = 0;
	this.transitingStyle[prop].transitTo(value,duration,timing);
	this.changed = true;
};

Style.prototype.set = function (prop,value) {
	this.transit(prop,value);
};

Style.prototype.getComputedStyle = function () {
	var computedStyle = {};
	for (var prop in this.transitingStyle) {
		computedStyle[prop] = this.transitingStyle[prop].getValue();
		if (!this.transitingStyle[prop].isDone()) this.changed = true;
	}
	return computedStyle;
};

Style.prototype.isChanged = function () {
	var changed = this.changed;
	this.changed = false;
	return changed;
};








function TransitingValue (endValue) {
	this.changeTime = 0;
	this.startValue = endValue;
	this.endValue = endValue;
	this.duration = 0;
	this.timing = TransitingValue.cubic;

	this.done = false;
}

TransitingValue.linear = function (t) {
	return t;
};

// TransitingValue.cos = function (t) {
// 	return (1-Math.cos(t*Math.PI))/2;
// };

TransitingValue.cubic = function (t) {
	var s = 1-t;
	return 1-s*s*s;
};

TransitingValue.prototype.now = function () {
	return Date.now();
};

TransitingValue.prototype.transitTo = function (value,duration,timing) {
	this.startValue = this.getValue();
	this.endValue = value;
	this.duration = duration || 0;
	this.timing = timing || TransitingValue.cubic;
	this.changeTime = this.now();
	this.done = false;
};

TransitingValue.prototype.getValue = function () {
	var currentTime = this.now();
	var startTime = this.changeTime;
	var endTime = startTime + this.duration*1000;

	if (currentTime < startTime) {
		return this.startValue;
	}
	if (currentTime >= endTime || this.startValue === this.endValue) {
		this.done = true;
		return this.endValue;
	}
	if (!isNum(this.endValue)) {
		return this.startValue;
	}

	var factor = this.timing((currentTime-startTime)/(endTime-startTime));
	return this.startValue + factor*(this.endValue-this.startValue);
};

TransitingValue.prototype.isDone = function () {
	return this.done;
};