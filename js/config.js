export const CFG = {
  pitch: {
    length: 60,
    width: 40,
    goalWidth: 8,
    goalHeight: 3,
    boardHeight: 1.1,
  },
  ball: {
    radius: 0.3,
    gravity: 18,
    bounce: 0.56,
    roll: 1.3,
    drag: 0.16,
    curve: 0.022,
  },
  player: {
    speed: 7,
    sprint: 10,
    accel: 24,
    radius: 0.65,
    kickRange: 1.85,
    staminaDrain: 0.22,
    staminaRecovery: 0.15,
  },
  match: { step: 1 / 60, aiHz: 12, goalDelay: 3.2, countdown: 3, lineup: 2 },
  difficulty: {
    Easy: { speed: 0.82, reaction: 0.5, accuracy: 0.8, press: 1 },
    Medium: { speed: 1, reaction: 0.3, accuracy: 0.94, press: 2 },
    Hard: { speed: 1.1, reaction: 0.18, accuracy: 0.99, press: 2 },
  },
  formations: {
    "1-2-1": [
      [-16, 0],
      [-5, -11],
      [-5, 11],
      [12, 0],
    ],
    "2-1-1": [
      [-15, -9],
      [-15, 9],
      [-2, 0],
      [13, 0],
    ],
    "1-1-2": [
      [-17, 0],
      [-5, 0],
      [12, -9],
      [12, 9],
    ],
  },
};
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
