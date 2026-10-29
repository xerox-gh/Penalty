import assert from "node:assert/strict";
globalThis.document = {
  createElement: () => ({ getContext: () => ({ fillText() {} }) }),
};
const T = await import("../libs/three.module.js");
const { Team } = await import("../js/team.js"),
  { Ball } = await import("../js/ball.js"),
  { Rules } = await import("../js/rules.js"),
  { State } = await import("../js/state.js");
const { penaltyArea, prepareRestart, strikeRestart, launchValues, targetFor } =
  await import("../js/set-pieces.js");
const { CFG } = await import("../js/config.js");
const scene = new T.Scene(),
  audio = { play() {} };
const g = {
  teams: [
    new Team(scene, 0, "#eee", "1-2-1"),
    new Team(scene, 1, "#c44", "1-2-1"),
  ],
  ball: new Ball(scene, audio),
  audio,
  state: new State(),
  options: { duration: 120, local: false, difficulty: "Medium" },
  matchStats: { shots: 0 },
  input: {
    clear() {},
    controls() {
      return { x: 0, z: 0 };
    },
  },
  particles: { burst() {} },
};
g.players = g.teams.flatMap((t) => t.players);
g.rules = new Rules(g);
g.ball.boardsEnabled = false;
assert.ok(penaltyArea(21, 9, 1));
assert.ok(penaltyArea(-24, 0, 0));
assert.ok(!penaltyArea(20.9, 0, 1));
assert.ok(!penaltyArea(24, 9.1, 1));
function foul(x, z, dir = 1) {
  g.teams.forEach((t) => t.reset());
  g.state.set("playing");
  const victim = g.teams[dir === 1 ? 0 : 1].players[4],
    def = g.teams[dir === 1 ? 1 : 0].players[1];
  Object.assign(victim, { x, z, slide: 0 });
  Object.assign(def, { x: x - dir * 0.8, z, slide: 0.4, cleanSlide: false });
  g.ball.reset(x + dir * 0.85, z);
  g.ball.owner = victim;
  assert.ok(g.rules.checkFouls());
}
foul(24, 0);
assert.equal(g.rules.restart.type, "PENALTY");
assert.equal(g.rules.restart.x, 24);
assert.equal(g.rules.restart.team, 0);
foul(-24, 0, -1);
assert.equal(g.rules.restart.type, "PENALTY");
assert.equal(g.rules.restart.x, -24);
foul(16, 2);
assert.equal(g.rules.restart.type, "FREE KICK");
g.rules.takeRestart();
for (const p of g.teams[1].players.slice(1, 3))
  assert.ok(Math.hypot(p.x - 16, p.z - 2) >= 4.99);
const elapsed = g.rules.elapsed;
g.rules.updateRestart(0.5);
assert.equal(g.rules.elapsed, elapsed);
g.state.pause();
assert.equal(g.state.name, "paused");
g.state.pause();
assert.equal(g.state.name, "setpiece");
for (const team of [0, 1])
  for (const type of [
    "PENALTY",
    "FREE KICK",
    "CORNER",
    "GOAL KICK",
    "THROW-IN",
  ]) {
    g.options.local = true;
    const dir = g.teams[team].dir;
    g.rules.award(
      type,
      team,
      dir *
        (type === "PENALTY"
          ? 24
          : type === "CORNER"
            ? 29
            : type === "GOAL KICK"
              ? -26
              : 15),
      type === "CORNER" ? 19 : 0,
    );
    g.rules.takeRestart();
    const r = g.rules.restart;
    assert.equal(g.state.name, "setpiece");
    assert.ok(r.human);
    if (type === "PENALTY") {
      for (const p of g.players)
        if (!p.keeper && !(p.team === team && p.index === r.taker))
          assert.ok(p.x * dir <= 21);
    }
    if (type === "CORNER") {
      const target = targetFor(r);
      assert.ok(target.x * dir < 27);
      assert.ok(Math.abs(target.z) < 4);
      assert.ok(r.loft);
    }
    const shot = launchValues(r);
    assert.ok(Object.values(shot).every(Number.isFinite));
    assert.ok(strikeRestart(g));
    assert.equal(g.state.name, "playing");
    assert.equal(g.ball.lastTeam, team);
    assert.ok(Math.hypot(g.ball.vx, g.ball.vz) > 0);
    assert.equal(g.rules.restart, null);
  }
// Career stays locked after restart delivery; AI keeper takes goal kicks.
g.options.local = false;
g.teams[0].lockedPlayer = 2;
g.rules.award("CORNER", 0, 29, 19);
g.rules.takeRestart();
assert.equal(g.rules.restart.taker, 2);
strikeRestart(g);
assert.equal(g.teams[0].active, 2);
g.rules.award("GOAL KICK", 0, -26, 0);
g.rules.takeRestart();
assert.equal(g.rules.restart.human, false);
g.rules.updateRestart(4);
assert.equal(g.state.name, "playing");
assert.equal(g.teams[0].active, 2);
// Clean ball-first slides do not become fouls on the following frame.
g.teams[0].lockedPlayer = null;
g.teams.forEach((t) => t.reset());
g.state.set("playing");
const a = g.teams[0].players[2],
  b = g.teams[1].players[2];
Object.assign(a, { x: 0, z: 0, slide: 0.4 });
Object.assign(b, { x: 1, z: 0 });
g.ball.reset(0.35, 0);
assert.equal(g.rules.checkFouls(), false);
a.cleanSlide = true;
g.ball.x = 2;
assert.equal(g.rules.checkFouls(), false);
// A chest-height attempt is blocked even during the kick's no-recapture window.
g.ball.reset(0, 0);
g.ball.y = 1.4;
g.ball.vx = 25;
g.ball.freeTime = 0.18;
g.ball.lastTeam = 0;
Object.assign(b, { x: 0.45, z: 0, cooldown: 0 });
g.ball.update(1 / 60, [b]);
assert.equal(g.ball.lastTeam, 1);
assert.ok(g.ball.vx < 0);
// An accurate central penalty crosses the line below the bar; deliberate high aim misses.
for (const [height, expected] of [
  [0.2, true],
  [1, false],
]) {
  g.rules.award("PENALTY", 0, 24, 0);
  g.rules.takeRestart();
  Object.assign(g.rules.restart, { aimX: 0, aimY: height, power: 0.65 });
  strikeRestart(g);
  let goalHeight = 0;
  for (let i = 0; i < 100; i++) {
    g.ball.update(1 / 120, []);
    if (g.ball.x > 30.3) {
      goalHeight = g.ball.y;
      break;
    }
  }
  assert.ok(goalHeight > 0);
  assert.equal(goalHeight < 2.7, expected);
}
console.log(
  "PASS: box fouls both ends, legal tackles, wall distance, penalty exclusion, all restarts both teams, career locking, AI delivery, pause/clock, wall blocking, accurate and missed penalties.",
);
// Screen-right aim must correspond to screen-right flight at either goal.
for (const dir of [-1, 1]) {
  const r = {
    type: "PENALTY",
    dir,
    x: 24 * dir,
    z: 0,
    aimX: 0.5,
    aimY: 0.3,
    power: 0.6,
    spin: 0,
  };
  const camera = new T.PerspectiveCamera(42, 1.5, 0.1, 300);
  camera.position.set(r.x - dir * 11, 6.5, 0);
  camera.lookAt(dir * 30, 1.4, 0);
  camera.updateMatrixWorld();
  const t = targetFor(r),
    right = new T.Vector3(t.x, t.y, t.z).project(camera),
    center = new T.Vector3(t.x, t.y, 0).project(camera);
  assert.ok(right.x > center.x);
}
// A last-second penalty completes its flight, but a save ends the extension.
g.rules.elapsed = g.options.duration - 0.01;
g.state.set("playing");
g.rules.award("PENALTY", 0, 24, 0);
g.rules.takeRestart();
Object.assign(g.rules.restart, { aimX: 0, aimY: 0.2, power: 0.65 });
strikeRestart(g);
g.rules.update(0.02);
assert.equal(g.state.name, "playing");
g.ball.owner = g.teams[1].players[0];
g.ball.held = 0.8;
g.rules.update(0.02);
assert.equal(g.state.name, "fulltime");
console.log(
  "PASS: camera-relative aim at both ends and full-time penalty extension.",
);
