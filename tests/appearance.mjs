import assert from "node:assert/strict";
import { CARDS } from "../js/progression.js";
import {
  appearanceFor,
  hairParts,
  portraitSVG,
  HAIR_STYLES,
} from "../js/appearance.js";
import { buildHead } from "../js/player-head.js";
const styles = new Set();
for (const c of CARDS) {
  const a = appearanceFor(c);
  styles.add(a.style);
  assert.deepEqual(a, appearanceFor({ ...c }));
  const head = buildHead(a);
  assert.equal(head.userData.appearance, a);
  const hair = head.getObjectByName("hairstyle");
  if (a.style === 9) assert.equal(hair, undefined);
  else {
    assert.ok(hair.geometry.attributes.position.array.every(Number.isFinite));
    assert.ok(hair.geometry.attributes.normal.array.every(Number.isFinite));
    assert.equal(
      hair.geometry.attributes.color.count,
      hair.geometry.attributes.position.count,
    );
    assert.equal(
      hair.geometry,
      buildHead(a).getObjectByName("hairstyle").geometry,
    );
    assert.equal(
      head.children.filter((child) => child.name === "hairstyle").length,
      1,
    );
  }
  assert.ok(portraitSVG(a, "#ffffff").includes(`data-hair="${a.style}"`));
  for (const p of hairParts(a))
    assert.ok(
      [p.x, p.y, p.z, p.sx, p.sy, p.sz, p.rx, p.rz, p.tone].every(
        Number.isFinite,
      ),
    );
}
assert.equal(styles.size, HAIR_STYLES.length);
assert.equal(hairParts({ ...appearanceFor("test"), style: 9 }).length, 0);
assert.equal(
  appearanceFor({ id: "glory1", name: "changed" }),
  appearanceFor({ id: "glory1" }),
);
console.log(
  "PASS: stable identities, every hairstyle represented, card/model profile agreement, finite hair geometry and bald style.",
);
