import { CFG, clamp, distance } from "./config.js";
// Small-sided distances match the painted box and penalty spot.
export function penaltyArea(x, z, defendingTeam) {
  const side = defendingTeam === 0 ? -1 : 1;
  return (
    x * side >= CFG.pitch.length / 2 - CFG.setPiece.areaDepth &&
    x * side <= CFG.pitch.length / 2 &&
    Math.abs(z) <= CFG.setPiece.areaHalfWidth
  );
}
export function goalAim(r) {
  return r.type === "PENALTY" || (r.type === "FREE KICK" && r.dir * r.x > 0);
}
export function targetFor(r) {
  if (goalAim(r))
    return { x: r.dir * 30, z: r.dir * r.aimX * 4.8, y: 0.3 + r.aimY * 3.5 };
  // Tactical panel: left/right are always relative to the taker's attacking goal.
  return {
    x:
      r.type === "CORNER"
        ? r.dir * (16 + r.aimY * 12)
        : clamp(r.x + r.dir * (5 + r.aimY * 24), -28, 28),
    z: clamp(r.dir * r.aimX * 18, -18, 18),
    y: 0.3,
  };
}
function place(p, x, z, dir) {
  p.x = clamp(x, -29.5, 29.5);
  p.z = clamp(z, -19.5, 19.5);
  p.vx = p.vz = p.slide = p.dive = p.kick = p.charge = p.runTimer = 0;
  p.cooldown = 0;
  p.dx = dir;
  p.dz = 0;
  p.target.x = p.x;
  p.target.z = p.z;
  p.throwReady=false;p.throwTime=0;
  p.penaltyDiveTime = 0;
  p.setPieceHold = 0;
  p.setPieceRun = 0;
}
export function prepareRestart(g, r) {
  const team = g.teams[r.team],
    enemy = g.teams[1 - r.team];
  r.dir = team.dir;
  r.oldActive = team.active;
  const taker =
    r.type === "GOAL KICK"
      ? team.players[0]
      : team.lockedPlayer != null
        ? team.players[team.lockedPlayer]
        : r.type === "PENALTY"
          ? team.players
              .slice(1)
              .reduce((a, b) => (a.shotBoost >= b.shotBoost ? a : b))
          : team.nearest(r);
  r.taker = taker.index;
  r.human =
    (r.team === 0 || g.options.local) &&
    (team.lockedPlayer == null || team.lockedPlayer === taker.index);
  r.defend =
    r.type === "PENALTY" &&
    (1 - r.team === 0 || g.options.local) &&
    enemy.lockedPlayer == null;
  Object.assign(r, {
    aimX: 0.38,
    aimY: 0.34,
    power: 0.62,
    spin: 0,
    loft: r.type === "CORNER" || r.type === "GOAL KICK",
    elapsed: 0,
    charging: false,
    charge: 0,
    diveChoice: 0,
    committed: false,
    contactX:0,contactY:0,
  });
  // Ready the ball and remove residual possession/slide velocities before arranging players.
  g.ball.reset(r.x, r.z);
  g.ball.lastTeam = r.team;
  g.passIntent = null;
  for (const t of g.teams) for (const p of t.players) place(p, p.x, p.z, t.dir);
  place(taker, r.x - r.dir * 1.1, r.z, r.dir);
  if (r.human) team.active = taker.index;
  if (r.type === "PENALTY") {
    place(enemy.players[0], r.dir * 29.5, 0, -r.dir);
    const waiting = g.players.filter(
      (p) => p !== taker && p !== enemy.players[0] && !p.keeper,
    );
    waiting.forEach((p, i) =>
      place(
        p,
        r.dir * 19,
        (i - (waiting.length - 1) / 2) * 2.1,
        g.teams[p.team].dir,
      ),
    );
  } else if (r.type === "CORNER") {
    // Runs to the near post, penalty spot and far post, with a defender goal-side of each.
    const side = Math.sign(r.z),
      runners = team.players.filter((p) => !p.keeper && p !== taker);
    const spots = [
      [26, side * 3],
      [23, -side * 1.7],
      [25, -side * 4.5],
    ];
    runners.forEach((p, i) => {
      const [x, z] = spots[i];
      place(p, r.dir * x, z, r.dir);
      place(enemy.players[i + 1], r.dir * (x + 1.1), z + 0.6, -r.dir);
    });
    place(enemy.players[4], r.dir * 18, side * 7, -r.dir);
    place(enemy.players[0], r.dir * 28.8, side * 1.2, -r.dir);
    r.aimX = r.dir * side * 0.11;
    r.aimY = 0.65;
  } else if (r.type === "FREE KICK" && goalAim(r)) {
    const dx = r.dir * 30 - r.x,
      dz = -r.z,
      len = Math.hypot(dx, dz),
      nx = dx / len,
      nz = dz / len;
    enemy.players
      .slice(1, 3)
      .forEach((p, i) =>
        place(
          p,
          r.x + nx * CFG.setPiece.wallDistance - nz * (i - 0.5) * 1.2,
          r.z + nz * CFG.setPiece.wallDistance + nx * (i - 0.5) * 1.2,
          -r.dir,
        ),
      );
    enemy.players[1].setPieceHold = enemy.players[2].setPieceHold = 0.4;
    place(enemy.players[0], r.dir * 28.8, -Math.sign(r.z || 1) * 1.1, -r.dir);
    team.players
      .filter((p) => !p.keeper && p !== taker)
      .forEach((p, i) => place(p, r.dir * (23 - i * 2), (i - 1) * 5, r.dir));
  } else {
    const side = Math.sign(r.z || 1);
    const mates = team.players.filter((p) => p !== taker && !p.keeper);
    mates.forEach((p, i) =>
      place(
        p,
        clamp(r.x + r.dir * (7 + i * 5), -25, 25),
        r.type === "THROW-IN" ? side * (12 - i * 5) : (i - 1.5) * 8,
        r.dir,
      ),
    );
    r.aimX = r.type === "THROW-IN" ? r.dir * side * 0.4 : 0;
    r.aimY = 0.45;
  }
  // Keep opponents five metres clear of the ball at every restart.
  for (const p of enemy.players)
    if (!p.keeper && distance(p, r) < CFG.setPiece.wallDistance) {
      const dx = p.x - r.x,
        dz = p.z - r.z,
        l = Math.hypot(dx, dz) || 1;
      place(
        p,
        r.x + ((dx || -r.dir) / l) * (CFG.setPiece.wallDistance + 0.3),
        r.z + (dz / l) * (CFG.setPiece.wallDistance + 0.3),
        -r.dir,
      );
    }
  if(r.type==='THROW-IN'){
    taker.x=r.x;taker.z=Math.sign(r.z)*20.25;taker.dx=0;taker.dz=-Math.sign(r.z);taker.throwReady=true;
    g.ball.y=CFG.setPiece.throwHeight;g.ball.z=r.z;
  }
  g.input?.clear();
  g.state.set("setpiece");
}
// Ballistic height compensates for travel time. Wide/high aim and too much power can miss.
export function composure(r){return r.type==='PENALTY'?1-Math.abs(Math.sin((r.elapsed||0)*CFG.setPiece.timingSpeed)):1;}
export function setContact(r,x,y){r.contactX=clamp(x,-1,1);r.contactY=clamp(y,-1,1);r.spin=-r.contactX*CFG.setPiece.maxSpin;}
export function launchValues(r, short = false) {
  const target = targetFor(r),
    dx = target.x - r.x,
    dz = target.z - r.z,
    range = Math.hypot(dx, dz);
  if(r.type==='THROW-IN'){
    const time=(short?.72:1.05)+r.power*.38;
    return {dx,dz,speed:range*CFG.ball.drag/(1-Math.exp(-CFG.ball.drag*time)),lift:clamp((.3-CFG.setPiece.throwHeight)/time+CFG.ball.gravity*time/2,2,12),spin:0};
  }
  let speed = r.type === "PENALTY" ? 20 + r.power * 14 : 18 + r.power * 16;
  let time =
    -Math.log(Math.max(0.15, 1 - (CFG.ball.drag * range) / speed)) /
    CFG.ball.drag;
  if (r.loft && !goalAim(r)) {
    time = Math.max(0.95, time * 1.38);
    speed = (range * CFG.ball.drag) / (1 - Math.exp(-CFG.ball.drag * time));
  }
  let lift =
    (target.y - CFG.ball.radius) / Math.max(0.12, time) +
    (CFG.ball.gravity * time) / 2;
  if (short) {
    speed = 13 + r.power * 6;
    lift = 0;
  }
  // Red-zone power trades accuracy for velocity; deliberate high aim remains possible.
  if (goalAim(r) && r.power > 0.9) lift += (r.power - 0.9) * 12;
  return {
    dx,
    dz,
    speed,
    lift: clamp(lift+(short?0:(r.contactY||0)*CFG.setPiece.contactLift), 0, 18),
    spin: short
      ? 0
      : goalAim(r) && r.type === "PENALTY"
        ? r.spin * 0.2
        : r.spin,
  };
}
export function strikeRestart(g, short = false) {
  const r = g.rules.restart;
  if (!r || g.state.name !== "setpiece") return false;
  const team = g.teams[r.team],
    p = team.players[r.taker];
  let shot = launchValues(r, short);
  if (short) {
    const mate = team.players
      .filter((q) => q !== p && !q.keeper)
      .sort((a, b) => distance(a, r) - distance(b, r))[0];
    shot = {
      ...shot,
      dx: mate.x - r.x,
      dz: mate.z - r.z,
      speed: clamp(distance(mate, r) * 1.1 + 5, 10, 25),
    };
  }
  if(r.type==='THROW-IN'){
    if(short){const range=Math.hypot(shot.dx,shot.dz),time=.9;shot.speed=range*CFG.ball.drag/(1-Math.exp(-CFG.ball.drag*time));shot.lift=Math.max(2,(.3-CFG.setPiece.throwHeight)/time+CFG.ball.gravity*time/2);}
    const len=Math.hypot(shot.dx,shot.dz)||1;
    const side=Math.sign(r.z);g.ball.x=r.x;g.ball.z=side*19.85;g.ball.y=CFG.setPiece.throwHeight;
    Object.assign(g.ball,{vx:shot.dx/len*shot.speed,vz:shot.dz/len*shot.speed,vy:shot.lift,spin:0,owner:null,held:0,freeTime:.4,lastTeam:r.team,lastPlayer:p.index,throwInTeam:r.team});
    p.throwReady=false;p.throwTime=CFG.setPiece.throwFollow;p.cooldown=.8;p.kick=0;
    g.audio.play('kick');
  }else{
    if(r.type==='PENALTY'){
      const error=(1-composure(r))*.18,sign=Math.sin((r.elapsed||0)*7)>=0?1:-1;
      shot.dz+=error*sign*3;shot.lift+=error*3;r.timing=composure(r);
    }
    if (!g.ball.kick(p, shot.dx, shot.dz, shot.speed, shot.lift, shot.spin))return false;
  }
  const face=Math.hypot(shot.dx,shot.dz)||1;p.dx=shot.dx/face;p.dz=shot.dz/face;
  if (r.type === "PENALTY") {
    g.rules.penaltyExtension = 3;
    const keeper = g.teams[1 - r.team].players[0];
    // AI chooses a side before reading the flight; human defenders choose on the panel.
    const choice = r.defend
      ? r.diveChoice
      : Math.random() < 0.12
        ? 0
        : Math.random() < 0.5
          ? -1
          : 1;
    keeper.penaltyZ = r.dir * choice * 3.15;
    keeper.penaltyReaction = CFG.setPiece.keeperReaction;
    keeper.penaltyDiveTime = CFG.setPiece.keeperDiveTime;
    keeper.dive = 0.65;
  }
  if (r.type === "CORNER" && !short) {
    const landing = targetFor(r);
    const runners = team.players.filter((q) => q !== p && !q.keeper);
    runners.forEach((q, i) => {
      q.setPieceRun = 1.2;
      q.target.x = clamp(landing.x + r.dir * (i - 1) * 0.6, -28, 28);
      q.target.z = clamp(landing.z + (i - 1) * 2, -17, 17);
      const marker = g.teams[1 - r.team].players[i + 1];
      marker.setPieceRun = 1.2;
      marker.target.x = clamp(q.target.x + r.dir, -29, 29);
      marker.target.z = q.target.z + 0.6;
    });
  }
  team.active = team.lockedPlayer ?? (r.taker === 0 ? r.oldActive : r.taker);
  if (r.team === 0 && goalAim(r) && !short && g.matchStats)
    g.matchStats.shots++;
  if (r.team === 0 && short) g.passIntent = { from: p.index, ttl: 4 };
  g.camera && (g.camera.shake = 0.2);
  g.practice?.release(r);
  g.rules.lastRestart = { type: r.type, team: r.team, timing:r.timing };
  g.rules.restart = null;
  g.state.set("playing");
  g.notice = "";
  g.input?.clear();
  return true;
}
export function updateRestart(g, dt) {
  const r = g.rules.restart;
  if (!r) return;
  r.elapsed += dt;
  if (r.defend) {
    const c = g.input.controls(r.team === 0, g.options.local);
    if (Math.abs(c.x) > 0.2) r.diveChoice = Math.sign(c.x);
    if (c.shootEdge) r.committed = true;
  }
  if (r.human) {
    const c = g.input.controls(r.team === 1, g.options.local);
    r.aimX = clamp(r.aimX + c.x * dt * 0.8, -1, 1);
    r.aimY = clamp(r.aimY - c.z * dt * 0.65, 0, 1);
    if (c.lobEdge && !goalAim(r)) r.loft = !r.loft;
    if (c.throughEdge)
      r.spin =
        r.spin > 0
          ? -CFG.setPiece.maxSpin
          : r.spin < 0
            ? 0
            : CFG.setPiece.maxSpin;
    if (c.passEdge && r.type !== "PENALTY") {
      strikeRestart(g, true);
      return;
    }
    if (c.shoot) {
      r.charging = true;
      r.charge = clamp(r.charge + dt * CFG.setPiece.chargeRate, 0, 1);
      r.power = r.charge;
    } else if (r.charging) {
      strikeRestart(g);
      return;
    }
  } else if (r.elapsed >= CFG.setPiece.aiWait) {
    const accuracy = CFG.difficulty[g.options.difficulty || "Medium"].accuracy;
    r.aimX =
      (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.36) +
      (Math.random() - 0.5) * (1 - accuracy);
    r.aimY = 0.12 + Math.random() * 0.38;
    r.power = 0.52 + Math.random() * 0.27;
    if (!goalAim(r)) {
      r.aimX = 0;
      r.aimY = r.type === "CORNER" ? 0.65 : 0.55;
    }
    strikeRestart(g);
    return;
  }
  if (r.elapsed >= CFG.setPiece.timeLimit) strikeRestart(g);
}
