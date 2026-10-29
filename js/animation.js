import { clamp } from "./config.js";
const mix = (a, b, t) => a + (b - a) * t;
// Distance-driven gait, independent phases, and a pelvis pivot keep feet anchored.
// Action envelopes blend back into locomotion instead of snapping whole models.
export class PlayerAnimator {
  constructor(seed) {
    this.phase = seed * 1.73;
    this.speed = 0;
    this.turn = 0;
    this.kickAge = 1;
    this.lastKick = 0;
    this.slide = 0;
    this.dive = 0;
    this.header = 0;
    this.celebrate = 0;
    this.state = "idle";
    this.throwBlend=0;
  }
  update(p, t, dt) {
    const blend = 1 - Math.exp(-dt * 14),
      speed = Math.hypot(p.vx, p.vz);
    this.speed = mix(this.speed, speed, blend);
    this.phase += this.speed * dt * (p.hasBall ? 2.65 : 2.15);
    const run = clamp(this.speed / 6, 0, 1),
      sprint = p.sprinting ? 1 : 0,
      dribble = p.hasBall ? 1 : 0;
    const angle = Math.atan2(p.dx, p.dz),
      turn = Math.atan2(
        Math.sin(angle - p.root.rotation.y),
        Math.cos(angle - p.root.rotation.y),
      );
    p.root.rotation.y += turn * (1 - Math.exp(-dt * 12));
    this.turn = mix(this.turn, clamp(turn, -0.5, 0.5), blend);
    if (p.kick > this.lastKick + 0.04) this.kickAge = 0;
    this.lastKick = p.kick;
    this.kickAge += dt;
    this.slide = mix(this.slide, p.slide > 0 ? 1 : 0, 1 - Math.exp(-dt * 18));
    this.dive = mix(this.dive, p.dive > 0 ? 1 : 0, 1 - Math.exp(-dt * 13));
    this.header = mix(this.header, p.header > 0 ? 1 : 0, blend);
    this.celebrate = mix(this.celebrate, p.celebrate ? 1 : 0, blend);
    p.throwTime=Math.max(0,(p.throwTime||0)-dt);
    this.throwBlend=mix(this.throwBlend,p.throwReady||p.throwTime>0?1:0,blend);
    const phase = this.phase,
      step = Math.sin(phase),
      stride = (0.55 + sprint * 0.25 - dribble * 0.12) * run;
    p.root.position.set(
      p.x,
      Math.abs(Math.sin(phase * 2)) * 0.025 * run +
        this.header * 0.22 +
        this.celebrate * Math.abs(Math.sin(t * 5)) * 0.16,
      p.z,
    );
    p.root.rotation.x = p.root.rotation.z = 0;
    p.body.position.y =
      0.84 -
      this.slide * 0.45 -
      this.dive * 0.37 -
      (p.keeper && !run ? 0.06 : 0);
    p.body.rotation.set(
      run * (0.06 + sprint * 0.09) - this.slide * 0.7 - this.header * 0.12,
      Math.sin(phase) * run * 0.035,
      this.turn * run * 0.16 + this.dive * (p.diveSide || 1) * 1.25,
    );
    p.head.rotation.y = -this.turn * 0.35;
    p.head.rotation.x = -run * 0.04 + Math.sin(t * 1.8) * 0.015;
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1,
        cycle = phase + i * Math.PI;
      p.legs[i].rotation.set(Math.sin(cycle) * stride, 0, s * 0.025);
      p.knees[i].rotation.x =
        Math.max(0, -Math.sin(cycle)) * (0.8 + sprint * 0.4) * run + 0.06;
      if(p.feet)p.feet[i].rotation.x=clamp(-p.legs[i].rotation.x-p.knees[i].rotation.x,-.6,.6)*run;
      p.arms[i].rotation.set(
        -Math.sin(cycle) * run * (0.45 + sprint * 0.25),
        0,
        -s * (0.12 + Math.abs(this.turn) * 0.3),
      );
      p.elbows[i].rotation.x = -0.25 - run * (0.5 + sprint * 0.25);
      if (p.keeper) {
        p.arms[i].rotation.x -= 0.2 * (1 - run);
        p.elbows[i].rotation.x -= 0.25 * (1 - run);
      }
    }
    if (this.kickAge < 0.32) {
      const q = this.kickAge / 0.32,
        wind = q < 0.25 ? q / 0.25 : 1 - (q - 0.25) / 0.75;
      // Backswing -> contact -> follow-through; left leg stays planted.
      const swing =
        q < 0.25
          ? 0.5 * Math.sin(((q / 0.25) * Math.PI) / 2)
          : -1.25 * Math.sin(((q - 0.25) / 0.75) * Math.PI);
      p.legs[1].rotation.x = swing;
      p.knees[1].rotation.x = 0.15 + wind * 0.45;
      p.arms[0].rotation.z = 0.55;
      p.arms[1].rotation.x = 0.4;
      p.body.rotation.y = -0.18 * Math.sin(q * Math.PI);
    }
    if (this.slide > 0.01) {
      const f = this.slide;
      p.legs[0].rotation.x = mix(p.legs[0].rotation.x, -1.25, f);
      p.legs[1].rotation.x = mix(p.legs[1].rotation.x, -0.45, f);
      p.knees[0].rotation.x = mix(p.knees[0].rotation.x, 0, f);
      p.knees[1].rotation.x = mix(p.knees[1].rotation.x, 1.3, f);
    }
    if (this.dive > 0.01)
      for (let i = 0; i < 2; i++) {
        p.arms[i].rotation.x = mix(p.arms[i].rotation.x, -1.6, this.dive);
        p.elbows[i].rotation.x = mix(p.elbows[i].rotation.x, -0.1, this.dive);
      }
    if(this.throwBlend>.01){
      const f=this.throwBlend,release=p.throwReady?0:1-(p.throwTime||0)/.75;
      p.body.rotation.x=mix(p.body.rotation.x,p.throwReady?-.1:.12,f);
      for(let i=0;i<2;i++){
        p.arms[i].rotation.x=mix(p.arms[i].rotation.x,-2.85+release*1.55,f);
        p.arms[i].rotation.z=mix(p.arms[i].rotation.z,i?-.2:.2,f);
        p.elbows[i].rotation.x=mix(p.elbows[i].rotation.x,-.45*(1-release),f);
        p.legs[i].rotation.x=mix(p.legs[i].rotation.x,0,f);p.knees[i].rotation.x=mix(p.knees[i].rotation.x,.06,f);
      }
    }
    if (this.celebrate > 0.01){
      const f=this.celebrate,age=p.celebrationTime||0,kind=p.celebrationKind||0;
      p.body.rotation.y=0;
      if(kind===0&&age>1){ // Knee slide: hips lowered, shins trailing and arms wide.
        p.body.position.y=mix(p.body.position.y,.45,f);p.body.rotation.x=mix(p.body.rotation.x,-.18,f);
        for(let i=0;i<2;i++){p.legs[i].rotation.x=mix(p.legs[i].rotation.x,-.2,f);p.knees[i].rotation.x=mix(p.knees[i].rotation.x,1.5,f);p.arms[i].rotation.z=mix(p.arms[i].rotation.z,i?-1.5:1.5,f);p.elbows[i].rotation.x=-.3;}
      }else if(kind===1){ // Jump and fist pump.
        p.root.position.y+=Math.max(0,Math.sin(age*4))* .24*f;
        p.arms[1].rotation.x=mix(p.arms[1].rotation.x,-2.6,f);p.elbows[1].rotation.x=-.9;
        p.arms[0].rotation.z=mix(p.arms[0].rotation.z,.65,f);p.knees[1].rotation.x+=.5*f;
      }else if(kind===2){ // Arms-out run, then salute the stand.
        for(let i=0;i<2;i++){p.arms[i].rotation.z=mix(p.arms[i].rotation.z,i?-1.6:1.6,f);p.elbows[i].rotation.x=-.12;}
        if(age>2.1){p.arms[1].rotation.x=-1.6;p.elbows[1].rotation.x=-1.2;}
      }
    }
    this.state =
      this.throwBlend>.3?"throw":
      this.celebrate > 0.3
        ? "celebrate"
        : this.dive > 0.3
          ? "dive"
          : this.slide > 0.3
            ? "slide"
            : this.header > 0.3
              ? "header"
              : this.kickAge < 0.32
                ? "kick"
                : run < 0.1
                  ? "idle"
                  : dribble
                    ? "dribble"
                    : sprint
                      ? "sprint"
                      : "jog";
  }
}
