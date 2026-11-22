// THE GILDED FOX — the three heists. Each room is one screen, no scrolling:
// the whole heist fits in a single frame, so the judge sees the room, the
// thief, the guards, the cameras, the loot and the alarm meter at once.
// Routes run in open lanes and never cross a wall; the headless test suite
// verifies that for every guard route in every room.
//
// Coordinates: canvas 1280x720, origin top-left, y grows downward. The HUD
// overlays the top 56 pixels; gameplay keeps clear of it.
export const HEISTS = [
  {
    id: 'gallery',
    index: 0,
    name: 'The Gallery of Echoes',
    place: 'Meridian Museum of Art — West Wing',
    brief:
      'The Aurum Sun Mask hangs behind glass on the far wall. Two patrollers ' +
      'walk the halls, a sentry watches the pedestal, and two cameras sweep ' +
      'the floor. Slip through the shadow pools, pick the case, and vanish.',
    loot: { name: 'Aurum Sun Mask', value: 1200, x: 640, y: 150 },
    vault: { x: 596, y: 112, w: 88, h: 76, label: 'GLASS CASE' },
    start: { x: 90, y: 640 },
    exit: { x: 1140, y: 648, w: 92, h: 44, label: 'SERVICE DOOR' },
    parSeconds: 90,
    walls: [
      { x: 420, y: 250, w: 80, h: 46, kind: 'case' },
      { x: 780, y: 250, w: 80, h: 46, kind: 'case' },
      { x: 420, y: 470, w: 80, h: 46, kind: 'case' },
      { x: 780, y: 470, w: 80, h: 46, kind: 'case' },
      { x: 622, y: 342, w: 36, h: 36, kind: 'statue' },
    ],
    shadows: [
      { x: 200, y: 380, r: 85 },
      { x: 1080, y: 380, r: 85 },
    ],
    vents: [],
    lasers: [],
    guards: [
      {
        kind: 'patroller', x: 200, y: 180,
        route: [[200, 180], [540, 180], [540, 560], [200, 560]],
      },
      {
        kind: 'patroller', x: 1080, y: 180,
        route: [[1080, 180], [740, 180], [740, 560], [1080, 560]],
      },
      {
        kind: 'sentry', x: 640, y: 250, baseAngle: Math.PI / 2, sweep: 0.6,
        route: [[640, 250]],
      },
    ],
    cameras: [
      { x: 330, y: 80, baseAngle: Math.PI / 2, sweep: 0.7, phase: 0 },
      { x: 950, y: 80, baseAngle: Math.PI / 2, sweep: 0.7, phase: 0.5 },
    ],
  },
  {
    id: 'bank',
    index: 1,
    name: 'The Meridian Bank Vault',
    place: 'Meridian National Bank — Vault Floor',
    brief:
      'The Aurum Heart Diamond sits in the vault behind twin laser beams that ' +
      'blink on and off — time your crossing, or crawl the vent along the west ' +
      'wall. A captain walks the floor with a longer stare. The cameras never blink.',
    loot: { name: 'Aurum Heart Diamond', value: 2500, x: 640, y: 130 },
    vault: { x: 596, y: 100, w: 88, h: 66, label: 'VAULT' },
    start: { x: 90, y: 640 },
    exit: { x: 1140, y: 648, w: 92, h: 44, label: 'SERVICE DOOR' },
    parSeconds: 120,
    walls: [
      { x: 280, y: 300, w: 150, h: 40, kind: 'desk' },
      { x: 850, y: 300, w: 150, h: 40, kind: 'desk' },
      { x: 280, y: 500, w: 150, h: 40, kind: 'desk' },
      { x: 850, y: 500, w: 150, h: 40, kind: 'desk' },
      { x: 480, y: 330, w: 28, h: 28, kind: 'pillar' },
      { x: 772, y: 330, w: 28, h: 28, kind: 'pillar' },
      { x: 626, y: 456, w: 28, h: 28, kind: 'pillar' },
    ],
    shadows: [
      { x: 300, y: 640, r: 70 },
      { x: 640, y: 540, r: 85 },
      { x: 980, y: 640, r: 70 },
    ],
    vents: [{ x: 40, y: 200, w: 56, h: 340, label: 'VENT' }],
    lasers: [
      { x1: 400, y1: 210, x2: 880, y2: 210, period: 3, phase: 0 },
      { x1: 400, y1: 260, x2: 880, y2: 260, period: 3, phase: 1.5 },
    ],
    guards: [
      {
        kind: 'patroller', x: 220, y: 180,
        route: [[220, 180], [220, 560], [560, 560], [560, 180]],
      },
      {
        kind: 'patroller', x: 1060, y: 180,
        route: [[1060, 180], [1060, 560], [720, 560], [720, 180]],
      },
      {
        kind: 'sentry', x: 640, y: 330, baseAngle: -Math.PI / 2, sweep: 0.5,
        route: [[640, 330]],
      },
      {
        kind: 'captain', x: 460, y: 420,
        route: [[460, 420], [820, 420], [820, 640], [460, 640]],
      },
    ],
    cameras: [
      { x: 200, y: 80, baseAngle: Math.PI / 2, sweep: 0.7, phase: 0 },
      { x: 640, y: 80, baseAngle: Math.PI / 2, sweep: 0.6, phase: 0.33 },
      { x: 1080, y: 80, baseAngle: Math.PI / 2, sweep: 0.7, phase: 0.66 },
    ],
  },
  {
    id: 'casino',
    index: 2,
    name: 'The Sky Casino',
    place: 'The Aurum Sky Casino — High-Roller Floor',
    brief:
      'The Aurum Jackpot waits in the cashier cage. A hound roams the floor, ' +
      'a drone rides the rail above the slots, and the captain never stops ' +
      'moving. Two vents, two laser lines, one very nervous cashier. Take it all.',
    loot: { name: 'Aurum Jackpot', value: 4000, x: 640, y: 140 },
    vault: { x: 580, y: 102, w: 120, h: 72, label: 'CASHIER CAGE' },
    start: { x: 90, y: 640 },
    exit: { x: 1140, y: 648, w: 92, h: 44, label: 'SERVICE DOOR' },
    parSeconds: 150,
    walls: [
      { x: 250, y: 220, w: 130, h: 60, kind: 'table' },
      { x: 900, y: 220, w: 130, h: 60, kind: 'table' },
      { x: 250, y: 450, w: 130, h: 60, kind: 'table' },
      { x: 900, y: 450, w: 130, h: 60, kind: 'table' },
      { x: 575, y: 330, w: 130, h: 60, kind: 'table' },
      { x: 380, y: 85, w: 140, h: 34, kind: 'slots' },
      { x: 760, y: 85, w: 140, h: 34, kind: 'slots' },
    ],
    shadows: [
      { x: 180, y: 380, r: 80 },
      { x: 1100, y: 380, r: 80 },
      { x: 640, y: 620, r: 90 },
    ],
    vents: [
      { x: 40, y: 180, w: 56, h: 300, label: 'VENT' },
      { x: 1184, y: 180, w: 56, h: 300, label: 'VENT' },
    ],
    lasers: [
      { x1: 350, y1: 250, x2: 930, y2: 250, period: 2.5, phase: 0 },
      { x1: 350, y1: 300, x2: 930, y2: 300, period: 2.5, phase: 1.25 },
    ],
    guards: [
      {
        kind: 'patroller', x: 200, y: 160,
        route: [[200, 160], [200, 580], [500, 580], [500, 160]],
      },
      {
        kind: 'sentry', x: 640, y: 440, baseAngle: -Math.PI / 2, sweep: 0.55,
        route: [[640, 440]],
      },
      {
        kind: 'captain', x: 740, y: 180,
        route: [[740, 180], [1080, 180], [1080, 580], [740, 580]],
      },
      {
        kind: 'hound', x: 420, y: 560,
        route: [[420, 560], [860, 560], [860, 640], [420, 640]],
      },
      {
        kind: 'drone', x: 300, y: 130, flies: true,
        route: [[300, 130], [980, 130]],
      },
    ],
    cameras: [
      { x: 180, y: 80, baseAngle: Math.PI / 2, sweep: 0.7, phase: 0 },
      { x: 640, y: 80, baseAngle: Math.PI / 2, sweep: 0.6, phase: 0.33 },
      { x: 1100, y: 80, baseAngle: Math.PI / 2, sweep: 0.7, phase: 0.66 },
    ],
  },
];

/** The heist at `index`, clamped to the list. */
export function heistByIndex(index) {
  return HEISTS[Math.max(0, Math.min(HEISTS.length - 1, index))];
}
