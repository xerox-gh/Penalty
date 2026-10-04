import * as T from "../libs/three.module.js";
import { CFG, distance } from "./config.js";
export class Ball {
  constructor(scene, audio) {
    this.audio = audio;
    this.mesh = new T.Mesh(
      new T.IcosahedronGeometry(0.3, 2),
      new T.MeshStandardMaterial({ color: 0xf7f9ec, flatShading: true }),
    );
    this.mesh.castShadow = true;
    scene.add(this.mesh);
    const lines = new T.LineSegments(
      new T.EdgesGeometry(new T.IcosahedronGeometry(0.302, 0)),
      new T.LineBasicMaterial({ color: 0x172433 }),
    );
    this.mesh.add(lines);
    this.reset();
  }
  reset(x = 0, z = 0) {
    Object.assign(this, {
      x,
      previousX: x,
      previousY: 0.3,
      previousZ: z,
      y: 0.3,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      spin: 0,
      lastTeam: 0,
      owner: null,
      held: 0,
      freeTime: 0,
    });
  }
  kick(p, dx, dz, power = 16, lift = 0, spin = 0) {
    if (
      distance(this, p) > CFG.player.kickRange ||
      this.y > 1.5 ||
      p.cooldown > 0 ||
      this.held > 0 ||
      (this.owner && this.owner !== p)
    )
      return false;
    const l = Math.hypot(dx, dz) || 1;
    this.vx = (dx / l) * power + p.vx * 0.2;
    this.vz = (dz / l) * power + p.vz * 0.2;
    this.vy = lift;
    this.spin = spin;
    this.lastTeam = p.team;
    this.owner = null;
    this.freeTime = 0.18;
    p.cooldown = 0.3;
    p.kick = 0.25;
    this.audio.play("kick");
    return true;
  }
  update(dt, players) {
    this.previousX = this.x;
    this.previousY = this.y;
    this.previousZ = this.z;
    if (this.held > 0) {
      this.held -= dt;
      return;
    }
    this.freeTime = Math.max(0, this.freeTime - dt);
    // Possession is a soft foot-to-ball spring: sprinting takes longer touches.
    if (this.owner && !this.owner.keeper) {
      const carrier = this.owner;
      let challenger = null;
      for (const q of players)
        if (
          q.team !== carrier.team &&
          q.slide > 0 &&
          distance(q, this) < CFG.control.tackleReach &&
          q.cooldown <= 0
        ) {
          challenger = q;
          break;
        }
      if (challenger) {
        this.owner = null;
        this.freeTime = 0.2;
        this.lastTeam = challenger.team;
        this.vx = challenger.dx * 11;
        this.vz = challenger.dz * 11;
        this.vy = 1;
        challenger.cooldown = 0.6;
        carrier.cooldown = 0.35;
        this.audio.play("kick");
      } else if (distance(carrier, this) < 2.7 && this.y < 1.3) {
        const reach = carrier.sprinting
          ? CFG.control.sprintTouch
          : CFG.control.closeTouch;
        const tx = carrier.x + carrier.dx * reach,
          tz = carrier.z + carrier.dz * reach;
        this.vx = carrier.vx + (tx - this.x) * CFG.control.dribbleSpring;
        this.vz = carrier.vz + (tz - this.z) * CFG.control.dribbleSpring;
        this.x += this.vx * dt;
        this.z += this.vz * dt;
        this.y = CFG.ball.radius;
        this.vy = 0;
        this.lastTeam = carrier.team;
        this.collidePitch();
        return;
      } else this.owner = null;
    }
    const c = CFG.ball;
    this.vy -= c.gravity * dt;
    const oldX = this.vx;
    this.vx += -this.vz * this.spin * c.curve * dt;
    this.vz += oldX * this.spin * c.curve * dt;
    this.x += this.vx * dt;
    this.z += this.vz * dt;
    this.y += this.vy * dt;
    if (this.y < c.radius) {
      this.y = c.radius;
      if (this.vy < -1) this.vy = -this.vy * c.bounce;
      else this.vy = 0;
      const f = Math.max(0, 1 - c.roll * dt);
      this.vx *= f;
      this.vz *= f;
    }
    this.vx *= 1 - c.drag * dt;
    this.vz *= 1 - c.drag * dt;
    this.spin *= 1 - dt;
    this.collidePitch();
    // A controlled first touch slows passes instead of ricocheting them away.
    this.owner = null;
    let receiver = null,
      nearest = Infinity;
    for (const p of players) {
      const d = distance(p, this);
      if (p.keeper || p.cooldown > 0 || this.y > 1.1) continue;
      if (p.slide > 0 && d < CFG.control.tackleReach) {
        this.vx = p.dx * 13;
        this.vz = p.dz * 13;
        this.lastTeam = p.team;
        p.cooldown = 0.5;
        this.freeTime = 0.2;
        return;
      }
      if (
        this.freeTime === 0 &&
        d < CFG.control.dribbleReach &&
        d < nearest &&
        Math.hypot(this.vx, this.vz) < CFG.control.firstTouchSpeed
      ) {
        receiver = p;
        nearest = d;
      } else if (
        d < 0.7 &&
        Math.hypot(this.vx, this.vz) >= CFG.control.firstTouchSpeed
      ) {
        const nx = (this.x - p.x) / (d || 1),
          nz = (this.z - p.z) / (d || 1),
          dot = this.vx * nx + this.vz * nz;
        if (dot < 0) {
          this.vx -= 1.5 * dot * nx;
          this.vz -= 1.5 * dot * nz;
          this.lastTeam = p.team;
        }
      }
    }
    if (receiver) {
      this.owner = receiver;
      this.lastTeam = receiver.team;
      this.vx *= 0.35;
      this.vz *= 0.35;
    }
  }

  collidePitch() {
    const H = CFG.pitch.boardHeight;
    if (Math.abs(this.z) > 19.7 && this.y < H) {
      this.z = Math.sign(this.z) * 19.7;
      this.vz *= -0.75;
      this.audio.play("post");
    }
    if (Math.abs(this.x) > 29.7 && Math.abs(this.z) > 4.25 && this.y < H) {
      this.x = Math.sign(this.x) * 29.7;
      this.vx *= -0.75;
      this.audio.play("post");
    }
    for (const s of [-1, 1]) {
      for (const z of [-4, 4]) {
        let dx = this.x - s * 30,
          dz = this.z - z,
          l = Math.hypot(dx, dz);
        if (l < 0.4 && this.y < 3.3) {
          const nx = dx / (l || 1),
            nz = dz / (l || 1),
            dot = this.vx * nx + this.vz * nz;
          if (dot < 0) {
            this.vx -= 1.8 * dot * nx;
            this.vz -= 1.8 * dot * nz;
          }
          this.x = s * 30 + nx * 0.41;
          this.z = z + nz * 0.41;
          this.audio.play("post");
        }
      }
      if (
        Math.abs(this.x - s * 30) < 0.4 &&
        Math.abs(this.y - 3) < 0.4 &&
        Math.abs(this.z) < 4.2
      ) {
        this.vx *= -0.8;
        this.vy *= -0.6;
        this.x = s * 29.55;
        this.audio.play("post");
      }
    }
  }
  render(dt) {
    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.rotation.z -= (this.vx * dt) / 0.3;
    this.mesh.rotation.x += (this.vz * dt) / 0.3;
  }
}
