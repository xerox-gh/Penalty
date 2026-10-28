// Fictional football biographies, independent of appearance and gameplay attributes.
const rows = [
  ["DE", "Germany", "h", "#151515", "#d32b36", "#f2c744"],
  ["FR", "France", "v", "#24478d", "#fff", "#dc3943"],
  ["IT", "Italy", "v", "#29875a", "#fff", "#d83b46"],
  ["NL", "Netherlands", "h", "#c83c43", "#fff", "#284e90"],
  ["BE", "Belgium", "v", "#191919", "#f6d449", "#dd3b43"],
  ["IE", "Ireland", "v", "#29965d", "#fff", "#ec913e"],
  ["RO", "Romania", "v", "#24468f", "#f5cf42", "#d53745"],
  ["AT", "Austria", "h", "#d93a43", "#fff", "#d93a43"],
  ["PL", "Poland", "b", "#fff", "#cf3451"],
  ["UA", "Ukraine", "b", "#3381c6", "#f7d748"],
  ["NG", "Nigeria", "v", "#228c58", "#fff", "#228c58"],
  ["JP", "Japan", "disc", "#fff", "#ce3549"],
  ["DK", "Denmark", "cross", "#ba2e3d", "#fff"],
  ["SE", "Sweden", "cross", "#2875a7", "#f8d64a"],
  ["FI", "Finland", "cross", "#fff", "#2b568b"],
  ["NO", "Norway", "cross", "#bb3541", "#fff", "#224477"],
  ["ID", "Indonesia", "b", "#d43a44", "#fff"],
  ["BD", "Bangladesh", "disc", "#126c52", "#da394a"],
  ["AR", "Argentina", "h", "#87c5e9", "#fff", "#87c5e9"],
];
rows.push(
  ["US", "USA", "usa", "#fff", "#b22234", "#253c70"],
  ["HR", "Croatia", "croatia", "#e34242", "#fff", "#29509a"],
  ["BR", "Brazil", "brazil", "#19824b", "#f1db46", "#294c99"],
  ["ES", "Spain", "h", "#b93037", "#f0ca4c", "#b93037"],
  ["PT", "Portugal", "portugal", "#21864a", "#c9353e"],
  ["GB", "United Kingdom", "uk", "#244075", "#fff", "#c93240"],
  ["CA", "Canada", "canada", "#d63242", "#fff"],
  ["MX", "Mexico", "v", "#238253", "#fff", "#c63b42"],
  ["KR", "South Korea", "korea", "#fff", "#c93240", "#28559d"],
  ["CN", "China", "china", "#d82e39", "#f6db44"],
  ["AU", "Australia", "australia", "#244075", "#fff"],
  ["NZ", "New Zealand", "australia", "#244075", "#e24949"],
  ["TR", "Türkiye", "crescent", "#d63242", "#fff"],
  ["GR", "Greece", "greece", "#296caa", "#fff"],
  ["CH", "Switzerland", "swiss", "#d4313c", "#fff"],
  ["RS", "Serbia", "h", "#c53142", "#294477", "#fff"],
  ["MA", "Morocco", "morocco", "#c53440", "#176d43"],
  ["DZ", "Algeria", "algeria", "#26754a", "#fff", "#ce3549"],
  ["GH", "Ghana", "ghana", "#ce3549", "#f6d74c", "#24844b"],
  ["SN", "Senegal", "senegal", "#24844b", "#f6d74c", "#ce3549"],
  ["CM", "Cameroon", "cameroon", "#24844b", "#ce3549", "#f6d74c"],
  ["UY", "Uruguay", "uruguay", "#fff", "#77b5dd"],
  ["CL", "Chile", "chile", "#fff", "#cf3546", "#264c8a"],
  ["CO", "Colombia", "colombia", "#f2d242", "#2456a0", "#ce3549"],
  ["PE", "Peru", "v", "#cf3546", "#fff", "#cf3546"],
  ["EN", "England", "england", "#fff", "#c6313e"],
  ["SC", "Scotland", "scotland", "#275b9a", "#fff"],
  ["RU", "Russia", "h", "#fff", "#2f5296", "#cc3547"],
  ["CZ", "Czechia", "czech", "#fff", "#cd3546", "#24558b"],
  ["SA", "Saudi Arabia", "saudi", "#24794b", "#fff"],
  ["EG", "Egypt", "h", "#cf3546", "#fff", "#222"],
  ["ZA", "South Africa", "southafrica", "#cf3546", "#fff", "#294e8d"],
);
// Extra national sides give each regional cup a complete eight-team field.
// Emblems remain deliberately simplified procedural flag designs.
rows.push(
 ["CR","Costa Rica","h","#2453a0","#d83242","#2453a0"],
 ["JM","Jamaica","jamaica","#187b4e","#f6d447","#171b20"],
 ["PA","Panama","panama","#fff","#ca3444","#2459a0"],
 ["HN","Honduras","h","#278dc6","#fff","#278dc6"],
 ["GT","Guatemala","v","#6ea9d3","#fff","#6ea9d3"],
 ["IN","India","h","#e99b43","#fff","#2e9656"],
 ["IR","Iran","h","#2d9c60","#fff","#d63d46"],
 ["EC","Ecuador","colombia","#f2d242","#2456a0","#ce3549"],
 ["PY","Paraguay","h","#d13c49","#fff","#345fa5"],
 ["FJ","Fiji","australia","#73b7dc","#fff"],
 ["WS","Samoa","samoa","#ca3045","#254990","#fff"],
 ["TO","Tonga","tonga","#c62f3c","#fff"],
 ["SB","Solomon Islands","solomon","#264d95","#247b46","#e9cf46"],
 ["VU","Vanuatu","vanuatu","#cb3945","#298452","#efcf48"],
 ["PG","Papua New Guinea","papua","#d73d44","#171b20","#f0d546"],
);
export const NATIONS = rows.map(([code, name, pattern, ...colors]) => ({
  code,
  name,
  pattern,
  colors,
}));
// Explicit creative assignments for the special players already supplied by the user.
const specials = {
  guide1: "US",
  guide2: "HR",
  guide3: "BR",
  guide4: "CA",
  guide5: "MX",
  guide6: "ES",
  guide7: "PT",
  guide8: "KR",
  guide9: "MA",
  guide10: "AU",
  heroes1: "DE",
  heroes2: "JP",
  heroes3: "DE",
  heroes4: "IT",
  heroes5: "NG",
  heroes6: "DK",
  heroes7: "FR",
  heroes8: "SE",
  heroes9: "PL",
  heroes10: "UA",
  icon1: "FR",
  icon2: "IT",
  icon3: "NO",
  icon4: "AR",
  icon5: "AR",
  icon6: "SE",
  icon7: "DE",
  icon8: "AR",
  icon9: "SE",
  icon10: "FR",
  glory1: "IT",
  glory2: "DK",
  glory3: "NL",
  glory4: "NG",
  glory5: "IT",
  glory6: "DE",
  glory7: "IE",
  glory8: "AR",
};
export function nationalityFor(card) {
  if (card.custom || card.nationality) {
    const nation = NATIONS.find((n) => n.code === card.nationality);
    if (nation) return nation;
  }
  let hash = 0;
  for (const c of card.id) hash = (Math.imul(hash, 31) + c.charCodeAt(0)) >>> 0;
  return (
    NATIONS.find((n) => n.code === specials[card.id]) || NATIONS[hash % 19]
  );
}
export function flagSVG(n) {
  const c = n.colors;
  let shapes = `<rect width="30" height="20" fill="${c[0]}"/>`;
  if (n.pattern === "v")
    shapes += `<path d="M10 0h10v20H10Z" fill="${c[1]}"/><path d="M20 0h10v20H20Z" fill="${c[2]}"/>`;
  if (n.pattern === "h")
    shapes += `<path d="M0 6.666h30v6.668H0Z" fill="${c[1]}"/><path d="M0 13.333h30V20H0Z" fill="${c[2]}"/>`;
  if (n.pattern === "b") shapes += `<path d="M0 10h30v10H0Z" fill="${c[1]}"/>`;
  if (n.pattern === "disc")
    shapes += `<circle cx="${n.code === "BD" ? 13 : 15}" cy="10" r="6" fill="${c[1]}"/>`;
  if (n.pattern === "cross") {
    shapes += `<path d="M8 0h4v20H8ZM0 8h30v4H0Z" fill="${c[1]}"/>`;
    if (c[2]) shapes += `<path d="M9 0h2v20H9ZM0 9h30v2H0Z" fill="${c[2]}"/>`;
  }
  if (n.code === "AR")
    shapes += '<circle cx="15" cy="10" r="1.8" fill="#e6b849"/>';
  const rect = (x, y, w, h, color) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
  const star = (x, y, r, color) =>
    `<polygon points="${Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5,
        s = i % 2 ? r * 0.42 : r;
      return `${x + Math.cos(a) * s},${y + Math.sin(a) * s}`;
    }).join(" ")}" fill="${color}"/>`;
  if (["usa", "uruguay", "greece"].includes(n.pattern)) {
    const count = n.pattern === "usa" ? 13 : 9;
    for (let i = 0; i < count; i++)
      if (n.pattern === "usa" ? i % 2 === 0 : i % 2 === 1)
        shapes += rect(0, (i * 20) / count, 30, 20 / count, c[1]);
    if (n.pattern === "usa") {
      shapes += rect(0, 0, 13, 11, c[2]);
      for (let y = 0; y < 9; y++)
        for (let x = 0; x < (y % 2 ? 5 : 6); x++)
          shapes += star(
            1.1 + x * 2.1 + (y % 2 ? 1 : 0),
            0.7 + y * 1.15,
            0.45,
            "#fff",
          );
    }
    if (n.pattern === "greece")
      shapes +=
        rect(0, 0, 11, 11, c[0]) +
        rect(4, 0, 3, 11, c[1]) +
        rect(0, 4, 11, 3, c[1]);
    if (n.pattern === "uruguay")
      shapes += rect(0, 0, 12, 11, "#fff") + star(6, 5.5, 4, "#e4bd44");
  }
  if (n.pattern === "croatia") {
    shapes +=
      rect(0, 6.66, 30, 6.67, c[1]) +
      rect(0, 13.33, 30, 6.67, c[2]) +
      rect(11, 6, 8, 10, "#fff");
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 4; x++)
        if ((x + y) % 2 === 0)
          shapes += rect(11 + x * 2, 6 + y * 2, 2, 2, c[0]);
  }
  if (n.pattern === "brazil")
    shapes += `<path d="M15 2L28 10 15 18 2 10Z" fill="${c[1]}"/><circle cx="15" cy="10" r="5" fill="${c[2]}"/><path d="M11 8Q15 7 19 12" stroke="#fff" fill="none"/>`;
  if (n.pattern === "portugal")
    shapes +=
      rect(12, 0, 18, 20, c[1]) +
      `<circle cx="12" cy="10" r="4" fill="#f2d44c"/>`;
  if (n.pattern === "canada")
    shapes +=
      rect(7, 0, 16, 20, "#fff") +
      `<path d="M15 3L17 7 20 6 19 10 22 11 17 14 16 18H14V14L8 11 11 10 10 6 13 7Z" fill="${c[0]}"/>`;
  if (n.pattern === "uk")
    shapes +=
      `<path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="5"/><path d="M0 0L30 20M30 0L0 20" stroke="${c[2]}" stroke-width="2"/>` +
      rect(12, 0, 6, 20, "#fff") +
      rect(0, 7, 30, 6, "#fff") +
      rect(13, 0, 4, 20, c[2]) +
      rect(0, 8, 30, 4, c[2]);
  if (n.pattern === "korea")
    shapes +=
      `<circle cx="15" cy="10" r="5" fill="${c[1]}"/><path d="M10 10A5 5 0 0 0 20 10Q17 7 15 10T10 10" fill="${c[2]}"/>` +
      rect(3, 3, 5, 2, "#222") +
      rect(22, 15, 5, 2, "#222");
  if (n.pattern === "china")
    shapes +=
      star(6, 6, 4, c[1]) +
      [0, 1, 2, 3]
        .map((i) => star(12 + (i % 2) * 2, 2 + i * 3, 1.2, c[1]))
        .join("");
  if (n.pattern === "australia")
    shapes +=
      star(8, 13, 3, c[1]) +
      star(22, 5, 2, c[1]) +
      star(25, 10, 2, c[1]) +
      star(21, 16, 2, c[1]);
  if (n.pattern === "crescent" || n.pattern === "algeria") {
    if (n.pattern === "algeria") shapes += rect(15, 0, 15, 20, c[1]);
    const ink = n.pattern === "algeria" ? c[2] : c[1];
    shapes +=
      `<circle cx="14" cy="10" r="5" fill="${ink}"/><circle cx="16" cy="9" r="4" fill="${n.pattern === "algeria" ? c[1] : c[0]}"/>` +
      star(21, 10, 2.5, ink);
  }
  if (n.pattern === "swiss")
    shapes += rect(12, 4, 6, 12, c[1]) + rect(9, 7, 12, 6, c[1]);
  if (n.pattern === "morocco")
    shapes += `<path d="M15 4L19 16 9 8H21L11 16Z" fill="none" stroke="${c[1]}" stroke-width="1.2"/>`;
  if (n.pattern === "ghana") {
    shapes +=
      rect(0, 6.67, 30, 6.67, c[1]) +
      rect(0, 13.34, 30, 6.66, c[2]) +
      star(15, 10, 3, "#171717");
  }
  if (n.pattern === "senegal" || n.pattern === "cameroon")
    shapes +=
      rect(10, 0, 10, 20, c[1]) +
      rect(20, 0, 10, 20, c[2]) +
      star(15, 10, 3, n.pattern === "senegal" ? c[0] : c[2]);
  if (n.pattern === "chile")
    shapes +=
      rect(0, 10, 30, 10, c[1]) +
      rect(0, 0, 10, 10, c[2]) +
      star(5, 5, 3, "#fff");
  if (n.pattern === "colombia")
    shapes += rect(0, 10, 30, 5, c[1]) + rect(0, 15, 30, 5, c[2]);
  if (n.pattern === "england")
    shapes += rect(12, 0, 6, 20, c[1]) + rect(0, 7, 30, 6, c[1]);
  if (n.pattern === "scotland")
    shapes += `<path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="5"/>`;
  if (n.pattern === "czech")
    shapes +=
      rect(0, 10, 30, 10, c[1]) + `<path d="M0 0L14 10 0 20Z" fill="${c[2]}"/>`;
  if (n.pattern === "saudi")
    shapes += `<path d="M7 7H23M8 9H22M7 14H24M8 13V15" stroke="#fff" stroke-width="1.4"/>`;
  if (n.pattern === "southafrica")
    shapes +=
      rect(0, 10, 30, 10, c[2]) +
      `<path d="M0 0L15 10 0 20" stroke="#fff" stroke-width="8" fill="none"/><path d="M0 0L15 10H30M15 10L0 20" stroke="#238153" stroke-width="5" fill="none"/><path d="M0 3L10 10 0 17Z" fill="#222" stroke="#efcb3f"/>`;
  if(n.pattern==='jamaica')shapes+=`<path d="M0 0L15 10 0 20ZM30 0L15 10 30 20Z" fill="${c[2]}"/><path d="M0 0L30 20M30 0L0 20" stroke="${c[1]}" stroke-width="3"/>`;
  if(n.pattern==='panama')shapes+=rect(15,0,15,10,c[1])+rect(0,10,15,10,c[2])+star(7,5,2,c[2])+star(23,15,2,c[1]);
  if(n.pattern==='samoa'){shapes+=rect(0,0,15,11,c[1]);for(const [x,y] of [[7,2],[4,5],[10,5],[7,9]])shapes+=star(x,y,1.2,c[2]);}
  if(n.pattern==='tonga')shapes+=rect(0,0,14,11,c[1])+rect(5,2,3,7,c[0])+rect(3,4,7,3,c[0]);
  if(n.pattern==='solomon')shapes+=`<path d="M0 20L30 0V20Z" fill="${c[1]}"/><path d="M0 20L30 0" stroke="${c[2]}" stroke-width="2"/>`+star(5,5,1.5,'#fff')+star(10,5,1.5,'#fff');
  if(n.pattern==='vanuatu')shapes+=rect(0,10,30,10,c[1])+`<path d="M0 0L13 10 0 20Z" fill="#161b20"/><path d="M0 0L13 10H30M13 10L0 20" stroke="${c[2]}" stroke-width="2" fill="none"/>`;
  if(n.pattern==='papua')shapes+=`<path d="M0 0L30 20H0Z" fill="${c[1]}"/>`+star(22,6,3,c[2])+star(7,12,2,'#fff')+star(12,16,1.5,'#fff');
  return `<svg class="nationFlag" viewBox="0 0 30 20" role="img" aria-label="${n.name} flag">${shapes}</svg>`;
}
