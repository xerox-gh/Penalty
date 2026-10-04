import { CFG, clamp } from "./config.js";
export class Rules {
  constructor(game) {
    this.g = game;
    this.elapsed = 0;
    this.golden = false;
    this.restart = null;
    this.goals = 0;
  }
  kickoff(team = 0) {
    const g = this.g;
    g.teams.forEach((t) => t.reset());
    g.ball.reset();
    const p = g.teams[team].players[4];
    p.x = -g.teams[team].dir * 1.2;
    p.z = 0;
    g.teams[team].active = 4;
    g.ball.lastTeam = team;
    g.state.set("countdown", CFG.match.countdown);
    g.audio.play("whistle");
  }
  update(dt) {
    const g = this.g,
      b = g.ball;
    const line = CFG.pitch.length / 2 + CFG.ball.radius;
    const crossed = Math.abs(b.previousX) <= line && Math.abs(b.x) > line;
    const fraction = crossed
      ? (Math.sign(b.x) * line - b.previousX) / (b.x - b.previousX)
      : 0;
    const crossingZ = b.previousZ + (b.z - b.previousZ) * fraction;
    const crossingY = b.previousY + (b.y - b.previousY) * fraction;
    if (
      crossed &&
      Math.abs(crossingZ) < CFG.pitch.goalWidth / 2 - CFG.ball.radius &&
      crossingY < CFG.pitch.goalHeight - CFG.ball.radius
    ) {
      const id = b.x > 0 ? 0 : 1;
      g.teams[id].score++;
      this.goals++;
      g.audio.play("net");
      g.particles.burst(b.x, b.z, 80);
      g.state.set("goal", CFG.match.goalDelay);
      g.notice = "GOAL!";
      this.kickTeam = 1 - id;
      return;
    }
    if (Math.abs(b.z) > 20.6 || Math.abs(b.x) > 30.6) {
      let team = 1 - b.lastTeam,
        type = "KICK-IN",
        x = clamp(b.x, -29, 29),
        z = Math.sign(b.z) * 19;
      if (Math.abs(b.x) > 30.6) {
        const defender = b.x > 0 ? 1 : 0;
        if (b.lastTeam === defender) {
          type = "CORNER";
          team = 1 - defender;
          x = Math.sign(b.x) * 29;
          z = Math.sign(b.z || 1) * 19;
        } else {
          type = "GOAL KICK";
          team = defender;
          x = Math.sign(b.x) * 26;
          z = 0;
        }
      }
      this.restart = { team, x, z };
      g.notice = type;
      g.state.set("restart", 1.5);
      b.vx = b.vy = b.vz = 0;
      return;
    }
    this.elapsed += dt;
    if (this.elapsed >= g.options.duration) {
      if (g.options.golden && g.teams[0].score === g.teams[1].score) {
        if (!this.golden) {
          this.golden = true;
          g.notice = "GOLDEN GOAL";
          g.noticeTime = 2;
        }
      } else this.finish();
    }
  }
  takeRestart() {
    const g = this.g,
      r = this.restart;
    g.ball.reset(r.x, r.z);
    const p = g.teams[r.team].nearest(g.ball);
    p.x = r.x - g.teams[r.team].dir;
    p.z = r.z * 0.97;
    p.cooldown = 0;
    g.teams[r.team].active = p.index;
    g.ball.lastTeam = r.team;
    for (const q of g.players)
      if (q.team !== r.team && Math.hypot(q.x - r.x, q.z - r.z) < 4) {
        q.x = clamp(r.x - g.teams[r.team].dir * 5, -28, 28);
        q.z = clamp(r.z * 0.7, -18, 18);
      }
    g.state.set("playing");
    g.notice = "";
  }
  finish() {
    this.g.state.set("fulltime");
    this.g.audio.play("whistle");
  }
}
