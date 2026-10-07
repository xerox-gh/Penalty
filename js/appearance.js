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
  if (identity?.custom && identity.look) return identity.look;
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
// Head-local shapes shared by cards and models. Angles are radians; tone adds
// subtle strand highlights. Geometry is baked once per style in player-head.js.
export function hairParts(a) {
  const parts = [];
  const part = (
    shape,
    x,
    y,
    z,
    sx,
    sy,
    sz,
    rz = 0,
    tone = 0,
    rx = 0,
    rear = false,
  ) => parts.push({ shape, x, y, z, sx, sy, sz, rz, rx, tone, rear });
  const cap = (height = 0.132) => {
    part("cap", 0, 0.075, -0.014, 0.182, height, 0.171);
    // Tapered temples soften the abrupt bowl-cut edge.
    for (const side of [-1, 1])
      part(
        "ball",
        side * 0.16,
        0.07,
        -0.025,
        0.027,
        0.065,
        0.105,
        side * -0.18,
      );
  };
  const tuft = (x, y, z, sx, sy, sz, rz = 0, tone = 1) =>
    part("ball", x, y, z, sx, sy, sz, rz, tone);
  switch (a.style) {
    case 0:
      cap(0.123);
      // Close-cropped grain, small enough to read as a fade at match scale.
      for (let i = 0; i < 17; i++) {
        const t = i * 2.4,
          r = 0.145 * Math.sqrt(i / 17);
        tuft(
          Math.cos(t) * r,
          0.082 + 0.123 * Math.sqrt(1 - (r / 0.182) ** 2),
          Math.sin(t) * r,
          0.022,
          0.007,
          0.021,
          0,
          i % 3,
        );
      }
      break;
    case 1:
      cap();
      for (let row = 0; row < 3; row++)
        for (let i = -3; i <= 3; i++)
          tuft(
            i * 0.044,
            0.163 + (2 - Math.abs(i)) * 0.012 + row * 0.009,
            0.132 - row * 0.074,
            0.035,
            0.039 + ((i + row + 6) % 3) * 0.007,
            0.059,
            -0.22 + i * 0.08,
            (i + row + 6) % 3,
          );
      break;
    case 2:
    case 3:
      cap();
      // Overlapping swept locks, with a visible part and lifted quiff fringe.
      for (let i = 0; i < 6; i++) {
        const quiff = a.style === 3;
        tuft(
          -0.118 + i * 0.042,
          0.171 + Math.sin((i / 6) * Math.PI) * (quiff ? 0.073 : 0.034),
          quiff ? 0.08 : 0.033,
          0.047,
          quiff ? 0.072 : 0.038,
          0.139 - i * 0.005,
          quiff ? -0.42 : -0.62,
          i % 3,
        );
      }
      if (a.style === 2)
        tuft(0.143, 0.138, 0.012, 0.029, 0.058, 0.136, 0.28, 1);
      break;
    case 4:
      cap();
      for (let i = 0; i < 39; i++) {
        const t = i * 2.39996,
          r = Math.sqrt((i + 0.5) / 39);
        tuft(
          Math.cos(t) * r * 0.174,
          0.115 + Math.sqrt(1 - r * r) * 0.125,
          Math.sin(t) * r * 0.161,
          0.035 + (i % 3) * 0.004,
          0.038,
          0.038,
          t,
          i % 3,
        );
      }
      break;
    case 5:
      part("ball", 0, 0.125, -0.075, 0.213, 0.216, 0.197, 0, 0, 0, true);
      // Rounded, irregular clumps around the silhouette, with an open hairline.
      for (let i = 0; i < 68; i++) {
        const y = -0.22 + (1.2 * (i + 0.5)) / 68,
          t = i * 2.39996;
        const r = Math.sqrt(1 - y * y),
          z = Math.sin(t) * r;
        const x = Math.cos(t) * r;
        const front = z > 0.1 && 0.125 + y * 0.213 > 0.105;
        part(
          "ball",
          x * 0.211,
          0.125 + y * 0.213,
          -0.065 + z * 0.191,
          0.045 + (i % 3) * 0.003,
          0.045,
          0.043,
          t,
          i % 3,
          0,
          !front,
        );
      }
      break;
    case 6:
      cap(0.14);
      for (let i = -2; i <= 2; i++)
        tuft(i * .052, .198 + (2 - Math.abs(i)) * .013, -.016,
          .031, .035, .154, i * -.12, (i + 2) % 3);
      // Rounded, slightly bent locs. Staggered lengths keep the fringe readable.
      for (let i = 0; i < 13; i++) {
        const t = (i * Math.PI * 2) / 13,
          front = Math.sin(t) > 0.35;
        const x = Math.cos(t) * 0.157,
          z = Math.sin(t) * 0.15;
        const length = front ? 0.085 + (i % 3) * 0.014 : 0.19 + (i % 3) * 0.025;
        for (let j = 0; j < 4; j++) {
          const f = j / 3;
          part(
            "ball",
            x * (1 + f * 0.12) + Math.sin(i * 3 + f) * 0.012,
            0.178 - f * length,
            z - f * 0.015,
            0.023 - f * 0.004,
            Math.max(.035, length / 4),
            0.024 - f * 0.003,
            Math.cos(t) * 0.17,
            (i + j) % 3,
            0,
            z < -0.06,
          );
        }
      }
      break;
    case 7:
      // Cornrows follow the scalp front-to-back; alternating lobes suggest braids.
      for (let row = -2; row <= 2; row++) {
        const x = row * 0.066,
          radius = Math.sqrt(1 - (x / 0.19) ** 2);
        for (let j = 0; j < 14; j++) {
          const t = -1.02 + (j / 13) * 3.3;
          part(
            "ball",
            x + (j % 2 ? 0.005 : -0.005),
            0.025 + Math.cos(t) * 0.19 * radius,
            Math.sin(t) * -0.176,
            0.018,
            0.019,
            0.036,
            row * -0.12,
            j % 3,
            -t,
            t > 1.65,
          );
        }
      }
      break;
    case 8:
      cap(0.129);
      for (let i = -3; i <= 3; i++)
        tuft(
          i * 0.041,
          0.166 + (3 - Math.abs(i)) * 0.012,
          -0.033,
          0.031,
          0.031,
          0.147,
          i * -0.13,
          (i + 3) % 3,
        );
      part("ball", 0, 0.202, -0.178, 0.095, 0.092, 0.087, 0, 0, 0, true);
      for (let i = 0; i < 8; i++) {
        const t = (i * Math.PI) / 4;
        part(
          "ball",
          Math.cos(t) * 0.052,
          0.202 + Math.sin(t) * 0.056,
          -0.218,
          0.043,
          0.04,
          0.036,
          t,
          i % 3,
          0,
          true,
        );
      }
      break;
    case 9:
      break;
  }
  return parts;
}
// Same three restrained colour values on the card and on the 3D mesh.
export function hairTone(color, tone = 0) {
  const n = parseInt(color.slice(1), 16),
    lift = [0, 0.045, 0.09][tone];
  return (
    "#" +
    [16, 8, 0]
      .map((shift) => {
        const channel = (n >> shift) & 255;
        return Math.round(channel + (255 - channel) * lift)
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
  );
}
export function portraitSVG(a, kit) {
  const skin = SKIN_COLORS[a.skin],
    hair = HAIR_COLORS[a.hair],
    eye = EYE_COLORS[a.eyes];
  const w = [1, 0.91, 1.07][a.face],
    h = [1, 1.08, 0.94][a.face];
  const draw = (p) => {
    const x = 80 + p.x * 150,
      y = 40 - p.y * 150;
    const rx = p.sx * 150,
      ry = Math.hypot(p.sy * Math.cos(p.rx), p.sz * Math.sin(p.rx)) * 150;
    const fill = hairTone(hair, p.tone);
    if (p.shape === "cap")
      return `<path d="M${x - rx} ${y}Q${x - rx} ${y - ry} ${x} ${y - ry}Q${x + rx} ${y - ry} ${x + rx} ${y}Q${x + rx * 0.78} ${y - 5} ${x} ${y - 3}Q${x - rx * 0.78} ${y - 5} ${x - rx} ${y}" fill="${fill}"/>`;
    return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${(-p.rz * 180) / Math.PI} ${x} ${y})" fill="${fill}"/>`;
  };
  const parts = hairParts(a).sort((a, b) => a.z - b.z);
  const rear = parts
    .filter((p) => p.rear || p.z < -0.12)
    .map(draw)
    .join("");
  const front = parts
    .filter((p) => !p.rear && p.z >= -0.12)
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
  return `<svg viewBox="0 -14 160 135" aria-hidden="true" data-hair="${a.style}"><path d="M20 121L30 79 62 67H98L130 79 141 121" fill="${kit}"/><path d="M67 60H93V74L80 82 67 73" fill="${skin}"/><path d="M62 69L80 82 98 69" stroke="#172e45" stroke-width="5" fill="none"/>${rear}<g transform="translate(80 40) scale(${w} ${h}) translate(-80 -40)"><ellipse cx="55" cy="41" rx="5" ry="8" fill="${skin}"/><ellipse cx="105" cy="41" rx="5" ry="8" fill="${skin}"/><path d="M55 23L65 12H95L105 23 103 48 94 62 80 68 66 61 57 48Z" fill="${skin}"/><path d="M58 45L66 59 80 65 94 59 102 45 94 63 80 69 65 63Z" fill="#0001"/>${[66, 94].map((x) => `<path d="M${x - 5} 36h10" stroke="#fff5" stroke-width="4"/><circle cx="${x}" cy="36" r="2.8" fill="${eye}"/><path d="M${x - 6} ${30 + a.brows}l12 ${a.brows - 1}" stroke="${hair}" stroke-width="2.8"/>`).join("")}<path d="M79 37L${76 - a.nose} 48H84" stroke="#0003" stroke-width="2" fill="none"/>${beard}<path d="M73 57Q80 ${57 + a.mouth * 2} 87 57" stroke="#603e35" stroke-width="2" fill="none"/></g>${front}<path d="M111 91H119V101H111Z" fill="#e7c866"/></svg>`;
}
