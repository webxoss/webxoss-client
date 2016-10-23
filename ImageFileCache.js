'use strict';

window.ImageFileCache = (function () {

function checkIndexedDBSupport (callback) {
	var db = null;
	function done(supportIndexedDB,supportBlob) {
		if (db) db.close();
		callback(!!supportIndexedDB,!!supportBlob);
	}
	if (!window.indexedDB) return done();
	if (!window.IDBKeyRange) return done();
	if (!window.IDBOpenDBRequest) return done();
	// shit iOS
	// var iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
	// if (iOS) return done();
	// ios 8
	var open = indexedDB.open('test indexedDB support',1);
	if (!('onupgradeneeded' in open)) return done();
	open.onupgradeneeded = function (event) {
		db = this.result;
		db.createObjectStore('one');
		db.createObjectStore('two',{keyPath: 'key'});
	};
	open.onerror = function (event) {
		done();
	};
	open.onsuccess = function (event) {
		db = this.result;
		db.onerror = function (event) {
			done();
		};
		var transaction;
		try {
			transaction = db.transaction(['one','two'],'readwrite');
		} catch (e) {
			return done();
		}
		var req = transaction.objectStore('two').put({key: 1});
		req.onsuccess = function (event) {
			var xhr = new XMLHttpRequest();
			xhr.responseType = 'blob';
			if (!window.Blob || !window.URL || (xhr.responseType !== 'blob')) {
				db.close();
				return done(true,false);
			} else {
				var blob = new Blob(['text'], {type: 'text/plain'});
				try {
					req = transaction.objectStore('one').put(blob,'blob');
					transaction.onabort = function (event) {
						event.stopPropagation();
						done(true,false);
					};
					transaction.onerror = function (event) {
						event.stopPropagation();
						done(true,false);
					};
					transaction.oncomplete = function (event) {
						return done(true,true);
					};
				} catch (e) {
					return done(true,false);
				}
			}
		};
	};
}

function get (url,type,callback,err) {
	var xhr = new XMLHttpRequest();
	xhr.responseType = type;
	xhr.onload = function (e) {
		if (xhr.status !== 200) {
			err(xhr,e);
		} else {
			callback(xhr,e);
		}
	};
	xhr.onerror = function (e) {
		err(xhr,e);
	};
	xhr.open('GET',url,true);
	xhr.send();
}

function cache (pid,blob) {
	if (!ImageFileCache.supportBlob) return;
	if (pid in urlMap) return;
	var url = window.URL.createObjectURL(blob);
	urlMap[pid] = url;
	var open = indexedDB.open('card images',1);
	open.onupgradeneeded = function (event) {
		this.result.createObjectStore('images');
	};
	open.onsuccess = function (event) {
		var db = this.result;
		db.transaction(['images'],'readwrite').objectStore('images').add(blob,pid);
	};
}

var urlMap = {};
var fetchingMap = {};
var ImageFileCache = {
	supportIndexedDB: false,
	supportBlob: false
};
var supportObjectURL = false; // 在360浏览器上,ObjectURL可能不能用.

// 检查支持并读取缓存
checkIndexedDBSupport(function (supportIndexedDB,supportBlob) {
	ImageFileCache.supportIndexedDB = supportIndexedDB;
	ImageFileCache.supportBlob = supportBlob;
	if (!supportBlob) return;
	var open = indexedDB.open('card images',1);
	open.onupgradeneeded = function (event) {
		this.result.createObjectStore('images');
	};
	open.onsuccess = function (event) {
		var db = this.result;
		var checked = false;
		db.transaction(['images']).objectStore('images').openCursor().onsuccess = function (event) {
			var cursor = this.result;
			if (!cursor) return;
			var pid = cursor.key;
			var blob = cursor.value;
			var url = window.URL.createObjectURL(blob);
			if (!checked) {
				checked = true;
				var img = new Image();
				img.onload = function () {
					supportObjectURL = true;
					console.log('supportObjectURL');
				};
				img.src = url;
			}
			urlMap[pid] = url;
			cursor.continue();
		};
	};
});

ImageFileCache.getUrlByPid = function (pid) {
	if (!supportObjectURL) return '';
	return urlMap[pid] || '';
};

ImageFileCache.fetchAndCache = function (pid,url) {
	if (!ImageFileCache.supportBlob) return;
	if (fetchingMap[pid]) return;
	fetchingMap[pid] = true;
	get(url,'blob',function (xhr,e) {
		var blob = xhr.response;
		cache(pid,blob);
	},function (xhr,e) {
		console.log('Failed to load "' + url + '"');
		fetchingMap[pid] = false;
	});
};

return ImageFileCache;
})();