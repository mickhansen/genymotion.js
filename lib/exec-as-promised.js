var child_process = require('child_process')
  , Promise = require('bluebird')
  , exec = Promise.promisify(child_process.exec, child_process)
  , debug = require('debug')('genymotion:exec');

module.exports = function(command, options) {
  options = options || {};
  options.env = options.env || {PATH: process.env.PATH};

  debug(command);

  return exec(command, options).spread(function (stdout, stderr) {
    if (stderr && stderr.length) throw new Error(stderr);

    return stdout;
  });
};
