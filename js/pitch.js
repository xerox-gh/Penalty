import * as T from "../libs/three.module.js";
import { CFG } from "./config.js";
export function buildPitch(scene) {
  const skyCanvas = document.createElement("canvas");
  skyCanvas.width = 16;
  skyCanvas.height = 128;
  const skyCtx = skyCanvas.getContext("2d"),
    gradient = skyCtx.createLinearGradient(0, 0, 0, 128);
  gradient.addColorStop(0, "#183b67");
  gradient.addColorStop(1, "#a5c1cf");
  skyCtx.fillStyle = gradient;
  skyCtx.fillRect(0, 0, 16, 128);
  const sky = new T.Mesh(
    new T.SphereGeometry(140, 24, 16),
    new T.MeshBasicMaterial({
      map: new T.CanvasTexture(skyCanvas),
      side: T.BackSide,
      fog: false,
    }),
  );
  scene.add(sky);
  const group = new T.Group();
  scene.add(group);
  const mats = {
    white: new T.MeshStandardMaterial({ color: 0xe2ece8 }),
    board: new T.MeshStandardMaterial({ color: 0x182939 }),
    stand: new T.MeshStandardMaterial({ color: 0x34475b }),
  };
  function box(w, h, d, x, y, z, mat) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.receiveShadow = true;
    m.castShadow = true;
    group.add(m);
    return m;
  }
  for (let i = 0; i < 12; i++)
    box(
      5,
      0.15,
      40,
      -27.5 + i * 5,
      -0.1,
      0,
      new T.MeshStandardMaterial({ color: i % 2 ? 0x287b4d : 0x308955 }),
    );
  const line = (w, d, x, z) => box(w, 0.025, d, x, 0.01, z, mats.white);
  line(60, 0.12, 0, -20);
  line(60, 0.12, 0, 20);
  line(0.12, 40, 0, 0);
  line(0.12, 40, -30, 0);
  line(0.12, 40, 30, 0);
  function circle(r, x, z, start = 0, end = Math.PI * 2) {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      let a = start + ((end - start) * i) / 64;
      pts.push(new T.Vector3(x + Math.cos(a) * r, 0.03, z + Math.sin(a) * r));
    }
    const l = new T.Line(
      new T.BufferGeometry().setFromPoints(pts),
      new T.LineBasicMaterial({ color: 0xffffff }),
    );
    group.add(l);
  }
  circle(5, 0, 0);
  for (const s of [-1, 1]) {
    line(0.12, 18, s * 21, 0);
    line(9, 0.12, s * 25.5, -9);
    line(9, 0.12, s * 25.5, 9);
    circle(0.16, s * 24, 0);
    for (const z of [-20, 20])
      circle(
        1,
        s * 30,
        z,
        s === 1 ? (z > 0 ? Math.PI : Math.PI / 2) : z > 0 ? -Math.PI / 2 : 0,
        s === 1 ? (z > 0 ? Math.PI * 1.5 : Math.PI) : z > 0 ? 0 : Math.PI / 2,
      );
    for (const z of [-4, 4]) box(0.16, 3, 0.16, s * 30, 1.5, z, mats.white);
    box(0.16, 0.16, 8, s * 30, 3, 0, mats.white);
    const pts = [];
    for (let z = -4; z <= 4; z += 0.5) {
      pts.push(
        new T.Vector3(s * 32, 0, z),
        new T.Vector3(s * 32, 3, z),
        new T.Vector3(s * 30, 3, z),
        new T.Vector3(s * 32, 3, z),
      );
    }
    for (let y = 0; y <= 3; y += 0.5)
      pts.push(new T.Vector3(s * 32, y, -4), new T.Vector3(s * 32, y, 4));
    for (const z of [-4, 4])
      for (let y = 0; y <= 3; y += 0.5)
        pts.push(new T.Vector3(s * 30, y, z), new T.Vector3(s * 32, y, z));
    group.add(
      new T.LineSegments(
        new T.BufferGeometry().setFromPoints(pts),
        new T.LineBasicMaterial({
          color: 0xc3d5da,
          transparent: true,
          opacity: 0.5,
        }),
      ),
    );
    for (const z of [-12, 12]) box(0.4, 1.1, 16, s * 30, 0.55, z, mats.board);
  }
  for (const z of [-20, 20]) box(60, 1.1, 0.4, 0, 0.55, z, mats.board);
  for (const z of [-27, 27])
    for (let i = 0; i < 3; i++)
      box(70, 1, 3, 0, i * 0.9, z + Math.sign(z) * i * 3, mats.stand);
  const crowd = new T.InstancedMesh(
    new T.BoxGeometry(0.55, 0.8, 0.45),
    new T.MeshStandardMaterial({ color: 0xffffff }),
    720,
  );
  const obj = new T.Object3D();
  for (let i = 0; i < 720; i++) {
    const row = Math.floor(i / 120),
      side = row < 3 ? -1 : 1;
    obj.position.set(
      ((i % 120) - 60) * 0.55,
      1 + (row % 3) * 0.9,
      side * (27 + (row % 3) * 3),
    );
    obj.updateMatrix();
    crowd.setMatrixAt(i, obj.matrix);
    crowd.setColorAt(i, new T.Color().setHSL((i * 0.137) % 1, 0.45, 0.5));
  }
  group.add(crowd);
  for (const x of [-34, 34])
    for (const z of [-24, 24]) {
      box(0.3, 13, 0.3, x, 6.5, z, mats.stand);
      box(3, 1, 1, x, 13, z, mats.white);
    }
  const ground = new T.Mesh(
    new T.PlaneGeometry(350, 350),
    new T.MeshStandardMaterial({ color: 0x172b32 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.2;
  ground.receiveShadow = true;
  scene.add(ground);
  return { crowd };
}
export class Particles {
  constructor(scene) {
    this.items = [];
    const geom = new T.BoxGeometry(0.12, 0.12, 0.12);
    for (let i = 0; i < 100; i++) {
      const m = new T.Mesh(
        geom,
        new T.MeshBasicMaterial({ color: i % 2 ? 0x16d7a0 : 0xffd76c }),
      );
      m.visible = false;
      scene.add(m);
      this.items.push({ mesh: m, life: 0, v: new T.Vector3() });
    }
    this.limit = 60;
  }
  burst(x, z, n = 20) {
    let count = 0;
    for (const p of this.items)
      if (p.life <= 0 && count++ < Math.min(n, this.limit)) {
        p.life = 1 + Math.random();
        p.mesh.visible = true;
        p.mesh.position.set(x, 0.4, z);
        p.v.set(
          (Math.random() - 0.5) * 8,
          Math.random() * 7 + 2,
          (Math.random() - 0.5) * 8,
        );
      }
  }
  update(dt) {
    for (const p of this.items)
      if (p.life > 0) {
        p.life -= dt;
        p.v.y -= 12 * dt;
        p.mesh.position.addScaledVector(p.v, dt);
        p.mesh.visible = p.life > 0;
      }
  }
}
