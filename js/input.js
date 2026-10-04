export class Input {
  constructor() {
    this.keys = new Set();
    this.edges = new Set();
    this.touch = new Set();
    this.touchEdges = new Set();
    this.stick = { x: 0, z: 0 };
    this.padOld = [];
    this.padEdges = new Set();
    this.pad = { x: 0, z: 0, buttons: [] };
    const captured = [
      "Space",
      "Tab",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Backspace",
    ];
    window.addEventListener("keydown", (e) => {
      if (/INPUT|SELECT/.test(e.target.tagName)) return;
      if (captured.includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.edges.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.clear());
    this.isTouch =
      matchMedia("(pointer:coarse)").matches || navigator.maxTouchPoints > 0;
    const joy = document.getElementById("joystick"),
      knob = joy.firstElementChild;
    let pid = null;
    const move = (e) => {
      const r = joy.getBoundingClientRect(),
        x = (e.clientX - r.left - r.width / 2) / 45,
        z = (e.clientY - r.top - r.height / 2) / 45,
        l = Math.max(1, Math.hypot(x, z));
      this.stick = { x: x / l, z: z / l };
      knob.style.transform = `translate(${(x / l) * 35}px,${(z / l) * 35}px)`;
    };
    joy.onpointerdown = (e) => {
      pid = e.pointerId;
      joy.setPointerCapture(pid);
      move(e);
    };
    joy.onpointermove = (e) => {
      if (pid === e.pointerId) move(e);
    };
    const release = () => {
      pid = null;
      this.stick = { x: 0, z: 0 };
      knob.style.transform = "";
    };
    joy.onpointerup = joy.onpointercancel = release;
    document.querySelectorAll("[data-action]").forEach((b) => {
      b.onpointerdown = (e) => {
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        this.touch.add(b.dataset.action);
        this.touchEdges.add(b.dataset.action);
      };
      b.onpointerup = b.onpointercancel = () =>
        this.touch.delete(b.dataset.action);
    });
  }
  clear() {
    this.keys.clear();
    this.edges.clear();
    this.touch.clear();
    this.touchEdges.clear();
    this.stick = { x: 0, z: 0 };
    this.pad = { x: 0, z: 0, buttons: [] };
    this.padOld = [];
  }
  poll() {
    const gp = navigator.getGamepads?.()[0];
    this.padEdges.clear();
    if (!gp) {
      this.pad = { x: 0, z: 0, buttons: [] };
      this.padOld = [];
      return;
    }
    this.pad.x = Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : 0;
    this.pad.z = Math.abs(gp.axes[1]) > 0.15 ? gp.axes[1] : 0;
    this.pad.buttons = gp.buttons.map((b) => b.pressed);
    this.pad.buttons.forEach((b, i) => {
      if (b && !this.padOld[i]) this.padEdges.add(i);
    });
    this.padOld = this.pad.buttons.slice();
  }
  controls(second = false, local = false) {
    const k = this.keys,
      e = this.edges;
    const mappings = second
      ? {
          shoot: "Enter",
          pass: "Slash",
          through: "Semicolon",
          lob: "Period",
          tackle: "Comma",
          switch: "Backspace",
          sprint: "ShiftRight",
          precision: "Quote",
        }
      : {
          shoot: "Space",
          pass: "KeyE",
          through: "KeyR",
          lob: "KeyQ",
          tackle: "KeyF",
          switch: "Tab",
          sprint: "ShiftLeft",
          precision: "KeyZ",
        };
    const out = {
      x: second
        ? +k.has("ArrowRight") - k.has("ArrowLeft")
        : +k.has("KeyD") - k.has("KeyA"),
      z: second
        ? +k.has("ArrowDown") - k.has("ArrowUp")
        : +k.has("KeyS") - k.has("KeyW"),
    };
    if (!second) {
      if (!local) {
        out.x += +k.has("ArrowRight") - k.has("ArrowLeft");
        out.z += +k.has("ArrowDown") - k.has("ArrowUp");
      }
      out.x += this.stick.x + this.pad.x;
      out.z += this.stick.z + this.pad.z;
    }
    const pads = {
      shoot: 0,
      pass: 1,
      lob: 2,
      tackle: 3,
      sprint: 5,
      switch: 4,
      precision: 6,
      through: 7,
    };
    for (const [a, code] of Object.entries(mappings)) {
      out[a] =
        k.has(code) ||
        (!second && (this.touch.has(a) || this.pad.buttons[pads[a]]));
      out[a + "Edge"] =
        e.has(code) ||
        (!second && (this.touchEdges.has(a) || this.padEdges.has(pads[a])));
    }
    return out;
  }
  end() {
    this.edges.clear();
    this.touchEdges.clear();
    this.padEdges.clear();
  }
}
