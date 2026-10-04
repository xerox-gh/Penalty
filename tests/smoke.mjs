import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
const root = new URL("../", import.meta.url).pathname.replace(/\/$/, "");
globalThis.document = {
  createElement: () => ({
    width: 0,
    height: 0,
    getContext: () => ({ fillText() {} }),
  }),
};
const T = await import(root + "/libs/three.module.js");
const { Team } = await import(root + "/js/team.js");
const { Ball } = await import(root + "/js/ball.js");
const { Rules } = await import(root + "/js/rules.js");
const { State } = await import(root + "/js/state.js");
const { decide, moveAI } = await import(root + "/js/ai.js");
const { goalkeeper } = await import(root + "/js/goalkeeper.js");
const scene = new T.Scene(),
  audio = { play() {} },
  teams = [
    new Team(scene, 0, "#16d7a0", "1-2-1"),
    new Team(scene, 1, "#ff664b", "1-2-1"),
  ],
  players = teams.flatMap((t) => t.players),
  ball = new Ball(scene, audio);
const g = {
  teams,
  players,
  ball,
  audio,
  state: new State(),
  particles: { burst() {} },
  options: { duration: 180, golden: true },
  notice: "",
};
const rules = (g.rules = new Rules(g));
assert.equal(players.length, 10);
rules.kickoff();
assert.equal(g.state.name, "countdown");
g.state.set("playing");
ball.reset(30.4, 0);
ball.previousX = 29.9;
rules.update(1 / 60);
assert.equal(teams[0].score, 1);
assert.equal(g.state.name, "goal");
ball.reset(-30.4, 0);
ball.previousX = -29.9;
g.state.set("playing");
rules.update(1 / 60);
assert.equal(teams[1].score, 1);
// An aerial ball outside the goal must never score after landing behind it.
ball.reset(31, 0);
ball.previousX = 29.9;
ball.previousY = ball.y = 4;
g.state.set("playing");
rules.update(1 / 60);
assert.equal(teams[0].score, 1);
assert.equal(g.notice, "GOAL KICK");
ball.reset(5, 21);
ball.lastTeam = 0;
g.state.set("playing");
rules.update(1 / 60);
assert.equal(g.notice, "KICK-IN");
assert.equal(rules.restart.team, 1);
rules.takeRestart();
assert.equal(g.state.name, "playing");
ball.reset(31, 12);
ball.lastTeam = 1;
rules.update(1 / 60);
assert.equal(g.notice, "CORNER");
assert.equal(rules.restart.team, 0);
ball.reset(31, 12);
ball.lastTeam = 0;
g.state.set("playing");
rules.update(1 / 60);
assert.equal(g.notice, "GOAL KICK");
assert.equal(rules.restart.team, 1);
ball.reset(0, 19.6);
ball.vz = 10;
ball.update(1 / 60, []);
assert.ok(ball.vz < 0);
ball.reset();
ball.y = 5;
for (let i = 0; i < 120; i++) ball.update(1 / 60, []);
assert.ok(ball.y >= 0.3);
const p = teams[0].players[1];
p.x = 0;
p.z = 0;
p.cooldown = 0;
ball.reset(1, 0);
assert.equal(ball.kick(p, 1, 0, 20, 5, 3), true);
assert.equal(ball.lastTeam, 0);
assert.ok(ball.vy > 0);
const keeper = teams[0].players[0];
keeper.x = -28.4;
keeper.z = 0;
keeper.cooldown = 0;
ball.reset(-28, 0);
ball.vx = -12;
goalkeeper(keeper, teams[0], ball, 1 / 60, audio);
assert.ok(ball.held > 0);
for (let i = 0; i < 120; i++) {
  goalkeeper(keeper, teams[0], ball, 1 / 60, audio);
  ball.update(1 / 60, []);
}
assert.equal(ball.held, 0);
assert.ok(ball.vx > 0);
for (const formation of ["1-2-1", "2-1-1", "1-1-2"]) {
  teams[0].formation = formation;
  teams[0].reset();
  assert.ok(teams[0].players.every((p) => Number.isFinite(p.x)));
}
teams.forEach((t) => t.reset());
ball.reset();
g.state.set("playing");
const start = performance.now();
for (let i = 0; i < 10800; i++) {
  if (i % 5 === 0)
    for (const t of teams) decide(t, teams[1 - t.id], ball, "Medium", null);
  for (const t of teams)
    for (const p of t.players)
      if (p.keeper) goalkeeper(p, t, ball, 1 / 60, audio);
      else moveAI(p, 1 / 60, 1);
  ball.update(1 / 60, players);
  if (Math.abs(ball.x) > 31 || Math.abs(ball.z) > 21) ball.reset();
  assert.ok(players.every((p) => Number.isFinite(p.x) && Number.isFinite(p.z)));
}
console.log(
  "PASS: goals, kick-ins, corners, goal kicks, boards, bounce, shots, keeper catch/distribution, formations; 180-second 10-player simulation took " +
    (performance.now() - start).toFixed(0) +
    "ms",
);
rules.elapsed = 180;
teams[0].score = teams[1].score = 1;
ball.reset();
rules.update(1 / 60);
assert.equal(rules.golden, true);
teams[0].score = 2;
rules.update(1 / 60);
assert.equal(g.state.name, "fulltime");
console.log("PASS: golden goal and full-time");
