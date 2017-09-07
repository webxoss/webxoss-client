'use strict'

// fix issue webxoss/webxoss-core#44 - wrong touch area in mobile chrome
// issue discussion in Easel.js - https://github.com/CreateJS/EaselJS/issues/598#issuecomment-176299538
// learn more about this bug - https://bugs.chromium.org/p/chromium/issues/detail?id=489206
// fix method reference - https://stackoverflow.com/questions/41841704/

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
