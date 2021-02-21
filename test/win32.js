'use strict';

const path = require('path');
const {Readable} = require('stream');

const {stub, test} = require('supertape');
const pullout = require('pullout');
const mockRequire = require('mock-require');

const {unicodify} = require('..');

const {reRequire, stopAll} = mockRequire;
const {stringify} = JSON;

test('win32: unicodify: linux', async (t) => {
    const stream = unicodify();
    Readable.from('hello').pipe(stream);
    const result = await pullout(stream);
    
    t.equal(result, 'hello');
    t.end();
});

test('win32: read: stringify with spaces', async (t) => {
    const read = stub().returns({
        files: [{
            name: 'hello.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    });
    
    mockRequire('redzip', {
        read,
    });
    
    const win32 = reRequire('..');
    const result = await pullout(await win32.read(__dirname));
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
    
    stopAll();
    
    t.equal(result, expected);
    t.end();
});

test('win32: read: dir: size', async (t) => {
    const read = stub().returns({
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
    
    mockRequire('redzip', {
        read,
    });
    
    const win32 = reRequire('..');
    const {size} = await win32.read(__dirname);
    
    stopAll();
    
    t.equal(typeof size, 'number');
    t.end();
});

test('win32: read: root', async (t) => {
    const read = stub().returns({
        files: [{
            name: 'hello.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    });
    
    mockRequire('redzip', {
        read,
    });
    
    const win32 = reRequire('..');
    const result = await pullout(await win32.read('/hello/world', {
        root: '/hello',
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
    
    stopAll();
    
    t.equal(result, expected);
    t.end();
});

test('win32: read: root: is set', async (t) => {
    const read = stub().returns({
        files: [{
            name: 'hello.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    });
    
    mockRequire('redzip', {
        read,
    });
    
    const win32 = reRequire('..');
    const result = await pullout(await win32.read('/', {
        root: '/',
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
    
    stopAll();
    
    t.equal(result, expected);
    t.end();
});

test('win32: read: root: long path is set', async (t) => {
    const read = stub().returns({
        files: [{
            name: 'hello.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    });
    
    mockRequire('redzip', {
        read,
    });
    
    const win32 = reRequire('..');
    const result = await pullout(await win32.read('/hello/world', {
        root: '/',
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
    
    stopAll();
    
    t.equal(result, expected);
    t.end();
});

test('win32: read: root: on windows', async (t) => {
    const read = stub().returns({
        files: [{
            name: 'hello.txt',
            type: 'file',
            size: '5b',
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        }],
    });
    
    mockRequire('redzip', {
        read,
    });
    
    const {platform} = process;
    Object.defineProperty(process, 'platform', {
        value: 'win32',
    });
    
    mockRequire('path', path.win32);
    
    reRequire('mellow');
    const win32 = reRequire('..');
    const result = await pullout(await win32.read('/c/windows/hello/world', {
        root: 'c:\\windows',
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
    
    stopAll();
    
    t.equal(result, expected);
    t.end();
});
