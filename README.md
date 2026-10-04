# Penalty • Five-a-side

A static, procedural 3D arcade soccer game: 4 outfield players and a goalkeeper per team. No build, backend, accounts, asset downloads, or runtime CDN dependency. Three.js 0.170.0 is vendored in `libs/`, with its MIT license.

## Play locally

From the repository root:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Use HTTP rather than opening the HTML file directly: ES modules and the offline service worker need a server. Audio starts when you press Take the pitch. Service workers work on localhost or HTTPS; wait for the first cache installation before going offline.

## GitHub Pages

Entry point: **`index.html` at the repository root**.

1. Push these files to `main`.
2. Settings → Pages → Deploy from branch → `main` / **root** → Save.
3. Open `https://xerox-gh.github.io/Penalty/` once deployment finishes.

All asset URLs are relative. The vendored engine and game modules are precached in the repository's service-worker scope. Bump `CACHE` in `sw.js` when publishing updates.

![Broadcast match preview](./docs/preview.png)

## Broadcast / ball-control update

The presentation now uses a broadcast score graphic, lime-accent match menus, a centered radar, overhead control markers, refined low-poly kits/boots/hair and stadium advertising. This is an original small-sided football game inspired by televised football and console football controls.

Movement keeps the ball close to your feet. Sprinting takes longer touches. Point toward a teammate and pass: control transfers to the intended receiver. Shots within 31 metres receive goal-mouth assistance when facing forward; vertical input chooses the side of the goal. AI supports the ball carrier with width and forward runs, and opposing players use timed tackles. A missed slide has a recovery cooldown.

Tune `CFG.control` for first-touch speed, dribble distance/spring, sprint touches, tackle reach/cooldown and shot-assist range. The game remains 5v5 with arcade rules, not a full 11v11 career-mode simulator.

## Controls

| Action | Player 1 | Local player 2 | Gamepad |
|---|---|---|---|
| Move | WASD; arrows in solo mode | Arrows | Left stick |
| Sprint | Left Shift | Right Shift | RB |
| Shoot | Hold Space, release | Hold Enter, release | Hold A, release |
| Pass | E | / | B |
| Through ball | R | ; | — |
| Chip | Q | . | X |
| Slide | F | , | Y |
| Switch | Tab | Backspace | LB |
| Camera | C | Shared | — |
| Pause | P / Esc | Shared | — |
| Mute | M | Shared | — |

Touch devices display a joystick and six action buttons. Use movement direction to aim passes and choose the finish; close-range shots are assisted. Neutral-stick switching selects a player near the ball; switching with movement favors that direction. Auto-switch can be disabled in setup. The home team attacks the right-hand (+X) goal for the whole match.

## Included

- 2 / 3 / 5-minute matches, optional golden goal, local keyboard versus mode, three difficulties, team names/colors and three formations.
- Fixed 60 Hz ball simulation: gravity, bounce, drag, rolling friction, sidespin, player/post/crossbar/board collisions. Lofted balls can leave the pitch and trigger kick-ins, corners or goal kicks.
- Role anchors shift with play, at most two AI outfield chasers per team, marking, scored passing lanes, shooting and goalkeeper prediction/catch/parry/distribution.
- Lineup, countdown, kickoff, goal camera/celebration, pause, full-time and replay match flow.
- Four cameras, procedural players/net/striped grass/crowd/floodlights, instanced crowd, shadows, particles, radar, stamina, shot meter, synth audio and volume/mute.
- Low/Medium/High quality and automatic downgrade after sustained rendering below 40 FPS. Hidden tabs pause matches.

## Tuning / scope

`js/config.js` holds pitch dimensions, player speeds/stamina, ball constants, formation anchors, difficulty and timing. Goalkeepers and field-player heuristics live in their respective modules. This is an arcade implementation: no fouls, cards, offside, substitutions or halftime. Restarts take 1.5 seconds and automatically position the nearest outfield taker. The goal camera is a live celebration swing, not a recorded replay. Audio is synthesized; crowd ambience is filtered noise. No multiplayer networking.

Low-poly procedural animations cover running, kicking, sliding, diving and celebration; these are simple rigid-part poses, not skeletal motion capture. There is no persistent match history. Quality performance varies by GPU; use Low on older hardware.

## Validation performed

`node tests/smoke.mjs` checks both goals, kick-ins, corners, goal kicks, board bounce, gravity, shots, keeper catch/distribution, formations, golden goal/full-time and a 180-second simulation with all ten players. JavaScript syntax and HTTP asset paths under `/Penalty/` were also checked. Headless Chromium rendered the game without console errors, accepted movement/shot/pass/camera input, exercised pause/resume, goal/golden-goal/full-time, and reloaded successfully offline after service-worker installation. The original Low-quality scene rendered about 149 draw calls / 6,110 triangles; the updated player geometry adds detail, so that figure is not a current performance measurement. Mobile portrait UI and touch targets were also checked in Chromium emulation. Real-device Chrome/Firefox/Safari/Edge and physical gamepad validation remain outstanding. The headless browser uses software rendering, so neither simulation timing nor these checks establish 60 FPS on real hardware.

## Test checklist

- [ ] Load `/Penalty/` under a repository subpath; all imports and CSS return 200.
- [ ] No browser console errors or missing assets.
- [ ] Ten players stay on pitch, keep formation and contest possession.
- [ ] Move/sprint/pass/charge shot/chip/slide/switch, score into both goals.
- [ ] Check keeper saves/distribution, kick-ins, goal kicks and corners.
- [ ] Pause/resume, hide tab, finish match, golden goal, play again.
- [ ] Test local P2 and a standard-mapping gamepad.
- [ ] Test mobile joystick/buttons in portrait and landscape.
- [ ] First online load installs service worker; reload and play offline.
- [ ] Smoke-test current Chrome, Firefox, Safari and Edge on real devices.
