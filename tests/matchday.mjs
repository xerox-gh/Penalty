import assert from 'node:assert/strict';
globalThis.document={createElement:()=>({getContext:()=>({fillText(){}})})};
const T=await import('../libs/three.module.js');
const {Team}=await import('../js/team.js'),{Ball}=await import('../js/ball.js'),{Rules}=await import('../js/rules.js'),{State}=await import('../js/state.js');
const {prepareRestart,strikeRestart,launchValues,setContact,composure}=await import('../js/set-pieces.js');
const scene=new T.Scene(),audio={play(){}},teams=[new Team(scene,0,'#eee','1-2-1'),new Team(scene,1,'#d44','1-2-1')],ball=new Ball(scene,audio);
const g={teams,players:teams.flatMap(t=>t.players),ball,audio,state:new State(),particles:{burst(){}},options:{duration:180,golden:false,local:false},input:{clear(){},controls(){return {x:0,z:0}}},matchStats:{shots:0}};g.rules=new Rules(g);
for(const team of [0,1])for(const side of [-1,1])for(const short of [false,true]){
 const r={type:'THROW-IN',team,x:0,z:20*side};g.rules.restart=r;prepareRestart(g,r);const p=teams[team].players[r.taker];assert.ok(p.throwReady);assert.equal(ball.y,2.05);assert.ok(Math.abs(p.z)>=20);p.render(0,.1);assert.equal(p.animator.state,'throw');assert.ok(strikeRestart(g,short));assert.equal(ball.throwInTeam,team);assert.ok(ball.vz*side<0);assert.ok(ball.vy>0);assert.equal(p.kick,0);assert.ok(p.throwTime>0);
}
// An untouched throw into either goal is a restart, never a goal.
for(const x of [-31,31]){ball.reset();ball.previousX=Math.sign(x)*29;ball.x=x;ball.z=ball.previousZ=0;ball.y=ball.previousY=1;ball.throwInTeam=0;g.state.set('playing');const before=teams[0].score+teams[1].score;g.rules.update(.01);assert.equal(teams[0].score+teams[1].score,before);assert.equal(g.rules.restart.type,x>0?'GOAL KICK':'CORNER');}
const r={type:'FREE KICK',dir:1,x:15,z:0,aimX:0,aimY:.3,power:.6,spin:0};const base=launchValues(r);setContact(r,.8,.7);const shaped=launchValues(r);assert.ok(shaped.spin<0);assert.ok(shaped.lift>base.lift);assert.equal(composure({type:'PENALTY',elapsed:0}),1);assert.ok(composure({type:'PENALTY',elapsed:Math.PI/4.8})<.01);
const p=teams[0].players[4];p.throwTime=0;p.throwReady=false;p.celebrate=true;
for(let kind=0;kind<3;kind++){p.celebrationKind=kind;p.celebrationTime=2.4;for(let i=0;i<30;i++)p.render(i/60,1/60);p.root.traverse(o=>assert.ok([...o.position,...o.rotation.toArray().slice(0,3)].every(Number.isFinite)));assert.equal(p.animator.state,'celebrate');}
g.rules.kickoff();assert.ok(g.players.every(p=>!p.throwReady&&p.throwTime===0));assert.equal(g.celebration,null);
console.log('PASS: overhead throws both teams/touchlines, short throws, direct-goal restrictions, strike-point spin/lift, composure cycle, three finite celebrations and kickoff recovery.');
