export class State {
  constructor() {
    this.name = "menu";
    this.timer = 0;
    this.previous = "playing";
  }
  set(name, time = 0) {
    this.name = name;
    this.timer = time;
  }
  tick(dt) {
    this.timer = Math.max(0, this.timer - dt);
  }
  pause() {
    if (this.name === "paused") this.name = this.previous;
    else if (
      ["playing", "countdown", "lineup", "goal", "restart"].includes(this.name)
    ) {
      this.previous = this.name;
      this.name = "paused";
    }
  }
}
