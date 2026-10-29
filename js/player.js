import { PlayerAnimator } from "./animation.js";
import {nationalityFor} from "./nationality.js";
import { appearanceFor } from "./appearance.js";
import { buildHead, skins } from "./player-head.js";
import * as T from "../libs/three.module.js";
import { CFG, clamp } from "./config.js";
// Shared low-poly body parts; limbs pivot at hips, knees, shoulders and elbows.
const geometry = {
  detail: new T.BoxGeometry(1, 1, 1),
  neck: new T.CylinderGeometry(0.07, 0.085, 0.13, 6),
  torso: new T.LatheGeometry([new T.Vector2(.19,-.27),new T.Vector2(.21,-.16),new T.Vector2(.28,.17),new T.Vector2(.25,.25),new T.Vector2(.12,.29)],8),
  hand:new T.SphereGeometry(.055,6,4),
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
const shortsMat = new T.MeshStandardMaterial({ color: 0x192c49, roughness: 1 });
const goldMat = new T.MeshStandardMaterial({ color: 0xe8c565, roughness: 0.6 });
const sockMat = new T.MeshStandardMaterial({ color: 0xf0eee5, roughness: 1 });
const bootMats = [0xeee8da, 0x10151c, 0xee9345, 0xaadaf0].map(
  (color) => new T.MeshStandardMaterial({ color, roughness: 0.8 }),
);
const names = [
  ["ALVES", "RIVERA", "MORGAN", "SANTOS", "BLAKE"],
  ["COSTA", "REED", "SILVA", "MASON", "DIAZ"],
];
export class Player {
  constructor(scene, team, index, color, card = null) {
    const appearance = card?.appearance ?? index + team * 7;
    this.nationality = nationalityFor(card || {id:names[team][index]});
    this.paceBoost = 1 + ((card?.pace ?? 65) - 65) * 0.0015;
    this.shotBoost = 1 + ((card?.shoot ?? 65) - 65) * 0.002;
    this.strength = card?.strength ?? 65;
    this.dribble = card?.dribble ?? 65;
    this.passBoost = 1 + ((card?.pass ?? 65) - 65) * 0.001;
    Object.assign(this, {
      team,
      index,
      name: card?.name || names[team][index],
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
    this.appearance = appearanceFor(card || { name: this.name });
    const skin = skins[this.appearance.skin];
    const add = (parent, geo, mat, x, y, z) => {
      const m = new T.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      parent.add(m);
      return m;
    };
    const torso=add(this.root, geometry.torso, this.kit, 0, 1.22, 0);torso.scale.z=.78;
    const shorts=add(this.root, geometry.shorts, shortsMat, 0, 0.88, 0);shorts.scale.y=.65;
    add(this.root, geometry.neck, skin, 0, 1.51, 0);
    const head = buildHead(this.appearance);
    head.position.set(0, 1.67, 0.01);
    this.root.add(head);
    this.head = head;
    const detail = (parent, mat, x, y, z, sx, sy, sz) => {
      const m = add(parent, geometry.detail, mat, x, y, z);
      m.scale.set(sx, sy, sz);
      return m;
    };
    detail(this.root, goldMat, -0.105, 1.31, 0.205, 0.063, 0.079, 0.015);
    detail(this.root, sockMat, 0.11, 1.32, 0.204, 0.065, 0.012, 0.015);
    detail(this.root, sockMat, 0, 1.13, 0.174, 0.24, 0.021, 0.012);
    detail(this.root, this.kit, -0.172, 0.87, 0.137, 0.031, 0.2, 0.012);
    detail(this.root, this.kit, 0.172, 0.87, 0.137, 0.031, 0.2, 0.012);
    const collar = add(this.root, geometry.sleeve, sockMat, 0, 1.49, 0);
    collar.scale.set(0.85, 0.2, 0.85);
    this.feet=[];
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
      const shortLeg=add(hip,geometry.sleeve,shortsMat,0,-.055,0);shortLeg.scale.set(1.18,1.05,1.15);
      const knee = new T.Group();
      knee.position.y = -0.4;
      hip.add(knee);
      this.knees.push(knee);
      add(knee, geometry.shin, sockMat, 0, -0.17, 0);
      const ankle=new T.Group();ankle.position.set(0,-.34,0);knee.add(ankle);this.feet.push(ankle);
      const boot=add(ankle, geometry.boot, bootMats[appearance % 4], 0, 0, 0.065);boot.scale.y=.8;
      detail(ankle,shortsMat,0,-.045,.065,.16,.025,.29);
      detail(knee, this.kit, 0, -0.047, 0.067, 0.1, 0.038, 0.021);
      detail(knee, sockMat, 0, -0.279, 0.1, 0.026, 0.011, 0.09);
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
      add(elbow,geometry.hand,this.keeper?sockMat:skin,0,-.29,.008);
      detail(
        elbow,
        this.keeper ? sockMat : skin,
        0,
        -0.29,
        0.008,
        0.087,
        0.092,
        0.079,
      );
      detail(shoulder, sockMat, 0, -0.16, 0, 0.15, 0.026, 0.13);
    }
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle =
      new T.Color(color).r > 0.65 && new T.Color(color).g > 0.65
        ? "#182741"
        : "#ffffff";
    ctx.font = "bold 66px Arial";
    ctx.textAlign = "center";
    ctx.fillText(String(index + 1), 64, 111);
    ctx.font = "bold 17px Arial";
    ctx.fillText(this.name, 64, 27, 120);
    const number = add(
      this.root,
      geometry.number,
      new T.MeshBasicMaterial({
        map: new T.CanvasTexture(canvas),
        transparent: true,
      }),
      0,
      1.22,
      -0.20,
    );
    number.rotation.y = Math.PI;
    this.body = new T.Group();this.body.position.y=.84;
    for(const child of [...this.root.children]){child.position.y-=.84;this.body.add(child);}
    this.root.add(this.body);this.animator=new PlayerAnimator(index+team*5);this.header=0;this.throwReady=false;this.throwTime=0;this.celebrationKind=(index+team)%3;
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
      this.paceBoost *
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
    this.header = Math.max(0,(this.header||0)-dt);
    this.kick = Math.max(0, this.kick - dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.slide = Math.max(0, this.slide - dt);
    this.dive = Math.max(0, this.dive - dt);
  }

  render(t, dt = 1 / 60) { this.animator.update(this,t,dt); }
}
