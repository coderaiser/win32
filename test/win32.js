'use strict';

const test = require('supertape');
const pullout = require('pullout');
const {unicodify} = require('..');

test('win32: unicodify: linux', async (t) => {
    const result = await pullout(unicodify('hello'));
    
    t.equal(result, 'hello');
    t.end();
});
