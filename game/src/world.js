// The simulation: one world, one step, every system.
// createWorld builds a fresh heist from a level definition; step advances it
// by dt seconds under the given input. The world is pure data — no canvas,
// no audio — so the headless tests drive the exact code the game runs.

import {
  ALARM,
  KIT_FUND,
  LOCKDOWN_ESCAPE_BONUS,
  TIME_BONUS_PER_SECOND,
} from './config.js';
import { buildLevel } from './levels.js';
import { makeRng } from './rng.js';
import { makeGuard, updateGuard } from './guards.js';
import { makeCamera, updateCamera } from './cameras.js';
import { makeLaser, updateLasers } from './lasers.js';
import { makeThief, updateThief } from './thief.js';
import { updateTools, useTool } from './tools.js';
import { updateAlarm } from './alarm.js';
import { pointInRect } from './geometry.js';

export function createWorld(heistIndex, mode, seed) {
  const level = buildLevel(heistIndex);
  const rng = makeRng(seed === undefined ? 1234 + heistIndex * 7919 : seed);
  const world = {
    heistIndex,
    mode, // 'standard' | 'ghost'
    level,
    rng,
    time: 0,
    phase: 'playing', // 'playing' | 'payout' | 'busted'
    thief: makeThief(level.spawn),
    guards: level.guards.map(makeGuard),
    cameras: level.cameras.map(makeCamera),
    lasers: level.lasers.map(makeLaser),
    coins: [],
    smokes: [],
    alarm: 0,
    alarmHot: false,
    lockdown: false,
    lockdownLeft: 0,
    lootSecured: false,
    purse: KIT_FUND,
    events: [],
    banner: null,
    bustReason: null, // 'caught' | 'alarm' | 'lockdown'
    bustGuard: null,
    escaped: false,
    escapedInLockdown: false,
    payout: null,
  };
  // Sentries start their pans at a seed-chosen angle, so two runs with
  // different seeds do not sweep in lockstep — while the same seed always
  // replays exactly.
  for (const g of world.guards) {
    if (g.kind === 'sentry') g.panTime = rng() * 6;
  }
  return world;
}

// One fixed step. Input: { up, down, left, right, sneak, sprint, pick,
// tool: null | 'coin' | 'smoke' | 'emp', aimX, aimY }.
export function step(world, input, dt) {
  if (world.phase !== 'playing') return;
  world.time += dt;

  // Tools fire before movement so a smoke cloud hides the same step.
  if (input.tool) {
    useTool(world, input.tool, input.aimX, input.aimY);
  }
  updateThief(world, input, dt);
  for (const g of world.guards) updateGuard(g, world, dt);
  for (const c of world.cameras) updateCamera(c, dt);
  updateLasers(world, dt);
  updateTools(world, dt);
  updateAlarm(world, dt);

  // The exit opens once the prize is in hand. Reaching it ends the heist.
  if (world.lootSecured && pointInRect(world.thief.x, world.thief.y, world.level.exit)) {
    world.escaped = true;
    world.escapedInLockdown = world.lockdown;
    world.phase = 'payout';
    world.payout = computePayout(world);
    world.events.push({ type: 'escape', payout: world.payout });
  }

  if (world.banner && world.time > world.banner.until) world.banner = null;
}

// The payout breakdown. Ghost mode doubles the loot; the clock pays a time
// bonus under par; unspent kit fund comes back; a lockdown escape adds its
// own bonus. A heist that ends without the prize pays only the unspent fund.
export function computePayout(world) {
  const level = world.level;
  const loot = world.lootSecured ? level.prizeValue : 0;
  const ghostBonus = world.mode === 'ghost' && world.lootSecured ? loot : 0;
  const underPar = Math.max(0, level.parSeconds - world.time);
  const timeBonus = world.lootSecured ? Math.round(underPar * TIME_BONUS_PER_SECOND) : 0;
  const lockdownBonus = world.escapedInLockdown && world.lootSecured ? LOCKDOWN_ESCAPE_BONUS : 0;
  const unspent = world.purse;
  const total = loot + ghostBonus + timeBonus + lockdownBonus + unspent;
  return {
    loot,
    ghostBonus,
    timeBonus,
    lockdownBonus,
    unspent,
    total,
    seconds: Math.round(world.time * 10) / 10,
  };
}

// How long a lockdown lasts once it starts.
export { ALARM };
