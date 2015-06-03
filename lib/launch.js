var spawn = require('child_process').spawn
  , vbox = require('./exec-vboxmanage')
  , exec = require('./exec-as-promised')
  , Promise = require('bluebird')
  , debug = require('debug')('genymotion:launcher')
  , debugPlayer = require('debug')('genymotion:launcher:player')
  , launch;

launch = function(name, options) {
  var player;

  options = options || {};
  options.genymotion = options.genymotion || process.env.GENYMOTION;

  if (!options.genymotion) {
    throw new Error('No genymotion path provided');
  }

  return Promise.join(
    vbox('list runningvms'),
    exec('ps aux')
  ).spread(function (runningvms, processes) {
    processes = processes.split("\n").filter(function (process) {
      return process.indexOf('virtualbox') > -1;
    });

    debug('runningvms: %s', runningvms);
    //debug('processes: %s', processes);
  }).then(function () {
    debug('Spawning genymotion player for %s', name);
    player = spawn(options.genymotion+'/player', [
      '--vm-name', name,
      '--no-popup'
    ]);

    player.stdout.on('data', function (stdout) {
      debugPlayer("stdout: %s", stdout.toString());
    });
    player.stderr.on('data', function (stderr) {
      debugPlayer("error: %s", stderr.toString());
    });

    player.on('close', function (code) {
      if (code !== 0) {
        //throw new Error('genymotion closed with a non-0 exit code');
      }
    });

    var stop = function() {
      player.kill('SIGINT');
      return vbox('controlvm '+name+' poweroff');
    };

    var savestate = function() {
      player.kill('SIGINT');
      return vbox('controlvm '+name+' savestate');
    };

    debug('Waiting for ip: %s', name);
    return require('./wait-for-ip')(name).tap(function (ip) {
      debug('Found ip for %s: %s', name, ip);
     }).tap(function (ip) {
      debug('Connecting to %s', ip);
      return exec('adb connect '+ip+':5555', {
        env: {
          PATH: process.env.PATH
        }
      }).tap(function () {
        debug('Connected to %s', ip);
      });
    }).tap(function () {
      return Promise.delay(500);
    }).tap(function (ip) {
      debug('Waiting on boot animation for %s', ip);
      return require('./wait-for-anim')(ip).tap(function () {
        debug('Boot animation done for %s', ip);
      });
    }).catch(function (err) {
      return stop().then(function () {
        throw err;
      });
    }).then(function (ip) {
      var instance
        , stopInstance;

      instance = {
        ip: ip,
        serial: ip+':5555',
        stop: function () {
          if (this.stopped) return;
          process.removeListener('SIGINT', stopInstance);
          this.stopped = true;

          return stop();
        },
        save: function() {
          if (this.stopped) return;
          process.removeListener('SIGINT', stopInstance);
          this.stopped = true;

          return stop();
        }
      };

      stopInstance = function() {
        return instance.stop();
      };

      process.addListener('SIGINT', stopInstance);

      return instance;
    });
  });
};

module.exports = launch;
