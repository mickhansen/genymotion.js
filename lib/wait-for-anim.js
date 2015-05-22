var exec = require('./exec-as-promised')
  , Promise = require('bluebird')
  , max = 5;

module.exports = function(ip, errors) {
  if (errors === undefined) {
    errors = 0;
  }

  return Promise.delay(500).then(function () {
    return exec('adb shell getprop init.svc.bootanim', {
      env: {
        ANDROID_SERIAL: ip + ':5555',
        PATH: process.env.PATH
      }
    }).then(function (value) {
      if (value.trim() === 'stopped') return;
      return module.exports(ip);
    }).catch(function (err) {
      if (errors === max) throw err;
      return module.exports(ip, ++errors);
    });
  });
};