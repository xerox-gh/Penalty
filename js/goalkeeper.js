import { clamp, distance } from "./config.js";
export function goalkeeper(p, team, ball, dt, audio) {
  const goal = -team.dir * 28.4;
  p.target.x = goal + team.dir * clamp((30 - Math.abs(ball.x)) * 0.09, 0, 2);
  const incoming = ball.vx * team.dir < -4;
  const t = incoming ? (goal - ball.x) / ball.vx : 0;
  const predict = t > 0 && t < 1.5 ? ball.z + ball.vz * t : ball.z * 0.55;
  p.target.z = clamp(predict, -3.5, 3.5);
  const dx = p.target.x - p.x,
    dz = p.target.z - p.z,
    l = Math.hypot(dx, dz);
  p.move(l > 0.15 ? dx / l : 0, l > 0.15 ? dz / l : 0, incoming, dt, 0.88);
  if (ball.held > 0 && ball.owner === p) {
    ball.x = p.x + team.dir * 0.8;
    ball.z = p.z;
    if (ball.held < dt * 2) {
      ball.held = 0;
      ball.y = 0.3;
      p.cooldown = 0;
      ball.kick(p, team.dir, Math.random() - 0.5, 21, 5);
      p.cooldown = 1;
    }
    return;
  }
  if (
    distance(p, ball) < (incoming ? 1.7 : 1.1) &&
    ball.y < 2.5 &&
    p.cooldown === 0
  ) {
    p.dive = incoming ? 0.6 : 0;
    audio.play("kick");
    ball.lastTeam = team.id;
    if (Math.hypot(ball.vx, ball.vz) < 24 && ball.y < 1.8) {
      ball.held = 0.85;
      ball.owner = p;
      ball.vx = ball.vz = ball.vy = 0;
      ball.y = 0.9;
    } else {
      ball.vx = team.dir * 12;
      ball.vz += (Math.random() - 0.5) * 10;
      ball.vy = 4;
      p.cooldown = 0.6;
    }
  }
}
