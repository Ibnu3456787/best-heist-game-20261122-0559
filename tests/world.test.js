// Tests for movement, collision, lockpicking, the exit, the payout and
// determinism — the core loop of THE GILDED FOX.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, step, computePayout } from '../game/src/world.js';
import { buildLevel, ROOM } from '../game/src/levels.js';
import { makeRng } from '../game/src/rng.js';
import { segmentHitsRect, inVisionCone } from '../game/src/geometry.js';
import { blankInput, run, gallery, clearGuards, snapshot, DT } from './helpers.js';

// --- movement ---------------------------------------------------------------

test('thief moves right with D', () => {
  const w = gallery();
  run(w, 60, (i) => { i.right = true; });
  assert.ok(w.thief.x > 200, `x=${w.thief.x}`);
});

test('thief moves up with W', () => {
  const w = gallery();
  run(w, 60, (i) => { i.up = true; });
  assert.ok(w.thief.y < 600, `y=${w.thief.y}`);
});

test('thief stands still with no input', () => {
  const w = gallery();
  const { x, y } = w.thief;
  run(w, 10);
  assert.equal(w.thief.x, x);
  assert.equal(w.thief.y, y);
});

test('diagonal movement is the same speed as straight movement', () => {
  const straight = gallery();
  run(straight, 60, (i) => { i.right = true; });
  const diagonal = gallery();
  run(diagonal, 60, (i) => { i.right = true; i.up = true; });
  const dx = diagonal.thief.x - 120;
  const dy = diagonal.thief.y - 680;
  const mag = Math.hypot(dx, dy);
  assert.ok(Math.abs(mag - 150) < 1, `diagonal magnitude ${mag}`);
  assert.ok(Math.abs(straight.thief.x - 120 - 150) < 1);
});

test('a display case blocks the thief', () => {
  const w = gallery();
  clearGuards(w);
  w.thief.x = 386;
  w.thief.y = 252;
  run(w, 30, (i) => { i.right = true; });
  assert.ok(w.thief.x <= 388, `x=${w.thief.x}`);
  assert.ok(w.thief.x > 380, `x=${w.thief.x}`);
});

test('sneaking is slower than walking', () => {
  const walk = gallery();
  run(walk, 60, (i) => { i.right = true; });
  const sneak = gallery();
  run(sneak, 60, (i) => { i.right = true; i.sneak = true; });
  assert.ok(sneak.thief.x < walk.thief.x, `sneak ${sneak.thief.x} vs walk ${walk.thief.x}`);
});

test('sprinting is faster than walking', () => {
  const walk = gallery();
  run(walk, 60, (i) => { i.right = true; });
  const sprint = gallery();
  run(sprint, 60, (i) => { i.right = true; i.sprint = true; });
  assert.ok(sprint.thief.x > walk.thief.x, `sprint ${sprint.thief.x} vs walk ${walk.thief.x}`);
});

test('sneak wins over sprint when both are held', () => {
  const w = gallery();
  clearGuards(w);
  run(w, 60, (i) => { i.right = true; i.sneak = true; i.sprint = true; });
  const moved = w.thief.x - 120;
  assert.ok(moved > 80 && moved < 90, `moved ${moved}`);
});

test('the thief cannot leave the room', () => {
  const w = gallery();
  w.thief.x = 20;
  w.thief.y = 400;
  run(w, 60, (i) => { i.left = true; });
  assert.ok(w.thief.x >= 22.5 && w.thief.x < 30, `x=${w.thief.x}`);
});

test('a vent slows the thief to vent speed for one step', () => {
  const w = gallery();
  w.thief.x = 53; // inside gallery vent 1 (40,360,26,130)
  w.thief.y = 400;
  const before = w.thief.x;
  const input = blankInput();
  input.right = true;
  step(w, input, DT);
  assert.ok(Math.abs((w.thief.x - before) - 1) < 0.001, `dx=${w.thief.x - before}`);
});

test('open floor moves at walk speed for one step', () => {
  const w = gallery();
  w.thief.x = 300;
  w.thief.y = 400;
  const before = w.thief.x;
  const input = blankInput();
  input.right = true;
  step(w, input, DT);
  assert.ok(Math.abs((w.thief.x - before) - 2.5) < 0.001, `dx=${w.thief.x - before}`);
});

// --- geometry ---------------------------------------------------------------

test('segmentHitsRect detects a crossing segment', () => {
  const rect = { x: 50, y: 50, w: 100, h: 100 };
  assert.equal(segmentHitsRect(0, 100, 200, 100, rect), true);
  assert.equal(segmentHitsRect(0, 0, 200, 0, rect), false);
  assert.equal(segmentHitsRect(60, 60, 90, 90, rect), true);
});

test('inVisionCone respects walls', () => {
  const wall = { x: 180, y: 50, w: 40, h: 100 };
  assert.equal(inVisionCone(100, 100, 0, 300, 0.6, 300, 100, [wall]), false);
  assert.equal(inVisionCone(100, 100, 0, 300, 0.6, 300, 100, []), true);
  assert.equal(inVisionCone(100, 100, 0, 300, 0.6, 100, 300, []), false);
});

// --- rng --------------------------------------------------------------------

test('rng: the same seed replays the same sequence', () => {
  const a = makeRng(7);
  const b = makeRng(7);
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
});

test('rng: values stay in [0, 1)', () => {
  const rng = makeRng(99);
  for (let i = 0; i < 100; i++) {
    const v = rng();
    assert.ok(v >= 0 && v < 1, `v=${v}`);
  }
});

// --- levels -----------------------------------------------------------------

test('all three levels build with the spec counts', () => {
  const g = buildLevel(0);
  assert.equal(g.guards.length, 3);
  assert.equal(g.cameras.length, 2);
  assert.equal(g.lasers.length, 0);
  const b = buildLevel(1);
  assert.equal(b.guards.length, 4);
  assert.equal(b.cameras.length, 3);
  assert.equal(b.lasers.length, 2);
  const c = buildLevel(2);
  assert.equal(c.guards.length, 5);
  assert.equal(c.cameras.length, 3);
  assert.equal(c.lasers.length, 2);
});

test('spawn and exit sit inside the room', () => {
  for (let h = 0; h < 3; h++) {
    const l = buildLevel(h);
    assert.ok(l.spawn.x > ROOM.x && l.spawn.x < ROOM.x + ROOM.w);
    assert.ok(l.spawn.y > ROOM.y && l.spawn.y < ROOM.y + ROOM.h);
    assert.ok(l.exit.x > ROOM.x && l.exit.x + l.exit.w < ROOM.x + ROOM.w);
    // The exit door sits flush with the room's bottom edge.
    assert.ok(l.exit.y > ROOM.y && l.exit.y + l.exit.h <= ROOM.y + ROOM.h);
  }
});

// --- lockpick, loot, exit ----------------------------------------------------

test('lockpicking progresses while holding E still by the case', () => {
  const w = gallery();
  clearGuards(w);
  w.thief.x = 640;
  w.thief.y = 192;
  run(w, 60, (i) => { i.pick = true; });
  // pickProgress is in seconds (0..2.5): 1s of holding E is ~1s of progress.
  assert.ok(w.thief.pickProgress > 0.9 && w.thief.pickProgress < 1.1,
    `progress=${w.thief.pickProgress}`);
});

test('lockpicking decays when the thief walks away', () => {
  const w = gallery();
  clearGuards(w);
  w.thief.x = 640;
  w.thief.y = 192;
  run(w, 60, (i) => { i.pick = true; });
  run(w, 60, (i) => { i.right = true; });
  // Decay runs at 2x speed, so 1s away wipes the 1s of progress.
  assert.ok(w.thief.pickProgress < 0.2, `progress=${w.thief.pickProgress}`);
});

test('holding E for 3s by the case secures the loot', () => {
  const w = gallery();
  clearGuards(w);
  w.thief.x = 640;
  w.thief.y = 192;
  run(w, 180, (i) => { i.pick = true; });
  assert.equal(w.lootSecured, true);
});

test('the exit stays locked until the loot is secured', () => {
  const w = gallery();
  clearGuards(w);
  w.thief.x = 640;
  w.thief.y = 707;
  run(w, 10);
  assert.equal(w.phase, 'playing');
});

test('reaching the exit with the loot pays out', () => {
  const w = gallery();
  clearGuards(w);
  w.lootSecured = true;
  w.time = 10;
  w.thief.x = 640;
  w.thief.y = 707;
  run(w, 1);
  assert.equal(w.phase, 'payout');
  assert.ok(w.payout !== null);
});

// --- payout -----------------------------------------------------------------

test('payout loot equals the prize value', () => {
  const w = gallery();
  w.lootSecured = true;
  w.time = 10;
  const p = computePayout(w);
  assert.equal(p.loot, 1200);
  assert.equal(p.ghostBonus, 0);
});

test('ghost mode doubles the loot', () => {
  const w = createWorld(0, 'ghost');
  w.lootSecured = true;
  w.time = 10;
  const p = computePayout(w);
  assert.equal(p.loot, 1200);
  assert.equal(p.ghostBonus, 1200);
});

test('a faster finish earns a bigger time bonus', () => {
  const fast = gallery();
  fast.lootSecured = true;
  fast.time = 10;
  const slow = gallery();
  slow.lootSecured = true;
  slow.time = 200;
  assert.ok(computePayout(fast).timeBonus > computePayout(slow).timeBonus);
});

test('unspent kit fund pays out at the end', () => {
  const w = gallery();
  w.purse = 125;
  w.time = 10;
  assert.equal(computePayout(w).unspent, 125);
});

test('escaping during lockdown pays the lockdown bonus', () => {
  const w = gallery();
  w.lootSecured = true;
  w.escapedInLockdown = true;
  w.time = 10;
  assert.equal(computePayout(w).lockdownBonus, 250);
});

// --- determinism ------------------------------------------------------------

test('the same seed and the same inputs replay identically', () => {
  const script = (input, i) => {
    if (i < 100) input.right = true;
    else if (i < 200) input.up = true;
    else input.pick = true;
  };
  const a = createWorld(0, 'standard', 42);
  run(a, 300, script);
  const b = createWorld(0, 'standard', 42);
  run(b, 300, script);
  assert.equal(snapshot(a), snapshot(b));
});

test('different seeds change the sentry pan offset', () => {
  const a = createWorld(0, 'standard', 42);
  const b = createWorld(0, 'standard', 43);
  assert.notEqual(a.guards[1].panTime, b.guards[1].panTime);
});
