import assert from "node:assert/strict";
import {
  CARDS,
  SHOP_CARDS,
  QUICK_SELL,
  PACKS,
  RARITIES,
  Progression,
  drawShopCard,
  validateSave,
  freshSave,
} from "../js/progression.js";
assert.equal(SHOP_CARDS.length, 112);
assert.equal(new Set(CARDS.map((c) => c.id)).size, 136);
for (const [rarity, count, min, max] of [
  ["Heroes", 10, 84, 89],
  ["Icon", 10, 90, 97],
  ["Glory", 8, 94, 99],
]) {
  const cards = CARDS.filter((c) => c.rarity === rarity);
  assert.equal(cards.length, count);
  assert.ok(cards.every((c) => c.rating >= min && c.rating <= max));
}
assert.equal(CARDS.find((c) => c.name === "Rafael Montclair").rating, 97);
assert.equal(CARDS.find((c) => c.name === "Aurelio Zenith").rating, 99);
// Check every probability interval directly instead of relying on flaky frequency tests.
for (const pack of PACKS) {
  assert.ok(Math.abs(pack.odds.reduce((a, b) => a + b, 0) - 100) < 1e-9);
  let lower = 0;
  pack.odds.forEach((weight, i) => {
    if (weight) {
      const values = [(lower + weight / 2) / 100, 0.5];
      assert.equal(
        drawShopCard(pack, () => values.shift()).rarity,
        RARITIES[i],
      );
    }
    lower += weight;
  });
}
const storage = {
    raw: null,
    getItem() {
      return this.raw;
    },
    setItem(k, v) {
      this.raw = v;
    },
  },
  p = new Progression(storage);
const original = p.export();
assert.throws(() => p.buyPack("glory"), /Not enough/);
assert.equal(p.export(), original);
assert.throws(() => p.buyPack("fake"), /Unknown/);
assert.equal(p.export(), original);
p.change((d) => {
  d.coins = 1000000;
  d.owned = CARDS.map((c) => c.id);
});
for (const pack of PACKS) {
  const coins = p.data.coins,
    packs = p.data.packs,
    count = p.data.stats.packs;
  const result = p.buyPack(pack.id);
  assert.equal(result.length, pack.count);
  assert.ok(result.every((c) => c.duplicate));
  assert.equal(
    p.data.coins,
    coins -
      pack.cost +
      result.reduce((sum, c) => sum + QUICK_SELL[c.rarity], 0),
  );
  assert.equal(p.data.packs, packs);
  assert.equal(p.data.stats.packs, count + 1);
  assert.ok(result.every((c) => pack.odds[RARITIES.indexOf(c.rarity)] > 0));
}
const reload = new Progression(storage);
assert.equal(reload.data.coins, p.data.coins);
assert.equal(reload.data.owned.length, CARDS.length);
reload.equip(2, "glory1");
assert.equal(reload.data.squad[2], "glory1");
const backup = reload.export();
p.import(backup);
assert.equal(p.data.squad[2], "glory1");
validateSave(p.data);
// Old saves and old earned-pack inventories still load without a schema reset.
const old = freshSave();
old.coins = 9999;
old.packs = 999999;
old.claimed = ["album"];
const compatible = validateSave(old);
assert.equal(compatible.coins, 9999);
assert.equal(compatible.packs, 999999);
assert.deepEqual(compatible.claimed, ["album"]);
console.log(
  "PASS: 112 guide cards plus legacy cards, special tiers/ratings, all odds intervals, atomic purchases, insufficient funds, duplicates, persistence, squad equip and old-save compatibility.",
);

assert.throws(() => p.sellCard(p.data.squad[0]), /replacement/);
const sellable = SHOP_CARDS.find((c) => !p.data.squad.includes(c.id));
const coins = p.data.coins;
assert.equal(p.sellCard(sellable.id), QUICK_SELL[sellable.rarity]);
assert.equal(p.data.coins, coins + QUICK_SELL[sellable.rarity]);
assert.throws(() => p.sellCard(sellable.id), /do not own/);
p.begin("quick");
assert.throws(() => p.sellCard("guide6"), /Finish/);
p.abandon();
const expected = [
  [500, 3],
  [1500, 4],
  [4000, 5],
  [10000, 5],
  [25000, 5],
  [75000, 3],
];
assert.deepEqual(
  PACKS.map((p) => [p.cost, p.count]),
  expected,
);
const returns = [306, 1100, 3621.25, 8850, 20685, 47925];
PACKS.forEach((p, i) =>
  assert.ok(
    Math.abs(
      p.count *
        p.odds.reduce(
          (sum, rate, j) => sum + (rate / 100) * QUICK_SELL[RARITIES[j]],
          0,
        ) -
        returns[i],
    ) < 1e-7,
  ),
);
console.log(
  "PASS: guide prices/card counts, expected quick-sell returns, selling, starter protection and pending-match protection.",
);

assert.deepEqual(RARITIES.map(r=>SHOP_CARDS.filter(c=>c.rarity===r).length),[6,10,10,10,16,10,10,10,14,8,8]);
assert.ok(SHOP_CARDS.every(c=>!c.legacy));
