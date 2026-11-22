// Tools: the coin, the smoke pellet and the EMP pulse. Every tool costs
// kit fund; the lockpick is free but costs time. Unspent fund pays out at
// the end of the heist, so every throw is a real decision.

import { TOOLS } from './config.js';
import { distractGuards } from './guards.js';
import { empBlast } from './cameras.js';
import { dist } from './geometry.js';

// A tool use: { slot: 'coin'|'smoke'|'emp', x, y } where x,y is the aim
// point for the coin. Returns true when the tool fired.
export function useTool(world, slot, aimX, aimY) {
  const tool = TOOLS[slot];
  if (!tool) return false;
  if (world.purse < tool.cost) {
    world.banner = { text: 'NOT ENOUGH GOLD FOR THE ' + tool.name.toUpperCase(), until: world.time + 1.6 };
    return false;
  }
  if (world.phase !== 'playing') return false;

  world.purse -= tool.cost;
  if (slot === 'coin') {
    const tx = aimX === undefined ? world.thief.x + 60 : aimX;
    const ty = aimY === undefined ? world.thief.y : aimY;
    world.coins.push({ x: tx, y: ty, timer: 5 });
    distractGuards(world, tx, ty);
    world.events.push({ type: 'coin', x: tx, y: ty });
  } else if (slot === 'smoke') {
    world.smokes.push({
      x: world.thief.x,
      y: world.thief.y,
      radius: tool.radius,
      timer: tool.duration,
    });
    world.events.push({ type: 'smoke' });
  } else if (slot === 'emp') {
    empBlast(world, tool.duration);
    world.events.push({ type: 'emp' });
  }
  return true;
}

// Tick the thrown coins and smoke clouds down; a coin stops ringing after
// its timer runs out.
export function updateTools(world, dt) {
  for (const coin of world.coins) coin.timer -= dt;
  world.coins = world.coins.filter((c) => c.timer > 0);
  for (const smoke of world.smokes) smoke.timer -= dt;
  world.smokes = world.smokes.filter((s) => s.timer > 0);
}

// Is the thief inside a smoke cloud right now?
export function thiefInSmoke(world) {
  return world.smokes.some((s) => dist(world.thief.x, world.thief.y, s.x, s.y) < s.radius);
}
