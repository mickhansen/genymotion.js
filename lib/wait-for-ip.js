var exec = require('./exec-vboxmanage')
  , Promise = require('bluebird');

module.exports = function(name) {
  return Promise.delay(1000).then(function () {
    return exec('guestproperty get "'+name+'" "androvm_ip_management"').then(function (value) {
      if (value.trim() === 'No value set!') {
        return module.exports(name);
      }
      return value.split(" ")[1].trim();
    });
  });
};