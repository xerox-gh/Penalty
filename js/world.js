import { NATIONS } from "./nationality.js";
import { COUNTRY_DATA } from "./world-data.js";
export { COUNTRY_DATA };
export const WORLD_CLUBS = [],
  WORLD_LEAGUES = [];
const special = {
  0: ["London Gunners", "Manchester Sky", "Liverpool Red", "London Blue"],
  2: ["Madrid White", "Barcelona Blue", "Madrid Red", "Seville Gold"],
  4: ["Turin Stripes", "Milan Black", "Milan Red", "Naples Blue"],
  6: ["Munich Red", "Dortmund Yellow"],
  8: ["Paris Saints", "Lyon Blue"],
  10: ["Lisbon Eagles", "Porto Blue"],
  12: ["Amsterdam Lions", "Rotterdam Red"],
};
COUNTRY_DATA.forEach((d, ci) => {
  for (let tier = 0; tier < 2; tier++) {
    const lid = ci * 2 + tier,
      league = { id: lid, country: d[0], tier, name: d[tier + 1], clubs: [] };
    WORLD_LEAGUES.push(league);
    const cities = d[3].split("|"),
      n = ci < 5 ? 20 : 16;
    for (let i = 0; i < n; i++) {
      const id = lid * 100 + i,
        hue = (i * 67 + ci * 41) % 360;
      const club = {
        id,
        lid,
        name:
          special[lid]?.[i] ||
          cities[i % cities.length] +
            " " +
            ["United", "City", "Athletic", "Rovers"][
              Math.floor(i / cities.length)
            ],
        color: `hsl(${hue},67%,51%)`,
        rating: Math.max(
          42,
          Math.round(
            (ci < 5 ? 85 : ci < 9 ? 77 : 70) -
              tier * 13 -
              i * 0.95 +
              ((id * 17) % 5),
          ),
        ),
      };
      WORLD_CLUBS.push(club);
      league.clubs.push(id);
    }
  }
});
const clubs = new Map(WORLD_CLUBS.map((c) => [c.id, c]));
export const worldClub = (id) => clubs.get(Number(id));
export function worldRoster(id) {
  const c = worldClub(id),
    d = COUNTRY_DATA[Math.floor(c.lid / 2)],
    first = d[4].split("|"),
    last = d[5].split("|");
  return ["GK", "DEF", "MID", "MID", "FWD"].map((position, i) => {
    const rating = Math.max(
      35,
      Math.min(99, c.rating + ((i * 7 + id) % 9) - 4),
    );
    return {
      id: `world-${id}-${i}`,
      name:
        first[(id + i) % first.length] + " " + last[(id + i * 3) % last.length],
      position,
      nationality:
        NATIONS.find(
          (n) =>
            n.name ===
            ({ "USA/Canada": "USA", Turkey: "Türkiye" }[d[0]] || d[0]),
        )?.code || "US",
      rating,
      pace: rating + (i === 4 ? 2 : 0),
      shoot: rating,
      pass: rating,
      strength: Math.min(100, rating + (i === 1 ? 6 : 0)),
      dribble: Math.min(100, rating + (i === 2 ? 5 : 0)),
    };
  });
}
export function fixtures(ids) {
  let ring = [...ids];
  const rounds = [];
  for (let r = 0; r < ids.length - 1; r++) {
    rounds.push(
      Array.from({ length: ids.length / 2 }, (_, i) =>
        r % 2
          ? [ring[ring.length - 1 - i], ring[i]]
          : [ring[i], ring[ring.length - 1 - i]],
      ),
    );
    ring.splice(1, 0, ring.pop());
  }
  return [...rounds, ...rounds.map((r) => r.map(([a, b]) => [b, a]))];
}
const emptyTable = (ids) =>
  ids.map((id) => ({ id, played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }));
export const standings = (table) =>
  [...table].sort(
    (a, b) =>
      b.pts - a.pts ||
      b.gf - b.ga - (a.gf - a.ga) ||
      b.gf - a.gf ||
      a.id - b.id,
  );
export function newWorldCareer(club) {
  const c = worldClub(club);
  if (!c) throw Error("Choose a club.");
  const base = c.lid - (c.lid % 2);
  return {
    club: c.id,
    league: c.lid,
    season: 1,
    round: 0,
    divisions: [
      ...WORLD_LEAGUES.slice(base, base + 2).map((l) => [...l.clubs]),
    ],
    table: emptyTable(WORLD_LEAGUES[c.lid].clubs),
    history: [],
    lastFinish: null,
  };
}
export const worldFixture = (c) =>
  fixtures(c.divisions[c.league % 2])[c.round]?.find((f) => f.includes(c.club));
function record(table, a, b, x, y) {
  const h = table.find((t) => t.id === a),
    v = table.find((t) => t.id === b);
  h.played++;
  v.played++;
  h.gf += x;
  h.ga += y;
  v.gf += y;
  v.ga += x;
  if (x === y) {
    h.d++;
    v.d++;
    h.pts++;
    v.pts++;
  } else {
    const win = x > y ? h : v,
      lose = x > y ? v : h;
    win.w++;
    win.pts += 3;
    lose.l++;
  }
}
export function recordWorld(c, gf, ga) {
  const round = fixtures(c.divisions[c.league % 2])[c.round];
  if (!round) throw Error("Season already complete.");
  for (const [a, b] of round) {
    const seed = c.season * 31 + c.round * 17 + a * 3 + b * 7;
    const x = a === c.club ? gf : b === c.club ? ga : seed % 4,
      y = a === c.club ? ga : b === c.club ? gf : Math.floor(seed / 7) % 4;
    record(c.table, a, b, x, y);
    if (a === c.club || b === c.club)
      c.history.push({ opponent: a === c.club ? b : a, gf, ga });
  }
  c.round++;
}
export function nextWorldSeason(c) {
  const tier = c.league % 2;
  if (c.round !== fixtures(c.divisions[tier]).length)
    throw Error("Finish this season first.");
  const order = standings(c.table).map((t) => t.id),
    rank = order.indexOf(c.club) + 1;
  // Simulate the parallel division with the same deterministic fixture engine.
  const other = 1 - tier,
    table = emptyTable(c.divisions[other]);
  fixtures(c.divisions[other]).forEach((r, i) =>
    r.forEach(([a, b]) =>
      record(
        table,
        a,
        b,
        (a * 3 + i + c.season) % 4,
        (b * 7 + i * 3 + c.season) % 4,
      ),
    ),
  );
  const otherOrder = standings(table).map((t) => t.id),
    top = tier === 0 ? order : otherOrder,
    bottom = tier === 1 ? order : otherOrder;
  const down = top.slice(-3),
    up = bottom.slice(0, 3);
  c.divisions = [
    c.divisions[0].filter((id) => !down.includes(id)).concat(up),
    c.divisions[1].filter((id) => !up.includes(id)).concat(down),
  ];
  const newTier = c.divisions[0].includes(c.club) ? 0 : 1;
  c.lastFinish = {
    rank,
    movement:
      newTier < tier
        ? "Promoted"
        : newTier > tier
          ? "Relegated"
          : "Stayed in division",
  };
  c.league = c.league - tier + newTier;
  c.season++;
  c.round = 0;
  c.history = [];
  c.table = emptyTable(c.divisions[newTier]);
}
export function validateWorld(c) {
  if (c == null) return null;
  const int = (v, max) => Number.isInteger(v) && v >= 0 && v <= max,
    fail = () => {
      throw Error("Invalid World League career.");
    };
  if (
    !worldClub(c.club) ||
    !WORLD_LEAGUES[c.league] || !int(c.league, WORLD_LEAGUES.length-1) ||
    !int(c.season, 10000) ||
    !c.season ||
    !Array.isArray(c.divisions) ||
    c.divisions.length !== 2
  )
    fail();
  const origin = Math.floor(c.league / 2),
    size = WORLD_LEAGUES[c.league].clubs.length;
  if (
    c.divisions.some(
      (ids) =>
        !Array.isArray(ids) ||
        ids.length !== size ||
        new Set(ids).size !== size ||
        ids.some(
          (id) =>
            !worldClub(id) || Math.floor(worldClub(id).lid / 2) !== origin,
        ),
    ) ||
    new Set(c.divisions.flat()).size !== size * 2 ||
    !c.divisions[c.league % 2].includes(c.club)
  )
    fail();
  if (
    !int(c.round, (size - 1) * 2) ||
    !Array.isArray(c.table) ||
    c.table.length !== size ||
    new Set(c.table.map((t) => t.id)).size !== size ||
    c.table.some(
      (t) =>
        !c.divisions[c.league % 2].includes(t.id) ||
        !["played", "w", "d", "l", "gf", "ga", "pts"].every((k) =>
          int(t[k], 10000),
        ) ||
        t.played !== c.round ||
        t.w + t.d + t.l !== t.played ||
        t.pts !== 3 * t.w + t.d,
    )
  )
    fail();
  if (
    !Array.isArray(c.history) ||
    c.history.length !== c.round ||
    c.history.some(
      (h) => !worldClub(h.opponent) || !int(h.gf, 100) || !int(h.ga, 100),
    )
  )
    fail();
  if (
    c.lastFinish &&
    (!int(c.lastFinish.rank, size) ||
      !["Promoted", "Relegated", "Stayed in division"].includes(
        c.lastFinish.movement,
      ))
  )
    fail();
  return c;
}
