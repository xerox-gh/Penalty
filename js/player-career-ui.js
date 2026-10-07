import { defaultPro, proCard, CAREER_POSITIONS, CAREER_STATS } from './player-career.js';
import { NATIONS } from './nationality.js';
import { HAIR_STYLES } from './appearance.js';
import { GUIDE } from './shop-guide.js';
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button = (action,label,disabled=false) => `<button data-club="${action}" ${disabled?'disabled':''}>${label}</button>`;
export function readProForm(form) {
  const f = new FormData(form), p = defaultPro();
  for (const k of ['name','position','rarity','nationality']) p[k] = f.get(k);
  for (const k of CAREER_STATS) p[k] = Number(f.get(k));
  for (const k of Object.keys(p.look)) p.look[k] = Number(f.get('look-'+k));
  return p;
}
export function renderPlayerCareer(club, clubs) {
  const c=club.save.data.playerCareer, p=c?.profile || defaultPro(), locked=!!club.save.data.pending;
  const select=(key,label,choices,value)=>`<label>${label}<select name="${key}">${choices.map(([v,t])=>`<option value="${esc(v)}" ${String(v)===String(value)?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
  const looks=[['style','Hairstyle',HAIR_STYLES],['hair','Hair color',['Black','Brown','Blond','Dark brown','Auburn','Silver']],['skin','Skin tone',['Light tan','Tan','Medium','Brown','Deep brown','Light']],['eyes','Eyes',['Brown','Blue','Green','Dark']],['face','Face',['Classic','Narrow','Broad']],['facialHair','Facial hair',['Clean-shaven','Beard','Moustache','Goatee']],['brows','Brows',['Soft','Straight','Angled']],['nose','Nose',['Small','Medium','Broad']],['mouth','Mouth',['Neutral','Soft smile','Smile']]];
  return `<div class="sectionHeading"><div><span class="eyebrow">ONE PLAYER. YOUR CAREER.</span><h2>CREATE YOUR LEGACY</h2><p>Play as your own defender, midfielder or forward. Your teammates and goalkeeper handle themselves.</p></div></div>
  ${c?`<div class="proSummary"><div><small>SEASON ${c.season}</small><h3>${c.round===10?'SEASON COMPLETE':`NEXT: ${clubs[1+c.round%7].name}`}</h3><p>${c.round}/10 fixtures · ${c.points}/18 target points · ${c.titles} titles</p><progress max="18" value="${Math.min(18,c.points)}"></progress><p>${c.matches} appearances · ${c.wins} team wins · ${c.xp} career XP</p>${button(c.round===10?'pro-season':'start:player',c.round===10?'NEXT SEASON →':'PLAY AS MY PLAYER →',locked)}</div><div><h3>${c.training} TRAINING POINTS</h3><p>+3 for a win, +1 for a draw or loss. Spend one point for +1 stat, up to 100.</p>${CAREER_STATS.map(k=>button('pro-train:'+k,`${k.toUpperCase()} ${p[k]} · +1`,locked||!c.training||p[k]>=100)).join('')}</div></div>`:''}
  <div class="proStudio"><div class="proPreview"><span class="eyebrow">YOUR CUSTOM CARD</span><div id="proPreview">${club.card(proCard(p),true,false,false)}</div><p>Rarity chooses the card design. OVR is the average of your three stats.</p></div>
  <form id="proForm"><fieldset ${locked?'disabled':''}><legend>${c?'EDIT YOUR PLAYER':'CREATE YOUR PLAYER'}</legend><div class="proFields"><label>Player name<input name="name" maxlength="24" required value="${esc(p.name)}"></label>
  ${select('position','Position',CAREER_POSITIONS.map(v=>[v,v]),p.position)}
  ${select('rarity','Card rarity',GUIDE.tiers.map(t=>[t.name,t.name]),p.rarity)}
  ${select('nationality','Nationality',NATIONS.map(n=>[n.code,n.name]),p.nationality)}
  ${CAREER_STATS.map(k=>`<label>${{pace:'Pace',shoot:'Shooting',pass:'Passing'}[k]}<input type="number" name="${k}" min="1" max="100" step="1" required value="${p[k]}"></label>`).join('')}
  ${looks.map(([key,label,values])=>select('look-'+key,label,values.map((v,i)=>[i,v]),p.look[key])).join('')}</div>
  <p>Choose stats from 1–100 and any rarity, Rookie through Eternal. Stats affect the same pace, shooting and passing boosts as collectible cards. Editing preserves your career progress.</p><button type="submit">${c?'SAVE PLAYER':'CREATE PLAYER & CAREER'}</button></fieldset></form></div>
  ${c?`<h3>THIS SEASON</h3><div class="resultsList">${c.history.map(h=>`<span>${clubs[h.opponent].name} <b>${h.gf} – ${h.ga}</b></span>`).join('')||'<p>Your first fixture awaits. Earn 18 points in ten matches for a title, 400 bonus coins and two packs.</p>'}</div>`:''}`;
}
