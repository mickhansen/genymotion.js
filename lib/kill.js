var spawn = require('child_process').spawn
  , vbox = require('./exec-vboxmanage')
  , exec = require('./exec-as-promised')
  , Promise = require('bluebird')
  , debug = require('debug')('genymotion:kill')
  , kill;

kill = function(name) {
  return Promise.join(
    vbox('list runningvms'),
    exec('ps aux')
  ).spread(function (runningvms, processes) {
    var $process;

    processes = processes.split("\n").filter(function ($process) {
      return $process.indexOf('player') > -1;
    });

    debug('runningvms: %s', runningvms);
    debug('processes: %s', processes);

    $process = processes.filter(function ($process) {
      return $process.indexOf('--vm-name '+name) > -1;
    });
    $process = $process && $process[0];

    if ($process) {
      $process = $process.split(' ').filter(function (part) {
        return part.trim();
      })[1];

      return exec('kill '+$process).then(function () {
        return Promise.delay(2500);
      });
    }
  });
};

module.exports = kill;