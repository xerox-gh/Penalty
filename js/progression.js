// Offline-only metagame. No clock-based rewards, real-money purchases, requests or accounts.
export const SAVE_KEY = "penalty.club.v1";
export const POSITIONS = ["GK", "DEF", "MID", "MID", "FWD"];
const names = [
  "ALVES",
  "COSTA",
  "HART",
  "OKAFOR",
  "NOVAK",
  "SOLANO",
  "RIVERA",
  "REED",
  "DIARRA",
  "ISHIKAWA",
  "MERCER",
  "VIDAL",
  "MORGAN",
  "SANTOS",
  "SILVA",
  "KIM",
  "BAPTISTE",
  "MOREAU",
  "BLAKE",
  "DIAZ",
  "MASON",
  "ADEYEMI",
  "ROSSI",
  "VEGA",
];
export const CARDS = names.map((name, i) => {
  const n = i % 6,
    rating = [64, 66, 71, 76, 82, 88][n];
  return {
    id: `p${i + 1}`,
    name,
    position: ["GK", "DEF", "MID", "FWD"][Math.floor(i / 6)],
    rating,
    rarity: n < 2 ? "Club" : n < 4 ? "Rare" : n === 4 ? "Elite" : "Legend",
    pace: Math.min(94, rating + (i % 3) * 2),
    shoot: Math.min(94, rating + (i % 4) - 1),
    pass: Math.min(94, rating + 2 - (i % 3)),
    appearance: i,
  };
});
// Stable IDs preserve existing collections and backups when the catalog expands.
export const RARITIES = [
  "Club",
  "Rare",
  "Elite",
  "Legend",
  "Heroes",
  "Icon",
  "Glory",
];
const specialRosters = {
  Heroes: [
    ["Tomas Vreld", "FWD", 89],
    ["Kaito Marenz", "MID", 88],
    ["Luca Brandt", "DEF", 88],
    ["Dario Quellan", "MID", 87],
    ["Emeka Torvald", "MID", 87],
    ["Ivo Strand", "GK", 86],
    ["Nico Valdeur", "DEF", 85],
    ["Soren Aldric", "MID", 85],
    ["Marek Ostrava", "FWD", 84],
    ["Yusuf Karimov", "DEF", 84],
  ],
  Icon: [
    ["Rafael Montclair", "MID", 97],
    ["Anselmo Draven", "FWD", 96],
    ["Viktor Halloran", "DEF", 95],
    ["Enzo Barosso", "MID", 94],
    ["Mateus Corbell", "FWD", 94],
    ["Henrik Valstrom", "GK", 93],
    ["Dmitri Kessler", "FWD", 92],
    ["Leandro Ferraz", "DEF", 91],
    ["Oskar Lindqvist", "MID", 91],
    ["Tariq Benali", "MID", 90],
  ],
  Glory: [
    ["Aurelio Zenith", "MID", 99],
    ["Kaspar Nightingale", "FWD", 98],
    ["Valen Ashgrove", "MID", 97],
    ["Ibrahim Solari", "DEF", 96],
    ["Matteo Crestfall", "MID", 96],
    ["Lothar Emberg", "GK", 95],
    ["Jericho Vale", "DEF", 95],
    ["Santiago Dawnbridge", "FWD", 94],
  ],
};
for (const [rarity, roster] of Object.entries(specialRosters)) {
  roster.forEach(([name, position, rating], index) => {
    const appearance = CARDS.length;
    CARDS.push({
      id: `${rarity.toLowerCase()}${index + 1}`,
      name,
      position,
      rating,
      rarity,
      pace: Math.min(99, rating + (index % 3) - 1),
      shoot: Math.min(99, rating + (index % 4) - 1),
      pass: Math.min(99, rating + 1 - (index % 3)),
      appearance,
    });
  });
}
// Each shop slot independently rolls a rarity, then a uniform card in that rarity.
// No hidden guarantees: the exact per-slot percentages are displayed in the shop.
export const PACKS = [
  {
    id: "club",
    name: "Club Pack",
    cost: 150,
    odds: [65, 25, 8, 2, 0, 0, 0],
    description: "Build your foundations. Club through Legend.",
  },
  {
    id: "elite",
    name: "Elite Pack",
    cost: 450,
    odds: [0, 25, 35, 25, 12, 2.5, 0.5],
    description: "Rare or better, with a chance at the special tiers.",
  },
  {
    id: "heroes",
    name: "Heroes Pack",
    cost: 1000,
    odds: [0, 0, 15, 25, 45, 12, 3],
    description: "Elite or better. The best chance to recruit a Hero.",
  },
  {
    id: "glory",
    name: "Glory Pack",
    cost: 2400,
    odds: [0, 0, 0, 15, 25, 35, 25],
    description: "Legend or better. Chase Icons and Glory players.",
  },
];
export function drawShopCard(pack, random) {
  let roll = random() * 100,
    rarity = RARITIES.at(-1);
  for (let i = 0; i < pack.odds.length; i++) {
    roll -= pack.odds[i];
    if (roll < 0) {
      rarity = RARITIES[i];
      break;
    }
  }
  const pool = CARDS.filter((c) => c.rarity === rarity);
  return pool[Math.floor(random() * pool.length)];
}
export const CLUBS = [
  { id: 0, name: "YOUR CLUB", color: "#edf1f5" },
  { id: 1, name: "RIVERSIDE", color: "#cf3046" },
  { id: 2, name: "NORTHBOROUGH", color: "#2871b9" },
  { id: 3, name: "ATLAS SC", color: "#e9b63e" },
  { id: 4, name: "GREENPORT", color: "#268879" },
  { id: 5, name: "OLD TOWN", color: "#6638a4" },
  { id: 6, name: "VALE UNITED", color: "#ef8151" },
  { id: 7, name: "COAST FC", color: "#66aec1" },
];
export const KITS = [
  { id: "cloud", name: "Cloud home", color: "#edf1f5", cost: 0 },
  { id: "royal", name: "Royal blue", color: "#407acb", cost: 180 },
  { id: "sunset", name: "Sunset orange", color: "#e88c42", cost: 180 },
  { id: "mint", name: "Mint away", color: "#48b998", cost: 220 },
  { id: "violet", name: "Violet nights", color: "#8c65d3", cost: 260 },
];
export const CHALLENGES = [
  {
    id: "comeback",
    name: "The comeback",
    description: "Start 0–2 down. Win in two minutes.",
    duration: 120,
    awayGoals: 2,
    goalTarget: 0,
  },
  {
    id: "clean",
    name: "Lock it down",
    description: "Win a 90-second game without conceding.",
    duration: 90,
    awayGoals: 0,
    goalTarget: 0,
  },
  {
    id: "three",
    name: "Triple threat",
    description:
      "Score three goals in 90 seconds. Reach three to finish early.",
    duration: 90,
    awayGoals: 0,
    goalTarget: 3,
  },
];
export const QUESTS = [
  {
    id: "debut",
    title: "First whistle",
    stat: "matches",
    target: 1,
    coins: 50,
    xp: 50,
    packs: 1,
  },
  {
    id: "scorer",
    title: "Off the mark",
    stat: "goals",
    target: 1,
    coins: 40,
    xp: 30,
  },
  {
    id: "builder",
    title: "Build the move",
    stat: "passes",
    target: 15,
    coins: 70,
    xp: 60,
  },
  {
    id: "winner",
    title: "Winning habit",
    stat: "wins",
    target: 3,
    coins: 100,
    xp: 100,
    packs: 1,
  },
  {
    id: "finisher",
    title: "Double figures",
    stat: "goals",
    target: 10,
    coins: 120,
    xp: 80,
  },
  {
    id: "collector",
    title: "Recruitment drive",
    stat: "collection",
    target: 10,
    coins: 100,
    xp: 100,
    packs: 1,
  },
  {
    id: "regular",
    title: "Club regular",
    stat: "matches",
    target: 10,
    coins: 150,
    xp: 120,
  },
  {
    id: "challenge",
    title: "Against the odds",
    stat: "challengeWins",
    target: 1,
    coins: 100,
    xp: 80,
    packs: 1,
  },
  {
    id: "cup",
    title: "Silverware",
    stat: "cups",
    target: 1,
    coins: 150,
    xp: 150,
    packs: 1,
  },
  {
    id: "album",
    title: "Collect 24 players",
    stat: "collection",
    target: 24,
    coins: 500,
    xp: 250,
    packs: 2,
  },
];
QUESTS.push({
  id: "fullalbum",
  title: "The complete collection",
  stat: "collection",
  target: CARDS.length,
  coins: 1500,
  xp: 500,
  packs: 3,
});
export const CONTRACTS = [
  {
    id: "play",
    title: "Play three matches",
    stat: "matches",
    target: 3,
    coins: 60,
    xp: 40,
  },
  {
    id: "goals",
    title: "Score five goals",
    stat: "goals",
    target: 5,
    coins: 60,
    xp: 40,
  },
  {
    id: "passes",
    title: "Complete ten passes",
    stat: "passes",
    target: 10,
    coins: 60,
    xp: 40,
    packs: 1,
  },
];
const statsKeys = [
  "matches",
  "wins",
  "draws",
  "goals",
  "passes",
  "shots",
  "cleanSheets",
  "packs",
  "challengeWins",
  "cups",
];
const clone = (x) => JSON.parse(JSON.stringify(x));
export const level = (xp) => 1 + Math.floor(xp / 300);
export function schedule() {
  let circle = [0, 1, 2, 3, 4, 5];
  const rounds = [];
  for (let r = 0; r < 5; r++) {
    rounds.push(
      Array.from({ length: 3 }, (_, i) =>
        r % 2 ? [circle[5 - i], circle[i]] : [circle[i], circle[5 - i]],
      ),
    );
    circle = [circle[0], circle[5], ...circle.slice(1, 5)];
  }
  return [...rounds, ...rounds.map((round) => round.map(([a, b]) => [b, a]))];
}
export const SCHEDULE = schedule();
export function newCareer(season = 1, division = 3) {
  return {
    season,
    division,
    round: 0,
    table: CLUBS.slice(0, 6).map((c) => ({
      id: c.id,
      played: 0,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0,
      pts: 0,
    })),
    history: [],
    lastFinish: null,
  };
}
export const tableOrder = (career) =>
  [...career.table].sort(
    (a, b) =>
      b.pts - a.pts ||
      b.gf - b.ga - (a.gf - a.ga) ||
      b.gf - a.gf ||
      a.id - b.id,
  );
export function freshSave() {
  return {
    version: 1,
    revision: 0,
    serial: 0,
    clubName: "NORTH CITY",
    coins: 120,
    xp: 0,
    packs: 1,
    rng: 47812,
    owned: ["p1", "p7", "p13", "p14", "p19"],
    squad: ["p1", "p7", "p13", "p14", "p19"],
    kits: ["cloud"],
    kit: "cloud",
    stats: Object.fromEntries(statsKeys.map((k) => [k, 0])),
    claimed: [],
    contracts: {
      number: 1,
      base: Object.fromEntries(statsKeys.map((k) => [k, 0])),
      claimed: [],
    },
    career: newCareer(),
    cup: { round: 0, attempt: 1, status: "ready" },
    challenges: [],
    trophies: [],
    pending: null,
    lastReward: null,
  };
}
function validInt(n, max = 100000000) {
  return Number.isSafeInteger(n) && n >= 0 && n <= max;
}
function need(value, message) {
  if (!value) throw new Error(message);
}
const isCard = (id) => CARDS.some((c) => c.id === id);
const unique = (list) => new Set(list).size === list.length;
// Import validation builds no HTML and only accepts the current, bounded save schema.
export function validateSave(source) {
  const d = clone(source);
  need(d?.version === 1, "Unsupported save version.");
  for (const key of ["revision", "serial", "coins", "xp", "packs", "rng"])
    need(
      validInt(d[key], key === "rng" ? 4294967295 : 100000000),
      "Invalid save counters.",
    );
  need(
    typeof d.clubName === "string" &&
      d.clubName.trim().length > 0 &&
      d.clubName.length <= 18,
    "Invalid club name.",
  );
  need(
    Array.isArray(d.owned) &&
      d.owned.length <= CARDS.length &&
      d.owned.every(isCard) &&
      unique(d.owned),
    "Invalid collection.",
  );
  need(
    Array.isArray(d.squad) &&
      d.squad.length === 5 &&
      unique(d.squad) &&
      d.squad.every(
        (id, i) =>
          d.owned.includes(id) &&
          CARDS.find((c) => c.id === id)?.position === POSITIONS[i],
      ),
    "Invalid squad.",
  );
  need(
    Array.isArray(d.kits) &&
      unique(d.kits) &&
      d.kits.every((id) => KITS.some((k) => k.id === id)) &&
      d.kits.includes(d.kit),
    "Invalid kits.",
  );
  for (const container of [d.stats, d.contracts?.base])
    need(
      container && statsKeys.every((k) => validInt(container[k])),
      "Invalid statistics.",
    );
  need(
    Array.isArray(d.claimed) &&
      unique(d.claimed) &&
      d.claimed.every((id) => QUESTS.some((q) => q.id === id)),
    "Invalid quests.",
  );
  need(
    validInt(d.contracts.number) &&
      Array.isArray(d.contracts.claimed) &&
      unique(d.contracts.claimed) &&
      d.contracts.claimed.every((id) => CONTRACTS.some((q) => q.id === id)),
    "Invalid contracts.",
  );
  const c = d.career;
  need(
    c &&
      validInt(c.season, 10000) &&
      c.season > 0 &&
      [1, 2, 3].includes(c.division) &&
      validInt(c.round, 10),
    "Invalid career.",
  );
  need(
    Array.isArray(c.table) &&
      c.table.length === 6 &&
      unique(c.table.map((t) => t.id)) &&
      c.table.every(
        (t) =>
          validInt(t.id, 5) &&
          ["played", "w", "d", "l", "gf", "ga", "pts"].every((k) =>
            validInt(t[k], 10000),
          ) &&
          t.played === c.round &&
          t.w + t.d + t.l === t.played &&
          t.pts === t.w * 3 + t.d,
      ),
    "Invalid league table.",
  );
  need(
    Array.isArray(c.history) &&
      c.history.length === c.round &&
      c.history.every(
        (h) =>
          validInt(h.gf, 100) &&
          validInt(h.ga, 100) &&
          validInt(h.opponent, 5) &&
          h.opponent > 0,
      ),
    "Invalid fixtures.",
  );
  need(
    c.lastFinish === null ||
      (c.lastFinish &&
        validInt(c.lastFinish.rank, 6) &&
        c.lastFinish.rank > 0 &&
        typeof c.lastFinish.promoted === "boolean"),
    "Invalid season result.",
  );
  need(
    d.cup &&
      validInt(d.cup.round, 3) &&
      validInt(d.cup.attempt) &&
      ["ready", "active", "won", "out"].includes(d.cup.status) &&
      (d.cup.round === 3 ? d.cup.status === "won" : d.cup.status !== "won"),
    "Invalid cup.",
  );
  need(
    Array.isArray(d.challenges) &&
      unique(d.challenges) &&
      d.challenges.every((id) => CHALLENGES.some((c) => c.id === id)),
    "Invalid challenge record.",
  );
  need(
    Array.isArray(d.trophies) &&
      d.trophies.length <= 100 &&
      d.trophies.every((t) => typeof t === "string" && t.length <= 80),
    "Invalid trophies.",
  );
  if (d.pending) {
    const p = d.pending;
    need(
      validInt(p.id) &&
        p.id <= d.serial &&
        ["quick", "career", "cup", "challenge"].includes(p.kind) &&
        validInt(p.opponent, 7),
      "Invalid pending match.",
    );
    need(
      p.kind !== "challenge" || CHALLENGES.some((c) => c.id === p.challenge),
      "Invalid pending challenge.",
    );
    need(
      p.kind !== "career" ||
        (p.round === c.round && p.season === c.season && c.round < 10),
      "Invalid pending fixture.",
    );
  }
  d.lastReward = null;
  return d;
}
export class Progression {
  constructor(storage) {
    this.storage = storage;
    this.message = "";
    this.corrupt = null;
    try {
      const raw = storage?.getItem(SAVE_KEY);
      this.data = raw ? validateSave(JSON.parse(raw)) : freshSave();
      if (!storage)
        this.message =
          "Device storage is unavailable. Export a backup before closing.";
    } catch (error) {
      this.corrupt = storage
        ? (() => {
            try {
              return storage.getItem(SAVE_KEY);
            } catch {
              return null;
            }
          })()
        : null;
      this.data = freshSave();
      this.message = this.corrupt
        ? "The stored save could not be read. Export the recovery file or import a valid backup before continuing."
        : "Device storage is unavailable. This session can still be exported.";
      if (!this.corrupt) this.storage = null;
    }
  }
  save(data) {
    need(!this.corrupt, "Import a valid backup to recover your save first.");
    data.revision = (this.data.revision || 0) + 1;
    try {
      if (!this.storage) throw new Error("unavailable");
      this.storage.setItem(SAVE_KEY, JSON.stringify(data));
      this.message = "Saved on this device.";
    } catch {
      this.message =
        "Progress is only in this tab: device saving failed. Export a backup before closing.";
    }
    this.data = data;
  }
  change(fn) {
    const d = clone(this.data);
    const result = fn(d);
    this.save(d);
    return result;
  }
  progress(q, contract = false) {
    if (q.stat === "collection") return this.data.owned.length;
    return Math.max(
      0,
      this.data.stats[q.stat] -
        (contract ? this.data.contracts.base[q.stat] : 0),
    );
  }
  reward(d, coins, xp, packs = 0) {
    const old = level(d.xp);
    d.coins += coins;
    d.xp += xp;
    const earned = level(d.xp) - old;
    d.packs += packs + earned;
    return { coins, xp, packs: packs + earned };
  }
  rename(name) {
    name = String(name).trim().slice(0, 18);
    need(name, "Enter a club name.");
    this.change((d) => {
      d.clubName = name;
    });
  }
  equip(slot, id) {
    need(
      Number.isInteger(slot) && slot >= 0 && slot < 5,
      "Invalid squad slot.",
    );
    this.change((d) => {
      need(
        !d.pending,
        "Finish or abandon the pending match before changing the squad.",
      );
      const card = CARDS.find((c) => c.id === id);
      need(
        d.owned.includes(id) && card?.position === POSITIONS[slot],
        "Choose an owned card for this position.",
      );
      const previous = d.squad.indexOf(id);
      if (previous >= 0)
        [d.squad[previous], d.squad[slot]] = [d.squad[slot], id];
      else d.squad[slot] = id;
    });
  }
  kit(id) {
    this.change((d) => {
      need(!d.pending, "Finish the pending match before changing kits.");
      const kit = KITS.find((k) => k.id === id);
      need(kit, "Unknown kit.");
      if (!d.kits.includes(id)) {
        need(d.coins >= kit.cost, "Not enough coins.");
        d.coins -= kit.cost;
        d.kits.push(id);
      }
      d.kit = id;
    });
  }
  claim(id, contract = false) {
    return this.change((d) => {
      const list = contract ? CONTRACTS : QUESTS,
        q = list.find((q) => q.id === id),
        claimed = contract ? d.contracts.claimed : d.claimed;
      need(
        q && !claimed.includes(id),
        "Reward already claimed or unavailable.",
      );
      need(this.progress(q, contract) >= q.target, "Objective not complete.");
      claimed.push(id);
      const reward = this.reward(d, q.coins, q.xp, q.packs || 0);
      if (contract && d.contracts.claimed.length === CONTRACTS.length)
        d.contracts = {
          number: d.contracts.number + 1,
          base: { ...d.stats },
          claimed: [],
        };
      return reward;
    });
  }
  openPack() {
    return this.change((d) => {
      need(d.packs > 0, "Earn a pack from matches, levels or quests.");
      d.packs--;
      d.stats.packs++;
      const result = [];
      const rand = () => {
        d.rng = (Math.imul(d.rng, 1664525) + 1013904223) >>> 0;
        return d.rng / 4294967296;
      };
      for (let i = 0; i < 3; i++) {
        const missing = CARDS.filter((c) => !d.owned.includes(c.id)),
          pool = i === 0 && missing.length ? missing : CARDS;
        const card = pool[Math.floor(rand() * pool.length)],
          duplicate = d.owned.includes(card.id);
        if (duplicate) d.coins += 20;
        else d.owned.push(card.id);
        result.push({ ...card, duplicate });
      }
      return result;
    });
  }
  // Deduction, draws and duplicate refunds commit in one saved transaction.
  buyPack(id) {
    const pack = PACKS.find((p) => p.id === id);
    need(pack, "Unknown pack.");
    return this.change((d) => {
      need(d.coins >= pack.cost, "Not enough coins for this pack.");
      d.coins -= pack.cost;
      d.stats.packs++;
      const random = () => {
        d.rng = (Math.imul(d.rng, 1664525) + 1013904223) >>> 0;
        return d.rng / 4294967296;
      };
      return Array.from({ length: 3 }, () => {
        const card = drawShopCard(pack, random),
          duplicate = d.owned.includes(card.id);
        if (duplicate) d.coins += 20;
        else d.owned.push(card.id);
        return { ...card, duplicate };
      });
    });
  }
  begin(kind, challenge) {
    return this.change((d) => {
      need(!d.pending, "Resume or abandon your pending match first.");
      need(
        ["quick", "career", "cup", "challenge"].includes(kind),
        "Unknown mode.",
      );
      let opponent = 1;
      const p = { id: ++d.serial, kind, opponent };
      if (kind === "career") {
        need(d.career.round < 10, "Start the next season first.");
        const fixture = SCHEDULE[d.career.round].find((f) => f.includes(0));
        p.opponent = fixture.find((id) => id !== 0);
        p.round = d.career.round;
        p.season = d.career.season;
      }
      if (kind === "cup") {
        if (["won", "out"].includes(d.cup.status))
          d.cup = { round: 0, attempt: d.cup.attempt + 1, status: "ready" };
        p.opponent = [6, 7, 3][d.cup.round];
        d.cup.status = "active";
      }
      if (kind === "challenge") {
        need(
          CHALLENGES.some((c) => c.id === challenge),
          "Unknown challenge.",
        );
        p.challenge = challenge;
        p.opponent = 4;
      }
      d.pending = p;
      return clone(p);
    });
  }
  abandon() {
    this.change((d) => {
      d.pending = null;
    });
  }
  nextSeason() {
    this.change((d) => {
      need(!d.pending && d.career.round === 10, "Finish the season first.");
      const rank = tableOrder(d.career).findIndex((t) => t.id === 0) + 1;
      d.career = newCareer(
        d.career.season + 1,
        rank <= 2 ? Math.max(1, d.career.division - 1) : d.career.division,
      );
    });
  }
  complete(id, result) {
    if (!this.data.pending || this.data.pending.id !== id) return null;
    for (const k of ["gf", "ga", "passes", "shots"])
      need(
        validInt(result[k], k === "gf" || k === "ga" ? 100 : 10000),
        "Invalid match result.",
      );
    return this.change((d) => {
      const p = d.pending;
      d.pending = null;
      const win = result.gf > result.ga,
        draw = result.gf === result.ga;
      d.stats.matches++;
      d.stats.wins += +win;
      d.stats.draws += +draw;
      d.stats.goals += result.gf;
      d.stats.passes += result.passes;
      d.stats.shots += result.shots;
      if (win && result.ga === 0) d.stats.cleanSheets++;
      let coins = 30 + result.gf * 10 + (win ? 50 : draw ? 25 : 0),
        xp = 40 + result.gf * 5 + (win ? 30 : 0),
        packs = 0;
      const notes = [];
      const trophy = (t) => {
        if (d.trophies.length < 100) d.trophies.push(t);
      };
      if (p.kind === "career") {
        const c = d.career;
        need(
          c.round === p.round && c.season === p.season,
          "This fixture was already processed.",
        );
        for (const [a, b] of SCHEDULE[c.round]) {
          let ag, bg;
          if (a === 0) {
            ag = result.gf;
            bg = result.ga;
          } else if (b === 0) {
            ag = result.ga;
            bg = result.gf;
          } else {
            ag = (c.season * 7 + c.round * 3 + a * 5) % 4;
            bg = (c.season * 3 + c.round * 7 + b * 2) % 4;
          }
          const ta = c.table.find((t) => t.id === a),
            tb = c.table.find((t) => t.id === b);
          ta.played++;
          tb.played++;
          ta.gf += ag;
          ta.ga += bg;
          tb.gf += bg;
          tb.ga += ag;
          if (ag === bg) {
            ta.d++;
            tb.d++;
            ta.pts++;
            tb.pts++;
          } else {
            const winner = ag > bg ? ta : tb,
              loser = ag > bg ? tb : ta;
            winner.w++;
            winner.pts += 3;
            loser.l++;
          }
        }
        c.history.push({ gf: result.gf, ga: result.ga, opponent: p.opponent });
        c.round++;
        if (c.round === 10) {
          const rank = tableOrder(c).findIndex((t) => t.id === 0) + 1,
            promoted = rank <= 2 && c.division > 1;
          c.lastFinish = { rank, promoted };
          coins += rank === 1 ? 400 : 150;
          xp += 150;
          packs += rank === 1 ? 2 : 1;
          notes.push(
            `Season ${c.season}: finished ${rank}${promoted ? " • Promotion earned" : ""}`,
          );
          if (rank === 1)
            trophy(`Division ${c.division} champion · Season ${c.season}`);
        }
      }
      if (p.kind === "cup") {
        if (win) {
          d.cup.round++;
          if (d.cup.round === 3) {
            d.cup.status = "won";
            d.stats.cups++;
            coins += 200;
            xp += 150;
            packs += 2;
            trophy(`Knockout Cup · Win ${d.stats.cups}`);
            notes.push("Cup champions!");
          }
        } else {
          d.cup.status = "out";
          notes.push("Cup run ended. Start a new run from the hub.");
        }
      }
      if (p.kind === "challenge") {
        const success =
          p.challenge === "comeback"
            ? win
            : p.challenge === "clean"
              ? win && result.ga === 0
              : result.gf >= 3;
        if (success) {
          d.stats.challengeWins++;
          if (!d.challenges.includes(p.challenge)) {
            d.challenges.push(p.challenge);
            coins += 100;
            xp += 100;
            packs++;
            notes.push("Challenge badge unlocked!");
          }
        } else
          notes.push(
            "Challenge objective not met. Match rewards still earned.",
          );
      }
      const reward = this.reward(d, coins, xp, packs);
      d.lastReward = { ...reward, notes, mode: p.kind };
      return clone(d.lastReward);
    });
  }
  export() {
    return this.corrupt || JSON.stringify(this.data, null, 2);
  }
  import(text) {
    need(
      typeof text === "string" && text.length <= 200000,
      "Save file is too large.",
    );
    const d = validateSave(JSON.parse(text));
    this.corrupt = null;
    this.save(d);
    return true;
  }
}
