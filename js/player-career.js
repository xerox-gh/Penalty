import { GUIDE } from './shop-guide.js';
import { appearanceFor } from './appearance.js';
import { NATIONS } from './nationality.js';
export const CAREER_POSITIONS = ['DEF', 'MID', 'FWD'];
export const CAREER_STATS = ['pace', 'shoot', 'pass'];
export function defaultPro() {
  return { id: 'custom-pro', name: 'MY PLAYER', position: 'MID', rarity: 'Club',
    nationality: 'AR', pace: 70, shoot: 70, pass: 70,
    look: { ...appearanceFor('custom-pro') } };
}
export function proCard(profile) {
  return { ...profile, id: 'custom-pro', custom: true,
    rating: Math.round((profile.pace + profile.shoot + profile.pass) / 3) };
}
export function validatePro(p) {
  const integer = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
  if (!p || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 24 ||
      !CAREER_POSITIONS.includes(p.position) || !GUIDE.tiers.some(t => t.name === p.rarity) ||
      !NATIONS.some(n => n.code === p.nationality) ||
      !CAREER_STATS.every(k => integer(p[k], 1, 100))) throw Error('Choose a name, position, rarity and stats from 1 to 100.');
  const bounds = {style:9,skin:5,hair:5,eyes:3,face:2,brows:2,facialHair:3,nose:2,mouth:2};
  if (!p.look || !Object.entries(bounds).every(([k,max]) => integer(p.look[k],0,max))) throw Error('Invalid player appearance.');
  return {id:'custom-pro',name:p.name.trim(),position:p.position,rarity:p.rarity,nationality:p.nationality,
    ...Object.fromEntries(CAREER_STATS.map(k => [k,p[k]])),
    look:Object.fromEntries(Object.keys(bounds).map(k => [k,p.look[k]]))};
}
export function newPlayerCareer(profile) {
  return {profile:validatePro(profile),season:1,round:0,points:0,matches:0,wins:0,xp:0,training:0,titles:0,history:[]};
}
export function validatePlayerCareer(c) {
  if (c == null) return null; // Older club saves migrate without losing anything.
  c.profile = validatePro(c.profile);
  for (const k of ['season','round','points','matches','wins','xp','training','titles'])
    if (!Number.isSafeInteger(c[k]) || c[k] < 0 || c[k] > 100000000) throw Error('Invalid player career progress.');
  if (!c.season || c.round > 10 || c.points > c.round * 3 || c.wins > c.matches || c.matches < c.round ||
      !Array.isArray(c.history) || c.history.length !== c.round || c.history.some(h =>
        ![h.gf,h.ga,h.opponent].every(Number.isInteger) || h.gf<0 || h.gf>100 || h.ga<0 || h.ga>100 || h.opponent<1 || h.opponent>7))
    throw Error('Invalid player career season.');
  return c;
}
export function proSlot(profile) { return {DEF:1,MID:2,FWD:4}[profile.position]; }
