// THE GILDED FOX — tuning constants. One file, one job: every number the
// game balances on lives here, so a balance pass touches this file only.
// The stage is a fixed 1280x720 canvas; the HUD takes the top 56 pixels
// and the room fills the rest, so a single frame always shows the heist.
export const VIEW = { width: 1280, height: 720, hudHeight: 56 };

/** The playable room: inside the gold-trimmed outer wall, below the HUD. */
export const ROOM = { minX: 24, minY: 64, maxX: 1256, maxY: 696 };

export const STEP = 1 / 60; // fixed simulation step (seconds)

export const THIEF = {
  radius: 15,
  walkSpeed: 205, // px/s
  sneakSpeed: 120, // Shift: slower, harder to spot
  sprintSpeed: 300, // Space: faster, easier to spot
  sneakDetect: 0.7, // detection-range multiplier while sneaking
  sprintDetect: 1.25, // detection-range multiplier while sprinting
  sprintAlarm: 1.5, // alarm-fill multiplier while sprinting
};

// Vision cones, by watcher kind. Range is pixels; halfAngle is radians on
// each side of the facing direction; fill is suspicion gained per second.
export const SIGHT = {
  patroller: { range: 195, halfAngle: 0.62, fill: 55 },
  sentry: { range: 210, halfAngle: 0.55, fill: 60 },
  captain: { range: 250, halfAngle: 0.6, fill: 85 },
  hound: { range: 170, halfAngle: 0.75, fill: 70 },
  drone: { range: 165, halfAngle: 0.9, fill: 65 },
  camera: { range: 225, halfAngle: 0.5, fill: 45 },
};

export const GUARD = {
  patrolSpeed: 78,
  chaseSpeed: 165,
  houndChaseSpeed: 235,
  returnSpeed: 120,
  suspicionDecay: 26, // per second while unseen
  suspiciousAt: 30, // "?" — the guard pauses and stares
  alertAt: 100, // "!" — the guard chases the last seen point
  touchBust: 20, // px: an alert guard this close busts you
  investigateSeconds: 4,
  stareSeconds: 1.2,
};

export const CAMERA = {
  sweepSeconds: 5, // one full sweep cycle
  empSeconds: 8, // offline after an EMP pulse
};

export const ALARM = {
  // Per-second rise while any watcher is suspicious / alert / camera-seeing.
  suspiciousRise: 6,
  alertRise: 22,
  cameraRise: 14,
  decay: 9, // per second while nobody sees you
  laserTrip: 30, // instant spike for crossing a live laser
  lockdownSeconds: 10, // countdown once the meter hits 100 (Standard)
  ghostBonusAt: 25, // an alarm peak never above this earns the Ghost bonus
};

export const TOOLS = {
  coin: { key: '1', name: 'Coin Toss', cost: 25, radius: 260, label: 'COIN' },
  smoke: { key: '2', name: 'Smoke Pellet', cost: 50, radius: 95, seconds: 6, label: 'SMOKE' },
  emp: { key: '3', name: 'EMP Pulse', cost: 100, seconds: 8, label: 'EMP' },
  lockpickSeconds: 2.5,
};

export const PURSE_START = 150; // kit fund per heist; tools spend it, the rest scores
export const TIME_BONUS_MAX = 300; // decays over the par time
export const GHOST_BONUS = 500;
export const LOCKDOWN_ESCAPE_BONUS = 150; // escaping during lockdown

// Noir-neon palette: safe cover is cool blue, danger is red, loot is gold —
// readable at a glance, which is the whole point of the look.
export const PALETTE = {
  floor: '#171c30',
  floorAlt: '#1b2138',
  wall: '#2a3050',
  wallTrim: '#c9a227',
  shadow: 'rgba(8, 12, 32, 0.55)',
  shadowEdge: 'rgba(90, 140, 255, 0.25)',
  coneGuard: 'rgba(255, 64, 64, 0.20)',
  coneGuardEdge: 'rgba(255, 64, 64, 0.45)',
  coneCamera: 'rgba(255, 170, 40, 0.16)',
  coneCameraEdge: 'rgba(255, 170, 40, 0.4)',
  coneAlert: 'rgba(255, 40, 40, 0.38)',
  loot: '#ffd94a',
  lootGlow: 'rgba(255, 217, 74, 0.35)',
  thief: '#f4f1e8',
  thiefCloak: '#232946',
  guard: '#3b4a6b',
  guardCap: '#1d2440',
  hound: '#6b4a3b',
  drone: '#8a93b2',
  exit: '#37d67a',
  text: '#f4f1e8',
  dim: '#9aa3c0',
  alarmLow: '#37d67a',
  alarmMid: '#ffb020',
  alarmHigh: '#ff4040',
};
