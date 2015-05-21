var exec = require('./exec-vboxmanage')
  , Promise = require('bluebird')
  , max = 3;

module.exports = function(name, errors) {
  if (errors === undefined) {
    errors = 0;
  }

  return Promise.delay(2500).then(function () {
    return exec('guestproperty get "'+name+'" "androvm_ip_management"').then(function (value) {
      if (value.trim() === 'No value set!') {
        return module.exports(name);
      }
      return value.split(" ")[1].trim();
    }).catch(function (err) {
      if (errors === max) throw err;
      return module.exports(name, ++errors);
    });
  });
};
