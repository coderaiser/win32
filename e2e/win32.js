import process from 'node:process';
import {test} from 'supertape';
import pullout from 'pullout';
import * as win32 from '../lib/win32.js';

const isWindows = process.platform === 'win32';
const testWindows = isWindows ? test : test.skip;
const systemDrive = (process.env.SystemDrive || 'C:')[0].toUpperCase();

const withoutWmic = async (command, args) => {
    if (command === 'wmic')
        throw Error('spawn wmic ENOENT');
    
    return await win32._runCommand(command, args);
};

testWindows('win32: e2e: getVolumes: has system drive', async (t) => {
    const volumes = await win32.getVolumes();
    const result = [];
    
    for (const a of volumes) {
        result.push(a.toUpperCase());
    }
    
    t.match(result, systemDrive);
    t.end();
});

testWindows('win32: e2e: getVolumes: real powershell finds system drive', async (t) => {
    const volumes = await win32.getVolumes({
        execFile: withoutWmic,
    });
    
    const result = [];
    
    for (const a of volumes) {
        result.push(a.toUpperCase());
    }
    
    t.match(result, systemDrive);
    t.end();
});

testWindows('win32: e2e: getVolumes: real powershell does not hang', async (t) => {
    const start = Date.now();
    
    await win32.getVolumes({
        execFile: withoutWmic,
    });
    
    const result = Date.now() - start;
    
    t.ok(result < 10_000, `took ${result}ms`);
    t.end();
});

testWindows('win32: e2e: read: root: lists volumes', async (t) => {
    const stream = await win32.read('/');
    const {files} = JSON.parse(await pullout(stream));
    const result = [];
    
    for (const {name} of files) {
        result.push(name.toUpperCase());
    }
    
    t.match(result, systemDrive);
    t.end();
});

testWindows('win32: e2e: read: root: type is directory', async (t) => {
    const stream = await win32.read('/');
    const {files} = JSON.parse(await pullout(stream));
    const result = files.every(({type}) => type === 'directory');
    
    t.ok(result);
    t.end();
});

test('win32: e2e: getVolumes: never throws on any platform', async (t) => {
    const result = await win32.getVolumes();
    
    t.ok(Array.isArray(result));
    t.end();
});
