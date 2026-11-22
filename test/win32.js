import process from 'node:process';
import {dirname} from 'node:path';
import {Readable} from 'node:stream';
import {fileURLToPath} from 'node:url';
import {stub, test} from 'supertape';
import pullout from 'pullout';
import * as win32 from '../lib/win32.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const {stringify} = JSON;

test('win32: unicodify: linux', async (t) => {
    const stream = win32.unicodify();
    
    Readable
        .from('hello')
        .pipe(stream);
    
    const result = await pullout(stream);
    
    t.equal(result, 'hello');
    t.end();
});

test('win32: read: stringify with spaces', async (t) => {
    const redzipRead = stub().returns({
        files: [{
            name: 'hello.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    });
    
    const result = await pullout(await win32.read(__dirname, {
        redzipRead,
    }));
    
    const expected = stringify({
        path: __dirname,
        files: [{
            name: 'hello.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    }, null, 4);
    
    t.equal(result, expected);
    t.end();
});

test('win32: read: dir: contentLength', async (t) => {
    const redzipRead = stub().returns({
        type: 'directory',
        files: [{
            name: 'hello.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    });
    
    const {contentLength} = await win32.read(__dirname, {
        redzipRead,
    });
    
    t.ok(contentLength);
    t.end();
});

test('win32: read: dir: files', async (t) => {
    const expectedFiles = [{
        name: 'hello.txt',
        type: 'file',
        size: '5b',
        date: '--.--.----',
        mode: '--- --- ---',
        owner: 0,
    }];
    
    const redzipRead = stub().returns({
        type: 'directory',
        files: expectedFiles,
    });
    
    const {files} = await win32.read(__dirname, {
        redzipRead,
    });
    
    t.deepEqual(files, expectedFiles);
    t.end();
});

test('win32: read: root', async (t) => {
    const redzipRead = stub().returns({
        files: [{
            name: 'hello.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    });
    
    const result = await pullout(await win32.read('/hello/world', {
        root: '/hello',
        redzipRead,
    }));
    
    const expected = stringify({
        path: '/world',
        files: [{
            name: 'hello.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    }, null, 4);
    
    t.equal(result, expected);
    t.end();
});

test('win32: read: root: is set', async (t) => {
    const redzipRead = stub().returns({
        files: [{
            name: 'hello.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    });
    
    const result = await pullout(await win32.read('/', {
        root: '/',
        redzipRead,
    }));
    
    const expected = stringify({
        path: '/',
        files: [{
            name: 'hello.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    }, null, 4);
    
    t.equal(result, expected);
    t.end();
});

test('win32: read: root: long path is set', async (t) => {
    const redzipRead = stub().returns({
        files: [{
            name: 'hello.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    });
    
    const result = await pullout(await win32.read('/hello/world', {
        root: '/',
        redzipRead,
    }));
    
    const expected = stringify({
        path: '/hello/world',
        files: [{
            name: 'hello.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    }, null, 4);
    
    t.equal(result, expected);
    t.end();
});

test('win32: read: root: on windows', async (t) => {
    const redzipRead = stub().returns({
        files: [{
            name: 'hello.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    });
    
    const {platform} = process;
    
    Object.defineProperty(process, 'platform', {
        value: 'win32',
    });
    
    const result = await pullout(await win32.read('c:\\windows\\hello\\world', {
        root: 'c:\\windows',
        redzipRead,
    }));
    
    const expected = stringify({
        path: '/hello/world',
        files: [{
            name: 'hello.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    }, null, 4);
    
    Object.defineProperty(process, 'platform', {
        value: platform,
    });
    
    t.equal(result, expected);
    t.end();
});

test('win32: read: nbsp', async (t) => {
    const redzipRead = stub().returns({
        files: [{
            name: 'hello\xa0world.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    });
    
    const result = await pullout(await win32.read(__dirname, {
        redzipRead,
    }));
    
    const expected = stringify({
        path: __dirname,
        files: [{
            name: 'hello&nbsp;world.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    }, null, 4);
    
    t.equal(result, expected);
    t.end();
});

const WMIC_OUT = 'Name  \r\r\nC:    \r\r\nD:    \r\r\n\r\r\n';
const PS_OUT = 'C\r\nD\r\n';

const noWmic = () => Error('spawn wmic ENOENT');

const fakeExec = ({wmic, powershell}) => stub(async (command) => {
    if (command === 'wmic')
        return await wmic();
    
    return await powershell();
});

test('win32: getVolumes: wmic: parses volumes', async (t) => {
    const execFile = fakeExec({
        wmic: () => WMIC_OUT,
        powershell: () => {
            throw Error('should not be called');
        },
    });
    
    const result = await win32.getVolumes({
        execFile,
    });
    
    const expected = ['C', 'D'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('win32: getVolumes: wmic: powershell is not called', async (t) => {
    const execFile = fakeExec({
        wmic: () => WMIC_OUT,
        powershell: () => PS_OUT,
    });
    
    await win32.getVolumes({
        execFile,
    });
    
    t.calledOnce(execFile);
    t.end();
});

test('win32: getVolumes: no wmic (windows 11): fallback to powershell', async (t) => {
    const execFile = fakeExec({
        wmic: () => {
            throw noWmic();
        },
        powershell: () => PS_OUT,
    });
    
    const result = await win32.getVolumes({
        execFile,
    });
    
    const expected = ['C', 'D'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('win32: getVolumes: wmic gives nothing: fallback to powershell', async (t) => {
    const execFile = fakeExec({
        wmic: () => '',
        powershell: () => PS_OUT,
    });
    
    const result = await win32.getVolumes({
        execFile,
    });
    
    const expected = ['C', 'D'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('win32: getVolumes: powershell: runs without profile and interaction', async (t) => {
    const execFile = fakeExec({
        wmic: () => {
            throw noWmic();
        },
        powershell: () => PS_OUT,
    });
    
    await win32.getVolumes({
        execFile,
    });
    
    const [, [command, args]] = execFile.args;
    const result = [command, args.slice(0, 3)];
    const expected = ['powershell.exe', ['-NoProfile', '-NonInteractive', '-Command']];
    
    t.deepEqual(result, expected);
    t.end();
});

test('win32: getVolumes: no wmic, no powershell: empty array', async (t) => {
    const execFile = stub().rejects(noWmic());
    
    const result = await win32.getVolumes({
        execFile,
    });
    
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('win32: getVolumes: output is not a string: empty array', async (t) => {
    const execFile = stub().resolves(42);
    
    const result = await win32.getVolumes({
        execFile,
    });
    
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('win32: getVolumes: always array (volumes.map is not a function, cloudcmd#465)', async (t) => {
    const execFile = fakeExec({
        wmic: () => {
            throw noWmic();
        },
        powershell: () => {
            throw Error('spawn powershell.exe ENOENT');
        },
    });
    
    const result = await win32.getVolumes({
        execFile,
    });
    
    t.ok(Array.isArray(result));
    t.end();
});

test('win32: getVolumes: real spawn without wmic and powershell: array, not message', async (t) => {
    const result = await win32.getVolumes();
    
    t.ok(Array.isArray(result));
    t.end();
});

test('win32: parseWmic: crlf', (t) => {
    const result = win32._parseWmic(WMIC_OUT);
    const expected = ['C', 'D'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('win32: parsePowerShell: crlf', (t) => {
    const result = win32._parsePowerShell(PS_OUT);
    const expected = ['C', 'D'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('win32: parsePowerShell: drops noise', (t) => {
    const result = win32._parsePowerShell('WARNING: something\r\nC\r\n\r\nDATA\r\nz\r\n');
    const expected = ['C', 'z'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('win32: parsePowerShell: empty', (t) => {
    const result = win32._parsePowerShell('');
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});
