var spawn = require('child_process').spawn
  , vbox = require('./exec-vboxmanage')
  , exec = require('./exec-as-promised')
  , Promise = require('bluebird')
  , debug = require('debug')('genymotion:launcher')
  , launch;

launch = function(name, options) {
  var player;

  options = options || {};
  options.genymotion = options.genymotion || process.env.GENYMOTION;

  if (!options.genymotion) {
    throw new Error('No genymotion path provided');
  }

  return Promise.try(function () {
    debug('Spawning genymotion player for %s', name);
    player = spawn(options.genymotion+'/player', [
      '--vm-name', name,
      '--no-popup'
    ]);

    player.stdout.pause();
    player.stderr.on('data', function (stderr) {
      console.error(stderr.toString());
    });

    player.on('close', function (code) {
      if (code !== 0) {
        //throw new Error('genymotion closed with a non-0 exit code');
      }
    });

    debug('Waiting for ip: %s', name);
    return Promise.join(
      require('./wait-for-ip')(name).tap(function (ip) {
        debug('Found ip for %s: %s', name, ip);
      }),
      new Promise(function (resolve, reject) {
        var tail
          , count = 0;

        debug('Looking for [SensorManager] Connected: %s', name);
        player.stdout.on('data', function (stdout) {
          stdout = stdout.toString();
          if (stdout.indexOf('Logging activities to file:') === 0) {
            if (stdout.indexOf(name) > -1) {
              tail = spawn('tail', ['-f', stdout.replace('Logging activities to file:', '').trim()]);

              tail.stdout.on('data', function (stdout) {
                count++;
                stdout = stdout.toString();

                if (count > 1 && stdout.indexOf('[SensorManager] Connected') > -1) {
                  debug('Found [SensorManager] Connected: %s', name);
                  resolve();
                }
              });
              tail.stderr.on('data', function (stderr) {
                reject(stderr.toString());
              });
            }
          }
        });

        player.stdout.resume();
      })
    ).spread(function (ip) {
      return ip;
    }).tap(function (ip) {
      debug('Connecting to %s', ip);
      return exec('adb connect '+ip+':5555', {
        env: {
          PATH: process.env.PATH
        }
      }).tap(function () {
        debug('Connected to %s', ip);
      });
    }).tap(function (ip) {
      debug('Waiting on boot animation for %s', ip);
      return require('./wait-for-anim')(ip).tap(function () {
        debug('Boot animation done for %s', ip);
      });
    }).then(function (ip) {
      var instance = {
        ip: ip,
        serial: ip+':5555',
        stop: function () {
          if (this.stopped) return;

          this.stopped = true;
          player.kill('SIGINT');
          return vbox('controlvm '+name+' poweroff');
        }
      };

      process.on('SIGINT', function () {
        instance.stop();
      });

      return instance;
    });
  });
};

module.exports = launch;
