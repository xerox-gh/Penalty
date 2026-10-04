import * as T from "../libs/three.module.js";
import { CFG, clamp } from "./config.js";
const bodyGeo = new T.BoxGeometry(0.65, 0.8, 0.4),
  headGeo = new T.IcosahedronGeometry(0.27, 1),
  limbGeo = new T.BoxGeometry(0.19, 0.65, 0.2),
  skin = new T.MeshStandardMaterial({ color: 0xcb936b }),
  shorts = new T.MeshStandardMaterial({ color: 0x152436 });
export class Player {
  constructor(scene, team, index, color) {
    Object.assign(this, {
      team,
      index,
      keeper: index === 0,
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      dx: team === 0 ? 1 : -1,
      dz: 0,
      stamina: 1,
      cooldown: 0,
      slide: 0,
      dive: 0,
      charge: 0,
      kick: 0,
      celebrate: 0,
      target: { x: 0, z: 0 },
      anchor: { x: 0, z: 0 },
    });
    this.root = new T.Group();
    this.kit = new T.MeshStandardMaterial({
      color: this.keeper ? 0xffd34d : color,
    });
    const torso = new T.Mesh(bodyGeo, this.kit);
    torso.position.y = 1.15;
    this.root.add(torso);
    const head = new T.Mesh(headGeo, skin);
    head.position.y = 1.85;
    this.root.add(head);
    this.legs = [];
    this.arms = [];
    for (const s of [-1, 1]) {
      const leg = new T.Mesh(limbGeo, shorts);
      leg.position.set(s * 0.2, 0.4, 0);
      this.root.add(leg);
      this.legs.push(leg);
      const arm = new T.Mesh(limbGeo, skin);
      arm.position.set(s * 0.47, 1.08, 0);
      this.root.add(arm);
      this.arms.push(arm);
    }
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "white";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(index + 1), 32, 49);
    const tag = new T.Mesh(
      new T.PlaneGeometry(0.38, 0.38),
      new T.MeshBasicMaterial({
        map: new T.CanvasTexture(c),
        transparent: true,
      }),
    );
    tag.position.set(0, 1.25, -0.211);
    tag.rotation.y = Math.PI;
    this.root.add(tag);
    this.root.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
    });
    scene.add(this.root);
  }
  move(x, z, sprint, dt, mult = 1) {
    const l = Math.hypot(x, z);
    if (l > 1) {
      x /= l;
      z /= l;
    }
    const fast = sprint && this.stamina > 0.04;
    const speed = (fast ? CFG.player.sprint : CFG.player.speed) * mult;
    this.vx += (x * speed - this.vx) * Math.min(1, (dt * CFG.player.accel) / 2);
    this.vz += (z * speed - this.vz) * Math.min(1, (dt * CFG.player.accel) / 2);
    this.x = clamp(this.x + this.vx * dt, -29.2, 29.2);
    this.z = clamp(this.z + this.vz * dt, -19.2, 19.2);
    if (l > 0.1) {
      this.dx = x / (l > 1 ? 1 : l);
      this.dz = z / (l > 1 ? 1 : l);
    }
    this.stamina = clamp(
      this.stamina +
        (fast && l > 0.1
          ? -CFG.player.staminaDrain
          : CFG.player.staminaRecovery) *
          dt,
      0,
      1,
    );
    this.kick = Math.max(0, this.kick - dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.slide = Math.max(0, this.slide - dt);
    this.dive = Math.max(0, this.dive - dt);
  }
  render(t) {
    this.root.position.set(this.x, 0, this.z);
    this.root.rotation.y = Math.atan2(this.dx, this.dz);
    this.root.rotation.z = this.dive > 0 ? 0.9 : 0;
    this.root.rotation.x = this.slide > 0 ? -1 : 0;
    const run = Math.min(1, Math.hypot(this.vx, this.vz) / 5);
    this.legs[0].rotation.x = Math.sin(t * 13) * run * 0.7;
    this.legs[1].rotation.x = this.kick > 0 ? -1.2 : -this.legs[0].rotation.x;
    this.arms.forEach((arm, i) => {
      arm.rotation.z = this.celebrate ? (i === 0 ? 2.4 : -2.4) : 0;
    });
    if (this.celebrate) this.root.position.y = Math.abs(Math.sin(t * 7)) * 0.3;
  }
}
