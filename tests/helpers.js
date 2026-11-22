// Shared helpers for the headless tests. The tests drive the exact
// simulation the game runs (game/src/*.js), with no canvas and no audio.

import { createWorld, step } from '../game/src/world.js';

export const DT = 1 / 60;

export function blankInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    sprint: false,
    pick: false,
    tool: null,
    aimX: 0,
    aimY: 0,
  };
}

// Run the world for n ticks (or until it stops playing). The driver fills
// the input each tick.
export function run(world, n, driver) {
  for (let i = 0; i < n; i++) {
    if (world.phase !== 'playing') break;
    const input = blankInput();
    if (driver) driver(input, i);
    step(world, input, DT);
  }
}

// A fresh gallery heist (index 0, standard mode) for tests that need a world.
export function gallery(seed) {
  return createWorld(0, 'standard', seed);
}

// Move every guard to the far corner so a test can isolate one system
// (lockpicking, the exit, the payout) without a patrol wandering in.
export function clearGuards(world) {
  for (const g of world.guards) {
    g.x = 60;
    g.y = 60;
    g.suspicion = 0;
    g.state = 'patrol';
  }
}

export function snapshot(world) {
  return JSON.stringify({
    thief: [world.thief.x, world.thief.y],
    alarm: world.alarm,
    time: world.time,
    guards: world.guards.map((g) => [g.x, g.y, g.angle, g.suspicion, g.state]),
    cameras: world.cameras.map((c) => [c.angle, c.blindFor]),
  });
}
