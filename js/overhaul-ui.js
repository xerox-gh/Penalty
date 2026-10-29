import {
  WORLD_LEAGUES,
  WORLD_CLUBS,
  worldClub,
  worldFixture,
  standings,
  fixtures,
} from "./world.js";
import { STADIUMS, PITCH_COLORS } from "./venues.js";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const btn = (action, text, off = false) =>
  `<button data-club="${action}" ${off ? "disabled" : ""}>${text}</button>`;
export function homeMenu(club) {
 const d=club.save.data;
 return `<div class="hubLive"><span>● OFFLINE FOOTBALL</span><span>YOUR NEXT MATCH STARTS HERE</span></div><section class="worldHero"><div><span class="eyebrow">PENALTY / MATCHDAY</span><h1>YOUR CLUB.<br><em>YOUR STORY.</em></h1><p>Play a match, continue a career or train your skills.</p><div class="heroActions">${btn('tab:exhibition','QUICK MATCH →')}${btn('tab:careers','CONTINUE A CAREER →')}</div></div><div class="heroPitch" aria-hidden="true"><i></i><strong>P /<small>MAKE YOUR MARK</small></strong></div></section><div class="chapterGrid">${[
 ['careers','Careers','Manager, club and player careers. Find your next fixture and season progress.'],
 ['cups','Cups','Choose a continent, club cup or international tournament.'],
 ['practice','Practice','Attacking, defending and every set piece. No career progress affected.'],
 ['squad','My club','Equip cards, open packs and claim earned rewards.'],
 ].map(([id,title,desc])=>`<article><h2>${title}</h2><p>${desc}</p>${btn('tab:'+id,'OPEN →')}</article>`).join('')}</div>`;
}
export function worldMenu(club) {
  const c = club.save.data.worldCareer,
    locked = !!club.save.data.pending,
    l = WORLD_LEAGUES[club.worldLeague || 0];
  const options = (ids, selected) =>
    ids
      .map(
        (id) =>
          `<option value="${id}" ${id === selected ? "selected" : ""}>${esc(worldClub(id).name)} · ${worldClub(id).rating} OVR</option>`,
      )
      .join("");
  let body = `${c?'<details class="modeOptions"><summary>BROWSE CLUBS & EXHIBITION</summary>':''}<div class="sectionHeading"><div><span class="eyebrow">MANAGER CAREER</span><h2>MANAGER OFFICE</h2><p>Choose your club and lead it through full league seasons. Play or simulate fixtures, track the table and earn promotion. Matches use the arcade 5v5 engine.</p></div></div><div class="worldBrowser"><label>COUNTRY / DIVISION<select id="worldLeague">${WORLD_LEAGUES.map((v) => `<option value="${v.id}" ${v.id === l.id ? "selected" : ""}>${esc(v.country)} · ${esc(v.name)}</option>`).join("")}</select></label><label>YOUR CLUB<select id="worldHome">${options(l.clubs, club.worldHome ?? l.clubs[0])}</select></label><label>EXHIBITION OPPONENT<select id="worldAway">${options(l.clubs, club.worldAway ?? l.clubs[1])}</select></label><div class="heroActions">${btn("world-exhibition", "PLAY EXHIBITION →", locked)}${!c ? btn("world-create", "START MANAGER CAREER", locked) : ""}</div></div>${c?'</details>':''}`;
  if (c) {
    const league = WORLD_LEAGUES[c.league],
      pair = worldFixture(c),
      opponent = pair ? worldClub(pair.find((id) => id !== c.club)) : null;
    body += `<section class="worldSeason"><span class="eyebrow">${esc(league.name)} · SEASON ${c.season}</span><h2>${esc(worldClub(c.club).name)}</h2><p>${opponent ? `NEXT: ${esc(opponent.name)} · MATCHDAY ${c.round + 1} / ${fixtures(c.divisions[c.league % 2]).length}` : "SEASON COMPLETE"}${c.lastFinish ? ` · Last season: ${c.lastFinish.rank}, ${esc(c.lastFinish.movement)}` : ""}</p><div class="heroActions">${btn(opponent ? "start:world" : "world-next", opponent ? "PLAY FIXTURE →" : "ADVANCE TO NEXT SEASON", locked)}${opponent ? btn("world-sim", "SIMULATE FIXTURE", locked) : ""}</div><p>Three clubs move up and down between paired divisions at season end. Your selected club stays with you.</p></section><div class="tableScroll"><table><thead><tr><th>#</th><th>CLUB</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>PTS</th></tr></thead><tbody>${standings(
      c.table,
    )
      .map(
        (t, i) =>
          `<tr class="${t.id === c.club ? "yourClub" : ""}"><td>${i + 1}</td><td>${esc(worldClub(t.id).name)}</td><td>${t.played}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td>${t.gf - t.ga}</td><td>${t.pts}</td></tr>`,
      )
      .join(
        "",
      )}</tbody></table></div><h3>RESULTS</h3><div class="resultsList">${c.history.map((h) => `<span>${esc(worldClub(h.opponent).name)} <b>${h.gf} – ${h.ga}</b></span>`).join("")}</div>`;
  } else
    body += `<div class="worldSeason"><h2>START A NEW STORY</h2><p>Each division has ${l.clubs.length} clubs. Play or simulate a full home-and-away season, with three points for a win and promotion/relegation between tiers. Your existing club and player careers are preserved.</p></div>`;
  return body;
}
export function settingsMenu(club) {
  const p = club.save.data.presentation,
    locked = !!club.save.data.pending;
  return `<span class="eyebrow">STADIUM STUDIO</span><h2>BUILD YOUR MATCHDAY</h2><p>Choose a venue and turf color. These apply to every mode and stay saved offline.</p><div class="venueGrid">${STADIUMS.map((v) => `<article class="venueCard ${v.id} ${p.stadium === v.id ? "selected" : ""}"><div class="venueArt" aria-hidden="true"><span>${v.name}</span></div><h3>${v.name}</h3><p>${v.description}</p>${btn("venue:" + v.id, p.stadium === v.id ? "SELECTED" : "SELECT VENUE", locked || p.stadium === v.id)}</article>`).join("")}</div><h2>PITCH COLOR</h2><div class="turfGrid">${PITCH_COLORS.map((v) => `<button data-club="turf:${v.id}" aria-pressed="${p.pitchColor === v.id}" ${locked ? "disabled" : ""}><span style="background:rgb(${v.rgb.join(",")})"></span>${v.name}${p.pitchColor === v.id ? " ✓" : ""}</button>`).join("")}</div><p>Finish or abandon an unfinished match before changing its venue. All graphics are procedural and included offline.</p>`;
}
export function healthMenu(club) {
  const s = club.save;
  return `<span class="eyebrow">SAVE HEALTH</span><h2>PROTECT YOUR PROGRESS</h2><div class="healthCard"><h3>${s.corrupt ? "RECOVERY REQUIRED" : "VALIDATION & RECOVERY"}</h3><p role="status">${esc(s.health || s.message || "Every save is checked before it is written. A previous verified copy is retained.")}</p><div class="heroActions">${btn("save-check", "CHECK SAVE")}${btn("save-repair", "REPAIR SAFE ERRORS")}${btn("save-backup", "RESTORE PREVIOUS SAVE")}${btn("export", "EXPORT CURRENT SAVE")}${btn("save-recovery", "EXPORT ORIGINAL RECOVERY")}</div><p>Safe repair clamps invalid counters and migrates older fields. It does not invent lost cards or reset careers. Structural damage uses a verified backup when available. Restoring a previous save replaces current progress and may lose the newest changes; the replaced data is retained as a recovery copy.</p><label class="fileLabel">IMPORT SAVE / RECOVERY JSON<input id="saveFile" type="file" accept="application/json,.json"></label><p>Storage failure or blocked browser storage is reported. Export a copy before clearing browser data.</p></div>`;
}
