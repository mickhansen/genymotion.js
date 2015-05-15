var exec = require('./exec-as-promised')
  , Promise = require('bluebird');

module.exports = function(ip) {
  return Promise.delay(500).then(function () {
    return exec('adb shell getprop init.svc.bootanim', {
      env: {
        ANDROID_SERIAL: ip + ':5555',
        PATH: process.env.PATH
      }
    }).then(function (value) {
      if (value.trim() === 'stopped') return;
      return module.exports(ip);
    });
  });
};