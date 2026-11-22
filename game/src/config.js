// Tuning, palette, guard kinds, tools and the heist table for
// THE GILDED FOX. Every number the simulation uses lives here, so a balance
// change is one edit and the tests can import the same constants the game
// runs with.

export const VIEW = {
  width: 1280,
  height: 800,
  hudTop: 64,
  hudBottom: 64,
};

// Playable room bounds: the outer walls sit just inside the HUD bars.
export const ROOM = { x: 10, y: 74, w: 1260, h: 650 };

export const PALETTE = {
  floor: '#141a2e',
  floorAlt: '#171e33',
  wall: '#232c4a',
  wallEdge: '#c9a227',
  gold: '#c9a227',
  goldBright: '#f2c94c',
  goldDim: '#8a7420',
  ink: '#e8e4d8',
  muted: '#8b93b0',
  danger: '#e5484d',
  dangerDim: '#7a2b2e',
  calm: '#e8a13c',
  safe: '#39d98a',
  shadow: '#2b3f6e',
  vent: '#3a4668',
  smoke: '#9aa3b8',
  thief: '#ff9f2e',
  guard: '#5b6b8c',
  camera: '#7dd3a8',
};

// Movement speeds in pixels per second.
export const SPEEDS = {
  walk: 150,
  sneak: 85,
  sprint: 228,
  vent: 60,
};

// The thief's collision radius.
export const THIEF_RADIUS = 13;

// How long the lockpick takes while standing still at the case.
export const LOCKPICK_SECONDS = 2.5;

// Alarm meter: 0..100.
export const ALARM = {
  // Alarm gained per second while any watcher sees the thief.
  risePerSecond: 7,
  // Alarm lost per second while nobody sees the thief.
  decayPerSecond: 4,
  // Alarm added when a live laser beam is tripped.
  laserTrip: 30,
  // Standard mode: seconds to reach the exit once the alarm hits 100.
  lockdownSeconds: 10,
};

// The five guard kinds. Range is sight distance in pixels, cone is the
// half-angle in radians, suspicion is how fast the meter fills per second
// at point blank, chase is the pursuit speed.
export const GUARD_KINDS = {
  patroller: {
    label: 'Patroller', speed: 56, range: 195, cone: 0.61,
    suspicion: 34, chase: 128, color: '#5b6b8c',
  },
  sentry: {
    label: 'Sentry', speed: 42, range: 235, cone: 0.52,
    suspicion: 48, chase: 110, color: '#7a6a9c',
  },
  captain: {
    label: 'Captain', speed: 72, range: 215, cone: 0.66,
    suspicion: 55, chase: 148, color: '#c25e4b',
  },
  hound: {
    label: 'Hound', speed: 96, range: 155, cone: 0.79,
    suspicion: 60, chase: 178, color: '#4b8c6a',
  },
  drone: {
    label: 'Drone', speed: 66, range: 205, cone: 0.57,
    suspicion: 40, chase: 138, color: '#4b7a8c',
  },
};

// Cameras sweep and feed the alarm directly; they never chase.
export const CAMERA = { range: 250, cone: 0.5, risePerSecond: 9 };

// Tools. The coin is aimed with the mouse; smoke hides the thief; the EMP
// blinds every camera and drone for its duration.
export const TOOLS = {
  coin: { name: 'Coin Toss', cost: 25, blurb: 'aim with mouse', key: '1' },
  smoke: { name: 'Smoke Pellet', cost: 50, blurb: 'hides you 6s', key: '2', duration: 6, radius: 74 },
  emp: { name: 'EMP Pulse', cost: 100, blurb: 'blinds machines 8s', key: '3', duration: 8 },
};

// Every heist starts with this much kit fund. Unspent fund pays out.
export const KIT_FUND = 150;

// The three jobs. Counts are the watchers each room holds.
export const HEISTS = [
  {
    name: 'The Gallery of Echoes',
    prize: 'Aurum Sun Mask',
    prizeValue: 1200,
    guards: 3,
    cameras: 2,
    lasers: 0,
    parSeconds: 75,
  },
  {
    name: 'The Meridian Bank Vault',
    prize: 'Aurum Heart Diamond',
    prizeValue: 2500,
    guards: 4,
    cameras: 3,
    lasers: 2,
    parSeconds: 95,
  },
  {
    name: 'The Sky Casino',
    prize: 'Aurum Jackpot',
    prizeValue: 4000,
    guards: 5,
    cameras: 3,
    lasers: 2,
    parSeconds: 115,
  },
];

// Campaign ranks by total gold banked across the three jobs.
export const RANKS = [
  { at: 0, name: 'STREET RAT' },
  { at: 1500, name: 'PICKPOCKET' },
  { at: 3500, name: 'CAT BURGLAR' },
  { at: 6000, name: 'SHADOW' },
  { at: 9000, name: 'MASTER THIEF' },
  { at: 12500, name: 'LEGEND OF THE NIGHT' },
];

export function rankFor(totalGold) {
  let rank = RANKS[0].name;
  for (const r of RANKS) {
    if (totalGold >= r.at) rank = r.name;
  }
  return rank;
}

// Time bonus: gold per second under par, capped at the par itself.
export const TIME_BONUS_PER_SECOND = 8;

// Escape during a lockdown pays this bonus on top of the loot.
export const LOCKDOWN_ESCAPE_BONUS = 250;
