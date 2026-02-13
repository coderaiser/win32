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
import {getVolumes} from 'win32';

const volumes = await getVolumes();
```

### unicodify()

Convert `cp437` (or other detected by `prepareCodePage`) to `utf8`;

```js
import {exec} from 'node:child_process';
import {unicodify} from 'win32';

exec('dir')
    .stdout
    .pipe(unicodify())
    .pipe(process.stdout);
```

### prepareCodePage()

Set code page to `65001` which is `utf8`. Will set back originial before exit.

```js
import {prepareCodePage} from 'win32';
prepareCodePage();
```

### isVolume(command)

Determines is `command` is volume:

```js
import {isVolume} from 'win32';

isVolume('c:\\');
// returns on windows
true;
```

### isChangeVolume(command)

Determines is `command` is changing of `volume`:

```js
import {isChangeVolume} from 'win32';

isChangeVolume('c:');
// returns
true;
```

## License

MIT
