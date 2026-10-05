import {
  Progression,
  CARDS,
  PACKS,
  RARITIES,
  CLUBS,
  KITS,
  CHALLENGES,
  QUESTS,
  CONTRACTS,
  POSITIONS,
  SCHEDULE,
  tableOrder,
  level,
} from "./progression.js";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const button = (action, label, disabled = false) =>
  `<button data-club="${action}" ${disabled ? "disabled" : ""}>${label}</button>`;
export class Club {
  constructor(game) {
    this.game = game;
    let storage;
    try {
      storage = localStorage;
    } catch {}
    this.save = new Progression(storage);
    this.tab = "play";
    this.message = "";
    this.reveal = [];
    this.el = document.getElementById("clubHub");
    this.el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-club]");
      if (b) this.act(b.dataset.club);
    });
    this.el.addEventListener("change", (e) => {
      try {
        if (e.target.dataset.slot !== undefined)
          this.save.equip(+e.target.dataset.slot, e.target.value);
        if (e.target.id === "clubName") this.save.rename(e.target.value);
        if (e.target.id === "saveFile") this.importFile(e.target.files[0]);
        else this.render();
      } catch (err) {
        this.message = err.message;
        this.render();
      }
    });
    this.render();
  }
  show() {
    this.game.input.clear();
    this.game.state.set("hub");
    this.render();
  }
  async importFile(file) {
    if (!file) return;
    try {
      if (file.size > 200000) throw Error("Save file is too large.");
      this.save.import(await file.text());
      this.message = "Backup restored.";
    } catch (e) {
      this.message = `Import failed: ${e.message}`;
    }
    this.render();
  }
  act(action) {
    try {
      this.game.audio.start();
      this.game.audio.play("ui");
      const [verb, id] = action.split(":");
      if (verb === "tab") {
        this.tab = id;
        this.reveal = [];
      } else if (verb === "quick") {
        if (this.save.data.pending)
          throw Error("Resume or abandon the unfinished match first.");
        this.game.state.set("menu");
        return;
      } else if (verb === "start") {
        this.game.startMode(id);
        return;
      } else if (verb === "challenge") {
        this.game.startMode("challenge", id);
        return;
      } else if (verb === "resume") {
        this.game.startMode(null);
        return;
      } else if (verb === "abandon") {
        this.save.abandon();
        this.message = "Unfinished match abandoned. No rewards awarded.";
      } else if (verb === "buy") {
        this.reveal = this.save.buyPack(id);
        this.message = `${PACKS.find((p) => p.id === id).name} opened. Three cards added; duplicates refund 20 coins each.`;
      } else if (verb === "pack") {
        this.reveal = this.save.openPack();
        this.message =
          "Three players revealed. Duplicates convert to 20 coins each.";
      } else if (verb === "claim" || verb === "contract") {
        const r = this.save.claim(id, verb === "contract");
        this.message = `Claimed +${r.coins} coins, +${r.xp} XP${r.packs ? `, +${r.packs} packs` : ""}.`;
      } else if (verb === "kit") {
        this.save.kit(id);
        this.message = "Kit equipped.";
      } else if (verb === "season") {
        this.save.nextSeason();
        this.message = "A new season begins.";
      } else if (verb === "export") {
        const url = URL.createObjectURL(
          new Blob([this.save.export()], { type: "application/json" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = "penalty-club-backup.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.message = "Backup downloaded.";
      }
      this.render();
    } catch (e) {
      this.message = e.message;
      this.render();
    }
  }
  card(c, owned = true, duplicate = false) {
    const skin = ["#dab08c", "#8e6045", "#e6bb97", "#624333", "#b77e58"][
        c.appearance % 5
      ],
      hair = ["#29231f", "#784a2d", "#d9b36e"][c.appearance % 3];
    return `<article class="playerCard ${c.rarity.toLowerCase()} ${owned ? "" : "locked"}"><div class="cardTop"><b>${c.rating}</b><span>${c.position}<small>${c.rarity}</small></span></div><svg viewBox="0 0 160 115" aria-hidden="true"><path d="M20 115L30 75 61 63H99L131 76 141 115" fill="${KITS.find((k) => k.id === this.save.data.kit).color}"/><path d="M65 65L80 82 96 65" fill="#172e45"/><path d="M69 53H92V72L80 77 69 70" fill="${skin}"/><path d="M53 18L65 6H96L109 22 103 50 89 64H73L58 50Z" fill="${skin}"/><path d="M53 29L51 16 65 3H98L110 19 106 31 96 20 67 17 57 36" fill="${hair}"/><path d="M63 35H72M88 35H97M76 51H88" stroke="#30251f" stroke-width="3"/><path d="M79 35L77 44H83" stroke="#0003" fill="none"/><path d="M111 87H119V97H111Z" fill="#e7c866"/></svg><h3>${c.name}</h3><div class="cardStats"><span>${c.pace} PAC</span><span>${c.shoot} SHO</span><span>${c.pass} PAS</span></div><small>${duplicate ? "DUPLICATE · +20 COINS" : owned ? "IN YOUR CLUB" : "NOT COLLECTED"}</small></article>`;
  }
  quest(q, contract = false) {
    const d = this.save.data,
      n = Math.min(q.target, this.save.progress(q, contract)),
      claimed = (contract ? d.contracts.claimed : d.claimed).includes(q.id);
    return `<article class="quest"><h3>${q.title}</h3><p>${n} / ${q.target} ${q.stat}</p><progress max="${q.target}" value="${n}"></progress><small>${q.coins} coins · ${q.xp} XP${q.packs ? ` · ${q.packs} pack` : ""}</small>${button(`${contract ? "contract" : "claim"}:${q.id}`, claimed ? "CLAIMED" : "CLAIM REWARD", claimed || n < q.target)}</article>`;
  }
  render() {
    const d = this.save.data,
      c = d.career,
      locked = !!d.pending;
    let body = "";
    if (this.tab === "play") {
      body = `<div class="clubIntro"><div><span class="eyebrow">YOUR CLUB. YOUR STORY.</span><h1>MAKE IT<br>COUNT.</h1><p>Build a squad. Chase silverware. Every match matters.</p></div><label>CLUB NAME<input id="clubName" maxlength="18" value="${esc(d.clubName)}" ${locked ? "disabled" : ""}></label></div><div class="modeCards"><article><small>THE LONG GAME</small><h2>CLUB CAREER</h2><p>Division ${c.division} · Season ${c.season}<br>10 fixtures. Top two earn promotion.</p>${button("tab:career", "VIEW SEASON →")}</article><article><small>THREE WINS FROM GLORY</small><h2>KNOCKOUT CUP</h2><p>${["Quarter-final", "Semi-final", "Final", "Champions"][d.cup.round]} · ${d.cup.status === "out" ? "Eliminated. Start a new run." : d.cup.status === "won" ? "Trophy secured. Defend it." : "Golden goal settles every tie."}</p>${button("start:cup", "ENTER CUP →", locked)}</article><article><small>STRAIGHT TO THE PITCH</small><h2>KICK OFF</h2><p>Custom matches, arena rules<br>and local two-player.</p>${button("quick", "MATCH SETUP →", locked)}</article></div><h2>MATCHDAY CHALLENGES</h2><div class="questGrid">${CHALLENGES.map((x) => `<article class="quest"><small>${d.challenges.includes(x.id) ? "COMPLETED ✓" : "FIRST WIN: 100 COINS + 1 PACK"}</small><h3>${x.name}</h3><p>${x.description}</p>${button("challenge:" + x.id, "TAKE THE CHALLENGE", locked)}</article>`).join("")}</div>`;
    }
    if (this.tab === "career") {
      const fixture =
          c.round < 10 ? SCHEDULE[c.round].find((f) => f.includes(0)) : null,
        opponent = fixture ? CLUBS[fixture.find((i) => i !== 0)] : null;
      body = `<div class="sectionHeading"><div><span class="eyebrow">DIVISION ${c.division} / SEASON ${c.season}</span><h2>${opponent ? `NEXT: ${opponent.name}` : "SEASON COMPLETE"}</h2><p>${opponent ? `Matchday ${c.round + 1} of 10 · 2 minutes · ${["Hard", "Medium", "Easy"][c.division - 1]}` : `Finished ${c.lastFinish?.rank || "—"} of 6. ${c.lastFinish?.promoted ? "Promotion earned!" : "Time to go again."}`}</p></div>${button(opponent ? "start:career" : "season", opponent ? "PLAY FIXTURE →" : "START NEXT SEASON →", locked)}</div><div class="tableScroll"><table><thead><tr><th>POS</th><th>CLUB</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>PTS</th></tr></thead><tbody>${tableOrder(
        c,
      )
        .map(
          (r, i) =>
            `<tr class="${r.id === 0 ? "yourClub" : ""}"><td>${i + 1}</td><td>${esc(r.id ? CLUBS[r.id].name : d.clubName)}</td><td>${r.played}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf - r.ga}</td><td><b>${r.pts}</b></td></tr>`,
        )
        .join(
          "",
        )}</tbody></table></div><h3>SEASON RESULTS</h3><div class="resultsList">${c.history.map((r) => `<span>${CLUBS[r.opponent].name} <b>${r.gf} – ${r.ga}</b></span>`).join("") || "<p>Your story starts at the first whistle.</p>"}</div>`;
    }
    if (this.tab === "squad") {
      body = `<div class="sectionHeading"><div><span class="eyebrow">${d.owned.length} / ${CARDS.length} COLLECTED</span><h2>YOUR STARTING FIVE</h2><p>Cards change your players and grant small pace, shot and pass boosts.</p></div>${button("pack", `OPEN PACK · ${d.packs} AVAILABLE`, !d.packs)}</div>${this.reveal.length ? `<div class="packReveal"><h3>WELCOME TO THE CLUB</h3><div class="cardGrid">${this.reveal.map((c) => this.card(c, true, c.duplicate)).join("")}</div></div>` : ""}<div class="squadSlots">${d.squad
        .map(
          (id, i) =>
            `<label>${POSITIONS[i]}<select data-slot="${i}" ${locked ? "disabled" : ""}>${CARDS.filter(
              (c) => c.position === POSITIONS[i] && d.owned.includes(c.id),
            )
              .map(
                (c) =>
                  `<option value="${c.id}" ${c.id === id ? "selected" : ""}>${c.name} · ${c.rating}</option>`,
              )
              .join("")}</select></label>`,
        )
        .join(
          "",
        )}</div><div class="cardGrid">${CARDS.map((c) => this.card(c, d.owned.includes(c.id))).join("")}</div><p>Every pack contains three cards and guarantees one new card until your album is complete. Duplicates become coins. Earn packs from quests, level-ups and trophies.</p>`;
    }
    if (this.tab === "shop") {
      body = `<div class="sectionHeading"><div><span class="eyebrow">EARN IT ON THE PITCH</span><h2>THE PACK SHOP</h2><p>Spend your club coins. Every purchase opens three cards immediately.</p></div><strong>${d.coins} COINS</strong></div>
      ${this.reveal.length ? `<div class="packReveal" aria-live="polite"><h3>YOUR NEW SIGNINGS</h3><div class="cardGrid">${this.reveal.map((c) => this.card(c, true, c.duplicate)).join("")}</div></div>` : ""}
      <div class="shopGrid">${PACKS.map((p) => `<article class="shopPack ${p.id}"><div class="packArt"><span>P /</span><b>${p.name.toUpperCase()}</b><small>3 PLAYER CARDS</small></div><h3>${p.name}</h3><p>${p.description}</p><h4>CHANCE PER CARD</h4><ul class="packOdds">${RARITIES.map((r, i) => `<li><span>${r}</span><b>${p.odds[i]}%</b></li>`).join("")}</ul>${button("buy:" + p.id, `BUY & OPEN · ${p.cost} COINS`, d.coins < p.cost)}</article>`).join("")}</div>
      <p>Chances apply independently to each of the three slots, including duplicates. Players within a rarity are equally likely. Pack names do not guarantee that rarity. Duplicates refund 20 coins. No real money or connection required.</p><p>Earned reward packs remain available in Squad & Cards and guarantee one unowned player while your collection is incomplete. Their draws are separate from shop odds.</p>`;
    }
    if (this.tab === "quests")
      body = `<span class="eyebrow">CONTRACT BOARD ${d.contracts.number}</span><h2>GIVE EVERY MATCH A PURPOSE</h2><p>Claim all three contracts to refresh the board. No timers. No daily login.</p><div class="questGrid">${CONTRACTS.map((q) => this.quest(q, true)).join("")}</div><h2>CLUB MILESTONES</h2><div class="questGrid">${QUESTS.map((q) => this.quest(q)).join("")}</div>`;
    if (this.tab === "club")
      body = `<h2>THE KIT ROOM</h2><div class="questGrid">${KITS.map((k) => `<article class="quest"><div class="kitSwatch" style="--kit:${k.color}">P /</div><h3>${k.name}</h3>${button("kit:" + k.id, d.kit === k.id ? "EQUIPPED" : d.kits.includes(k.id) ? "EQUIP" : `${k.cost} COINS`, locked || d.kit === k.id || (!d.kits.includes(k.id) && d.coins < k.cost))}</article>`).join("")}</div><h2>TROPHY CABINET</h2><div class="resultsList">${[...d.trophies, ...d.challenges.map((id) => "Challenge: " + CHALLENGES.find((c) => c.id === id).name)].map((t) => `<span>★ ${esc(t)}</span>`).join("") || "<p>Your first piece of silverware is waiting.</p>"}</div><h2>CLUB RECORD</h2><p>${d.stats.matches} matches · ${d.stats.wins} wins · ${d.stats.goals} goals · ${d.stats.passes} completed passes</p><h2>YOUR OFFLINE SAVE</h2><p>Progress is stored in this browser on this device. Export a backup to keep it when clearing browser data, moving devices or changing site addresses. Import replaces this device’s club.</p><div class="backupActions">${button("export", "EXPORT BACKUP")}<label class="fileLabel">IMPORT BACKUP<input id="saveFile" type="file" accept="application/json,.json"></label></div>`;
    this.el.innerHTML = `<header class="clubHeader"><b>P / FOOTBALL</b><div><span>LEVEL ${level(d.xp)}</span><strong>${d.coins} <small>COINS</small></strong><span>${d.packs} PACKS</span></div></header><nav class="clubTabs" aria-label="Club sections">${[
      ["play", "PLAY"],
      ["career", "CAREER"],
      ["squad", "SQUAD & CARDS"],
      ["shop", "PACK SHOP"],
      ["quests", "QUESTS"],
      ["club", "MY CLUB"],
    ]
      .map(
        ([id, label]) =>
          `<button data-club="tab:${id}" aria-current="${this.tab === id ? "page" : "false"}">${label}</button>`,
      )
      .join(
        "",
      )}</nav><div class="xpTrack"><progress value="${d.xp % 300}" max="300"></progress><small>${d.xp % 300}/300 XP · NEXT LEVEL: 1 PACK</small></div><p class="clubStatus" role="status">${esc([this.message, this.save.message || "OFFLINE CLUB · ALL REWARDS EARNED THROUGH PLAY"].filter(Boolean).join(" · "))}</p>${locked ? `<aside class="pendingMatch"><b>Unfinished ${esc(d.pending.kind)} match</b><span>Resume restarts this fixture from kickoff.</span>${button("resume", "RESUME")}${button("abandon", "ABANDON · NO REWARD")}</aside>` : ""}<div class="clubBody">${body}</div>`;
  }
}
