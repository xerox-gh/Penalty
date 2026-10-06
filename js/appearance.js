// Shared identity for the SVG card and the 3D player. Stable IDs survive save updates.
export const HAIR_STYLES = [
  "Buzz cut",
  "Textured crop",
  "Side part",
  "Quiff",
  "Curls",
  "Afro",
  "Locs",
  "Braids",
  "Bun",
  "Bald",
];
export const SKIN_COLORS = [
  "#e6bb97",
  "#dab08c",
  "#b77e58",
  "#8e6045",
  "#624333",
  "#f0cbb0",
];
export const HAIR_COLORS = [
  "#211c19",
  "#66432b",
  "#c7a367",
  "#392923",
  "#a05232",
  "#c9c9c3",
];
export const EYE_COLORS = ["#493223", "#53778a", "#657444", "#292d35"];
const cache = new Map();
export function appearanceFor(identity) {
  const key = String(identity?.id ?? identity?.name ?? identity);
  if (cache.has(key)) return cache.get(key);
  let hash = 2166136261;
  for (const ch of key)
    hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  let state = hash;
  const next = (n) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return Math.floor((state / 4294967296) * n);
  };
  const profile = Object.freeze({
    style: next(10),
    skin: next(6),
    hair: next(6),
    eyes: next(4),
    face: next(3),
    brows: next(3),
    facialHair: next(4),
    nose: next(3),
    mouth: next(3),
  });
  cache.set(key, profile);
  return profile;
}
// Hair pieces use head-local metres. Both renderers consume this exact silhouette.
export function hairParts(a) {
  const parts = [];
  const part = (shape, x, y, z, sx, sy, sz) =>
    parts.push({ shape, x, y, z, sx, sy, sz });
  const cap = (height = 0.14) =>
    part("cap", 0, 0.08, -0.012, 0.183, height, 0.173);
  switch (a.style) {
    case 0:
      cap(0.125);
      break;
    case 1:
      cap();
      for (let i = -2; i <= 2; i++)
        part("ball", i * 0.062, 0.17, 0.09, 0.057, 0.065, 0.068);
      break;
    case 2:
      cap();
      part("ball", -0.055, 0.19, 0.025, 0.145, 0.06, 0.145);
      part("box", 0.065, 0.18, 0.08, 0.012, 0.03, 0.18);
      break;
    case 3:
      cap();
      part("ball", -0.025, 0.215, 0.065, 0.165, 0.09, 0.135);
      break;
    case 4:
      cap();
      for (let i = 0; i < 9; i++) {
        const t = (i * Math.PI * 2) / 9;
        part(
          "ball",
          Math.cos(t) * 0.13,
          0.18 + (i % 2) * 0.03,
          Math.sin(t) * 0.12,
          0.07,
          0.075,
          0.07,
        );
      }
      break;
    case 5:
      part("ball", 0, 0.135, -0.1, 0.245, 0.235, 0.225);
      break;
    case 6:
      cap();
      for (let i = 0; i < 8; i++) {
        const t = (i * Math.PI * 2) / 8;
        part(
          "box",
          Math.cos(t) * 0.18,
          Math.sin(t) > 0.3 ? 0.16 : 0.055,
          Math.sin(t) * 0.155 - 0.02,
          0.058,
          Math.sin(t) > 0.3 ? 0.14 : 0.3,
          0.058,
        );
      }
      break;
    case 7:
      for (let i = -2; i <= 2; i++)
        part(
          "ball",
          i * 0.068,
          0.135 + 0.025 * (2 - Math.abs(i)),
          -0.012,
          0.026,
          0.067,
          0.183,
        );
      break;
    case 8:
      cap();
      part("ball", 0, 0.19, -0.19, 0.092, 0.09, 0.095);
      break;
    case 9:
      break;
  }
  return parts;
}
export function portraitSVG(a, kit) {
  const skin = SKIN_COLORS[a.skin],
    hair = HAIR_COLORS[a.hair],
    eye = EYE_COLORS[a.eyes];
  const w = [1, 0.91, 1.07][a.face],
    h = [1, 1.08, 0.94][a.face];
  const draw = (p) =>
    p.shape === "cap"
      ? `<path d="M${80 - p.sx * 150} ${40 - p.y * 150}Q${80 - p.sx * 150} ${40 - (p.y + p.sy) * 150} 80 ${40 - (p.y + p.sy) * 150}Q${80 + p.sx * 150} ${40 - (p.y + p.sy) * 150} ${80 + p.sx * 150} ${40 - p.y * 150}Z" fill="${hair}"/>`
      : p.shape === "box"
        ? `<rect x="${80 + (p.x - p.sx / 2) * 150}" y="${40 - (p.y + p.sy / 2) * 150}" width="${p.sx * 150}" height="${p.sy * 150}" rx="2" fill="${hair}"/>`
        : `<ellipse cx="${80 + p.x * 150}" cy="${40 - p.y * 150}" rx="${p.sx * 150}" ry="${p.sy * 150}" fill="${hair}"/>`;
  const parts = hairParts(a),
    rear = parts
      .filter((p) => p.z < -0.12 || a.style === 5)
      .map(draw)
      .join(""),
    front = parts
      .filter((p) => p.z >= -0.12 && a.style !== 5)
      .map(draw)
      .join("");
  const beard =
    a.facialHair === 1
      ? `<path d="M59 49L67 64 80 70 94 62 101 49 96 58 80 63 66 57Z" fill="${hair}"/>`
      : a.facialHair === 2
        ? `<path d="M69 54Q80 49 91 54L91 58Q80 54 69 58Z" fill="${hair}"/>`
        : a.facialHair === 3
          ? `<path d="M75 61H85L83 68H77Z" fill="${hair}"/>`
          : "";
  return `<svg viewBox="0 -14 160 135" aria-hidden="true" data-hair="${a.style}"><path d="M20 121L30 79 62 67H98L130 79 141 121" fill="${kit}"/><path d="M67 60H93V74L80 82 67 73" fill="${skin}"/><path d="M62 69L80 82 98 69" stroke="#172e45" stroke-width="5" fill="none"/>${rear}<g transform="translate(80 40) scale(${w} ${h}) translate(-80 -40)"><ellipse cx="55" cy="41" rx="5" ry="8" fill="${skin}"/><ellipse cx="105" cy="41" rx="5" ry="8" fill="${skin}"/><path d="M55 23L65 12H95L105 23 103 48 94 62 80 68 66 61 57 48Z" fill="${skin}"/><path d="M58 45L66 59 80 65 94 59 102 45 94 63 80 69 65 63Z" fill="#0001"/>${[66, 94].map((x) => `<path d="M${x - 5} 36h10" stroke="#fff5" stroke-width="4"/><circle cx="${x}" cy="36" r="2.8" fill="${eye}"/><path d="M${x - 6} ${30 + a.brows}l12 ${a.brows - 1}" stroke="${hair}" stroke-width="2.8"/>`).join("")}<path d="M79 37L${76 - a.nose} 48H84" stroke="#0003" stroke-width="2" fill="none"/>${beard}<path d="M73 57Q80 ${57 + a.mouth * 2} 87 57" stroke="#603e35" stroke-width="2" fill="none"/></g>${a.style === 5 ? `<path d="M45 29Q43 -3 80 -1Q117 -3 115 29L101 19Q80 8 59 19Z" fill="${hair}"/>` : ""}${front}<path d="M111 91H119V101H111Z" fill="#e7c866"/></svg>`;
}
