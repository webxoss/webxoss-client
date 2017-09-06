'use strict'

// fix issue #44 - wrong touch area in mobile chrome

var mobileDevice = /Android|iPhone|/i.test(navigator.userAgent)
var chromeVersion = +(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./) || [])[2];

if (mobileDevice && chromeVersion && chromeVersion < 61) {
  try {
    Object.defineProperty(window, 'pageXOffset', {
      get: function() {
        return -document.documentElement.getBoundingClientRect().left;
      },
    });
    Object.defineProperty(window, 'pageYOffset', {
      get: function() {
        return -document.documentElement.getBoundingClientRect().top;
      },
    });
  } catch (e) {
    console.error(e);
  }
}
