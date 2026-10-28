import assert from 'node:assert/strict';
import {Progression, freshSave, SAVE_KEY, validateSave, CARDS} from '../js/progression.js';
import {inspectSave} from '../js/save-health.js';
import {WORLD_LEAGUES,WORLD_CLUBS,fixtures,worldFixture,validateWorld,newWorldCareer,recordWorld,nextWorldSeason,worldRoster} from '../js/world.js';
import {NATIONS,flagSVG} from '../js/nationality.js';
import {validatePro,defaultPro,proCard} from '../js/player-career.js';
class Store{constructor(){this.map=new Map()}getItem(k){return this.map.get(k)||null}setItem(k,v){this.map.set(k,v)}}
const storage=new Store(),save=new Progression(storage);save.change(d=>d.coins=999);
save.change(d=>d.coins=1999);assert.ok(storage.getItem(SAVE_KEY+'.backup'));
const bad=JSON.parse(save.export());bad.coins=1e20;bad.packs=null;bad.xp='123.8';storage.setItem(SAVE_KEY,JSON.stringify(bad));
const repaired=new Progression(storage);assert.equal(repaired.data.coins,100000000);assert.equal(repaired.data.packs,0);assert.equal(repaired.data.xp,123);assert.ok(storage.getItem(SAVE_KEY+'.recovery'));assert.equal(repaired.corrupt,null);
repaired.change(d=>d.coins+=500);assert.equal(repaired.data.coins,100000000);validateSave(repaired.data);
const verified=storage.getItem(SAVE_KEY);assert.throws(()=>repaired.change(d=>d.squad=['missing']));assert.equal(storage.getItem(SAVE_KEY),verified);
storage.setItem(SAVE_KEY,'{broken');const fallback=new Progression(storage);assert.equal(fallback.corrupt,null);assert.equal(storage.getItem(SAVE_KEY+'.recovery'),'{broken');assert.ok(fallback.data.owned.length);
const noBackup=new Store();noBackup.setItem(SAVE_KEY,'invalid');const protectedSave=new Progression(noBackup);assert.ok(protectedSave.corrupt);assert.throws(()=>protectedSave.openPack());assert.equal(noBackup.getItem(SAVE_KEY),'invalid');
assert.equal(inspectSave({...freshSave(),squad:['fake']},validateSave).data,null);
assert.equal(WORLD_LEAGUES.length,76);assert.equal(WORLD_CLUBS.length,1256);
for(const l of WORLD_LEAGUES){const rounds=fixtures(l.clubs),pairs=rounds.flat();assert.equal(rounds.length,2*(l.clubs.length-1));assert.equal(new Set(pairs.map(p=>p.join(':'))).size,l.clubs.length*(l.clubs.length-1));}
// Play a full lower-division season, promote, persist, then relegate.
save.startWorld(100);const initialClub=save.data.worldCareer.club;
while(worldFixture(save.data.worldCareer)){const m=save.begin('world');assert.equal(new Progression(storage).data.pending.id,m.id);save.complete(m.id,{gf:5,ga:0,passes:1,shots:2});assert.equal(save.complete(m.id,{gf:5,ga:0,passes:1,shots:2}),null);}
save.nextWorld();assert.equal(save.data.worldCareer.league,0);assert.equal(save.data.worldCareer.club,initialClub);assert.equal(save.data.worldCareer.lastFinish.movement,'Promoted');
while(worldFixture(save.data.worldCareer)){const m=save.begin('world');save.complete(m.id,{gf:0,ga:5,passes:0,shots:0});}
save.nextWorld();assert.equal(save.data.worldCareer.league,1);assert.equal(save.data.worldCareer.lastFinish.movement,'Relegated');validateWorld(save.data.worldCareer);
const copy=new Progression(new Store());copy.import(save.export());assert.deepEqual(copy.data.worldCareer,save.data.worldCareer);
assert.throws(()=>save.begin('exhibition',{home:0,away:0}));const ex=save.begin('exhibition',{home:0,away:200});save.complete(ex.id,{gf:1,ga:0,passes:0,shots:1});assert.equal(save.data.worldCareer.round,0);
for(const card of CARDS)for(const key of ['strength','dribble'])assert.ok(Number.isInteger(card[key])&&card[key]>=1&&card[key]<=100);
assert.ok(NATIONS.some(n=>n.code==='US'));assert.ok(NATIONS.some(n=>n.code==='HR'));for(const n of NATIONS){assert.match(flagSVG(n),/<svg/);assert.ok(!flagSVG(n).includes('undefined'));}
const old=defaultPro();delete old.strength;delete old.dribble;old.pace=old.shoot=old.pass=90;const pro=validatePro(old);assert.equal(pro.strength,90);assert.equal(proCard(pro).rating,90);
assert.equal(worldRoster(2500).length,5);
console.log('PASS: counter repair, original/backup retention, protected writes, recovery fallback, 76 fixture calendars, playable world seasons, promotion/relegation, exhibition isolation, five stats and nationality flags.');
