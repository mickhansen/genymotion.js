var exec = require('./exec-as-promised')
  , errors = [
    'Command failed'
  ];

module.exports = function(command) {
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