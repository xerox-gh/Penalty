import {nationalityFor,flagSVG} from './nationality.js';
import {RARITIES} from './progression.js';
const COLORS=['#99b0be','#a9c7d4','#5ab3ff','#c68df4','#f57999','#e8c366','#ff9f6a','#fff0be','#969bff','#f3cc76','#a1f9e0'];
// Presentation only: Club has already committed the purchase/rewards before open().
export class PackOpening {
 constructor(club){this.club=club;this.dialog=document.createElement('dialog');this.dialog.className='packOpening';this.dialog.setAttribute('aria-label','Pack opening');document.body.append(this.dialog);this.dialog.addEventListener('click',e=>{const a=e.target.closest('[data-opening]')?.dataset.opening;if(a==='open'||a==='next')this.next();if(a==='skip')this.summary();if(a==='close')this.close();});this.dialog.addEventListener('keydown',e=>e.stopPropagation());this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();});}
 open(cards,title){if(this.dialog.open)return;this.club.game.input.clear();this.cards=cards;this.title=title;this.index=-1;this.returnFocus=document.activeElement;this.dialog.showModal();this.draw('sealed');}
 draw(stage){this.stage=stage;const card=this.cards[this.index],rank=card?RARITIES.indexOf(card.rarity):0,n=card?nationalityFor(card):null;
 this.dialog.style.setProperty('--reveal',COLORS[Math.max(0,rank)]);const counter=card?`${this.index+1} / ${this.cards.length}`:`${this.cards.length} PLAYERS`;
 const cardHTML=c=>this.club.card(c,true,c.duplicate,false);
 let body=stage==='sealed'?`<div class="sealedPack"><b>P /</b><span>${this.title}</span><small>${counter}</small></div><button data-opening="open" class="primary">OPEN PACK</button>`:stage==='tease'?`<div class="revealHint">${flagSVG(n)}<h2>${n.name}</h2><strong>${card.position}</strong></div>`:stage==='card'?`<div class="openingCard">${cardHTML(card)}</div><p class="pullRarity">${card.rarity.toUpperCase()} · ${card.rating} OVR</p><button data-opening="next" class="primary">${this.index+1<this.cards.length?'NEXT PLAYER':'VIEW ALL PLAYERS'}</button>`:`<h2>YOUR NEW SIGNINGS</h2><div class="openingSummary">${this.cards.map(cardHTML).join('')}</div><button data-opening="close" class="primary">BACK TO CLUB</button>`;
 this.dialog.innerHTML=`<div class="openingHeader"><span>${this.title} · ${counter}</span><button data-opening="${stage==='summary'?'close':'skip'}">${stage==='summary'?'CLOSE':'SKIP TO RESULTS'}</button></div><div class="openingStage ${stage}"><div class="openingRays"></div>${body}${stage==='card'&&rank>=6?`<div class="openingConfetti" aria-hidden="true">${Array.from({length:20},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div>`:''}</div><p class="openingSaved" role="status">${this.club.save.message || 'Players added to your club.'}</p>`;
 this.dialog.querySelector('.primary')?.focus();
 }
 next(){if(this.stage==='tease')return;clearTimeout(this.timer);this.index++;if(this.index>=this.cards.length){this.summary();return;}this.draw('tease');this.club.game.audio.play('pack');this.timer=setTimeout(()=>{if(!this.dialog.open)return;this.draw('card');this.club.game.audio.play(RARITIES.indexOf(this.cards[this.index].rarity)>=6?'rare':'reveal');},matchMedia('(prefers-reduced-motion: reduce)').matches?0:850);}
 summary(){clearTimeout(this.timer);this.draw('summary');}
 close(){clearTimeout(this.timer);this.dialog.close();this.club.render();this.club.el.querySelector('.packReveal')?.scrollIntoView({block:'start'});this.club.el.querySelector('[data-club="tab:'+this.club.tab+'"]')?.focus();}
}
