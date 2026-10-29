// Session-only training. Never calls progression.begin/complete/save.
export const DRILLS=[
 {id:'attack',group:'ATTACKING',name:'Attack the box',help:'Break through the defence and score within 25 seconds.'},
 {id:'defend',group:'DEFENDING',name:'Stop the counter',help:'Win possession, clear beyond halfway, or protect your goal for 25 seconds.'},
 {id:'penalty',group:'SET PIECES',name:'Penalty shooting',type:'PENALTY',team:0,x:24,z:0,help:'Aim, charge and time your release. Score past the keeper.'},
 {id:'save-penalty',group:'DEFENDING',name:'Penalty saves',type:'PENALTY',team:1,x:-24,z:0,help:'Choose your keeper’s dive direction and stop the AI penalty.'},
 {id:'free-kick',group:'SET PIECES',name:'Free kicks',type:'FREE KICK',team:0,x:17,z:4,help:'Shape the ball over or around the wall and score.'},
 {id:'corner',group:'SET PIECES',name:'Corners',type:'CORNER',team:0,x:29.3,z:19.3,help:'Deliver into the box, then finish the chance.'},
 {id:'throw',group:'SET PIECES',name:'Throw-ins',type:'THROW-IN',team:0,x:5,z:20,help:'Complete a throw to a teammate. Try short or long delivery.'},
 {id:'goal-kick',group:'SET PIECES',name:'Goal kicks',type:'GOAL KICK',team:0,x:-28,z:0,help:'Find a teammate and control the first touch.'},
];
export function practiceMenu(){return `<div class="sectionHeading"><div><span class="eyebrow">TRAINING GROUND</span><h2>REPETITION BUILDS CONFIDENCE.</h2><p>Unlimited attempts. Real match controls. No entry cost, rewards or changes to your career save. Your equipped squad and selected stadium are used.</p></div></div><label class="practiceDifficulty">AI DIFFICULTY<select id="practiceDifficulty"><option>Easy</option><option selected>Medium</option><option>Hard</option></select></label><div class="chapterGrid">${DRILLS.map(d=>`<article><span>${d.group}</span><h2>${d.name}</h2><p>${d.help}</p><button data-club="practice:${d.id}">START DRILL →</button></article>`).join('')}</div>`;}
export class Practice {
 constructor(game,id,difficulty='Medium'){
  this.g=game;this.drill=DRILLS.find(d=>d.id===id);if(!this.drill)throw Error('Unknown practice drill.');
  this.difficulty=['Easy','Medium','Hard'].includes(difficulty)?difficulty:'Medium';this.attempts=0;this.successes=0;this.side=1;this.stage='setup';this.elapsed=0;this.controlTime=0;this.result='';
 }
 reset(){
  const g=this.g,d=this.drill;this.stage='setup';this.elapsed=0;this.controlTime=0;this.result='';this.taker=null;
  g.input?.clear();g.passIntent=null;g.feedback='';g.feedbackTime=0;g.notice='';g.celebration=null;g.aiTime=0;g.assistManual=0;
  g.rules.restart=null;g.rules.penaltyExtension=0;g.rules.elapsed=0;g.rules.golden=false;g.rules.lastRestart=null;
  for(const t of g.teams){t.reset();t.score=0;t.passLock=0;for(const p of t.players){p.stamina=1;p.cooldown=0;p.tackleCooldown=0;p.slide=p.dive=p.kick=p.header=0;p.celebrate=false;}}
  g.ball.reset();g.ball.boardsEnabled=false;g.pitch&&(g.pitch.boards.visible=false);
  if(d.type){this.stage='aim';g.rules.award(d.type,d.team,d.x,d.z*this.side);g.rules.takeRestart();this.taker=g.rules.restart.taker;return;}
  const attacking=d.id==='attack',owner=g.teams[attacking?0:1].players[4];
  const spots=attacking?[[[-27,0],[3,0],[12,-8],[14,8],[15,0]],[[29,0],[21,0],[23,-5],[24,6],[7,0]]]:[[[-29,0],[-21,0],[-23,-6],[-24,6],[-7,0]],[[27,0],[-3,0],[-13,-8],[-14,8],[-15,0]]];
  for(const t of g.teams)for(const p of t.players){const [x,z]=spots[t.id][p.index];p.x=p.anchor.x=p.target.x=x;p.z=p.anchor.z=p.target.z=z*this.side;}
  g.teams[0].active=attacking?4:1;g.ball.reset(owner.x+g.teams[owner.team].dir*.7,owner.z);g.ball.owner=owner;g.ball.lastTeam=owner.team;g.ball.lastPlayer=owner.index;
  this.stage='live';g.state.set('playing');
 }
 release(r){this.stage='live';this.elapsed=0;this.taker=r.taker;}
 finish(success,message){if(this.stage==='result')return;this.attempts++;this.successes+=+success;this.result=message;this.stage='result';this.elapsed=0;this.g.notice=success?'DRILL COMPLETE':'TRY AGAIN';this.g.state.set('practiceResult');this.g.ball.vx=this.g.ball.vy=this.g.ball.vz=0;for(const p of this.g.players)p.vx=p.vz=0;}
 goal(team){const defending=['defend','save-penalty'].includes(this.drill.id);this.finish(defending?team!==1:team===0,team===0?'Goal scored!':'Goal conceded.');}
 restart(type,team){const defending=['defend','save-penalty'].includes(this.drill.id);const success=defending&&(this.drill.id==='save-penalty'||team===0);this.finish(success,success?'Attack stopped.':type==='FREE KICK'||type==='PENALTY'?'Foul ended the attempt.':'Ball out — reset and try again.');}
 update(dt){
  if(this.stage==='result'){this.elapsed+=dt;if(this.elapsed>=3)this.reset();return true;}
  if(this.stage!=='live')return false;
  this.elapsed+=dt;const b=this.g.ball,defending=['defend','save-penalty'].includes(this.drill.id);
  if(defending){this.controlTime=b.owner?.team===0?this.controlTime+dt:0;if(this.controlTime>.45||b.held>0&&b.owner?.team===0||this.drill.id==='defend'&&b.x>0){this.finish(true,'Possession won / danger cleared.');return true;}}
  if(['throw','goal-kick'].includes(this.drill.id)&&b.owner?.team===0&&b.owner.index!==this.taker){this.finish(true,'Delivery controlled by a teammate.');return true;}
  if(this.drill.id==='attack'&&b.owner?.team===1){this.controlTime+=dt;if(this.controlTime>.6){this.finish(false,'Defence won possession.');return true;}}
  else if(this.drill.id==='attack')this.controlTime=0;
  if(this.elapsed>=25){this.finish(defending,defending?'Goal protected.':'Time up — try a quicker finish.');return true;}return false;
 }
}
export class PracticeUI {
 constructor(g){this.g=g;this.el=document.createElement('aside');this.el.id='practicePanel';this.el.hidden=true;this.el.innerHTML='<div><small>TRAINING GROUND</small><b id="practiceName"></b><span id="practiceStats"></span></div><p id="practiceHelp"></p><div class="practiceActions"><button data-practice="reset">RESET</button><button data-practice="side">SWITCH SIDE</button><button data-practice="exit">DRILLS / EXIT</button></div>';document.body.append(this.el);this.el.onclick=e=>{const p=g.practice,a=e.target.closest('[data-practice]')?.dataset.practice;if(!p)return;if(a==='reset')p.reset();if(a==='side'){p.side*=-1;p.reset();}if(a==='exit'){g.club.tab='practice';g.club.show();}};}
 update(){const p=this.g.practice;this.el.hidden=!p||['hub','menu','paused'].includes(this.g.state.name);if(this.el.hidden)return;this.el.querySelector('#practiceName').textContent=p.drill.name;this.el.querySelector('#practiceStats').textContent=`${p.successes}/${p.attempts} completed · ${p.stage==='live'?Math.max(0,Math.ceil(25-p.elapsed))+'s':'Unlimited attempts'}`;this.el.querySelector('#practiceHelp').textContent=p.stage==='result'?p.result+' Next attempt in '+Math.max(1,Math.ceil(3-p.elapsed))+'…':p.drill.help;}
}
