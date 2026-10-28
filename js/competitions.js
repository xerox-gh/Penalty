import { WORLD_CLUBS, WORLD_LEAGUES, worldClub, worldRoster } from './world.js';
import { NATIONS } from './nationality.js';
const EUROPE = new Set(['EN','SC','ES','PT','FR','DE','IT','NL','BE','HR','RS','CH','GR','TR','RU','CZ','PL','SE','NO','DK','FI','AT','UA']);
export const CUPS = [
  {id:'international',name:'International Cup',type:'nation',size:32,region:'world',description:'32 national teams. Five knockout rounds to become world champions.'},
  {id:'europe',name:'Europe Cup',type:'club',size:16,region:'europe',description:'16 European clubs. Round of 16, quarter-finals, semi-finals and final.'},
  {id:'europe-nations',name:'Europe Nation Cup',type:'nation',size:16,region:'europe',description:'16 European national teams compete for continental glory.'},
  {id:'world-clubs',name:'World Club Cup',type:'club',size:16,region:'world',description:'16 clubs from around the world. One global club champion.'},
];
export const clubRef = id => `club:${id}`;
export function teamInfo(ref) {
  if(typeof ref!=='string')return null;
  if(ref.startsWith('club:'))return worldClub(Number(ref.slice(5))) || null;
  const n=NATIONS.find(n=>ref===`nation:${n.code}` && n.code!=='GB');
  if(!n)return null;
  return {id:ref,name:n.name,color:`hsl(${(n.code.charCodeAt(0)*19+n.code.charCodeAt(1)*7)%360},65%,48%)`,nationality:n.code};
}
export function teamRoster(ref) {
  const info=teamInfo(ref);if(!info)return [];
  if(ref.startsWith('club:'))return worldRoster(Number(ref.slice(5)));
  const candidates=WORLD_CLUBS.filter(c=>worldRoster(c.id)[0].nationality===info.nationality);
  const base=worldRoster(candidates[0]?.id ?? 0);
  return base.map((p,i)=>({...p,id:`${ref}-${i}`,nationality:info.nationality,rating:80+i%3,pace:79+i,shoot:80,pass:82,strength:81,dribble:82}));
}
const poolCache=new Map();
export function cupPool(id) {
  if(poolCache.has(id))return poolCache.get(id);
  const pool=buildPool(id);poolCache.set(id,Object.freeze(pool));return pool;
}
function buildPool(id) {
  const def=CUPS.find(c=>c.id===id);if(!def)return [];
  if(def.type==='nation')return NATIONS.filter(n=>n.code!=='GB'&&(def.region!=='europe'||EUROPE.has(n.code))).map(n=>`nation:${n.code}`);
  return WORLD_CLUBS.filter(c=>def.region!=='europe'||EUROPE.has(worldRoster(c.id)[0].nationality)).map(c=>clubRef(c.id));
}
export const cupStage = n => ({2:'FINAL',4:'SEMI-FINAL',8:'QUARTER-FINAL',16:'ROUND OF 16',32:'ROUND OF 32'}[n] || 'COMPLETE');
export function newCup(id, team, attempt=1) {
  const def=CUPS.find(c=>c.id===id),pool=cupPool(id);
  if(!def||!pool.includes(team))throw Error('Choose an eligible team for this cup.');
  // Deterministic draw per attempt, spread club entries across countries where possible.
  const others=pool.filter(x=>x!==team);let seed=attempt*937+id.length*31;
  for(let i=others.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[others[i],others[j]]=[others[j],others[i]];}
  if(def.type==='club')others.sort((a,b)=> Number(Number(a.slice(5))%100>=4)-Number(Number(b.slice(5))%100>=4));
  const entrants=[team,...others.slice(0,def.size-1)];
  return {id,team,attempt,round:0,status:'active',entrants,alive:[...entrants],history:[],champion:null};
}
export function cupOpponent(c){if(c?.status!=='active')return null;const i=c.alive.indexOf(c.team);return c.alive[i%2?i-1:i+1];}
export function recordCup(c,gf,ga){
  if(!cupOpponent(c)||gf===ga)throw Error('A knockout fixture needs a winner. Play golden goal.');
  const results=[],winners=[];
  for(let i=0;i<c.alive.length;i+=2){const a=c.alive[i],b=c.alive[i+1],human=a===c.team||b===c.team;
    let home=(c.attempt*11+c.round*3+i)%4,away=(c.attempt*7+c.round+i*3)%3;if(home===away)home++;
    if(human){home=a===c.team?gf:ga;away=a===c.team?ga:gf;}
    const winner=home>away?a:b;results.push({home:a,away:b,gf:home,ga:away,winner});winners.push(winner);
  }
  c.history.push(results);c.alive=winners;c.round++;
  if(!winners.includes(c.team))c.status='out';else if(winners.length===1)c.status='won';
  if(winners.length===1)c.champion=winners[0];
}
export function validateCups(value={}) {
  if(!value||Array.isArray(value)||typeof value!=='object')throw Error('Invalid cup careers.');
  for(const [id,c] of Object.entries(value)){
    const def=CUPS.find(x=>x.id===id),pool=cupPool(id);
    const ok=def&&c.id===id&&pool.includes(c.team)&&Number.isSafeInteger(c.attempt)&&c.attempt>0&&c.attempt<=1000000&&Number.isInteger(c.round)&&c.round>=0&&c.round<=Math.log2(def.size)&&['active','won','out'].includes(c.status)&&Array.isArray(c.entrants)&&c.entrants.length===def.size&&new Set(c.entrants).size===def.size&&c.entrants.includes(c.team)&&c.entrants.every(r=>pool.includes(r))&&Array.isArray(c.history)&&c.history.length===c.round;
    if(!ok)throw Error('Invalid tournament bracket.');
    let alive=[...c.entrants];
    for(const round of c.history){if(!Array.isArray(round)||round.length!==alive.length/2)throw Error('Invalid cup results.');
      const winners=[];round.forEach((m,i)=>{if(m.home!==alive[i*2]||m.away!==alive[i*2+1]||![m.gf,m.ga].every(n=>Number.isInteger(n)&&n>=0&&n<=100)||m.gf===m.ga||m.winner!==(m.gf>m.ga?m.home:m.away))throw Error('Invalid cup result.');winners.push(m.winner);});alive=winners;
    }
    const status=!alive.includes(c.team)?'out':alive.length===1?'won':'active';
    if(JSON.stringify(alive)!==JSON.stringify(c.alive)||c.status!==status||c.champion!==(alive.length===1?alive[0]:null))throw Error('Invalid cup progression.');
  }return value;
}
// The compact careers retain their existing schedules/rewards; slot IDs map to real league clubs.
export function careerClubs(id){if(id==null)return null;const club=worldClub(id);if(!club)return null;return [club,...WORLD_LEAGUES[club.lid].clubs.filter(x=>x!==id).map(worldClub)].slice(0,8);}
export function validateSelections(v={}){
  if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid mode teams.');
  return Object.fromEntries(['career','player','cup','challenge','quick'].map(k=>{const id=v[k]??null;if(id!==null&&(!Number.isInteger(id)||!worldClub(id)))throw Error('Invalid selected league club.');return [k,id];}));
}
