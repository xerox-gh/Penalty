import assert from 'node:assert/strict';
import {Progression,validateSave} from '../js/progression.js';
import {defaultPro} from '../js/player-career.js';
import {navigation,careerDashboard,careerHub,resetPanel,SECTIONS} from '../js/career-hub.js';
const m=new Map(),s=new Progression({getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)});
s.savePro(defaultPro());s.startWorld(0);
for(const kind of ['career','player','world']){const p=s.begin(kind);s.complete(p.id,{gf:2,ga:0,passes:2,shots:4});}
const club={save:s},shared=()=>JSON.stringify([s.data.coins,s.data.packs,s.data.owned,s.data.squad,s.data.stats,s.data.trophies,s.data.claimed]);
const before=shared(),pro=JSON.stringify(s.data.playerCareer.profile),world=JSON.stringify(s.data.worldCareer);
assert.match(careerDashboard(club,'world'),/MD 38/);assert.match(careerDashboard(club,'career'),/MD 10/);assert.match(careerDashboard(club,'player'),/18 points/);
s.resetCareer('career');assert.equal(s.data.career.round,0);assert.equal(s.data.career.division,3);assert.equal(JSON.stringify(s.data.worldCareer),world);
s.resetCareer('player');assert.equal(s.data.playerCareer.matches,0);assert.equal(JSON.stringify(s.data.playerCareer.profile),pro);
s.resetCareer('world');assert.equal(s.data.worldCareer,null);assert.equal(shared(),before);validateSave(JSON.parse(s.export()));
assert.throws(()=>s.resetCareer('anything'));const p=s.begin('career');for(const kind of ['career','player','world'])assert.throws(()=>s.resetCareer(kind));s.abandon();
assert.match(resetPanel(club,'career'),/RESET CLUB CAREER/);club.resetTarget='career';assert.match(resetPanel(club,'career'),/YES, RESET THIS CAREER/);
for(const group of SECTIONS)for(const [tab] of group[2])assert.match(navigation(tab),new RegExp(`tab:${tab}`));
assert.match(careerHub(club),/Manager career/);assert.equal(new Progression(s.storage).data.career.round,0);
console.log('Career reset isolation, calendar, navigation and save round-trip passed');
