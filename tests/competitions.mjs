import assert from 'node:assert/strict';
import {Progression,validateSave,freshSave} from '../js/progression.js';
import {CUPS,cupPool,newCup,recordCup,validateCups,cupOpponent,teamInfo,teamRoster,careerClubs} from '../js/competitions.js';
import {defaultPro} from '../js/player-career.js';
class Store{constructor(){this.d=new Map()}getItem(k){return this.d.get(k)||null}setItem(k,v){this.d.set(k,v)}}
const result={gf:3,ga:1,shots:4,passes:2};
assert.equal(careerClubs(null),null);const legacy=freshSave();delete legacy.modeClubs;delete legacy.tournaments;delete legacy.aiAssist;assert.equal(validateSave(legacy).modeClubs.player,null);
for(const mode of ['career','player','cup','challenge','quick']){
 const s=new Progression(new Store());s.savePro(defaultPro());s.selectModeClub(mode,200);
 const p=s.begin(mode,mode==='challenge'?'comeback':undefined);assert.equal(p.worldHome,200);assert.equal(careerClubs(200)[p.opponent].id,p.worldAway);assert.notEqual(p.worldHome,p.worldAway);
 assert.throws(()=>s.selectModeClub(mode,201));s.complete(p.id,result);assert.equal(s.data.modeClubs[mode],200);
 if(mode==='career'||mode==='player')assert.throws(()=>s.selectModeClub(mode,201));
 const copy=new Progression(new Store());copy.import(s.export());assert.equal(copy.data.modeClubs[mode],200);
}
for(const def of CUPS){
 const pool=cupPool(def.id);assert.ok(pool.length>=def.size);const c=newCup(def.id,pool[0]);assert.equal(new Set(c.entrants).size,def.size);
 for(const ref of c.entrants){assert.ok(teamInfo(ref));assert.equal(teamRoster(ref).length,5);if(def.type==='nation')assert.ok(teamRoster(ref).every(p=>p.nationality===ref.slice(7)));}
 const s=new Progression(new Store());s.createTournament(def.id,pool[0]);const before=s.data.coins;
 while(cupOpponent(s.data.tournaments[def.id])){const p=s.begin('tournament',def.id);assert.equal(p.homeRef,pool[0]);assert.throws(()=>s.complete(p.id,{...result,gf:1,ga:1}));assert.equal(s.data.pending.id,p.id);s.complete(p.id,result);assert.equal(s.complete(p.id,result),null);validateCups(s.data.tournaments);}
 assert.equal(s.data.tournaments[def.id].status,'won');assert.equal(s.data.tournaments[def.id].round,Math.log2(def.size));assert.ok(s.data.coins>=before+700);assert.ok(s.data.trophies.some(t=>t.includes(def.name)));assert.equal(s.data.stats.cups,1);
 const copy=new Progression(new Store());copy.import(s.export());assert.deepEqual(copy.data.tournaments,s.data.tournaments);
 s.createTournament(def.id,pool[1]);const p=s.begin('tournament',def.id);s.complete(p.id,{...result,gf:0,ga:1});assert.equal(s.data.tournaments[def.id].status,'out');assert.throws(()=>s.begin('tournament',def.id));
 const broken=structuredClone(s.data.tournaments);broken[def.id].history[0][0].winner='nation:FAKE';assert.throws(()=>validateCups(broken));
}
const assist=new Progression(new Store());assist.change(d=>d.aiAssist=true);const match=assist.begin('quick');assert.equal(match.aiAssist,true);assert.equal(new Progression(assist.storage).data.pending.aiAssist,true);
console.log('PASS: all-mode league teams, legacy defaults, season locks, four full cups, nationality rosters, bracket validation, golden-goal requirement, rewards, retries, duplicate protection and offline assistance persistence.');
