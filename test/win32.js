import process from 'node:process';
import path, {dirname} from 'node:path';
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
