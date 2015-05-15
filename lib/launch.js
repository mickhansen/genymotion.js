var spawn = require('child_process').spawn
  , exec = require('./exec-vboxmanage')
  , Promise = require('bluebird')
  , launch;

launch = function(name, options) {
  var player;

  options = options || {};
  options.genymotion = options.genymotion || process.env.GENYMOTION;

  if (!options.genymotion) {
    throw new Error('No genymotion path provided');
  }

  return Promise.try(function () {
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
        throw new Error('genymotion closed with a non-0 exit code');
      }
    });

    return Promise.join(
      require('./wait-for-ip')(name),
      new Promise(function (resolve, reject) {
        var tail
          , count = 0;

        player.stdout.on('data', function (stdout) {
          stdout = stdout.toString();
          if (stdout.indexOf('Logging activities to file:') === 0) {
            if (stdout.indexOf(name) > -1) {
              tail = spawn('tail', ['-f', stdout.replace('Logging activities to file:', '').trim()]);

              tail.stdout.on('data', function (stdout) {
                count++;
                stdout = stdout.toString();

                if (count > 1 && stdout.indexOf('[SensorManager] Connected') > -1) {
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
      return require('./wait-for-anim')(ip);
    }).then(function (ip) {
      var instance = {
        ip: ip,
        serial: ip+':5555',
        stop: function () {
          player.kill();
          return exec('controlvm '+name+' poweroff');
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