import assert from "node:assert/strict";
import {
  CARDS,
  PACKS,
  RARITIES,
  Progression,
  drawShopCard,
  validateSave,
  freshSave,
} from "../js/progression.js";
assert.equal(CARDS.length, 52);
assert.equal(new Set(CARDS.map((c) => c.id)).size, 52);
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
  assert.equal(
    pack.odds.reduce((a, b) => a + b, 0),
    100,
  );
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
  d.coins = 10000;
  d.owned = CARDS.map((c) => c.id);
});
for (const pack of PACKS) {
  const coins = p.data.coins,
    packs = p.data.packs,
    count = p.data.stats.packs;
  const result = p.buyPack(pack.id);
  assert.equal(result.length, 3);
  assert.ok(result.every((c) => c.duplicate));
  assert.equal(p.data.coins, coins - pack.cost + 60);
  assert.equal(p.data.packs, packs);
  assert.equal(p.data.stats.packs, count + 1);
  assert.ok(result.every((c) => pack.odds[RARITIES.indexOf(c.rarity)] > 0));
}
const reload = new Progression(storage);
assert.equal(reload.data.coins, p.data.coins);
assert.equal(reload.data.owned.length, 52);
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
  "PASS: 52 cards, special tiers/ratings, all odds intervals, atomic purchases, insufficient funds, duplicates, persistence, squad equip and old-save compatibility.",
);
