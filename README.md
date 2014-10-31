win32
=====

Win32 specific functions module

## Install

```
npm install win32 --save
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
