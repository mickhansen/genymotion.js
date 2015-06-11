var exec = require('./exec-as-promised')
  , Promise = require('bluebird')
  , max = 5;

module.exports = function(ip, options) {
  options = options || {};

  options = {
    errors: options.errors || 0,
    stoppedMax: options.stoppedMax || 10, // How many times should we see stopped without having seen "running",
    stoppedSaw: options.stoppedSaw || 0,
    runningSaw: options.runningSaw || 0
  };

  return Promise.delay(1000).then(function () {
    return exec('adb shell getprop init.svc.bootanim', {
      env: {
        ANDROID_SERIAL: ip + ':5555',
        PATH: process.env.PATH
      }
    }).then(function (value) {
      value = value.trim();
      if (value === 'stopped') {
        options.stoppedSaw++;
        if (options.stoppedSaw >= options.stoppedMax || options.runningSaw) {
          return;
        }
      }
      if (value === 'running') {
        options.runningSaw++;
      }
      return module.exports(ip, options);
    }).catch(function (err) {
      if (options.errors === max) throw err;
      options.errors++;
      return module.exports(ip, options);
    });
  });
};