import {Buffer} from 'node:buffer';
import process from 'node:process';
import {Readable} from 'node:stream';
import assert from 'node:assert';
import {
    exec,
    execFile as _execFile,
} from 'node:child_process';
import {fullstore} from 'fullstore';
import iconv from 'iconv-lite';
import {read as _redzipRead} from 'redzip';
import {winToWeb} from 'mellow';
import through from 'through2';
import {tryToCatch} from 'try-to-catch';

const WIN = process.platform === 'win32';
const WIN_VOLUME = '^[a-z]{1}:$';

const chcp = fullstore();
const CHCP = 'cp437';

const {stringify} = JSON;
const {assign} = Object;

const encodeNBSP = (a) => a.replace('\xa0', '&nbsp;');
const encodeMap = (a) => ({
    ...a,
    name: encodeNBSP(a.name),
});

const maybeAddSlash = (a) => a[0] === '/' ? a : `/${a}`;

export function unicodify() {
    if (!WIN || chcp() === '65001')
        return through();
    
    return iconv.decodeStream(`cp${chcp() || CHCP}`);
}

const WMIC = [
    'wmic',
    ['logicaldisk', 'get', 'name'],
];

const POWERSHELL = ['powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    '(Get-PSDrive -PSProvider FileSystem).Name',
]];

const COMMAND_TIMEOUT = 10_000;

const runCommand = (command, args) => new Promise((resolve, reject) => {
    const child = _execFile(command, args, {
        timeout: COMMAND_TIMEOUT,
        windowsHide: true,
        encoding: 'utf8',
    }, (error, stdout) => {
        if (error)
            return reject(error);
        
        resolve(stdout);
    });
    
    child.stdin.end();
});

export async function getVolumes({execFile = runCommand} = {}) {
    const fromWmic = await collect(parseWmic, WMIC, execFile);
    
    if (fromWmic.length)
        return fromWmic;
    
    return await collect(parsePowerShell, POWERSHELL, execFile);
}

async function collect(parse, [command, args], execFile) {
    const [error, data] = await tryToCatch(execFile, command, args);
    
    if (error)
        return [];
    
    return parse(data);
}

function parseWmic(data) {
    const strDrop = /Name|\r| |\n/g;
    
    if (!data)
        return [];
    
    const volumes = String(data)
        .replace(strDrop, '')
        .split(':');
    
    volumes.pop();
    
    return volumes;
}

function parsePowerShell(data) {
    if (!data)
        return [];
    
    return String(data)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => /^[a-z]$/i.test(line));
}

export const _runCommand = runCommand;
export const _parseWmic = parseWmic;
export const _parsePowerShell = parsePowerShell;

export function prepareCodePage() {
    /* if we on windows and command is built in
     * change code page to unicode becouse
     * windows uses unicode on non English versions
     */
    if (process.platform !== 'win32')
        return;
    
    getCodePage((codepage) => {
        if (!codepage)
            return;
        
        process.on('SIGINT', () => {
            exec(`chcp ${codepage}`, () => {
                process.exit();
            });
        });
        
        exec('chcp 65001', () => {
            getCodePage(chcp);
        });
    });
}

function getCodePage(callback) {
    exec('chcp', (error, stdout, stderror) => {
        if (error || stderror || !stdout)
            return;
        
        const index = stdout.indexOf(':');
        
        const codepage = stdout
            .slice(index + 2)
            .replace('\r\n', '');
        
        callback(codepage);
    });
}

export function isVolume(command) {
    assert(command, 'command could not be empty!');
    
    if (!WIN)
        return;
    
    const winVolume = new RegExp(`${WIN_VOLUME}\\.*`, 'i');
    
    return command.match(winVolume);
}

export function isChangeVolume(command) {
    assert(command, 'command could not be empty!');
    
    if (!WIN)
        return;
    
    const winVolume = new RegExp(WIN_VOLUME, 'i');
    
    return command.match(winVolume);
}

export const read = async (pathOs, options = {}) => {
    const {
        root = '/',
        redzipRead = _redzipRead,
    } = options;
    
    if (WIN && pathOs === '/')
        return await getRoot();
    
    const stream = await redzipRead(pathOs, options);
    
    if (stream.type === 'file')
        return stream;
    
    const {files} = stream;
    
    const webPath = winToWeb(pathOs);
    const webRoot = winToWeb(root);
    const withoutRoot = webPath.replace(webRoot, '');
    const newPath = maybeAddSlash(withoutRoot);
    
    return toStream({
        path: encodeNBSP(newPath),
        files: files.map(encodeMap),
    });
};

async function getRoot() {
    const volumes = await getVolumes();
    
    const data = {
        path: '/',
        files: [],
    };
    
    data.files = [];
    for (const name of volumes) {
        data.files.push({
            name,
            type: 'directory',
            size: 0,
            date: '--.--.----',
            mode: '--- --- ---',
            owner: 0,
        });
    }
    
    return toStream(data);
}

function toStream({path, files}) {
    const str = stringify({
        path,
        files,
    }, null, 4);
    
    const stream = Readable.from(str);
    
    assign(stream, {
        type: 'directory',
        path,
        files,
        contentLength: Buffer.byteLength(str),
    });
    
    return stream;
}
