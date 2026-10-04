export class HUD {
  constructor() {
    this.radar = document.getElementById("radar").getContext("2d");
    this.lastState = "";
  }
  update(g) {
    const s = g.state.name;
    if (s !== this.lastState) {
      document.getElementById("menu").hidden = s !== "menu";
      document.getElementById("pause").hidden = s !== "paused";
      document.getElementById("fulltime").hidden = s !== "fulltime";
      document.getElementById("hud").hidden = s === "menu" || s === "fulltime";
      document.getElementById("touch").hidden =
        !g.input.isTouch || s !== "playing";
      this.lastState = s;
    }
    const p = g.teams[0].players[g.teams[0].active];
    document.getElementById("score").textContent =
      `${g.teams[0].score} : ${g.teams[1].score}`;
    const left = Math.max(0, Math.ceil(g.options.duration - g.rules.elapsed));
    document.getElementById("clock").textContent = g.rules.golden
      ? "GOLDEN"
      : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    document.getElementById("stamina").value = p.stamina;
    document.getElementById("power").value = p.charge;
    document.getElementById("playerTag").textContent =
      `${g.options.home} • #${p.index + 1}  /  ${["Broadcast", "Top-down", "Sideline", "Player"][g.camera.mode]}`;
    document.getElementById("notice").textContent =
      s === "countdown"
        ? Math.ceil(g.state.timer)
        : s === "lineup"
          ? "MATCH DAY"
          : g.notice;
    const c = this.radar;
    c.clearRect(0, 0, 180, 120);
    c.strokeStyle = "#ffffff55";
    c.strokeRect(8, 6, 164, 108);
    c.beginPath();
    c.moveTo(90, 6);
    c.lineTo(90, 114);
    c.arc(90, 60, 13, 0, Math.PI * 2);
    c.stroke();
    for (const q of g.players) {
      c.fillStyle = q.team === 0 ? g.options.homeColor : g.options.awayColor;
      c.beginPath();
      c.arc(90 + q.x * 2.65, 60 + q.z * 2.65, q === p ? 4 : 3, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = "white";
    c.beginPath();
    c.arc(90 + g.ball.x * 2.65, 60 + g.ball.z * 2.65, 2, 0, Math.PI * 2);
    c.fill();
    if (s === "fulltime") {
      document.getElementById("result").textContent =
        `${g.teams[0].score} — ${g.teams[1].score}`;
      document.getElementById("summary").textContent =
        `${g.options.home} vs ${g.options.away} · ${g.rules.goals} goals · ${g.rules.golden ? "Golden goal finish" : "Full-time"}`;
    }
  }
}
