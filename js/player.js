import * as T from "../libs/three.module.js";
import { CFG, clamp } from "./config.js";
// Shared low-poly body parts; limbs pivot at hips, knees, shoulders and elbows.
const geometry = {
  torso: new T.CylinderGeometry(0.25, 0.2, 0.54, 8),
  head: new T.IcosahedronGeometry(0.18, 1),
  thigh: new T.CylinderGeometry(0.105, 0.083, 0.4, 6),
  shin: new T.CylinderGeometry(0.08, 0.06, 0.38, 6),
  upperArm: new T.CylinderGeometry(0.074, 0.062, 0.29, 6),
  forearm: new T.CylinderGeometry(0.06, 0.044, 0.28, 6),
  boot: new T.BoxGeometry(0.15, 0.12, 0.29),
  shorts: new T.BoxGeometry(0.39, 0.25, 0.26),
  hair: new T.SphereGeometry(0.185, 7, 4, 0, Math.PI * 2, 0, Math.PI * 0.48),
  sleeve: new T.CylinderGeometry(0.105, 0.08, 0.2, 6),
  number: new T.PlaneGeometry(0.25, 0.28),
};
const skinMaterials = [0xdab08c, 0x8e6045, 0xe6bb97, 0x624333, 0xb77e58].map(
  (color) => new T.MeshStandardMaterial({ color, roughness: 1 }),
);
const shortsMat = new T.MeshStandardMaterial({ color: 0x192c49, roughness: 1 });
const hairMat = new T.MeshStandardMaterial({ color: 0x29231f, roughness: 1 });
const sockMat = new T.MeshStandardMaterial({ color: 0xf0eee5, roughness: 1 });
const bootMats = [0xeee8da, 0x10151c, 0xee9345, 0xaadaf0].map(
  (color) => new T.MeshStandardMaterial({ color, roughness: 0.8 }),
);
const names = [
  ["ALVES", "RIVERA", "MORGAN", "SANTOS", "BLAKE"],
  ["COSTA", "REED", "SILVA", "MASON", "DIAZ"],
];
export class Player {
  constructor(scene, team, index, color) {
    Object.assign(this, {
      team,
      index,
      name: names[team][index],
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
      tackleCooldown: 0,
      sprinting: false,
      dive: 0,
      charge: 0,
      kick: 0,
      celebrate: 0,
      runTimer: 0,
      precision: false,
      target: { x: 0, z: 0 },
      anchor: { x: 0, z: 0 },
    });
    this.root = new T.Group();
    this.kit = new T.MeshStandardMaterial({
      color: this.keeper ? (team === 0 ? 0xe9bf43 : 0x64b29b) : color,
      roughness: 0.85,
    });
    const skin = skinMaterials[(index + team * 2) % 5];
    const add = (parent, geo, mat, x, y, z) => {
      const m = new T.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      parent.add(m);
      return m;
    };
    add(this.root, geometry.torso, this.kit, 0, 1.22, 0);
    add(this.root, geometry.shorts, shortsMat, 0, 0.88, 0);
    add(this.root, geometry.head, skin, 0, 1.65, 0.01);
    add(this.root, geometry.hair, hairMat, 0, 1.67, 0.005);
    const collar = add(this.root, geometry.sleeve, sockMat, 0, 1.49, 0);
    collar.scale.set(0.85, 0.2, 0.85);
    this.legs = [];
    this.knees = [];
    this.arms = [];
    this.elbows = [];
    for (const side of [-1, 1]) {
      const hip = new T.Group();
      hip.position.set(side * 0.12, 0.84, 0);
      this.root.add(hip);
      this.legs.push(hip);
      add(hip, geometry.thigh, skin, 0, -0.2, 0);
      const knee = new T.Group();
      knee.position.y = -0.4;
      hip.add(knee);
      this.knees.push(knee);
      add(knee, geometry.shin, sockMat, 0, -0.17, 0);
      add(knee, geometry.boot, bootMats[(index + team) % 4], 0, -0.34, 0.065);
      const shoulder = new T.Group();
      shoulder.position.set(side * 0.27, 1.43, 0);
      this.root.add(shoulder);
      this.arms.push(shoulder);
      add(shoulder, geometry.sleeve, this.kit, 0, -0.07, 0);
      add(shoulder, geometry.upperArm, skin, 0, -0.19, 0);
      const elbow = new T.Group();
      elbow.position.y = -0.31;
      elbow.rotation.x = -0.3;
      shoulder.add(elbow);
      this.elbows.push(elbow);
      add(elbow, geometry.forearm, skin, 0, -0.14, 0);
    }
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle =
      new T.Color(color).r > 0.65 && new T.Color(color).g > 0.65
        ? "#182741"
        : "#ffffff";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText(String(index + 1), 32, 49);
    const number = add(
      this.root,
      geometry.number,
      new T.MeshBasicMaterial({
        map: new T.CanvasTexture(canvas),
        transparent: true,
      }),
      0,
      1.22,
      -0.232,
    );
    number.rotation.y = Math.PI;
    scene.add(this.root);
  }
  move(x, z, sprint, dt, mult = 1) {
    const l = Math.hypot(x, z);
    if (l > 1) {
      x /= l;
      z /= l;
    }
    const fast = sprint && !this.precision && this.stamina > 0.04;
    this.sprinting = fast && l > 0.1;
    this.runTimer = Math.max(0, this.runTimer - dt);
    this.tackleCooldown = Math.max(0, this.tackleCooldown - dt);
    const speed =
      (fast ? CFG.player.sprint : CFG.player.speed) *
      mult *
      (this.precision ? CFG.control.precisionSpeed : 1);
    this.vx += (x * speed - this.vx) * Math.min(1, (dt * CFG.player.accel) / 2);
    this.vz += (z * speed - this.vz) * Math.min(1, (dt * CFG.player.accel) / 2);
    this.x = clamp(
      this.x + this.vx * dt,
      this.openPitch ? -31 : -29.2,
      this.openPitch ? 31 : 29.2,
    );
    this.z = clamp(
      this.z + this.vz * dt,
      this.openPitch ? -21 : -19.2,
      this.openPitch ? 21 : 19.2,
    );
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

  render(t, dt = 1 / 60) {
    const speed = Math.hypot(this.vx, this.vz),
      run = Math.min(1, speed / 6),
      phase = t * (this.sprinting ? 16 : 12),
      angle = Math.atan2(this.dx, this.dz);
    const delta = Math.atan2(
      Math.sin(angle - this.root.rotation.y),
      Math.cos(angle - this.root.rotation.y),
    );
    this.root.rotation.y += delta * (1 - Math.exp(-dt * 14));
    this.root.position.set(
      this.x,
      Math.abs(Math.sin(phase)) * run * 0.045,
      this.z,
    );
    this.root.rotation.x = this.slide > 0 ? -1.1 : run * 0.075;
    this.root.rotation.z = this.dive > 0 ? 1.1 : 0;
    if (this.slide > 0) this.root.position.y = 0.12;
    if (this.dive > 0) this.root.position.y = 0.22;
    for (let i = 0; i < 2; i++) {
      const cycle = phase + i * Math.PI;
      this.legs[i].rotation.x = Math.sin(cycle) * run * 0.72;
      this.knees[i].rotation.x = Math.max(0, -Math.sin(cycle)) * run * 1.05;
      this.arms[i].rotation.x = -Math.sin(cycle) * run * 0.6;
      this.arms[i].rotation.z = i ? -0.12 : 0.12;
      this.elbows[i].rotation.x = -0.35 - run * 0.5;
    }
    if (this.kick > 0) {
      this.legs[1].rotation.x = -1.05;
      this.knees[1].rotation.x = 0.15;
      this.arms[0].rotation.z = 0.5;
    }
    if (this.slide > 0) {
      this.legs[0].rotation.x = -0.8;
      this.knees[1].rotation.x = 1.2;
    }
    if (this.celebrate) {
      this.root.position.y = Math.abs(Math.sin(t * 6)) * 0.28;
      this.arms[0].rotation.z = 2.6;
      this.arms[1].rotation.z = -2.6;
    }
  }
}
