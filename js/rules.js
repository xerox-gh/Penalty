import { penaltyArea, prepareRestart, updateRestart } from "./set-pieces.js";
import { CFG, clamp } from "./config.js";
export class Rules {
  constructor(game) {
    this.g = game;
    this.elapsed = 0;
    this.golden = false;
    this.restart = null;
    this.goals = 0;
    this.penaltyExtension = 0;
  }
  kickoff(team = 0) {
    const g = this.g;
    this.restart = null;
    this.penaltyExtension = 0;
    g.teams.forEach((t) => t.reset());
    g.ball.reset();
    const p = g.teams[team].players[4];
    p.x = -g.teams[team].dir * 1.2;
    p.z = 0;
    g.teams[team].active = g.teams[team].lockedPlayer ?? 4;
    g.ball.lastTeam = team;
    g.state.set("countdown", CFG.match.countdown);
    g.audio.play("whistle");
  }
  update(dt) {
    const g = this.g,
      b = g.ball;
    this.penaltyExtension = Math.max(0, this.penaltyExtension - dt);
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
    if (
      Math.abs(b.z) > 20 + CFG.ball.radius ||
      Math.abs(b.x) > 30 + CFG.ball.radius
    ) {
      if (this.penaltyExtension > 0 && this.elapsed >= g.options.duration) {
        this.penaltyExtension = 0;
        this.finish();
        return;
      }
      let team = 1 - b.lastTeam,
        type = "KICK-IN",
        x = clamp(b.x, -29, 29),
        z = Math.sign(b.z) * (b.boardsEnabled ? 19.7 : 20);
      if (Math.abs(b.x) > 30 + CFG.ball.radius) {
        const defender = b.x > 0 ? 1 : 0;
        if (b.lastTeam === defender) {
          type = "CORNER";
          team = 1 - defender;
          x = Math.sign(b.x) * 29.3;
          z = Math.sign(b.z || 1) * 19.3;
        } else {
          type = "GOAL KICK";
          team = defender;
          x = Math.sign(b.x) * 28;
          z = 0;
        }
      }
      this.award(type, team, x, z);
      return;
    }
    this.elapsed += dt;
    if (this.elapsed >= g.options.duration) {
      // Let a penalty awarded before full-time finish its flight, including a
      // post rebound. Possession, a save or the short timeout ends the extension.
      if (
        this.penaltyExtension > 0 &&
        !b.owner &&
        b.held <= 0 &&
        Math.hypot(b.vx, b.vz) > 1
      )
        return;
      if (g.options.golden && g.teams[0].score === g.teams[1].score) {
        if (!this.golden) {
          this.golden = true;
          g.notice = "GOLDEN GOAL";
          g.noticeTime = 2;
        }
      } else this.finish();
    }
  }
  award(type, team, x, z) {
    const g = this.g;
    this.restart = { type, team, x, z };
    g.ball.vx = g.ball.vy = g.ball.vz = 0;
    g.ball.owner = null;
    g.ball.held = 0;
    for (const p of g.players) {
      p.slide = 0;
      p.charge = 0;
      p.vx = p.vz = 0;
    }
    g.notice = type;
    g.audio.play("whistle");
    g.input?.clear();
    g.state.set("restart", CFG.setPiece.setupTime);
  }
  // A slide into a nearby opponent is a foul unless the tackler reaches the
  // ball first. Ordinary shoulder-to-shoulder contact remains legal.
  checkFouls() {
    const g = this.g,
      b = g.ball;
    if (g.state.name !== "playing" || b.held > 0) return false;
    for (const tackler of g.players) {
      if (tackler.slide <= 0 || tackler.cleanSlide) continue;
      for (const victim of g.players) {
        if (victim.team === tackler.team || victim.keeper) continue;
        const contact = Math.hypot(victim.x - tackler.x, victim.z - tackler.z);
        if (
          contact > CFG.setPiece.foulContact ||
          Math.hypot(victim.x - b.x, victim.z - b.z) > 2.8
        )
          continue;
        const ballRange = Math.hypot(tackler.x - b.x, tackler.z - b.z);
        if (
          b.y < 1.1 &&
          ballRange <= CFG.setPiece.cleanTackleReach &&
          ballRange < contact + 0.05
        )
          continue;
        const spot = {
          x: clamp(victim.x, -29.5, 29.5),
          z: clamp(victim.z, -19.5, 19.5),
        };
        const penalty = penaltyArea(spot.x, spot.z, tackler.team);
        this.award(
          penalty ? "PENALTY" : "FREE KICK",
          victim.team,
          penalty
            ? g.teams[victim.team].dir * (30 - CFG.setPiece.penaltyDistance)
            : spot.x,
          penalty ? 0 : spot.z,
        );
        return true;
      }
    }
    return false;
  }
  takeRestart() {
    if (this.restart) prepareRestart(this.g, this.restart);
  }
  updateRestart(dt) {
    updateRestart(this.g, dt);
  }
  finish() {
    if (this.g.state.name === "fulltime") return;
    this.g.onMatchFinished?.();
    this.g.state.set("fulltime");
    this.g.audio.play("whistle");
  }
}
