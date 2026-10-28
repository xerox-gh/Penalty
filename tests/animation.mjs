import assert from 'node:assert/strict';
globalThis.document={createElement:()=>({getContext:()=>({fillText(){}})})};
const T=await import('../libs/three.module.js');
const {Player}=await import('../js/player.js');
const scene=new T.Scene(),p=new Player(scene,0,1,'#123456'),q=new Player(scene,0,2,'#123456');
let time=0;
function advance(){for(let i=0;i<40;i++){time+=1/60;p.render(time,1/60);p.root.traverse(o=>assert.ok([...o.position,...o.rotation.toArray().slice(0,3)].every(Number.isFinite)));}}
assert.notEqual(p.animator.phase,q.animator.phase);
p.vx=6;p.vz=0;advance();assert.equal(p.animator.state,'jog');
p.sprinting=true;advance();assert.equal(p.animator.state,'sprint');
p.hasBall=true;advance();assert.equal(p.animator.state,'dribble');
p.kick=.3;p.render(time,1/60);assert.equal(p.animator.state,'kick');
p.hasBall=false;p.kick=0;p.slide=1;advance();assert.equal(p.animator.state,'slide');
p.slide=0;p.dive=1;p.diveSide=-1;advance();assert.equal(p.animator.state,'dive');assert.ok(p.body.rotation.z<0);
p.dive=0;p.header=1;advance();assert.equal(p.animator.state,'header');
p.header=0;p.celebrate=true;advance();assert.equal(p.animator.state,'celebrate');
p.celebrate=false;p.vx=0;p.sprinting=false;advance();assert.equal(p.animator.state,'idle');
console.log('PASS: independent gaits, jog/sprint/dribble, kick, slide, directional dive, header, celebrate, idle recovery and finite transforms.');
