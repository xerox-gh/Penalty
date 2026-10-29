// Navigation and career presentation use existing saves; no migration or duplicate progress.
import { SCHEDULE, CLUBS, tableOrder } from './progression.js';
import { displayCareerClubs } from './competition-ui.js';
import { fixtures, standings, worldClub, worldRoster } from './world.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(action,label,off=false)=>`<button data-club="${action}" ${off?'disabled':''}>${label}</button>`;
export const SECTIONS=[
 ['play','Play',[['play','Home'],['exhibition','Quick match'],['cups','Cups'],['challenges','Challenges'],['practice','Practice']]],
 ['careers','Careers',[['careers','Career hub'],['world','Manager career'],['career','Club career'],['player','Player career']]],
 ['collection','My club',[['squad','Squad & cards'],['shop','Pack shop'],['quests','Rewards & quests'],['club','Kits & trophies']]],
 ['options','Settings',[['settings','Stadium & pitch'],['controls','Controls & assistance'],['health','Save & backup']]],
];
export function navigation(tab){
 const group=SECTIONS.find(g=>g[2].some(([id])=>id===tab))||SECTIONS[0];
 return `<nav class="clubTabs mainSections" aria-label="Main sections">${SECTIONS.map(g=>`<button data-club="tab:${g[2][0][0]}" aria-current="${g===group?'true':'false'}">${g[1]}</button>`).join('')}</nav><nav class="sectionTabs" aria-label="${group[1]} pages">${group[2].map(([id,label])=>`<button data-club="tab:${id}" aria-current="${tab===id?'page':'false'}">${label}</button>`).join('')}</nav><p class="menuBreadcrumb">${group[1]} / ${group[2].find(([id])=>id===tab)?.[1]||'Home'}</p>`;
}
export function careerHub(club){
 const d=club.save.data;
 return `<span class="eyebrow">YOUR CAREERS</span><h2>CHOOSE YOUR ROLE</h2><p>Three independent careers. Each keeps its own season progress; coins and collections belong to your shared club.</p><div class="chapterGrid">${[
 ['world','Manager career','Manage a league club through a full home-and-away season, standings, promotion and relegation.',d.worldCareer?`${esc(worldClub(d.worldCareer.club).name)} · Season ${d.worldCareer.season}`:'Choose your country and club'],
 ['career','Club career','A compact ten-match league using your collected squad or a selected league team.',`Season ${d.career.season} · ${d.career.round}/10 played`],
 ['player','Player career','Control your created player, earn training points and chase the season points target.',d.playerCareer?`${esc(d.playerCareer.profile.name)} · Season ${d.playerCareer.season}`:'Create your player to begin'],
 ].map(([id,title,desc,status])=>`<article><span>${status}</span><h2>${title}</h2><p>${desc}</p>${btn('tab:'+id,'OPEN CAREER →')}</article>`).join('')}</div>`;
}
export function careerDashboard(club,kind){
 const d=club.save.data,c=kind==='world'?d.worldCareer:kind==='player'?d.playerCareer:d.career;
 if(!c)return '';
 const isWorld=kind==='world',isPro=kind==='player',clubs=displayCareerClubs(club,kind,CLUBS);
 const schedule=isWorld?fixtures(c.divisions[c.league%2]).map(r=>r.find(f=>f.includes(c.club))):isPro?Array.from({length:10},(_,i)=>[0,1+i%7]):SCHEDULE.map(r=>r.find(f=>f.includes(0)));
 const home=isWorld?c.club:0,name=id=>isWorld?worldClub(id).name:id===0?(d.modeClubs[kind]!=null?clubs[0].name:d.clubName):clubs[id].name;
 const order=isPro?null:isWorld?standings(c.table):tableOrder(c),rank=order?order.findIndex(r=>r.id===home)+1:null;
 const points=isPro?c.points:order.find(r=>r.id===home).pts;
 const target=isPro?'Earn 18 points':isWorld?(c.league%2?'Finish in the top 3 for promotion':'Win the division; avoid the bottom 3'):(c.division>1?'Finish in the top 2 for promotion; first place wins the title':'Win the division 1 title');
 return `<section class="careerDashboard"><div><span class="eyebrow">SEASON ${c.season} / CAREER CENTRAL</span><h2>${esc(isPro?c.profile.name:name(home))}</h2><p>${c.round} / ${schedule.length} fixtures played · ${points} points${rank?` · Position ${rank} of ${order.length}`:''}</p><progress value="${c.round}" max="${schedule.length}"></progress></div><div><h3>SEASON OBJECTIVE</h3><p>${target}</p><span class="formGuide" aria-label="Recent form">${c.history.slice(-5).map(h=>`<b class="form${h.gf>h.ga?'W':h.gf===h.ga?'D':'L'}">${h.gf>h.ga?'W':h.gf===h.ga?'D':'L'}</b>`).join('')||'No matches played yet'}</span></div></section><details class="modeOptions"><summary>FIXTURE CALENDAR · ${schedule.length} MATCHDAYS</summary><ol class="fixtureCalendar">${schedule.map((pair,i)=>{const opp=pair.find(id=>id!==home),h=c.history[i];return `<li class="${i===c.round?'nextFixture':''}"><small>MD ${i+1}${isPro?'':pair[0]===home?' · HOME':' · AWAY'}</small><span>${esc(name(opp))}</span><b>${h?`${h.gf} – ${h.ga}`:i===c.round?'UP NEXT':'Scheduled'}</b></li>`;}).join('')}</ol></details>${isWorld?`<details class="modeOptions"><summary>TEAM SHEET · ${esc(name(home))}</summary><div class="tableScroll"><table><thead><tr><th>Player</th><th>Position</th><th>OVR</th></tr></thead><tbody>${worldRoster(c.club).map(p=>`<tr><td>${esc(p.name)}</td><td>${p.position}</td><td>${p.rating}</td></tr>`).join('')}</tbody></table></div><p>Manager career uses your selected club’s roster. Collectible cards are equipped in Club career.</p></details>`:''}`;
}
export function resetPanel(club,kind){
 const title={world:'Manager',career:'Club',player:'Player'}[kind];
 if(kind==='world'&&!club.save.data.worldCareer||kind==='player'&&!club.save.data.playerCareer)return '';
 const pending=!!club.save.data.pending;
 if(club.resetTarget!==kind)return `<section class="careerReset"><h3>CAREER MANAGEMENT</h3><p>Restart only this career. Your other careers and shared collection remain available.</p>${btn('reset-ask:'+kind,`RESET ${title.toUpperCase()} CAREER`,pending)}${pending?'<p>Resume or abandon the unfinished match before resetting a career.</p>':''}</section>`;
 return `<section class="careerReset resetConfirm" role="region" aria-label="Confirm career reset"><h3>RESET ${title.toUpperCase()} CAREER?</h3><p>This clears this career’s seasons, results and progress.${kind==='player'?' Training points and career titles reset. Your created player, appearance and current stats stay.':kind==='world'?' You can choose a new club afterwards.':' You return to division 3, season 1 and can choose your team again.'} Shared coins, packs, cards, quests, trophies and other careers are kept.</p><p>Export a backup first if you want to keep this career.</p><div class="heroActions">${btn('export','EXPORT BACKUP')}${btn('reset-cancel','KEEP MY CAREER')}${btn('reset-confirm:'+kind,'YES, RESET THIS CAREER',pending)}</div></section>`;
}
