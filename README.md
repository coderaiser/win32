# win32

Win32 specific functions module for [Cloud Commander](https://cloudcmd.io).

## Install

```
npm install win32 --save
```

## Use

### read(path, options)

Read path and if it's root, return `volumes` on `win32`

### getVolumes()

Get volumes of Windows platform

```js
const win = require('win32');

const volumes = await win.getVolumes();
```

### unicodify()

Convert `cp437` (or other detected by `prepareCodePage`) to `utf8`;

```js
const {exec} = require('node:child_process');
const win = require('win32');

exec('dir')
    .stdout
    .pipe(win.unicodify())
    .pipe(process.stdout);
```

### prepareCodePage()

Set code page to `65001` which is `utf8`. Will set back originial before exit.

```js
const win = require('win32');
win.prepareCodePage();
```

### isVolume(command)

Determines is `command` is volume:

```js
const win = require('win32');
win.isVolume('c:\\');
// returns on windows
true;
```

### isChangeVolume(command)

Determines is `command` is changing of `volume`:

```js
const win = require('win32');
win.isChangeVolume('c:');
// returns
true;
```

## License

MIT
