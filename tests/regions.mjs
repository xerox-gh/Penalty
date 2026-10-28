import assert from 'node:assert/strict';
import {CUPS,REGIONS,cupPool,clubRegion,nationRegion,newCup,recordCup,cupOpponent,validateCups} from '../js/competitions.js';
import {WORLD_CLUBS,worldClub} from '../js/world.js';
import {NATIONS,flagSVG} from '../js/nationality.js';
import {Progression} from '../js/progression.js';
assert.equal(CUPS.length,58);assert.equal(CUPS.filter(c=>c.kind==='domestic').length,38);assert.equal(new Set(CUPS.map(c=>c.id)).size,CUPS.length);
for(const club of WORLD_CLUBS)assert.ok(clubRegion(club.id),club.name);
for(const n of NATIONS.filter(n=>n.code!=='GB')){assert.ok(nationRegion(n.code),n.name);assert.ok(flagSVG(n).includes('</svg>'));}
for(const r of REGIONS){const cups=CUPS.filter(c=>c.region===r.id&&c.kind!=='domestic');assert.deepEqual(cups.map(c=>c.kind).sort(),['club','nation','super']);for(const c of cups)for(const ref of cupPool(c.id))assert.equal(c.type==='nation'?nationRegion(ref.slice(7)):clubRegion(Number(ref.slice(5))),r.id);}
for(const c of CUPS.filter(c=>c.kind==='domestic')){const clubs=cupPool(c.id).map(ref=>worldClub(Number(ref.slice(5))));assert.ok(clubs.length>=32);assert.equal(new Set(clubs.map(c=>c.lid)).size,2);assert.ok(clubs.every(x=>Math.floor(x.lid/2)===c.countryIndex));const foreign=WORLD_CLUBS.find(x=>Math.floor(x.lid/2)!==c.countryIndex);assert.throws(()=>newCup(c.id,`club:${foreign.id}`));}
assert.throws(()=>newCup('asia-nations','nation:DE'));assert.throws(()=>newCup('africa-super','club:0'));
const old=newCup('europe','club:0');recordCup(old,2,1);assert.equal(validateCups({europe:old}).europe.round,1);
const save=new Progression(null);
for(const def of CUPS){save.createTournament(def.id,cupPool(def.id)[0]);while(cupOpponent(save.data.tournaments[def.id])){const m=save.begin('tournament',def.id);save.complete(m.id,{gf:2,ga:0,shots:2,passes:1});}}
const raw=save.export();assert.ok(raw.length<200000,'All tournament runs must fit the existing import size limit');const copy=new Progression(null);copy.import(raw);assert.equal(Object.keys(copy.data.tournaments).length,58);
console.log(`PASS: six regions, 58 cups, 38 domestic pools, eligibility, flags, old bracket compatibility and all-run export/import (${raw.length} bytes).`);
