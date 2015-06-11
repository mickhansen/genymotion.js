var genymotion = require('./lib');

genymotion.kill('test').catch(function (err) {
  throw err;
});