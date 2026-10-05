import assert from "node:assert/strict";
import {
  Progression,
  SAVE_KEY,
  SCHEDULE,
  validateSave,
  CARDS,
  SHOP_CARDS,
} from "../js/progression.js";
class Storage {
  constructor() {
    this.map = new Map();
  }
  getItem(k) {
    return this.map.get(k) || null;
  }
  setItem(k, v) {
    this.map.set(k, v);
  }
}
const storage = new Storage(),
  p = new Progression(storage);
assert.equal(SCHEDULE.length, 10);
const pairs = new Map();
for (const round of SCHEDULE) {
  assert.equal(new Set(round.flat()).size, 6);
  for (const [a, b] of round)
    pairs.set(`${a}-${b}`, (pairs.get(`${a}-${b}`) || 0) + 1);
}
assert.equal(pairs.size, 30);
assert.ok([...pairs.values()].every((n) => n === 1));
const before = p.data.owned.length;
assert.equal(p.openPack().length, 3);
assert.ok(p.data.owned.length > before);
assert.throws(() => p.openPack());
assert.throws(() => p.equip(0, "p19"));
p.equip(2, "p14");
assert.equal(p.data.squad[3], "p13");
let m = p.begin("career");
assert.throws(() => p.begin("career"));
assert.throws(() => p.equip(2, "p13"));
const resumed = new Progression(storage);
assert.equal(resumed.data.pending.id, m.id);
assert.equal(resumed.data.career.round, 0);
const reward = p.complete(m.id, { gf: 3, ga: 0, passes: 12, shots: 7 });
assert.ok(reward.coins > 0);
const coins = p.data.coins;
assert.equal(p.complete(m.id, { gf: 3, ga: 0, passes: 12, shots: 7 }), null);
assert.equal(p.data.coins, coins);
p.claim("debut");
assert.throws(() => p.claim("debut"));
p.claim("passes", true);
assert.throws(() => p.claim("passes", true));
for (let i = 1; i < 10; i++) {
  m = p.begin("career");
  p.complete(m.id, { gf: 8, ga: 0, passes: 5, shots: 10 });
  validateSave(p.data);
}
assert.equal(p.data.career.round, 10);
assert.equal(p.data.career.lastFinish.rank, 1);
assert.throws(() => p.begin("career"));
p.nextSeason();
assert.equal(p.data.career.division, 2);
assert.equal(p.data.career.round, 0);
for (let i = 0; i < 3; i++) {
  m = p.begin("cup");
  p.complete(m.id, { gf: 2, ga: 0, passes: 0, shots: 3 });
}
assert.equal(p.data.cup.status, "won");
assert.equal(p.data.stats.cups, 1);
m = p.begin("cup");
p.complete(m.id, { gf: 0, ga: 2, passes: 0, shots: 3 });
assert.equal(p.data.cup.status, "out");
m = p.begin("cup");
assert.equal(p.data.cup.round, 0);
p.abandon();
for (const id of ["comeback", "clean", "three"]) {
  m = p.begin("challenge", id);
  p.complete(m.id, { gf: 3, ga: 0, passes: 0, shots: 3 });
}
assert.equal(p.data.challenges.length, 3);
p.kit("royal");
assert.equal(p.data.kit, "royal");
const backup = p.export(),
  restored = new Progression(new Storage());
restored.import(backup);
assert.deepEqual(restored.data.squad, p.data.squad);
assert.equal(restored.data.coins, p.data.coins);
const old = restored.export();
assert.throws(() => restored.import("{bad"));
assert.equal(restored.export(), old);
let invalid = JSON.parse(backup);
invalid.cup.round = 3;
invalid.cup.status = "active";
assert.throws(() => restored.import(JSON.stringify(invalid)));
const broken = new Storage();
broken.setItem(SAVE_KEY, "invalid");
const corrupt = new Progression(broken);
assert.throws(() => corrupt.openPack());
assert.equal(corrupt.export(), "invalid");
corrupt.import(backup);
assert.ok(!corrupt.corrupt);
const denied = new Progression({
  getItem() {
    return null;
  },
  setItem() {
    throw Error("quota");
  },
});
denied.openPack();
assert.match(denied.message, /only in this tab/);
assert.ok(denied.export());
// Guarantee completion without buying packs. Rewards earned from repeated matches.
while (!SHOP_CARDS.every((c) => p.data.owned.includes(c.id))) {
  if (!p.data.packs) {
    m = p.begin("quick");
    p.complete(m.id, { gf: 3, ga: 0, passes: 0, shots: 3 });
  } else p.openPack();
}
assert.ok(SHOP_CARDS.every((c) => p.data.owned.includes(c.id)));
validateSave(p.data);
console.log(
  "PASS: fixtures, season/promotion, cup, challenges, quests, packs, squad, kits, persistence, backup validation, duplicate rewards and storage failures.",
);
