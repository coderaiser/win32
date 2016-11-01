'use strict';

/* win.js
* -----------
*
* used for work with windows specific
* functions like volumes.
*/

var spawn       = require('child_process').spawn,
    exec        = require('child_process').exec,
    assert      = require('assert'),
    
    pullout     = require('pullout/legacy'),
    
    WIN         = process.platform === 'win32',
    WIN_VOLUME  = '^[a-z]{1}:$';

exports.getVolumes          = getVolumes;
exports.prepareCodePage     = prepareCodePage;

exports.isVolume            = isVolume;
exports.isChangeVolume      = isChangeVolume;

function getVolumes(callback) {
    var wmic = spawn('wmic', ['logicaldisk', 'get', 'name']);
    
    assert(callback, 'callback could not be empty!');
    
    /* stream should be closed on win xp*/
    wmic.stdin.end();
    
    pullout(wmic.stdout, 'string', function(error, data) {
        if (error)
            callback(error);
        else
            parse(data, callback);
    });
    
    wmic.stderr.on('data', callback);
    wmic.on('error', callback);
}

function parse(data, callback) {
    var volumes     = [],
        strDrop     = /Name|\r| |\n/g;
    
    if (data) {
        volumes = data
            .replace(strDrop, '')
            .split(':');
        
        volumes.pop();
    }
    
    callback(null, volumes);
}

function prepareCodePage() {
    /* if we on windows and command is build in
     * change code page to unicode becouse
     * windows use unicode on non English versions
     */
     
    if (process.platform === 'win32')
        getCodePage(function(codepage) {
            if (codepage) {
                process.on('SIGINT', function() {
                    exec('chcp ' + codepage, function() {
                        process.exit();
                    });
                });
                
                exec('chcp 65001', function(error, stdout, stderror) {
                    if (error)
                        console.log(error);
                    
                    if (stderror)
                        console.log(stderror);
                 });
            }
        });
}

function getCodePage(callback) {
    exec('chcp', function(error, stdout, stderror) {
        var index, codepage;
        
        if (!error && !stderror && stdout) {
            index       = stdout.indexOf(':');
            codepage    = stdout.slice(index + 2);
        }
        
        callback(codepage);
    });
}

function isVolume(command) {
    var is, winVolume;
    
    assert(command, 'command could not be empty!');
    
    if (WIN) {
        winVolume   = new RegExp(WIN_VOLUME + '\\\\.*', 'i');
        is          = command.match(winVolume);
    }
    
    return is;
}

function isChangeVolume(command) {
    var is, winVolume;
    
    assert(command, 'command could not be empty!');
    
    if (WIN) {
        winVolume   = new RegExp(WIN_VOLUME, 'i');
        is          = command.match(winVolume);
    }
    
    return is;
}

