// Fictional football biographies, independent of appearance and gameplay attributes.
const rows=[
 ['DE','Germany','h','#151515','#d32b36','#f2c744'],['FR','France','v','#24478d','#fff','#dc3943'],
 ['IT','Italy','v','#29875a','#fff','#d83b46'],['NL','Netherlands','h','#c83c43','#fff','#284e90'],
 ['BE','Belgium','v','#191919','#f6d449','#dd3b43'],['IE','Ireland','v','#29965d','#fff','#ec913e'],
 ['RO','Romania','v','#24468f','#f5cf42','#d53745'],['AT','Austria','h','#d93a43','#fff','#d93a43'],
 ['PL','Poland','b','#fff','#cf3451'],['UA','Ukraine','b','#3381c6','#f7d748'],
 ['NG','Nigeria','v','#228c58','#fff','#228c58'],['JP','Japan','disc','#fff','#ce3549'],
 ['DK','Denmark','cross','#ba2e3d','#fff'],['SE','Sweden','cross','#2875a7','#f8d64a'],
 ['FI','Finland','cross','#fff','#2b568b'],['NO','Norway','cross','#bb3541','#fff','#224477'],
 ['ID','Indonesia','b','#d43a44','#fff'],['BD','Bangladesh','disc','#126c52','#da394a'],
 ['AR','Argentina','h','#87c5e9','#fff','#87c5e9']
];
export const NATIONS=rows.map(([code,name,pattern,...colors])=>({code,name,pattern,colors}));
// Explicit creative assignments for the special players already supplied by the user.
const specials={heroes1:'DE',heroes2:'JP',heroes3:'DE',heroes4:'IT',heroes5:'NG',heroes6:'DK',heroes7:'FR',heroes8:'SE',heroes9:'PL',heroes10:'UA',icon1:'FR',icon2:'IT',icon3:'NO',icon4:'AR',icon5:'AR',icon6:'SE',icon7:'DE',icon8:'AR',icon9:'SE',icon10:'FR',glory1:'IT',glory2:'DK',glory3:'NL',glory4:'NG',glory5:'IT',glory6:'DE',glory7:'IE',glory8:'AR'};
export function nationalityFor(card){if(card.custom){const nation=NATIONS.find(n=>n.code===card.nationality);if(nation)return nation;}let hash=0;for(const c of card.id)hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;return NATIONS.find(n=>n.code===specials[card.id])||NATIONS[hash%NATIONS.length];}
export function flagSVG(n){const c=n.colors;let shapes=`<rect width="30" height="20" fill="${c[0]}"/>`;
 if(n.pattern==='v')shapes+=`<path d="M10 0h10v20H10Z" fill="${c[1]}"/><path d="M20 0h10v20H20Z" fill="${c[2]}"/>`;
 if(n.pattern==='h')shapes+=`<path d="M0 6.666h30v6.668H0Z" fill="${c[1]}"/><path d="M0 13.333h30V20H0Z" fill="${c[2]}"/>`;
 if(n.pattern==='b')shapes+=`<path d="M0 10h30v10H0Z" fill="${c[1]}"/>`;
 if(n.pattern==='disc')shapes+=`<circle cx="${n.code==='BD'?13:15}" cy="10" r="6" fill="${c[1]}"/>`;
 if(n.pattern==='cross'){shapes+=`<path d="M8 0h4v20H8ZM0 8h30v4H0Z" fill="${c[1]}"/>`;if(c[2])shapes+=`<path d="M9 0h2v20H9ZM0 9h30v2H0Z" fill="${c[2]}"/>`;}
 if(n.code==='AR')shapes+='<circle cx="15" cy="10" r="1.8" fill="#e6b849"/>';
 return `<svg class="nationFlag" viewBox="0 0 30 20" role="img" aria-label="${n.name} flag">${shapes}</svg>`;
}
