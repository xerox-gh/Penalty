import * as T from "../libs/three.module.js";
import { CFG, distance, clamp } from "./config.js";
import { buildPitch, Particles } from "./pitch.js";
import { Ball } from "./ball.js";
import { Team } from "./team.js";
import { decide, moveAI, passTarget } from "./ai.js";
import { goalkeeper } from "./goalkeeper.js";
import { Rules } from "./rules.js";
import { Input } from "./input.js";
import { Camera } from "./camera.js";
import { HUD } from "./hud.js";
import { Audio } from "./audio.js";
import { State } from "./state.js";
const $ = (id) => document.getElementById(id);
class Game {
  constructor() {
    this.options = {
      duration: 180,
      home: "NEON FC",
      away: "EMBER FC",
      homeColor: "#16d7a0",
      awayColor: "#ff664b",
      difficulty: "Medium",
      formation: "1-2-1",
      quality: "Medium",
      golden: true,
      local: false,
      auto: true,
    };
    this.state = new State();
    this.audio = new Audio();
    this.input = new Input();
    this.hud = new HUD();
    this.scene = new T.Scene();
    this.scene.background = new T.Color(0x6b91ad);
    this.scene.fog = new T.Fog(0x6b91ad, 75, 180);
    this.renderer = new T.WebGLRenderer({
      canvas: $("game"),
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.scene.add(new T.HemisphereLight(0xd5ecff, 0x395843, 2));
    this.sun = new T.DirectionalLight(0xffead5, 2.7);
    this.sun.position.set(-20, 40, 15);
    this.sun.castShadow = true;
    Object.assign(this.sun.shadow.camera, {
      left: -38,
      right: 38,
      top: 30,
      bottom: -30,
      near: 1,
      far: 100,
    });
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.sun);
    this.pitch = buildPitch(this.scene);
    this.particles = new Particles(this.scene);
    this.ball = new Ball(this.scene, this.audio);
    this.camera = new Camera(innerWidth / innerHeight);
    this.makeTeams();
    this.rules = new Rules(this);
    this.notice = "";
    this.noticeTime = 0;
    this.aiTime = 0;
    this.time = 0;
    this.acc = 0;
    this.last = 0;
    this.fpsTime = 0;
    this.fpsFrames = 0;
    this.slow = 0;
    this.rings = [0, 1].map((i) => {
      const m = new T.Mesh(
        new T.RingGeometry(0.85, 1.05, 32),
        new T.MeshBasicMaterial({
          color: i === 0 ? 0x16ffb0 : 0xff8050,
          side: T.DoubleSide,
        }),
      );
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.07;
      this.scene.add(m);
      return m;
    });
    this.markers = [0, 1].map((i) => {
      const marker = new T.Mesh(
        new T.ConeGeometry(0.32, 0.48, 3),
        new T.MeshBasicMaterial({ color: i === 0 ? 0xd4ff44 : 0x61d8ff }),
      );
      marker.rotation.z = Math.PI;
      this.scene.add(marker);
      return marker;
    });
    this.quality("Medium");
    this.resize();
    addEventListener("resize", () => this.resize());
    document.addEventListener("visibilitychange", () => {
      this.input.clear();
      this.last = 0;
      this.acc = 0;
      if (
        document.hidden &&
        this.state.name !== "menu" &&
        this.state.name !== "fulltime" &&
        this.state.name !== "paused"
      )
        this.state.pause();
    });
    $("setup").onsubmit = (e) => {
      e.preventDefault();
      this.start();
    };
    $("resume").onclick = () => {
      this.audio.start();
      this.state.pause();
    };
    $("pauseButton").onclick = () => this.state.pause();
    $("quit").onclick = () => {
      this.state.set("menu");
      this.notice = "";
    };
    $("again").onclick = () => this.start();
    $("mute").onclick = () => this.audio.toggle();
    $("volume").oninput = (e) => this.audio.setVolume(+e.target.value);
    $("boot").textContent = "READY TO PLAY • Local match / 5 v 5";
    requestAnimationFrame((t) => this.frame(t));
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("./sw.js").catch((e) => {
        console.warn("Offline cache unavailable", e);
        $("boot").textContent =
          "Ready • Offline cache unavailable in this browser session.";
      });
  }
  makeTeams() {
    if (this.teams)
      for (const team of this.teams)
        for (const p of team.players) {
          this.scene.remove(p.root);
          p.root.traverse((o) => {
            if (o.material?.map) o.material.map.dispose();
          });
          p.kit.dispose();
        }
    this.teams = [
      new Team(this.scene, 0, this.options.homeColor, this.options.formation),
      new Team(this.scene, 1, this.options.awayColor, this.options.formation),
    ];
    this.players = this.teams.flatMap((t) => t.players);
  }
  quality(level) {
    this.options.quality = level;
    const high = level === "High",
      low = level === "Low";
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio, low ? 1 : high ? 2 : 1.5),
    );
    this.renderer.shadowMap.enabled = !low;
    this.sun.shadow.mapSize.set(high ? 2048 : 1024, high ? 2048 : 1024);
    this.pitch.crowd.count = low ? 240 : high ? 720 : 480;
    this.particles.limit = low ? 20 : high ? 100 : 60;
    this.resize();
  }
  resize() {
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.camera.camera.aspect = innerWidth / innerHeight;
    this.camera.camera.updateProjectionMatrix();
  }
  start() {
    for (const k of [
      "home",
      "away",
      "homeColor",
      "awayColor",
      "difficulty",
      "formation",
      "quality",
    ])
      this.options[k] = $(k).value;
    this.options.home = this.options.home.trim() || "HOME";
    this.options.away = this.options.away.trim() || "AWAY";
    this.options.duration = +$("duration").value;
    for (const k of ["golden", "local", "auto"]) this.options[k] = $(k).checked;
    this.audio.start();
    this.audio.play("ui");
    this.input.clear();
    this.makeTeams();
    this.rules = new Rules(this);
    this.ball.reset();
    this.quality(this.options.quality);
    document.documentElement.style.setProperty(
      "--home",
      this.options.homeColor,
    );
    document.documentElement.style.setProperty(
      "--away",
      this.options.awayColor,
    );
    $("homeName").textContent = this.options.home;
    $("awayName").textContent = this.options.away;
    this.notice = "";
    this.aiTime = 0;
    this.rules.kickoff();
    this.state.set("lineup", CFG.match.lineup);
  }
  human(team, dt, second = false) {
    const p = team.players[team.active],
      c = this.input.controls(second, this.options.local);
    team.passLock = Math.max(0, (team.passLock || 0) - dt);
    if (c.switchEdge) {
      p.charge = 0;
      team.switch(this.ball, { x: c.x, z: c.z });
      return;
    }
    p.move(c.x, c.z, c.sprint, dt);
    const goalX = team.dir * 30;
    const inRange = Math.hypot(goalX - p.x, p.z) < CFG.control.shotAssistRange;
    const forward = p.dx * team.dir > -0.2;
    // Assist towards the goal mouth; stick direction selects the near/far side.
    const shotX = inRange && forward ? goalX - p.x : p.dx;
    const shotZ =
      inRange && forward
        ? clamp(c.z * 2.8 + p.dz * 0.6, -3.1, 3.1) - p.z
        : p.dz;
    if (c.shoot) p.charge = clamp(p.charge + dt * 0.8, 0.08, 1);
    else if (p.charge > 0) {
      if (
        this.ball.kick(
          p,
          shotX,
          shotZ,
          18 + p.charge * 16,
          0.6 + p.charge * 3.2,
          (p.vz * p.dx - p.vx * p.dz) * 0.7,
        )
      ) {
        this.camera.shake = 0.5;
        this.particles.burst(p.x, p.z, 8);
      }
      p.charge = 0;
    }
    if (c.passEdge || c.throughEdge) {
      const target = passTarget(
        p,
        team,
        this.teams[1 - team.id].players,
        c.throughEdge,
        { x: c.x, z: c.z },
      );
      if (
        target &&
        this.ball.kick(
          p,
          target.x - p.x,
          target.z - p.z,
          Math.min(27, distance(p, target) * 1.1 + 7),
          c.throughEdge ? 0.6 : 0,
        )
      ) {
        team.active = target.player.index;
        team.passLock = 1.5;
      }
    }
    if (c.lobEdge) this.ball.kick(p, shotX, shotZ, 16, 10);
    if (c.tackleEdge && p.tackleCooldown <= 0) {
      p.slide = 0.5;
      p.tackleCooldown = CFG.control.tackleCooldown;
      p.vx += p.dx * 5;
      p.vz += p.dz * 5;
      this.particles.burst(p.x, p.z, 10);
    }
    if (
      this.options.auto &&
      team.passLock === 0 &&
      !c.shoot &&
      Math.hypot(c.x, c.z) < 0.2 &&
      distance(p, this.ball) > 6
    ) {
      const near = team.nearest(this.ball);
      if (distance(near, this.ball) + 3 < distance(p, this.ball))
        team.active = near.index;
    }
  }
  step(dt) {
    this.time += dt;
    const s = this.state.name;
    if (s === "menu" || s === "paused" || s === "fulltime") return;
    this.state.tick(dt);
    if (s === "lineup") {
      if (!this.state.timer) this.state.set("countdown", CFG.match.countdown);
      return;
    }
    if (s === "countdown") {
      if (!this.state.timer) {
        this.state.set("playing");
        this.notice = "";
        this.audio.play("whistle");
      }
      return;
    }
    if (s === "goal") {
      this.particles.update(dt);
      if (!this.state.timer) {
        if (
          this.rules.golden ||
          (this.rules.elapsed >= this.options.duration &&
            this.teams[0].score !== this.teams[1].score)
        )
          this.rules.finish();
        else this.rules.kickoff(this.rules.kickTeam);
      }
      return;
    }
    if (s === "restart") {
      if (!this.state.timer) this.rules.takeRestart();
      return;
    }
    this.aiTime -= dt;
    if (this.aiTime <= 0) {
      this.aiTime = 1 / CFG.match.aiHz;
      for (const team of this.teams)
        decide(
          team,
          this.teams[1 - team.id],
          this.ball,
          this.options.difficulty,
          team.id === 0 || this.options.local
            ? team.players[team.active]
            : null,
        );
    }
    for (const team of this.teams) {
      const human = team.id === 0 || this.options.local;
      if (human) this.human(team, dt, team.id === 1);
      for (const p of team.players) {
        if (p.keeper) goalkeeper(p, team, this.ball, dt, this.audio);
        else if (!human || p.index !== team.active)
          moveAI(p, dt, CFG.difficulty[this.options.difficulty].speed);
      }
    } // Resolve player overlap with a small symmetric displacement.
    for (let i = 0; i < 10; i++)
      for (let j = i + 1; j < 10; j++) {
        const a = this.players[i],
          b = this.players[j],
          dx = a.x - b.x,
          dz = a.z - b.z,
          d = Math.hypot(dx, dz);
        if (d < 1.1 && d > 0.01) {
          const shift = (1.1 - d) * 0.5;
          a.x = clamp(a.x + (dx / d) * shift, -29, 29);
          a.z = clamp(a.z + (dz / d) * shift, -19, 19);
          b.x = clamp(b.x - (dx / d) * shift, -29, 29);
          b.z = clamp(b.z - (dz / d) * shift, -19, 19);
        }
      }
    this.ball.update(dt, this.players);
    this.rules.update(dt);
    this.particles.update(dt);
    if (this.noticeTime > 0) {
      this.noticeTime -= dt;
      if (this.noticeTime <= 0) this.notice = "";
    }
    if (Math.hypot(this.ball.vx, this.ball.vz) > 26 && Math.random() < dt * 15)
      this.particles.burst(this.ball.x, this.ball.z, 1);
  }
  frame(ms) {
    requestAnimationFrame((t) => this.frame(t));
    if (document.hidden) return;
    const dt = this.last ? Math.min((ms - this.last) / 1000, 0.1) : 0;
    this.last = ms;
    this.input.poll();
    if (this.input.edges.has("KeyP") || this.input.edges.has("Escape"))
      this.state.pause();
    if (this.input.edges.has("KeyC")) this.camera.toggle();
    if (this.input.edges.has("KeyM")) this.audio.toggle();
    this.acc += dt;
    let stepped = false;
    while (this.acc >= CFG.match.step) {
      this.step(CFG.match.step);
      this.acc -= CFG.match.step;
      if (!stepped) {
        this.input.end();
        stepped = true;
      }
    }
    for (const p of this.players) {
      p.celebrate =
        this.state.name === "goal" && p.team === 1 - this.rules.kickTeam;
      p.render(this.time);
    }
    this.ball.render(dt);
    this.rings.forEach((r, i) => {
      const p = this.teams[i].players[this.teams[i].active];
      r.position.set(p.x, 0.07, p.z);
      this.markers[i].position.set(p.x, 2.65, p.z);
      this.markers[i].visible =
        this.state.name !== "menu" && (i === 0 || this.options.local);
      r.visible = this.state.name !== "menu" && (i === 0 || this.options.local);
    });
    this.camera.update(
      this.ball,
      this.teams[0].players[this.teams[0].active],
      this.state.name,
      this.time,
      dt,
    );
    this.hud.update(this);
    this.renderer.render(this.scene, this.camera.camera);
    this.fpsTime += dt;
    this.fpsFrames++;
    if (this.fpsTime >= 3) {
      const fps = this.fpsFrames / this.fpsTime;
      this.slow = fps < 40 ? this.slow + 1 : 0;
      if (this.slow >= 2 && this.options.quality !== "Low") {
        this.quality(this.options.quality === "High" ? "Medium" : "Low");
        this.slow = 0;
      }
      this.fpsTime = this.fpsFrames = 0;
    }
  }
}
export let game;
try {
  game = new Game();
} catch (e) {
  console.error(e);
  $("boot").textContent =
    "Unable to start WebGL. Enable hardware acceleration, then reload.";
}
