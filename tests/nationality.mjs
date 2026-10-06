import assert from 'node:assert/strict';
import {CARDS} from '../js/progression.js';
import {NATIONS,nationalityFor,flagSVG} from '../js/nationality.js';
for(const c of CARDS){const n=nationalityFor(c);assert.ok(NATIONS.includes(n));assert.equal(c.nationality,n.code);assert.equal(nationalityFor({...c,name:'Renamed',rating:100}),n);assert.ok(flagSVG(n).includes('viewBox="0 0 30 20"'));assert.ok(!flagSVG(n).includes('http'));}
assert.equal(nationalityFor({id:'heroes2'}).code,'JP');
assert.equal(nationalityFor({id:'glory1'}).code,'IT');
assert.equal(new Set(NATIONS.map(n=>n.code)).size,NATIONS.length);
console.log('PASS: every guide/legacy card has a stable nationality and offline SVG flag.');
