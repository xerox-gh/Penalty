import * as T from "../libs/three.module.js";
import {
  SKIN_COLORS,
  HAIR_COLORS,
  EYE_COLORS,
  hairParts,
} from "./appearance.js";
const ball = new T.IcosahedronGeometry(1, 1),
  box = new T.BoxGeometry(1, 1, 1);
const cap = new T.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2);
const materials = (colors) =>
  colors.map((color) => new T.MeshStandardMaterial({ color, roughness: 0.95 }));
export const skins = materials(SKIN_COLORS);
const hairs = materials(HAIR_COLORS),
  eyes = materials(EYE_COLORS),
  mouth = new T.MeshStandardMaterial({ color: 0x603e35 });
export function buildHead(a) {
  const root = new T.Group(),
    skin = skins[a.skin],
    hair = hairs[a.hair];
  root.userData.appearance = a;
  const add = (geo, mat, x, y, z, sx, sy, sz) => {
    const m = new T.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    root.add(m);
    return m;
  };
  const w = [1, 0.91, 1.07][a.face],
    h = [1, 1.08, 0.94][a.face];
  add(ball, skin, 0, 0, 0, 0.174 * w, 0.202 * h, 0.17);
  for (const side of [-1, 1]) {
    add(ball, skin, side * 0.174 * w, -0.01, 0, 0.025, 0.044, 0.029);
    add(box, eyes[a.eyes], side * 0.066 * w, 0.012, 0.165, 0.034, 0.022, 0.015);
    const brow = add(
      box,
      hair,
      side * 0.066 * w,
      0.046,
      0.158,
      0.057,
      0.012 + a.brows * 0.003,
      0.014,
    );
    brow.rotation.z = side * (a.brows - 1) * 0.12;
  }
  add(
    ball,
    skin,
    0,
    -0.027,
    0.17,
    0.024 + a.nose * 0.006,
    0.04,
    0.035 + a.nose * 0.006,
  );
  add(box, mouth, 0, -0.102, 0.145, 0.07 + a.mouth * 0.007, 0.012, 0.012);
  if (a.facialHair === 1) {
    add(ball, hair, 0, -0.14, 0.092, 0.125 * w, 0.064, 0.067);
    add(box, mouth, 0, -0.105, 0.163, 0.066, 0.011, 0.014);
  }
  if (a.facialHair === 2) add(box, hair, 0, -0.079, 0.16, 0.09, 0.026, 0.019);
  if (a.facialHair === 3) add(ball, hair, 0, -0.155, 0.114, 0.035, 0.04, 0.031);
  for (const p of hairParts(a)) {
    // Afro sits behind the face; the front stays open around the forehead.
    add(
      p.shape === "box" ? box : p.shape === "cap" ? cap : ball,
      hair,
      p.x,
      p.y,
      p.z,
      p.sx,
      p.sy,
      p.sz,
    );
  }
  return root;
}
