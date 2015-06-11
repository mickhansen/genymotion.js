# genymotion.js
Launch Genymotion player from node.js and wait for it to be as booted as possible.

Specifically it looks for the presense of an IP for the VM for the android boot animation to finish.
The android emulator STILL might not be fully booted at this point so you might want to wait a further 5-10s depending on system resources.

## Installation

```sh
npm install --save genymotion
```

## Usage

```js
var genymotion = require('genymotion');

genymotion.launch('vm-name', {
  genymotion: '/path/to/genymotion/dir' // default: process.env.GENYMOTION
  kill: true // default: true, will kill existing player for vm if running
}).then(function (instance) {
  console.log(instance.ip); // IP of genymotion player, for adb connect
  instance.stop(); // Cleanly stops genymotion and its virtualbox image
});
```

Set path to genymotion with `GENYMOTION=/path/to/genymotion` 
Assumes that `vboxmanage` is in `$PATH`.

`stop()` will also be called automatically on `process.on('SIGINT')`.