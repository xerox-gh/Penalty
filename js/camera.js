import * as T from "../libs/three.module.js";
export class Camera {
  constructor(aspect) {
    this.camera = new T.PerspectiveCamera(50, aspect, 0.1, 300);
    this.camera.position.set(0, 38, 42);
    this.mode = 0;
    this.target = new T.Vector3();
    this.pos = new T.Vector3();
    this.look = new T.Vector3();
    this.shake = 0;
  }
  toggle() {
    this.mode = (this.mode + 1) % 4;
  }
  update(ball, p, state, time, dt) {
    const x = ball.x * 0.65 + p.x * 0.35,
      z = ball.z * 0.65 + p.z * 0.35;
    this.look.set(x, 0, z);
    if (state === "menu" || state === "lineup") {
      this.pos.set(Math.sin(time * 0.1) * 35, 30, 46);
      this.look.set(0, 0, 0);
    } else if (state === "goal") {
      this.pos.set(
        ball.x - Math.sign(ball.x) * 12,
        7,
        ball.z + Math.sin(time) * 10,
      );
      this.look.set(ball.x, 1, ball.z);
    } else if (this.mode === 0) this.pos.set(x - 5, 31, z + 32);
    else if (this.mode === 1) this.pos.set(x, 49, z + 0.1);
    else if (this.mode === 2) this.pos.set(x, 14, 36);
    else {
      this.pos.set(p.x - p.dx * 11, 8, p.z - p.dz * 11);
      this.look.set(p.x + p.dx * 8, 0, p.z + p.dz * 8);
    }
    this.camera.position.lerp(this.pos, 1 - Math.exp(-dt * 3));
    this.target.lerp(this.look, 1 - Math.exp(-dt * 5));
    if (this.shake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake;
      this.shake = Math.max(0, this.shake - dt * 2);
    }
    this.camera.up.set(
      0,
      this.mode === 1 && state === "playing" ? 0 : 1,
      this.mode === 1 && state === "playing" ? -1 : 0,
    );
    this.camera.lookAt(this.target);
  }
}
