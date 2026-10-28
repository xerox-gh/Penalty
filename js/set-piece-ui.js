import { CFG, clamp } from "./config.js";
import { goalAim, strikeRestart } from "./set-pieces.js";
// Canvas is an aiming surface, not a second renderer. It uses the same normalized
// target as keyboard/gamepad controls and supports Pointer Events on mouse/touch.
export class SetPieceUI {
  constructor(game) {
    this.g = game;
    this.r = null;
    this.pointer = null;
    this.stroke = [];
    this.el = document.createElement("aside");
    this.el.id = "setPiecePanel";
    this.el.hidden = true;
    this.el.innerHTML = `<div class="spHeading"><div><small id="spTeam"></small><h2 id="spTitle">SET PIECE</h2></div><span id="spTimer"></span></div>
      <p id="spHelp"></p><canvas id="setPieceAim" width="720" height="340" aria-label="Set-piece target. Drag from the ball to shoot or use movement keys and hold shoot." role="img"></canvas>
      <div class="spMeter"><span id="spPower"></span><progress id="spCharge" max="1" value=".62"></progress></div>
      <div class="spActions" id="spAttack"><button type="button" data-sp="take">TAKE KICK</button><button type="button" data-sp="short">SHORT PASS</button><button type="button" data-sp="loft">LOFTED</button><button type="button" data-sp="curl">CURL: NONE</button></div>
      <div class="spActions" id="spDefend"><button type="button" data-sp="left">DIVE LEFT</button><button type="button" data-sp="center">STAY CENTER</button><button type="button" data-sp="right">DIVE RIGHT</button></div>`;
    document.body.append(this.el);
    this.canvas = this.el.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.nodes = Object.fromEntries(
      [...this.el.querySelectorAll("[id]")].map((n) => [n.id, n]),
    );
    this.el.addEventListener("click", (e) => {
      const action = e.target.closest("[data-sp]")?.dataset.sp,
        r = this.live();
      if (!r) return;
      if (r.defend && ["left", "center", "right"].includes(action)) {
        r.diveChoice = { left: -1, center: 0, right: 1 }[action];
        r.committed = true;
      }
      if (!r.human) return;
      if (action === "take") strikeRestart(this.g);
      if (action === "short" && r.type !== "PENALTY")
        strikeRestart(this.g, true);
      if (action === "loft" && !goalAim(r)) r.loft = !r.loft;
      if (action === "curl")
        r.spin =
          r.spin > 0
            ? -CFG.setPiece.maxSpin
            : r.spin < 0
              ? 0
              : CFG.setPiece.maxSpin;
    });
    this.canvas.addEventListener("pointerdown", (e) => {
      const r = this.live();
      if (!r?.human || this.pointer != null) return;
      e.preventDefault();
      const p = this.point(e);
      if (Math.hypot(p.x - 0.5, p.y - 0.91) > 0.19) {
        this.aim(p);
        return;
      }
      this.pointer = e.pointerId;
      this.canvas.setPointerCapture(e.pointerId);
      this.stroke = [p];
      r.charging = false;
      r.charge = 0;
    });
    this.canvas.addEventListener("pointermove", (e) => {
      if (this.pointer !== e.pointerId || !this.live()) return;
      const p = this.point(e);
      if (this.stroke.length < 80) this.stroke.push(p);
      else this.stroke[this.stroke.length - 1] = p;
      this.aim(p);
      const start = this.stroke[0],
        r = this.r;
      r.power = clamp(
        0.25 + Math.hypot(p.x - start.x, p.y - start.y) * 0.95,
        0.2,
        1,
      );
      const mid = this.stroke[Math.floor(this.stroke.length / 2)],
        t = (mid.y - start.y) / (p.y - start.y || 1);
      r.spin = clamp(
        (mid.x - (start.x + (p.x - start.x) * t)) * 40,
        -CFG.setPiece.maxSpin,
        CFG.setPiece.maxSpin,
      );
    });
    this.canvas.addEventListener("pointerup", (e) => {
      if (this.pointer !== e.pointerId) return;
      const r = this.live(),
        last = this.point(e),
        first = this.stroke[0];
      this.pointer = null;
      if (
        r &&
        first &&
        Math.hypot(last.x - first.x, last.y - first.y) > 0.12 &&
        last.y < 0.8
      ) {
        this.aim(last);
        strikeRestart(this.g);
      }
      this.stroke = [];
    });
    this.canvas.addEventListener("pointercancel", () => this.cancel());
    this.canvas.addEventListener("lostpointercapture", () => this.cancel());
    window.addEventListener("blur", () => this.cancel());
  }
  live() {
    return this.g.state.name === "setpiece" ? this.g.rules?.restart : null;
  }
  point(e) {
    const b = this.canvas.getBoundingClientRect();
    return {
      x: clamp((e.clientX - b.left) / b.width, 0, 1),
      y: clamp((e.clientY - b.top) / b.height, 0, 1),
    };
  }
  aim(p) {
    const r = this.live();
    if (r) {
      r.aimX = clamp((p.x - 0.5) / 0.45, -1, 1);
      r.aimY = clamp((0.76 - p.y) / 0.68, 0, 1);
    }
  }
  cancel() {
    this.pointer = null;
    this.stroke = [];
    if (this.r) {
      this.r.charging = false;
      this.r.charge = 0;
    }
  }
  update() {
    const r = this.live();
    this.el.hidden = !r;
    if (!r) {
      if (this.r) this.cancel();
      this.r = null;
      return;
    }
    const n = this.nodes;
    if (this.r !== r) {
      this.cancel();
      this.r = r;
      n.spTitle.textContent = r.type;
      n.spTeam.textContent = `${r.team === 0 ? this.g.options.home : this.g.options.away} · ${this.g.teams[r.team].players[r.taker].name}`;
      n.spAttack.hidden = !r.human;
      n.spDefend.hidden = !r.defend;
      this.el.querySelector('[data-sp="short"]').hidden = r.type === "PENALTY";
      this.el.querySelector('[data-sp="loft"]').hidden = goalAim(r);
      n.spHelp.textContent = r.human
        ? "Drag from the ball to your target; bend the stroke for curl. Or aim with movement keys / stick, hold shoot, then release. Tap a target + TAKE KICK also works."
        : r.defend
          ? "Choose a dive side before the kick: buttons or left/right movement keys. The shooter takes the penalty after the countdown."
          : "AI taking the restart. Teammates are moving into position.";
    }
    n.spTimer.textContent = `${Math.max(0, Math.ceil((r.human ? CFG.setPiece.timeLimit : CFG.setPiece.aiWait) - r.elapsed))}s`;
    n.spPower.textContent = r.defend
      ? `KEEPER: ${r.diveChoice < 0 ? "LEFT" : r.diveChoice > 0 ? "RIGHT" : "CENTER"}`
      : `POWER ${Math.round(r.power * 100)}%${r.power > 0.9 ? " · HIGH MISS RISK" : ""}`;
    n.spCharge.value = r.power;
    this.el.querySelector('[data-sp="loft"]').textContent = r.loft
      ? "LOFTED"
      : "DRIVEN";
    this.el.querySelector('[data-sp="curl"]').textContent =
      `CURL: ${Math.abs(r.spin) < 0.5 ? "NONE" : r.spin > 0 ? "RIGHT" : "LEFT"}`;
    this.draw(r);
  }
  draw(r) {
    const c = this.ctx,
      w = 720,
      h = 340;
    c.clearRect(0, 0, w, h);
    c.fillStyle = "#0a2028";
    c.fillRect(0, 0, w, h);
    c.strokeStyle = "#37575b";
    c.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      c.beginPath();
      c.moveTo((w * i) / 8, 25);
      c.lineTo((w * i) / 8, h * 0.78);
      c.stroke();
    }
    if (goalAim(r)) {
      c.strokeStyle = "#d2e7e3";
      c.lineWidth = 5;
      c.strokeRect(w * 0.125, h * 0.235, w * 0.75, h * 0.54);
      c.strokeStyle = "#ffffff24";
      c.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        c.beginPath();
        c.moveTo(w * 0.125, h * (0.235 + i * 0.108));
        c.lineTo(w * 0.875, h * (0.235 + i * 0.108));
        c.stroke();
      }
      c.fillStyle = "#f3c75d";
      const kp = r.defend ? r.diveChoice * 0.2 : 0;
      c.fillRect(w * (0.48 + kp), h * 0.64, w * 0.04, h * 0.13);
    } else {
      c.strokeStyle = "#9bc8ab";
      c.lineWidth = 2;
      c.strokeRect(w * 0.05, h * 0.08, w * 0.9, h * 0.68);
      c.strokeRect(w * 0.3, h * 0.08, w * 0.4, h * 0.25);
      c.fillStyle = "#b5cbd1";
      c.font = "18px sans-serif";
      c.fillText("DELIVERY TARGET · ATTACKING DIRECTION ↑", 24, 27);
      const dir = r.dir;
      for (const p of this.g.players) {
        if (p.index === r.taker && p.team === r.team) continue;
        const aimY =
          r.type === "CORNER"
            ? (p.x * dir - 16) / 12
            : ((p.x - r.x) * dir) / 24 - 5 / 24;
        const x = w * (0.5 + ((dir * p.z) / 18) * 0.45),
          y = h * (0.76 - aimY * 0.68);
        if (y < 30 || y > h * 0.78) continue;
        c.fillStyle = p.team === r.team ? "#aeea8c" : "#f58079";
        c.beginPath();
        c.arc(x, y, 7, 0, Math.PI * 2);
        c.fill();
      }
    }
    // Don't reveal an AI penalty's aim to the defending player.
    if (r.human) {
      const x = w * (0.5 + r.aimX * 0.45),
        y = h * (0.76 - r.aimY * 0.68);
      c.strokeStyle = r.power > 0.9 ? "#ff8567" : "#c0f68a";
      c.lineWidth = 3;
      c.setLineDash([8, 8]);
      c.beginPath();
      c.moveTo(w * 0.5, h * 0.91);
      c.quadraticCurveTo(w * (0.5 + r.spin * 0.015), h * 0.55, x, y);
      c.stroke();
      c.setLineDash([]);
      c.beginPath();
      c.arc(x, y, 12, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.moveTo(x - 19, y);
      c.lineTo(x + 19, y);
      c.moveTo(x, y - 19);
      c.lineTo(x, y + 19);
      c.stroke();
      if (this.stroke.length) {
        c.strokeStyle = "#fff";
        c.beginPath();
        this.stroke.forEach((p, i) =>
          i ? c.lineTo(p.x * w, p.y * h) : c.moveTo(p.x * w, p.y * h),
        );
        c.stroke();
      }
    }
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(w * 0.5, h * 0.91, 13, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#133039";
    c.beginPath();
    c.arc(w * 0.5, h * 0.91, 5, 0, Math.PI * 2);
    c.fill();
  }
}
