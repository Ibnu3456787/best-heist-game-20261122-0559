// The three rooms of THE GILDED FOX.
// Each level is pure data: walls, patrol routes, cameras, laser beams, vents,
// shadow pools, the loot case, the exit door and the thief's spawn. The
// simulation and the renderer both read this, so a room is one definition.

import { HEISTS, ROOM } from './config.js';

function wall(x, y, w, h, label) {
  return { x, y, w, h, label: label || '' };
}

// The room's outer shell. The bottom wall leaves a gap where the exit door
// sits; the van waits outside it.
function borderWalls(exit) {
  return [
    wall(0, 64, 1280, 10, ''),
    wall(0, 74, 10, 650, ''),
    wall(1270, 74, 10, 650, ''),
    wall(0, 724, exit.x, 10, ''),
    wall(exit.x + exit.w, 724, 1280 - (exit.x + exit.w), 10, ''),
  ];
}

function guard(kind, waypoints) {
  return { kind, x: waypoints[0][0], y: waypoints[0][1], waypoints };
}

function camera(x, y, angle, sweep, period) {
  return { x, y, angle, sweep, period };
}

function laser(x1, y1, x2, y2, period, onFraction, phase) {
  return { x1, y1, x2, y2, period, onFraction, phase };
}

// Heist 1 — The Gallery of Echoes. Four display cases in the middle of the
// hall, a sentry watching the mask's pedestal, a hound working the floor.
function galleryLevel() {
  const exit = { x: 600, y: 690, w: 80, h: 34 };
  return {
    index: 0,
    name: HEISTS[0].name,
    prize: HEISTS[0].prize,
    prizeValue: HEISTS[0].prizeValue,
    parSeconds: HEISTS[0].parSeconds,
    walls: [
      ...borderWalls(exit),
      wall(400, 220, 130, 64, 'DISPLAY'),
      wall(750, 220, 130, 64, 'DISPLAY'),
      wall(400, 470, 130, 64, 'DISPLAY'),
      wall(750, 470, 130, 64, 'DISPLAY'),
      wall(180, 300, 60, 140, ''),
      wall(1040, 300, 60, 140, ''),
    ],
    guards: [
      guard('patroller', [[200, 180], [1080, 180], [1080, 620], [200, 620]]),
      guard('sentry', [[560, 260], [720, 260]]),
      guard('hound', [[180, 600], [1100, 600]]),
    ],
    cameras: [
      camera(60, 110, 0.6, 0.5, 5),
      camera(1220, 110, Math.PI - 0.6, 0.5, 6),
    ],
    lasers: [],
    vents: [{ x: 24, y: 300, w: 36, h: 160 }],
    shadows: [
      { x: 300, y: 420, r: 70 },
      { x: 980, y: 420, r: 70 },
    ],
    casePos: { x: 615, y: 120, w: 50, h: 50 },
    exit,
    spawn: { x: 120, y: 680 },
  };
}

// Heist 2 — The Meridian Bank Vault. Teller desks box the floor in, two
// timed laser beams guard the vault approach, a drone works the corridor
// between them.
function bankLevel() {
  const exit = { x: 600, y: 690, w: 80, h: 34 };
  return {
    index: 1,
    name: HEISTS[1].name,
    prize: HEISTS[1].prize,
    prizeValue: HEISTS[1].prizeValue,
    parSeconds: HEISTS[1].parSeconds,
    walls: [
      ...borderWalls(exit),
      wall(300, 300, 150, 60, 'TELLER'),
      wall(830, 300, 150, 60, 'TELLER'),
      wall(300, 500, 150, 60, 'TELLER'),
      wall(830, 500, 150, 60, 'TELLER'),
    ],
    guards: [
      guard('patroller', [[220, 200], [1060, 200], [1060, 260], [220, 260]]),
      guard('captain', [[220, 440], [1060, 440], [1060, 640], [220, 640]]),
      guard('sentry', [[560, 200], [720, 200]]),
      guard('drone', [[300, 470], [980, 470]]),
    ],
    cameras: [
      camera(60, 110, 0.6, 0.5, 5),
      camera(1220, 110, Math.PI - 0.6, 0.5, 6),
      camera(640, 700, -Math.PI / 2, 0.55, 7),
    ],
    lasers: [
      laser(200, 400, 1080, 400, 2.6, 0.6, 0),
      laser(200, 580, 1080, 580, 3.4, 0.55, 1.7),
    ],
    vents: [{ x: 1220, y: 300, w: 36, h: 160 }],
    shadows: [
      { x: 320, y: 640, r: 65 },
      { x: 960, y: 180, r: 65 },
    ],
    casePos: { x: 615, y: 120, w: 50, h: 50 },
    exit,
    spawn: { x: 120, y: 680 },
  };
}

// Heist 3 — The Sky Casino. A slot row under the jackpot, gaming tables
// across the floor, a vertical laser on the jackpot approach and a
// horizontal one across the middle.
function casinoLevel() {
  const exit = { x: 600, y: 690, w: 80, h: 34 };
  return {
    index: 2,
    name: HEISTS[2].name,
    prize: HEISTS[2].prize,
    prizeValue: HEISTS[2].prizeValue,
    parSeconds: HEISTS[2].parSeconds,
    walls: [
      ...borderWalls(exit),
      wall(420, 160, 440, 44, 'SLOTS'),
      wall(260, 300, 150, 70, 'TABLE'),
      wall(870, 300, 150, 70, 'TABLE'),
      wall(260, 520, 150, 70, 'TABLE'),
      wall(870, 520, 150, 70, 'TABLE'),
      wall(80, 380, 90, 120, 'BAR'),
    ],
    guards: [
      guard('patroller', [[200, 250], [1080, 250]]),
      guard('sentry', [[560, 250], [720, 250]]),
      guard('captain', [[200, 470], [1080, 470], [1080, 650], [200, 650]]),
      guard('hound', [[180, 620], [1100, 620]]),
      guard('drone', [[640, 300], [640, 620]]),
    ],
    cameras: [
      camera(60, 110, 0.6, 0.5, 5),
      camera(1220, 110, Math.PI - 0.6, 0.5, 6),
      camera(1220, 690, -2.36, 0.5, 7),
    ],
    lasers: [
      laser(640, 240, 640, 660, 3.0, 0.55, 0.8),
      laser(200, 440, 1080, 440, 3.8, 0.5, 1.2),
    ],
    vents: [{ x: 24, y: 480, w: 36, h: 160 }],
    shadows: [
      { x: 640, y: 400, r: 75 },
      { x: 1100, y: 620, r: 60 },
    ],
    casePos: { x: 615, y: 100, w: 44, h: 44 },
    exit,
    spawn: { x: 120, y: 680 },
  };
}

export function buildLevel(index) {
  if (index === 0) return galleryLevel();
  if (index === 1) return bankLevel();
  return casinoLevel();
}

export const LEVELS = [galleryLevel(), bankLevel(), casinoLevel()];

// The room rectangle, for clamping and for the renderer.
export { ROOM };
