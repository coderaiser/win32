'use strict';

const {stub, test} = require('supertape');
const pullout = require('pullout');
const mockRequire = require('mock-require');

const {unicodify} = require('..');

const {reRequire, stopAll} = mockRequire;
const {stringify} = JSON;

test('win32: unicodify: linux', async (t) => {
    const result = await pullout(unicodify('hello'));
    
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
