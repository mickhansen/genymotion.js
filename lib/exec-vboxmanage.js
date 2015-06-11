var exec = require('./exec-as-promised')
  , debug = require('debug')('genymotion:vbox')
  , errors = [
    'Command failed'
  ];

module.exports = function(command) {
  debug(command);
  return exec('vboxmanage '+command).catch(function (err) {
    var message = err.message;

    errors.forEach(function (type) {
      if (message.indexOf(type) === 0) {
        throw err;
      }
    });

    return message;
  });
};