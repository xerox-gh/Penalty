import { Player } from "./player.js";
import { CFG, distance } from "./config.js";
export class Team {
  constructor(scene, id, color, formation) {
    this.id = id;
    this.dir = id === 0 ? 1 : -1;
    this.score = 0;
    this.active = 1;
    this.players = Array.from(
      { length: 5 },
      (_, i) => new Player(scene, id, i, color),
    );
    this.formation = formation;
    this.reset();
  }
  reset() {
    const anchors = CFG.formations[this.formation];
    this.players.forEach((p, i) => {
      const a = i === 0 ? [-27.5, 0] : anchors[i - 1];
      p.anchor = { x: a[0] * this.dir, z: a[1] };
      p.x = p.anchor.x;
      p.z = p.anchor.z;
      p.vx = p.vz = 0;
      p.target.x = p.x;
      p.target.z = p.z;
      p.charge = 0;
      p.cooldown = 0.6;
      p.dx = this.dir;
      p.dz = 0;
    });
  }
  nearest(ball) {
    return this.players
      .slice(1)
      .sort((a, b) => distance(a, ball) - distance(b, ball))[0];
  }
  switch(ball, stick) {
    let candidates = this.players
      .slice(1)
      .filter((p) => p.index !== this.active);
    if (stick && Math.hypot(stick.x, stick.z) > 0.2) {
      const current = this.players[this.active];
      candidates.sort(
        (a, b) =>
          ((b.x - current.x) * stick.x + (b.z - current.z) * stick.z) /
            Math.max(1, distance(b, current)) -
          ((a.x - current.x) * stick.x + (a.z - current.z) * stick.z) /
            Math.max(1, distance(a, current)),
      );
    } else candidates.sort((a, b) => distance(a, ball) - distance(b, ball));
    this.active = candidates[0].index;
  }
}
