import * as T from "../libs/three.module.js";
import {
  SKIN_COLORS,
  HAIR_COLORS,
  EYE_COLORS,
  hairParts,
  hairTone,
} from "./appearance.js";
const ball = new T.IcosahedronGeometry(1, 1),
  box = new T.BoxGeometry(1, 1, 1);
const cap = new T.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
const materials = (colors) =>
  colors.map((color) => new T.MeshStandardMaterial({ color, roughness: 0.95 }));
export const skins = materials(SKIN_COLORS);
const hairs = materials(HAIR_COLORS),
  eyes = materials(EYE_COLORS),
  mouth = new T.MeshStandardMaterial({ color: 0x603e35 });
// Bake strands into one shared mesh: richer silhouettes without a draw call
// for every curl. Cached by style/colour; no hair work in the animation loop.
const hairGeometry = new Map();
const strandMaterial = new T.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.88,
});
function styledHair(a) {
  const key = `${a.style}:${a.hair}`;
  if (!hairGeometry.has(key)) {
    const positions = [],
      normals = [],
      colors = [];
    const transform = new T.Object3D();
    for (const p of hairParts(a)) {
      transform.position.set(p.x, p.y, p.z);
      transform.scale.set(p.sx, p.sy, p.sz);
      transform.rotation.set(p.rx, 0, p.rz);
      transform.updateMatrix();
      const source = p.shape === "cap" ? cap : ball;
      const geo = source.index ? source.toNonIndexed() : source.clone();
      geo.applyMatrix4(transform.matrix);
      positions.push(...geo.attributes.position.array);
      normals.push(...geo.attributes.normal.array);
      const color = new T.Color(hairTone(HAIR_COLORS[a.hair], p.tone));
      for (let i = 0; i < geo.attributes.position.count; i++)
        colors.push(color.r, color.g, color.b);
      geo.dispose();
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    geo.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
    geo.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    geo.computeBoundingSphere();
    hairGeometry.set(key, geo);
  }
  const mesh = new T.Mesh(hairGeometry.get(key), strandMaterial);
  mesh.name = "hairstyle";
  mesh.castShadow = true;
  return mesh;
}
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
  if (a.style !== 9) root.add(styledHair(a));
  return root;
}
