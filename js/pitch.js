import * as T from "../libs/three.module.js";
import { CFG } from "./config.js";

// All stadium surfaces are generated locally, including the grass and LED ribbons.
export function buildPitch(scene) {
  const group = new T.Group();
  scene.add(group);
  const concrete = new T.MeshStandardMaterial({
    color: 0x737b83,
    roughness: 1,
  });
  const dark = new T.MeshStandardMaterial({ color: 0x202a3b, roughness: 0.9 });
  const white = new T.MeshStandardMaterial({ color: 0xf3f3e7, roughness: 0.7 });
  const blue = new T.MeshStandardMaterial({ color: 0x284d77, roughness: 0.9 });
  const boxGeo = new T.BoxGeometry(1, 1, 1);
  function box(w, h, d, x, y, z, mat = concrete) {
    const mesh = new T.Mesh(boxGeo, mat);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  const skyCanvas = document.createElement("canvas");
  skyCanvas.width = 16;
  skyCanvas.height = 128;
  const sc = skyCanvas.getContext("2d"),
    gradient = sc.createLinearGradient(0, 0, 0, 128);
  gradient.addColorStop(0, "#6f98ba");
  gradient.addColorStop(1, "#dae7df");
  sc.fillStyle = gradient;
  sc.fillRect(0, 0, 16, 128);
  const sky = new T.Mesh(
    new T.SphereGeometry(160, 24, 16),
    new T.MeshBasicMaterial({
      map: new T.CanvasTexture(skyCanvas),
      side: T.BackSide,
      fog: false,
    }),
  );
  scene.add(sky);
  const turfCanvas = document.createElement("canvas");
  turfCanvas.width = turfCanvas.height = 1024;
  const tc = turfCanvas.getContext("2d");
  const turfData = tc.createImageData(1024, 1024);
  let seed = 4781;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let y = 0; y < 1024; y++)
    for (let x = 0; x < 1024; x++) {
      const i = (y * 1024 + x) * 4;
      const stripe = Math.floor(x / (1024 / 12)) % 2 ? 5 : -5;
      const n =
        (random() - 0.5) * 19 +
        Math.sin(x * 0.025) * 2 +
        Math.cos(y * 0.014) * 2;
      turfData.data[i] = 66 + stripe + n;
      turfData.data[i + 1] = 105 + stripe + n;
      turfData.data[i + 2] = 39 + stripe * 0.4 + n * 0.5;
      turfData.data[i + 3] = 255;
    }
  tc.putImageData(turfData, 0, 0);
  const turf = new T.CanvasTexture(turfCanvas);
  turf.colorSpace = T.SRGBColorSpace;
  turf.anisotropy = 4;
  const grass = new T.Mesh(
    new T.PlaneGeometry(70, 50),
    new T.MeshStandardMaterial({ map: turf, roughness: 1 }),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  group.add(grass);
  const ground = new T.Mesh(
    new T.PlaneGeometry(250, 250),
    new T.MeshStandardMaterial({ color: 0x5e6667, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.06;
  ground.receiveShadow = true;
  scene.add(ground);
  const paintMat = new T.MeshBasicMaterial({ color: 0xe4e5cf });
  function mark(points) {
    const vertices = points.map(([x, z]) => new T.Vector3(x, 0.025, z));
    const line = new T.Line(
      new T.BufferGeometry().setFromPoints(vertices),
      new T.LineBasicMaterial({ color: 0xe4e5cf }),
    );
    group.add(line);
  }
  function line(w, d, x, z) {
    box(w, 0.018, d, x, 0.017, z, paintMat);
  }
  function arc(r, x, z, a = 0, b = Math.PI * 2) {
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const t = a + ((b - a) * i) / 64;
      points.push([x + r * Math.cos(t), z + r * Math.sin(t)]);
    }
    mark(points);
  }
  line(60, 0.09, 0, -20);
  line(60, 0.09, 0, 20);
  line(0.09, 40, -30, 0);
  line(0.09, 40, 30, 0);
  line(0.09, 40, 0, 0);
  arc(5, 0, 0);
  const dotGeo = new T.CircleGeometry(0.13, 12);
  function dot(x, z) {
    const m = new T.Mesh(dotGeo, paintMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.028, z);
    group.add(m);
  }
  dot(0, 0);
  for (const side of [-1, 1]) {
    line(0.09, 18, side * 21, 0);
    line(9, 0.09, side * 25.5, -9);
    line(9, 0.09, side * 25.5, 9);
    line(0.09, 10, side * 27, 0);
    line(3, 0.09, side * 28.5, -5);
    line(3, 0.09, side * 28.5, 5);
    dot(side * 24, 0);
    // Penalty arc extends outside the box only.
    arc(
      4.5,
      side * 24,
      0,
      side === 1 ? Math.PI - 0.84 : -0.84,
      side === 1 ? Math.PI + 0.84 : 0.84,
    );
    for (const z of [-20, 20]) {
      arc(
        1,
        side * 30,
        z,
        side === 1 ? (z > 0 ? Math.PI : Math.PI / 2) : z > 0 ? -Math.PI / 2 : 0,
        side === 1
          ? z > 0
            ? Math.PI * 1.5
            : Math.PI
          : z > 0
            ? 0
            : Math.PI / 2,
      );
      box(0.045, 1.4, 0.045, side * 30, 0.7, z, white);
      const flag = new T.Mesh(
        new T.PlaneGeometry(0.48, 0.3),
        new T.MeshStandardMaterial({ color: 0xf0d32f, side: T.DoubleSide }),
      );
      flag.position.set(side * 30 + 0.23, 1.3, z);
      group.add(flag);
    }
    for (const z of [-4, 4]) {
      box(0.13, 3, 0.13, side * 30, 1.5, z, white);
      box(0.09, 2.5, 0.09, side * 32, 1.25, z, white);
    }
    box(0.13, 0.13, 8, side * 30, 3, 0, white);
    const net = [];
    for (let z = -4; z <= 4; z += 0.32) {
      net.push(
        new T.Vector3(side * 32, 0, z),
        new T.Vector3(side * 32, 2.5, z),
        new T.Vector3(side * 32, 2.5, z),
        new T.Vector3(side * 30, 3, z),
      );
    }
    for (let y = 0; y <= 2.5; y += 0.25)
      net.push(new T.Vector3(side * 32, y, -4), new T.Vector3(side * 32, y, 4));
    for (const z of [-4, 4])
      for (let y = 0; y <= 2.5; y += 0.25)
        net.push(
          new T.Vector3(side * 30, y, z),
          new T.Vector3(side * 32, y, z),
        );
    group.add(
      new T.LineSegments(
        new T.BufferGeometry().setFromPoints(net),
        new T.LineBasicMaterial({
          color: 0xf0eee0,
          transparent: true,
          opacity: 0.62,
        }),
      ),
    );
  }
  // The original small-sided boards remain available as an alternate ruleset.
  const boards = new T.Group();
  group.add(boards);
  function board(w, d, x, z) {
    const mesh = new T.Mesh(boxGeo, dark);
    mesh.scale.set(w, 1.1, d);
    mesh.position.set(x, 0.55, z);
    boards.add(mesh);
  }
  for (const side of [-1, 1]) {
    board(60, 0.25, 0, side * 20);
    board(0.25, 16, side * 30, -12);
    board(0.25, 16, side * 30, 12);
  }
  boards.visible = false;
  // Four banks of terraces with open aisles and a continuous parapet.
  const seats = [];
  for (let bank = 0; bank < 4; bank++) {
    const alongX = bank < 2,
      side = bank % 2 === 0 ? -1 : 1,
      columns = alongX ? 100 : 64;
    for (let row = 0; row < 9; row++) {
      const depth = (alongX ? 27 : 37) + row * 1.25,
        y = 0.3 + row * 0.65;
      box(
        alongX ? 82 : 1.35,
        0.65,
        alongX ? 1.35 : 54,
        alongX ? 0 : side * depth,
        y,
        alongX ? side * depth : 0,
        concrete,
      );
      box(
        alongX ? 82 : 1,
        0.32,
        alongX ? 1 : 54,
        alongX ? 0 : side * depth,
        y + 0.46,
        alongX ? side * depth : 0,
        blue,
      );
      for (let col = 0; col < columns; col++) {
        if (col % 14 < 2) continue;
        const a = (col - (columns - 1) / 2) * 0.78;
        seats.push({
          x: alongX ? a : side * depth,
          z: alongX ? side * depth : a,
          y: y + 0.98,
          rotation: alongX
            ? side < 0
              ? 0
              : Math.PI
            : side < 0
              ? Math.PI / 2
              : -Math.PI / 2,
        });
      }
    }
    const outside = alongX ? 39 : 49;
    box(
      alongX ? 84 : 0.4,
      1.5,
      alongX ? 0.4 : 56,
      alongX ? 0 : side * outside,
      6.7,
      alongX ? side * outside : 0,
      dark,
    );
  }
  // Shuffle once so every quality level retains spectators around the whole stadium.
  for (let i = seats.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [seats[i], seats[j]] = [seats[j], seats[i]];
  }
  const crowd = new T.InstancedMesh(
    new T.CylinderGeometry(0.23, 0.2, 0.58, 5),
    new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }),
    seats.length,
  );
  const heads = new T.InstancedMesh(
    new T.IcosahedronGeometry(0.15, 0),
    new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }),
    seats.length,
  );
  const obj = new T.Object3D(),
    color = new T.Color();
  const shirts = [0xeee8dd, 0x273849, 0x923337, 0x577ba5, 0xb5b6a8, 0x404f65];
  const skin = [0xe1b18d, 0x986c4d, 0xc89371, 0x674e3e];
  seats.forEach((seat, i) => {
    obj.position.set(seat.x, seat.y, seat.z);
    obj.rotation.y = seat.rotation;
    obj.updateMatrix();
    crowd.setMatrixAt(i, obj.matrix);
    crowd.setColorAt(
      i,
      color.setHex(shirts[Math.floor(random() * shirts.length)]),
    );
    obj.position.y += 0.43;
    obj.updateMatrix();
    heads.setMatrixAt(i, obj.matrix);
    heads.setColorAt(i, color.setHex(skin[i % 4]));
  });
  group.add(crowd, heads);
  // Original pitch-side advertising, facing into the pitch.
  const adCanvas = document.createElement("canvas");
  adCanvas.width = 1024;
  adCanvas.height = 128;
  const ac = adCanvas.getContext("2d");
  ac.fillStyle = "#111936";
  ac.fillRect(0, 0, 1024, 128);
  ac.fillStyle = "#fafaf1";
  ac.font = "bold 42px Arial";
  ac.fillText("PENALTY FOOTBALL", 40, 78);
  ac.fillStyle = "#93b8ff";
  ac.font = "25px Arial";
  ac.fillText("THE GAME IS YOURS", 565, 74);
  const adTexture = new T.CanvasTexture(adCanvas);
  adTexture.colorSpace = T.SRGBColorSpace;
  const adMat = new T.MeshBasicMaterial({ map: adTexture, side: T.DoubleSide });
  const adGeo = new T.PlaneGeometry(14, 1.05);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const panel = new T.Mesh(adGeo, adMat);
      panel.position.set((i - 2) * 14, 0.65, side * 24.5);
      if (side === 1) panel.rotation.y = Math.PI;
      group.add(panel);
    }
    for (let i = 0; i < 3; i++) {
      const panel = new T.Mesh(adGeo, adMat);
      panel.position.set(side * 34.5, 0.65, (i - 1) * 14);
      panel.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
      group.add(panel);
    }
  }
  // A recessed tunnel and dugouts replace the large block on the touchline.
  box(4, 2.5, 1, 0, 1.25, -28, dark);
  for (const x of [-8, 8]) {
    box(5, 0.1, 1.5, x, 1.8, -23, dark);
    box(5, 0.5, 0.6, x, 0.35, -23, blue);
  }
  for (const x of [-43, 43])
    for (const z of [-32, 32]) {
      box(0.22, 18, 0.22, x, 9, z, concrete);
      box(
        3.5,
        1.2,
        0.3,
        x,
        18,
        z,
        new T.MeshBasicMaterial({ color: 0xffffdf }),
      );
    }
  return { crowd, heads, boards, crowdCapacity: seats.length };
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
