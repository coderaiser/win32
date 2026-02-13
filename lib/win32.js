import {Buffer} from 'node:buffer';
import process from 'node:process';
import {Readable} from 'node:stream';
import assert from 'node:assert';
import {exec, spawn} from 'node:child_process';
import {once} from 'node:events';
import {fullstore} from 'fullstore';
import pullout from 'pullout';
import iconv from 'iconv-lite';
import {read as _redzipRead} from 'redzip';
import {winToWeb} from 'mellow';
import through from 'through2';

const isError = (a) => a instanceof Error;

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

export async function getVolumes() {
    const wmic = spawn('wmic', ['logicaldisk', 'get', 'name']);
    
    /* stream should be closed on win xp*/
    wmic.stdin.end();
    
    const [error] = await Promise.race([
        once(wmic.stdout, 'data'),
        once(wmic.stderr, 'data'),
        once(wmic, 'error'),
    ]);
    
    if (isError(error))
        return error.message;
    
    const data = await pullout(wmic.stdout);
    
    return parse(data);
}

function parse(data) {
    const strDrop = /Name|\r| |\n/g;
    
    if (!data)
        return [];
    
    const volumes = data
        .replace(strDrop, '')
        .split(':');
    
    volumes.pop();
    
    return volumes;
}

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
    
    data.files = volumes.map((name) => ({
        name,
        type: 'directory',
        size: 0,
        date: '--.--.----',
        mode: '--- --- ---',
        owner: 0,
    }));
    
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
