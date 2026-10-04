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
    });
  }
  kick(p, dx, dz, power = 16, lift = 0, spin = 0) {
    if (
      distance(this, p) > CFG.player.kickRange ||
      this.y > 1.5 ||
      p.cooldown > 0 ||
      this.held > 0
    )
      return false;
    const l = Math.hypot(dx, dz) || 1;
    this.vx = (dx / l) * power + p.vx * 0.2;
    this.vz = (dz / l) * power + p.vz * 0.2;
    this.vy = lift;
    this.spin = spin;
    this.lastTeam = p.team;
    this.owner = null;
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
    this.owner = null;
    for (const p of players) {
      const d = distance(p, this);
      if (d > 1.5 || this.y > 1.2 || p.cooldown > 0) continue;
      if (d < 1.05) {
        const nx = (this.x - p.x) / (d || 1),
          nz = (this.z - p.z) / (d || 1);
        this.x = p.x + nx * 1.05;
        this.z = p.z + nz * 1.05;
        if (Math.hypot(this.vx, this.vz) < 11) {
          this.vx = p.vx + nx * 1.8;
          this.vz = p.vz + nz * 1.8;
          this.owner = p;
          this.lastTeam = p.team;
        } else {
          const dot = this.vx * nx + this.vz * nz;
          if (dot < 0) {
            this.vx -= 1.5 * dot * nx;
            this.vz -= 1.5 * dot * nz;
            this.lastTeam = p.team;
          }
        }
      }
      if (p.slide > 0 && d < 1.5) {
        this.vx = p.dx * 13;
        this.vz = p.dz * 13;
        this.lastTeam = p.team;
        p.cooldown = 0.5;
      }
    }
  }
  render(dt) {
    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.rotation.z -= (this.vx * dt) / 0.3;
    this.mesh.rotation.x += (this.vz * dt) / 0.3;
  }
}
