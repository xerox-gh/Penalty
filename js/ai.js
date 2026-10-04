import { CFG, clamp, distance } from "./config.js";
// Favor forward, open receivers and penalize defenders near the passing segment.
export function passTarget(p, team, opponents, through = false, aim = null) {
  let best = null,
    score = -Infinity;
  for (const q of team.players) {
    if (q === p || q.keeper) continue;
    const dx = q.x - p.x,
      dz = q.z - p.z,
      len = Math.hypot(dx, dz);
    if (len < 3) continue;
    let risk = 0;
    for (const o of opponents) {
      const t = clamp(
        ((o.x - p.x) * dx + (o.z - p.z) * dz) / (len * len),
        0,
        1,
      );
      if (Math.hypot(o.x - p.x - t * dx, o.z - p.z - t * dz) < 2) risk += 8;
    }
    const value =
      dx * team.dir * 0.5 -
      len * 0.12 -
      risk +
      (aim && Math.hypot(aim.x, aim.z) > 0.2
        ? ((dx * aim.x + dz * aim.z) / len) * 14
        : 0) +
      Math.min(6, ...opponents.map((o) => distance(o, q)));
    if (value > score) {
      score = value;
      best = { x: q.x + (through ? team.dir * 6 : 0), z: q.z, player: q };
    }
  }
  return best;
}
export function decide(team, enemy, ball, difficulty, human) {
  const diff = CFG.difficulty[difficulty],
    carrier = ball.owner,
    possession = carrier ? carrier.team === team.id : ball.lastTeam === team.id,
    chasers = team.players
      .slice(1)
      .filter((p) => p !== human && p !== carrier)
      .sort((a, b) => distance(a, ball) - distance(b, ball))
      .slice(0, possession && carrier ? 0 : diff.press);
  for (const p of team.players) {
    if (p.keeper || p === human) continue;
    const near = distance(p, ball);
    p.aiWait =
      near < CFG.player.kickRange ? (p.aiWait || 0) + 1 / CFG.match.aiHz : 0;
    if (
      p.aiWait >= diff.reaction &&
      near < CFG.player.kickRange &&
      ball.y < 1.1 &&
      p.cooldown <= 0 &&
      (!carrier || carrier === p)
    ) {
      const gx = team.dir * 30,
        range = Math.hypot(gx - p.x, p.z);
      const clear = !enemy.players
        .slice(1)
        .some(
          (o) =>
            o.x * team.dir > p.x * team.dir &&
            Math.abs(o.z - p.z) < 1.7 &&
            distance(o, p) < 9,
        );
      if (range < 21 && clear) {
        ball.kick(
          p,
          gx - p.x,
          -p.z + (Math.random() - 0.5) * (1 - diff.accuracy) * 18,
          22 + Math.random() * 4,
          2,
        );
      } else {
        const target = passTarget(p, team, enemy.players);
        if (
          target &&
          near < 1.6 &&
          (enemy.players.some((o) => distance(o, p) < 4.5) ||
            Math.random() < 0.16)
        )
          ball.kick(
            p,
            target.x - p.x,
            target.z - p.z,
            Math.min(24, distance(p, target) * 1.1 + 7),
          );
      }
    }
    if (carrier === p) {
      p.target.x = clamp(p.x + team.dir * 8, -27, 27);
      p.target.z = p.z * 0.7;
      const blocker = enemy.players.find(
        (o) => distance(o, p) < 5 && (o.x - p.x) * team.dir > 0,
      );
      if (blocker)
        p.target.z = clamp(p.z + (p.z > blocker.z ? 5 : -5), -17, 17);
    } else if (chasers.includes(p) && ball.held <= 0) {
      p.target.x = clamp(ball.x + ball.vx * 0.22, -28, 28);
      p.target.z = clamp(ball.z + ball.vz * 0.22, -18, 18);
    } else {
      p.target.x = clamp(
        p.anchor.x +
          ball.x * 0.35 +
          (possession ? team.dir * 4 : -team.dir * 3),
        -26,
        26,
      );
      p.target.z = clamp(p.anchor.z + ball.z * 0.3, -17, 17);
      if (!possession) {
        const mark = enemy.players[p.index];
        p.target.x = p.target.x * 0.7 + (mark.x - team.dir * 2) * 0.3;
        p.target.z = p.target.z * 0.7 + mark.z * 0.3;
      }
    }
    if (
      carrier &&
      carrier.team !== team.id &&
      distance(p, ball) < 1.8 &&
      p.tackleCooldown <= 0 &&
      p.cooldown <= 0
    ) {
      p.slide = 0.4;
      p.tackleCooldown = CFG.control.tackleCooldown;
    }
  }
}
export function moveAI(p, dt, mult) {
  const dx = p.target.x - p.x,
    dz = p.target.z - p.z,
    l = Math.hypot(dx, dz);
  p.move(l > 0.4 ? dx / l : 0, l > 0.4 ? dz / l : 0, false, dt, mult);
}
