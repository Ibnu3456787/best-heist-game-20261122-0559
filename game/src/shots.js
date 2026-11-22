// The pilot: it plays the game for real and stages the four screenshots.
// Each scene drives the simulation with scripted inputs — the same step()
// the player runs — and stops at a chosen moment. No frame is posed by
// hand: the alarm, the cones and the thief's position are whatever the
// simulation produced when the pilot stopped.

import { laserLive } from './lasers.js';
import { startHeist, recordBust } from './state.js';
import { step } from './world.js';

const DT = 1 / 60;

// A blank input, filled in by the driver each tick.
function blankInput() {
  return {
    up: false, down: false, left: false, right: false,
    sneak: false, sprint: false, pick: false,
    tool: null, aimX: 0, aimY: 0,
  };
}

// Steer the thief toward a point: set the movement keys from the delta.
function steer(input, world, tx, ty) {
  const t = world.thief;
  const dx = tx - t.x;
  const dy = ty - t.y;
  input.left = dx < -6;
  input.right = dx > 6;
  input.up = dy < -6;
  input.down = dy > 6;
  return Math.abs(dx) < 10 && Math.abs(dy) < 10;
}

// Run the world for up to maxTicks, one scripted tick at a time. The
// driver fills the input each tick and may stop early by returning 'stop'.
function runScript(world, maxTicks, driver) {
  for (let i = 0; i < maxTicks; i++) {
    if (world.phase !== 'playing') break;
    const input = blankInput();
    const done = driver(input, i);
    step(world, input, DT);
    if (done === 'stop') break;
  }
}

// Scene 1 — the bank vault mid-heist. The pilot slips up the left edge
// (the captain never faces that way), walks along the floor below the
// drone's line, waits for the first laser beam to open a fresh window, and
// crosses it — the trip pushes the alarm to 30 — then holds below the vault
// until the meter cools into a warm band.
function stageCover(game) {
  startHeist(game, 1, 'standard');
  const world = game.world;
  let phase = 'edge';
  runScript(world, 3600, (input) => {
    const beam = world.lasers[0];
    if (phase === 'edge') {
      // Up the left edge to just above the teller desks (y=487 clears
      // their tops; y=500 would wedge the Fox against a desk corner).
      const arrived = steer(input, world, 120, 487);
      if (arrived) phase = 'floor';
    } else if (phase === 'floor') {
      const arrived = steer(input, world, 640, 487);
      if (arrived) phase = 'wait-beam';
    } else if (phase === 'wait-beam') {
      // A fresh window: live, with most of its on-time still ahead, so the
      // beam cannot switch off mid-crossing.
      const intoCycle = beam.time % beam.period;
      const remaining = beam.period * beam.onFraction - intoCycle;
      if (laserLive(beam) && remaining > 0.8) phase = 'cross';
    } else if (phase === 'cross') {
      const arrived = steer(input, world, 640, 340);
      if (arrived) phase = 'cool';
    } else if (phase === 'cool') {
      // Stop a touch early so the LASER TRIPPED banner is still on screen.
      if (world.alarm <= 28) return 'stop';
    }
    return undefined;
  });
}

// Scene 2 — the title screen: the three jobs, the two modes, the note to
// the judge. No world is needed; the title paints itself.
function stageBriefing(game) {
  game.screen = 'title';
  game.titleSelection = 1;
}

// Scene 3 — the gallery getaway. The pilot sneaks to the mask's case and
// picks the lock from its left side (35px above the patroller's line, and
// just outside the sentry's pan), then sprints for the exit and stops with
// the door in view and the alarm warm.
function stageGetaway(game) {
  startHeist(game, 0, 'standard');
  const world = game.world;
  let phase = 'to-case';
  runScript(world, 3600, (input) => {
    const t = world.thief;
    if (phase === 'to-case') {
      const arrived = steer(input, world, 640, 360);
      if (arrived) phase = 'up';
    } else if (phase === 'up') {
      const arrived = steer(input, world, 570, 190);
      if (arrived) phase = 'side';
    } else if (phase === 'side') {
      const arrived = steer(input, world, 570, 145);
      if (arrived) phase = 'pick';
    } else if (phase === 'pick') {
      input.pick = true;
      if (world.lootSecured) phase = 'run';
    } else if (phase === 'run') {
      input.sprint = true;
      // Steer past the exit door, not to it: stopping on the hound's line
      // lets the hound close in while the pilot waits for a warm alarm.
      steer(input, world, 640, 700);
      if (t.y >= 560 && world.alarm >= 20 && world.alarm <= 70) return 'stop';
      // Stop clear of the centre banner, so the Fox stays visible.
      if (t.y >= 620) return 'stop';
    }
    return undefined;
  });
}

// Scene 4 — caught red-handed. The pilot walks the Fox onto the gallery
// patroller's line and stands there until the guard closes in, then shows
// the busted screen (the main loop would do this live; the pilot does it
// here because the screenshot renders a single frame).
function stageCaught(game) {
  startHeist(game, 0, 'standard');
  const world = game.world;
  let phase = 'to-line';
  runScript(world, 3600, (input) => {
    if (phase === 'to-line') {
      const arrived = steer(input, world, 640, 180);
      if (arrived) phase = 'wait';
    }
    return undefined;
  });
  if (world.phase === 'busted') recordBust(game);
}

export function stageShot(game, name) {
  if (name === '1-cover') stageCover(game);
  else if (name === '2-briefing') stageBriefing(game);
  else if (name === '3-getaway') stageGetaway(game);
  else if (name === '4-caught') stageCaught(game);
  else stageBriefing(game);
}

// The scenes the pilot can stage, in screenshot order.
export const SHOT_NAMES = ['1-cover', '2-briefing', '3-getaway', '4-caught'];
