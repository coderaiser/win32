win32
=====

Win32 specific functions module

## Install

```
npm install inline-io
```

## Use

```js
var win = require('win32');

win.getVolumes(function(error, volumes) {
    console.log(error || volumes);
});

```
## License

MIT
